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