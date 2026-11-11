# Image de l'API : Python, les dépendances, puis le code et les données brutes.
# Construite depuis la racine du projet (voir compose.prod.yaml).
FROM python:3.13-slim

WORKDIR /app/backend

# On copie d'abord requirements.txt seul : tant qu'il ne change pas,
# Docker réutilise les dépendances déjà installées, et la reconstruction est rapide.
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
# Le fichier brut NOAA, pour pouvoir lancer l'import dans le conteneur (python -m etl.load).
COPY data/ /app/data/

EXPOSE 8000

# Au démarrage : créer ou mettre à jour les tables, puis lancer l'API.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
