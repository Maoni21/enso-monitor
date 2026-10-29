import pandas as pd

SAISON_VERS_MOIS = {
    "DJF": 1,
    "JFM": 2,
    "FMA": 3,
    "MAM": 4,
    "AMJ": 5,
    "MJJ": 6,
    "JJA": 7,
    "JAS": 8,
    "ASO": 9,
    "SON": 10,
    "OND": 11,
    "NDJ": 12,
}


def rejeter_lignes_invalides(brut: pd.DataFrame) -> pd.DataFrame:
    """Garde uniquement les lignes dont la saison, l'année et l'anomalie sont valides."""
    saison_ok = brut["SEAS"].isin(SAISON_VERS_MOIS.keys()) 
    annee_ok = pd.to_numeric(brut["YR"], errors="coerce").notna()
    anom_ok = pd.to_numeric(brut["ANOM"], errors="coerce").notna()
    masque = saison_ok & annee_ok & anom_ok  
    return brut[masque]

def convertir_saisons_en_dates(valides: pd.DataFrame) -> pd.DataFrame:
    """Ajoute une colonne date : le 1er jour du mois du milieu de la saison."""
    resultat = valides.copy()
    annee = resultat["YR"].astype(int)
    mois = resultat["SEAS"].map(SAISON_VERS_MOIS)
    resultat["date"] = pd.to_datetime({"year": annee, "month": mois, "day": 1})
    return resultat

def supprimer_doublons(avec_dates: pd.DataFrame) -> pd.DataFrame:
    """Garde une seule ligne par date : la première rencontrée."""
    return avec_dates.drop_duplicates(subset="date", keep="first")

def transformer(brut: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Nettoie le tableau brut et renvoie les données propres avec un rapport d'import."""
    valides = rejeter_lignes_invalides(brut)
    avec_dates = convertir_saisons_en_dates(valides)
    sans_doublons = supprimer_doublons(avec_dates)

    propre = pd.DataFrame({
        "date": sans_doublons["date"],
        "saison": sans_doublons["SEAS"],
        "anomalie": sans_doublons["ANOM"].astype(float),
    })
    rapport = {
        "lues": len(brut),
        "rejetees": len(brut) - len(valides),
        "doublons": len(avec_dates) - len(sans_doublons),
        "gardees": len(propre),
    }
    return propre, rapport