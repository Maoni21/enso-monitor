import datetime

from pydantic import BaseModel, ConfigDict


class ObservationOut(BaseModel):
    """Ce que l'API renvoie pour une observation : seulement ce dont le frontend a besoin."""

    model_config = ConfigDict(from_attributes=True)

    date: datetime.date
    saison: str
    anomalie: float


class IndiceOut(BaseModel):
    """Ce que l'API renvoie pour décrire l'indice : ce qu'il mesure, d'où il vient, quand il a été extrait."""

    nom: str
    nom_complet: str
    unite: str
    producteur: str
    url: str
    version: str
    date_extraction: datetime.date


class StatistiquesEpisode(BaseModel):
    """Les chiffres d'un épisode : sa période, son pic, sa moyenne et sa durée au-dessus du seuil."""

    debut: datetime.date
    fin: datetime.date
    nb_saisons: int
    pic: float
    date_pic: datetime.date
    saison_pic: str
    moyenne: float
    duree_el_nino: int


class ComparaisonOut(BaseModel):
    """Ce que l'API renvoie pour comparer deux épisodes, avec l'indice et le seuil utilisés."""

    indice: str
    seuil: float
    episode_a: StatistiquesEpisode
    episode_b: StatistiquesEpisode
