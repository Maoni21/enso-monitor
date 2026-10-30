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
