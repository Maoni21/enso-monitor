# Étape 1 : construire le site React en fichiers statiques (HTML, CSS, JS).
# Construite depuis la racine du projet (voir compose.prod.yaml).
FROM node:24-alpine AS construction

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .

# En production, Caddy sert le site et l'API à la même adresse : l'API est donc sur /api/v1.
ENV VITE_API_URL=/api/v1
RUN npm run build

# Étape 2 : une image légère avec seulement Caddy et les fichiers construits.
# Node n'est plus nécessaire une fois le site construit.
FROM caddy:2
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=construction /app/dist /srv
