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

---

## D8. Découpage de l'API en trois fichiers

- **Besoin :** une API facile à tester et à faire évoluer.
- **Choix :**
  - `main.py` : le HTTP uniquement (routes, paramètres, codes 404 et 422) ;
  - `repository.py` : les requêtes à la base ;
  - `comparaison.py` : les calculs (pic, moyenne, durée), sans base de données.
- **Pourquoi :** les calculs se testent avec de simples listes de nombres, sans démarrer PostgreSQL (`test_comparaison.py`). Chaque fichier a une seule raison de changer.
- **Limites :** un fichier de plus à ouvrir pour suivre une requête de bout en bout.

---

## D9. Comparaison par périodes libres, au mois près

- **Besoin :** comparer deux épisodes, alors qu'un épisode El Niño est presque toujours à cheval sur deux années (1997-1998, 2015-2016).
- **Options :** choisir deux années civiles, ou deux périodes libres (date de début et de fin).
- **Choix :** deux périodes libres. Les deux exemples préremplis sont 1997-04-01 → 1998-06-01 et 2015-01-01 → 2016-06-01.
- **Pourquoi :** une année civile couperait l'épisode en deux et fausserait le pic et la durée.
- **Limites :** l'utilisateur doit connaître à peu près les dates de l'épisode. La courbe l'aide à les repérer.

---

## D10. Durée El Niño : la plus longue suite de saisons consécutives

- **Besoin :** mesurer combien de temps un épisode reste au-dessus du seuil de +0,5 °C.
- **Options :** compter toutes les saisons au-dessus du seuil, ou la plus longue suite **sans interruption**.
- **Choix :** la plus longue suite de saisons consécutives à +0,5 °C ou plus (`plus_longue_serie`).
- **Pourquoi :** la NOAA définit un épisode par des saisons consécutives. Exemple : en 2015, DJF à 0,54 puis JFM à 0,47 casse la série.
- **Limites :** une seule saison sous le seuil coupe la durée en deux, même si l'épisode reprend juste après.

---

## D11. TypeScript 6 au lieu de 7

- **Besoin :** vérifier le code frontend avec ESLint.
- **Constat :** `typescript-eslint` n'acceptait pas encore TypeScript 7.
- **Choix :** TypeScript 6, en mode `strict`.
- **Limites :** il faudra passer à la version 7 quand les outils la prendront en charge.

---

## D12. La courbe : Recharts, axe fixe de −3 à +3 °C

- **Besoin :** une courbe interactive des 920 saisons, avec les seuils El Niño et La Niña.
- **Choix :**
  - Recharts : des composants React (`LineChart`, `XAxis`, `Line`…), lisibles sans connaître le dessin SVG ;
  - pas de point sur chaque valeur (`dot={false}`), sinon 920 points rendent la courbe illisible ;
  - axe vertical fixé de −3 à +3 °C.
- **Pourquoi l'axe fixe :** automatiquement, Recharts montait jusqu'à +6 °C, ce qui laissait la moitié du graphique vide et écrasait les pics. Un axe symétrique autour de 0 donne le même poids visuel à El Niño et à La Niña, et toutes les valeurs depuis 1950 y tiennent.
- **Limites :** si une valeur dépassait ±3 °C un jour, il faudrait élargir l'axe.

---

## D13. Le filtre de période

- **Besoin :** n'afficher que la période choisie par l'utilisateur.
- **Choix :**
  - deux états `start` et `end` dans `App`, le composant qui fait l'appel à l'API ;
  - le `useEffect` des observations surveille `[start, end]` : il rappelle l'API à chaque changement ;
  - des champs natifs `<input type="date">` : le navigateur fournit le calendrier, il fonctionne au clavier, et il donne le format `AAAA-MM-JJ` attendu par l'API.
- **Pourquoi filtrer côté serveur :** l'API sait déjà filtrer (`start`, `end`), et le navigateur ne reçoit que les données utiles.
- **Conséquence de D3 :** les observations sont datées du 1er du mois. Du 11 janvier 2009 au 11 janvier 2010, on obtient 12 saisons et pas 13 : DJF 2009 (datée du 2009-01-01) est avant le 11 janvier.
- **Limites :** si l'utilisateur change très vite de période, une ancienne réponse pourrait en théorie arriver après la nouvelle. Ce cas n'est pas géré.

