from app.models import Observation

SEUIL_EL_NINO = 0.5


def plus_longue_serie(valeurs: list[float], seuil: float) -> int:
    """Renvoie le plus grand nombre de valeurs consécutives supérieures ou égales au seuil."""
    meilleure = 0      # la plus longue série trouvée jusqu'ici
    en_cours = 0       # la longueur de la série qu'on est en train de compter

    for valeur in valeurs :
        if valeur >= seuil :
            en_cours = en_cours + 1
            if en_cours > meilleure :
                meilleure = en_cours
        else:
            en_cours = 0       # la série est cassée

    return meilleure


def calculer_statistiques(observations: list[Observation]) -> dict:
    """Calcule le pic, la moyenne, le nombre de saisons et la durée El Niño d'un épisode."""
    valeurs = [obs.anomalie for obs in observations]
    position_pic = valeurs.index(max(valeurs))
    pic = observations[position_pic]

    return {
        "nb_saisons": len(observations),
        "pic": pic.anomalie,
        "date_pic": pic.date,
        "saison_pic": pic.saison,
        "moyenne": round(sum(valeurs) / len(valeurs), 2),
        "duree_el_nino": plus_longue_serie(valeurs, SEUIL_EL_NINO),
    }


