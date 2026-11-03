# ENSO Monitor

Application web pour explorer l'indice **RONI** (Relative Oceanic Niño Index) de la NOAA : courbe interactive avec filtre de période, et comparaison de deux épisodes El Niño ou La Niña.

Projet individuel de rattrapage, HETIC WEB3 (RNCP 36146).

## Architecture

```
data/raw/          fichier brut NOAA, jamais modifié
backend/etl/       import : extract (lecture) → transform (nettoyage) → load (base)
backend/app/       API FastAPI : routes, accès à la base, calculs
backend/alembic/   migrations de la base de données
backend/tests/     tests Pytest
frontend/          interface React + TypeScript (Vite)
docs/decisions.md  décisions techniques et leurs justifications
```

- **Base de données :** PostgreSQL 17 dans Docker. 4 tables : `indice`, `source`, `import`, `observation`.
- **Données :** indice RONI, NOAA Climate Prediction Center, basé sur ERSST v6. Source, version et date d'extraction dans [`data/SOURCES.md`](data/SOURCES.md).

## Prérequis

- Python 3.12 ou plus
- Docker Desktop
- Node.js (pour le frontend)

## Variables d'environnement

Copier `.env.example` en `.env` à la racine, puis le remplir :

| Variable | Rôle | Exemple en local |
|---|---|---|
| `POSTGRES_USER` | utilisateur de la base | `enso` |
| `POSTGRES_PASSWORD` | mot de passe de la base | à choisir |
| `POSTGRES_DB` | nom de la base | `enso` |
| `DATABASE_URL` | adresse complète utilisée par Python | `postgresql+psycopg://enso:MOT_DE_PASSE@localhost:5432/enso` |

Le fichier `.env` n'est jamais commité.

## Lancer le backend en local

Depuis la racine du projet :

```bash
# 1. Démarrer PostgreSQL
docker compose up -d

# 2. Installer les dépendances Python
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Créer les tables
alembic upgrade head

# 4. Importer les données RONI (relançable sans créer de doublon)
python -m etl.load

# 5. Lancer l'API
uvicorn app.main:app --reload
```

La documentation interactive de l'API (OpenAPI) est disponible sur http://localhost:8000/docs.

## Routes de l'API

| Route | Rôle |
|---|---|
| `GET /api/v1/observations?start=AAAA-MM-JJ&end=AAAA-MM-JJ` | observations RONI, filtre de période facultatif |
| `GET /api/v1/indice` | description de l'indice, de sa source et date d'extraction |
| `GET /api/v1/comparaison?debut_a=…&fin_a=…&debut_b=…&fin_b=…` | statistiques de deux épisodes : pic, moyenne, durée au-dessus de +0,5 °C |

Une période inversée ou une date invalide renvoie une erreur 422.

## Tests

Depuis `backend/`, avec la base démarrée et les données importées :

```bash
pytest -v
```

| Fichier | Ce qui est vérifié |
|---|---|
| `test_transform.py` | conversion des saisons en dates, rejet des lignes invalides, suppression des doublons |
| `test_api.py` | filtre par période, période inversée refusée, date mal écrite refusée |
| `test_comparaison.py` | calcul de la plus longue série de saisons au-dessus du seuil |

Limite : les tests de l'API utilisent la base de développement. Une base de test dédiée serait plus robuste.

## Utilisation de l'IA

À compléter : outils utilisés et parties assistées.
