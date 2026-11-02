# Décisions techniques

Chaque décision importante du projet, notée au moment où elle est prise.
Format : besoin, options envisagées, choix, limites. Ce fichier sert de base au dossier de conception.

---

## D1. Indice retenu : RONI

Voir `data/SOURCES.md`, section « Choix de l'indice ».

---

## D2. Découpage de l'ETL en trois fichiers

- **Besoin :** importer le fichier NOAA en base de façon fiable, et pouvoir tester la transformation automatiquement.
- **Options :**
  - un seul script qui lit, transforme et enregistre ;
  - trois fichiers séparés : `extract.py`, `transform.py`, `load.py`.
- **Choix :** trois fichiers dans `backend/etl/`.
  - `extract.py` lit le fichier brut. Il ne juge pas les données.
  - `transform.py` nettoie les données. Il ne touche jamais au fichier.
  - `load.py` enregistre en base.
- **Pourquoi :** le test de transformation peut donner directement quelques lignes inventées à `transform.py`, sans lire le vrai fichier. C'est le principe de responsabilité unique : chaque fichier a un seul rôle.
- **Limites :** trois fichiers à maintenir au lieu d'un. C'est acceptable vu la taille du projet.

---

## D3. Conversion d'une saison en date

- **Besoin :** une saison comme `DJF 1997` doit devenir une vraie date, pour pouvoir filtrer et trier par période.
- **Options :**
  - deviner le mois à partir des lettres (ambigu : J = juin ou juillet ?) ;
  - une table de correspondance fixe entre les 12 saisons et leur mois du milieu.
- **Choix :** une table de correspondance (dictionnaire Python). La date est le 1er jour du mois du milieu de la saison.
  - `DJF 1997` (déc. 1996, janv. 1997, févr. 1997) → 1er janvier 1997.
  - `NDJ 1997` (nov. 1997, déc. 1997, janv. 1998) → 1er décembre 1997.
- **Pourquoi :** il n'existe que 12 saisons possibles. Une table ne peut pas se tromper, et elle se lit facilement.
- **Limites :** la date représente une moyenne sur 3 mois, pas un mois isolé. L'interface doit le préciser.

---

## D4. Lignes invalides

- **Besoin :** une ligne abîmée ne doit ni planter l'import, ni entrer en base.
- **Est rejetée une ligne :**
  - dont la saison n'est pas dans la table (ex. `XYZ`) ;
  - dont l'année n'est pas un nombre entier (ex. `19a7`) ;
  - dont l'anomalie est absente ou n'est pas un nombre (ex. `abc`).
- **Choix :** la ligne est écartée et l'import continue. Le nombre de lignes rejetées est compté dans un rapport d'import.
- **Pourquoi :** traçabilité. On doit pouvoir répondre à la question « combien de lignes ont été écartées, et pourquoi ? ».
- **Limites :** on ne corrige rien automatiquement. Une ligne abîmée est perdue, mais elle est visible dans le rapport.

---

## D5. Doublons

- **Besoin :** l'indice ne doit avoir qu'une seule valeur par date.
- **Ce qui doit être unique :** la date, et pas la ligne entière. `DJF 1997 -0.21` et `DJF 1997 -0.25` sont des doublons, même si leurs valeurs diffèrent.
- **Options :** garder la première ligne, garder la dernière, ou rejeter les deux.
- **Choix :** garder la première et compter les doublons dans le rapport d'import.
- **Pourquoi :** le résultat est toujours le même à chaque exécution, et le rapport rend l'anomalie visible.
- **Limites :** si la bonne valeur est la deuxième, on garde la mauvaise. Le rapport permet de le repérer.
- **Deuxième sécurité :** la base aura une contrainte `UNIQUE` sur la date (voir le 29 octobre).

---

## D6. Schéma de la base de données

- **Besoin :** stocker les observations durablement, savoir d'où vient chaque observation, filtrer vite par période, et ne jamais avoir deux valeurs pour la même date.
- **Tables :**
  - `indice` : nom, nom complet, unité. Une ligne par indice (RONI).
  - `source` : producteur, URL, version. Qui produit les données et où les trouver. Ne change pas d'un téléchargement à l'autre.
  - `import` : date d'extraction, fichier brut, moment de l'import, et le rapport (lues, rejetées, doublons, gardées). Une ligne à chaque lancement du script.
  - `observation` : date, saison, anomalie. Une ligne par mesure.
- **Liens (clés étrangères) :**
  - `observation.indice_id` → `indice.id` : plusieurs observations appartiennent à un indice.
  - `observation.import_id` → `import.id` : plusieurs observations viennent d'un import.
  - `import.source_id` → `source.id` : plusieurs imports lisent le fichier d'une même source.
  - Règle : la clé étrangère se met du côté « plusieurs ». Un import ne peut pas stocker 920 numéros d'observations, mais chaque observation peut stocker un numéro d'import.
- **Chaque information à un seul endroit (normalisation) :** l'unité est dans `indice`, pas répétée 920 fois dans `observation`. Si elle change, on la modifie une seule fois.
- **Unicité :** contrainte `UNIQUE (indice_id, date)` sur `observation`. Une seule valeur par indice et par date. C'est la deuxième sécurité contre les doublons, après `transform.py` (D5).
- **Index :** la contrainte `UNIQUE (indice_id, date)` crée automatiquement un index, qui sert aussi au filtre par période de l'API.
- **Traçabilité :** pour une observation, on retrouve son fichier brut et son URL en suivant `observation` → `import` → `source`.
- **Limites :** 4 tables pour un seul indice, c'est un peu plus que le strict nécessaire. Mais ça correspond au modèle demandé par le sujet, et ça permettrait d'ajouter l'ONI sans changer le schéma.

---

## D7. Relancer l'import : la dernière valeur l'emporte

- **Besoin :** pouvoir relancer l'import sans créer de doublon, et prendre en compte les corrections de la NOAA (les valeurs récentes sont révisées pendant environ deux mois).
- **Options :**
  - A. ignorer les observations déjà en base (`ON CONFLICT DO NOTHING`) ;
  - B. remplacer la valeur par la nouvelle (`ON CONFLICT DO UPDATE`, appelé « upsert ») ;
  - C. une interface pour choisir à la main.
- **Choix :** B. Si l'observation (indice, date) existe déjà, son anomalie est remplacée et elle pointe vers le nouvel import.
- **Pourquoi :** la valeur la plus récente de la NOAA est la plus juste. L'option C est une fonctionnalité en plus, hors MVP.
- **Traçabilité :** chaque lancement crée une ligne dans `import` avec son rapport. L'observation pointe vers l'import qui a fourni sa valeur actuelle.
- **Ordre de remplissage :** `indice` et `source` d'abord (« obtenir ou créer » : on cherche la ligne, on la crée seulement si elle n'existe pas), puis `import`, puis `observation`. Une table qui pointe vers une autre est remplie après elle.
- **Limites :** l'ancienne valeur n'est conservée nulle part. Une table d'historique des valeurs serait possible, mais hors MVP.
