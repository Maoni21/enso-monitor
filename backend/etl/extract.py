import pandas as pd

def lire_fichier_roni(chemin: str) -> pd.DataFrame:
    return pd.read_csv(chemin, sep=r"\s+", dtype=str)