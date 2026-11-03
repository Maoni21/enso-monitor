import datetime

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.comparaison import SEUIL_EL_NINO, calculer_statistiques
from app.database import get_db
from app.repository import dernier_import, lister_observations, obtenir_indice, obtenir_source
from app.schemas import ComparaisonOut, IndiceOut, ObservationOut, StatistiquesEpisode

app = FastAPI(title="ENSO Monitor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/v1/observations", response_model=list[ObservationOut])
def get_observations(
    start: datetime.date | None = None,
    end: datetime.date | None = None,
    db: Session = Depends(get_db),
):
    """Renvoie les observations RONI, filtrées par période si start et/ou end sont fournis."""
    if start is not None and end is not None and start > end:
        raise HTTPException(status_code=422, detail="start doit être avant end")
    return lister_observations(db, start, end)


@app.get("/api/v1/indice", response_model=IndiceOut)
def get_indice(db: Session = Depends(get_db)):
    """Renvoie la description de l'indice RONI, sa source et la date d'extraction des données affichées."""
    indice = obtenir_indice(db, "RONI")
    import_ = dernier_import(db)
    if indice is None or import_ is None:
        raise HTTPException(status_code=404, detail="Aucune donnée importée")
    source = obtenir_source(db, import_.source_id)

    return IndiceOut(
        nom=indice.nom,
        nom_complet=indice.nom_complet,
        unite=indice.unite,
        producteur=source.producteur,
        url=source.url,
        version=source.version,
        date_extraction=import_.date_extraction,
    )


def analyser_episode(db: Session, nom: str, debut: datetime.date, fin: datetime.date) -> StatistiquesEpisode:
    """Vérifie la période d'un épisode, récupère ses observations et calcule ses statistiques."""
    if debut > fin:
        raise HTTPException(status_code=422, detail=f"Épisode {nom} : le début doit être avant la fin")
    observations = lister_observations(db, debut, fin)
    if len(observations) == 0:
        raise HTTPException(status_code=422, detail=f"Épisode {nom} : aucune observation sur cette période")
    statistiques = calculer_statistiques(observations)
    return StatistiquesEpisode(debut=debut, fin=fin, **statistiques)


@app.get("/api/v1/comparaison", response_model=ComparaisonOut)
def get_comparaison(
    debut_a: datetime.date,
    fin_a: datetime.date,
    debut_b: datetime.date,
    fin_b: datetime.date,
    db: Session = Depends(get_db),
):
    """Compare deux épisodes : pic, moyenne, nombre de saisons et durée au-dessus du seuil El Niño."""
    return ComparaisonOut(
        indice="RONI",
        seuil=SEUIL_EL_NINO,
        episode_a=analyser_episode(db, "A", debut_a, fin_a),
        episode_b=analyser_episode(db, "B", debut_b, fin_b),
    )
