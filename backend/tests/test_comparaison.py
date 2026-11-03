from app.comparaison import plus_longue_serie


def test_plus_longue_serie_garde_la_plus_longue():
    # Une série de 2, coupée par 0.2, puis une série de 3
    assert plus_longue_serie([0.6, 0.7, 0.2, 0.8, 0.9, 1.0], 0.5) == 3


def test_plus_longue_serie_aucune_valeur_au_dessus():
    # Toutes les valeurs sont sous 0.5 : aucune série
    assert plus_longue_serie([0.1, -0.3, 0.4], 0.5) == 0


def test_plus_longue_serie_compte_le_seuil_exact():
    # 0.5 est égal au seuil, donc il compte : une série de 2
    assert plus_longue_serie([0.5, 0.5, 0.2], 0.5) == 2
