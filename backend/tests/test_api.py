from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_filtre_par_periode():
    # Agir : demander les observations de 1997 et 1998
    reponse = client.get("/api/v1/observations", params={"start": "1997-01-01", "end": "1998-12-01"})

    # Vérifier : la réponse est correcte, avec 24 observations, et la première est DJF 1997
    assert reponse.status_code == 200
    observations = reponse.json()
    assert len(observations) == 24
    assert observations[0] == {"date": "1997-01-01", "saison": "DJF", "anomalie": -0.21}

def test_periode_inversee_refusee():
    # Agir : demander une période où start est APRÈS end
    reponse = client.get("/api/v1/observations", params={"start": "1999-01-01", "end": "1998-12-01"})
    # Vérifier : le code est 422, avec notre message d'erreur
    assert reponse.status_code == 422
    assert reponse.json()["detail"] == "start doit être avant end"


def test_date_mal_ecrite_refusee():
    # Agir : demander une date qui n'en est pas une
    reponse = client.get("/api/v1/observations", params={"start": "abd"})

    # Vérifier : le code est 422
    assert reponse.status_code == 422
