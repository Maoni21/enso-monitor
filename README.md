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
frontend/src/      interface React + TypeScript (Vite)
docs/decisions.md  décisions techniques et leurs justifications
compose.yaml       la base seule, pour le développement
compose.prod.yaml  base + API + site derrière Caddy, pour la production
```

- **Base de données :** PostgreSQL 17 dans Docker. 4 tables : `indice`, `source`, `import`, `observation`.
- **Données :** indice RONI, NOAA Climate Prediction Center, basé sur ERSST v6. Source, version et date d'extraction dans [`data/SOURCES.md`](data/SOURCES.md).

## Prérequis

- Python 3.12 ou plus
- Docker Desktop
- Node.js 22 ou plus (pour le frontend)

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

## Lancer le frontend en local

Dans un autre terminal, avec l'API lancée :

```bash
cd frontend
npm install
npm run dev
```

Le site est sur http://localhost:5173. Attention : l'API n'autorise que cette adresse (CORS). Si Vite annonce un autre port, c'est qu'un autre `npm run dev` tourne déjà : il faut l'arrêter.

| Fichier | Rôle |
|---|---|
| `src/api.ts` | appels à l'API, et traduction des erreurs en phrases |
| `src/types.ts` | la forme des données reçues de l'API |
| `src/App.tsx` | la page : source de l'indice, filtre de période, messages, courbe, comparaison |
| `src/CourbeAnomalies.tsx` | la courbe Recharts, et les mêmes données en tableau |
| `src/ComparaisonEpisodes.tsx` | le formulaire de comparaison et le tableau des résultats |
| `src/interpretation.ts` | mise en forme des nombres et texte d'interprétation prudente |

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

Tests du frontend, depuis `frontend/` (sans API ni base : les appels sont simulés) :

```bash
npm test
```

| Fichier | Ce qui est vérifié |
|---|---|
| `App.test.tsx` | changer la période met à jour la courbe ; une période inversée affiche un message d'erreur |
| `interpretation.test.ts` | format des nombres, saison du pic, prudence de l'interprétation |

## Déploiement sur un VPS

Le déploiement utilise `compose.prod.yaml` : trois conteneurs (`db`, `api`, `web`), et seul Caddy (`web`) est accessible depuis Internet, sur les ports 80 et 443.

```bash
# 1. Sur le serveur : installer Docker, puis récupérer le projet
git clone https://github.com/Maoni21/enso-monitor.git
cd enso-monitor

# 2. Créer le .env (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, et DOMAINE pour le HTTPS)
cp .env.example .env
nano .env

# 3. Construire et lancer (les tables sont créées au démarrage de l'API)
docker compose -f compose.prod.yaml up -d --build

# 4. Importer les données RONI
docker compose -f compose.prod.yaml exec api python -m etl.load
```

- **HTTPS :** avec `DOMAINE=enso.mon-domaine.fr` dans `.env`, et le nom de domaine qui pointe vers l'adresse IP du serveur, Caddy obtient et renouvelle seul le certificat.
- **Mise à jour :** `git pull`, puis la commande de l'étape 3.
- **Sauvegarde de la base :** `docker compose -f compose.prod.yaml exec db pg_dump -U enso enso > sauvegarde.sql`.
- **Sécurité :** la base et l'API n'ont aucun port ouvert vers l'extérieur ; le `.env` n'est jamais commité ; Caddy ajoute des en-têtes de sécurité.

## Utilisation de l'IA

L'IA (Claude, d'Anthropic) a été utilisée comme **professeur** pendant tout le projet, et comme **assistant de code** pour une partie de l'interface et de la configuration.

| Partie | Comment elle a été faite |
|---|---|
| choix de l'indice, schéma de la base, décisions (`docs/decisions.md`) | proposés par moi, discutés et challengés avec l'IA |
| `etl/transform.py`, modèles SQLAlchemy, tests Pytest, `comparaison.py`, courbe et filtre | écrits par moi, avec explications et corrections de l'IA |
| configuration (Docker, Alembic, Vite), `api.ts`, messages d'erreur, comparaison à l'écran, accessibilité, test frontend, déploiement | écrits par l'IA, puis relus et expliqués ligne par ligne |

Règle suivie : aucune ligne ne reste dans le projet si je ne sais pas l'expliquer.
