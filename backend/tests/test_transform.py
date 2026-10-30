import pandas as pd

from etl.transform import transformer


def test_saisons_converties_en_dates():
    # 1. Préparer : un petit tableau dont on connaît le résultat attendu
    brut = pd.DataFrame({
        "SEAS": ["DJF", "NDJ"],
        "YR": ["1997", "1997"],
        "ANOM": ["-0.21", "2.28"],
    })

    # 2. Agir : appeler la fonction testée
    propre, rapport = transformer(brut)

    # 3. Vérifier : le résultat est-il celui qu'on attend ?
    assert list(propre["date"]) == [pd.Timestamp("1997-01-01"), pd.Timestamp("1997-12-01")]


def test_lignes_invalides_rejetees():
    # Préparer : les 5 lignes de l'exercice (XYZ, abc, 19a7, valeur absente, et une valide)
    brut = pd.DataFrame({
        "SEAS": ["DJF",   "XYZ",  "DJF",  "DJF",   "DJF"],
        "YR":   ["1997",  "1997", "1997", "19a7",  "1997"],
        "ANOM": ["-0.21", "0.50", "abc",  "-0.21", None],
    })
    # Agir : appeler transformer
    propre, rapport = transformer(brut)

    assert len(propre) == 1
    assert rapport["rejetees"] == 4

def test_doublon_garde_la_premiere_valeur():
    # Préparer : DJF 1997 -0.21, puis DJF 1997 -0.25
    brut = pd.DataFrame({
        "SEAS": ["DJF", "DJF"],
        "YR": ["1997", "1997"],
        "ANOM": ["-0.21", "-0.25"],
    })
    # Agir : appeler transformer
    propre, rapport = transformer(brut)

    # Vérifier : il reste 1 ligne, elle vaut -0.21, et le rapport compte 1 doublon

    assert len(propre) == 1
    assert propre["anomalie"].iloc[0] == -0.21
    assert rapport["doublons"] == 1

