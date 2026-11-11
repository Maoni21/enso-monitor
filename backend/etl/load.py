import datetime
from pathlib import Path

import pandas as pd
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Import, Indice, Observation, Source
from etl.extract import lire_fichier_roni
from etl.transform import transformer

FICHIER = "../data/raw/roni_2026-10-27.txt"
URL_SOURCE = "https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt"


def obtenir_ou_creer_indice(session: Session) -> Indice:
    """Renvoie la ligne RONI de la table indice, en la créant si elle n'existe pas encore."""
    indice = session.scalars(select(Indice).where(Indice.nom == "RONI")).first()
    if indice is None:
        indice = Indice(nom="RONI", nom_complet="Relative Oceanic Niño Index", unite="°C")
        session.add(indice)
        session.flush()
    return indice


def obtenir_ou_creer_source(session: Session) -> Source:
    """Renvoie la source NOAA du fichier RONI, en la créant si elle n'existe pas encore."""
    source = session.scalars(select(Source).where(Source.url == URL_SOURCE)).first()
    if source is None:
        source = Source(producteur="NOAA Climate Prediction Center", url=URL_SOURCE, version="ERSST v6")
        session.add(source)
        session.flush()
    return source


def date_extraction_depuis_nom(chemin: str) -> datetime.date:
    """Lit la date dans le nom du fichier : roni_2026-10-27.txt donne le 27 octobre 2026."""
    return datetime.date.fromisoformat(Path(chemin).stem.split("_")[1])


def preparer_observations(propre: pd.DataFrame, indice_id: int, import_id: int) -> list[dict]:
    """Transforme le tableau propre en une liste de dictionnaires, un par observation, prêts à insérer."""
    lignes = []                                   # 1. une liste vide

    for ligne in propre.to_dict("records"):        # 2. pour chaque ligne du tableau
        observation = {                            # 3. on fabrique un dictionnaire
            "indice_id": indice_id,
            "import_id": import_id,
            "date": ligne["date"].date(),
            "saison": ligne["saison"],
            "anomalie": ligne["anomalie"],
        }
        lignes.append(observation)                    # 4. on l'ajoute à la liste

    return lignes                                     # 5. on renvoie la liste


def charger(chemin: str) -> dict:
    """Lit, transforme et enregistre le fichier RONI en base. Renvoie le rapport d'import."""
    brut = lire_fichier_roni(chemin)
    propre, rapport = transformer(brut)

    with SessionLocal() as session:
        indice = obtenir_ou_creer_indice(session)
        source = obtenir_ou_creer_source(session)

        import_ = Import(
            source_id=source.id,
            date_extraction=date_extraction_depuis_nom(chemin),
            fichier_brut=Path(chemin).name,
            lance_le=datetime.datetime.now(),
            lues=rapport["lues"],
            rejetees=rapport["rejetees"],
            doublons=rapport["doublons"],
            gardees=rapport["gardees"],
        )
        session.add(import_)
        session.flush()

        lignes = preparer_observations(propre, indice.id, import_.id)

        requete = insert(Observation).values(lignes)
        requete = requete.on_conflict_do_update(
            index_elements=["indice_id", "date"],
            set_={"anomalie": requete.excluded.anomalie, "import_id": requete.excluded.import_id},
        )
        session.execute(requete)
        session.commit()

    return rapport


if __name__ == "__main__":
    print(charger(FICHIER))