---

## D14. Gestion des erreurs

- **Besoin :** l'utilisateur doit comprendre ce qui se passe, au lieu de voir une page vide.
- **Choix :**
  - la règle « le début doit être avant la fin » est vérifiée **par le serveur** (422), car on ne peut pas faire confiance au navigateur : n'importe qui peut appeler l'API directement ;
  - le frontend traduit l'erreur en phrase (`messageErreur` dans `api.ts`) : 422 → message sur les dates, autre code → « réessayez plus tard », pas de réponse → « le serveur ne répond pas » ;
  - trois états affichés : chargement, erreur, période sans donnée.
- **Accessibilité :** le message d'erreur a `role="alert"` et le compteur `role="status"`, pour qu'un lecteur d'écran les annonce.
- **Limites :** le message 422 du filtre suppose que la seule erreur possible est une période inversée, ce qui est vrai avec des champs de date natifs.

---

## D15. Le test frontend

- **Besoin :** le 3ᵉ test obligatoire : changer la période met à jour la courbe.
- **Choix :** Vitest + Testing Library + jsdom (un faux navigateur).
  - les appels à l'API sont remplacés par de fausses fonctions (`vi.mock`), qui suivent les mêmes règles que la vraie API ;
  - la courbe Recharts est remplacée par une fausse courbe qui affiche le nombre de points reçus, car Recharts ne sait pas se dessiner dans jsdom.
- **Vérification :** si on remet `[]` à la place de `[start, end]` dans le `useEffect`, les tests échouent. Ils détectent donc bien le bug.
- **Limites :** le dessin réel de la courbe n'est pas testé, seulement les données qu'elle reçoit.

---

## D16. Une interprétation prudente de la comparaison

- **Besoin :** le sujet demande une interprétation prudente. « Super El Niño » n'est pas une catégorie scientifique.
- **Choix :**
  - un écart de pic de moins de 0,1 °C est présenté comme « presque identique », sans désigner de gagnant (1997 : 2,28 °C contre 2015 : 2,25 °C) ;
  - l'indice et le seuil sont toujours affichés ;
  - un avertissement rappelle qu'un autre indice ou un autre seuil peut changer la conclusion, que les valeurs récentes sont provisoires, et qu'il ne s'agit pas d'une prévision.
- **Pourquoi 0,1 °C :** les valeurs sont publiées à 0,01 °C près, mais les révisions de la NOAA et le choix de l'indice (RONI ou ONI) déplacent les valeurs bien plus que de quelques centièmes. C'est un seuil de prudence choisi pour ce projet, pas une norme officielle.
- **Limites :** le texte est généré par des règles simples. Il ne remplace pas l'avis d'un climatologue.

---

## D17. Accessibilité et mobile

- **Choix :**
  - chaque champ a un `<label>` relié par `htmlFor`, et les champs d'une période sont groupés dans un `<fieldset>` avec une `<legend>` ;
  - le graphique a une description (`<figcaption>`) et les mêmes données en **tableau**, pour les personnes qui ne peuvent pas lire un graphique ;
  - contour visible au clavier (`:focus-visible`), contrastes au niveau AA, page en `lang="fr"` ;
  - sur un écran de moins de 600 px, les champs passent les uns sous les autres et les tableaux défilent dans leur cadre.
- **Limites :** pas encore testé avec un vrai lecteur d'écran (VoiceOver).

---

## D18. Déploiement : Docker Compose et Caddy

- **Besoin :** documenter un déploiement sur un VPS, sécurisé et reproductible.
- **Choix :**
  - `compose.prod.yaml` lance trois conteneurs : `db` (PostgreSQL), `api` (FastAPI) et `web` (Caddy + le site construit) ;
  - Caddy sert le site **et** transmet `/api/*` à l'API : tout est à la même adresse, donc pas besoin de CORS en production ;
  - seul Caddy publie des ports (80 et 443). La base et l'API ne sont joignables que sur le réseau interne de Docker ;
  - HTTPS automatique : il suffit de renseigner `DOMAINE` dans `.env` ;
  - `compose.yaml` reste réservé au développement (la base seule, port 5432 ouvert sur la machine).
- **Limites :** pas de sauvegarde automatique de la base, pas de déploiement automatique (CI/CD), un seul serveur.
