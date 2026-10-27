# Lexique

Ma fiche de révision pour l'oral : chaque notion expliquée simplement.

## Git et GitHub
Git est le logiciel installé sur mon ordinateur qui garde l'historique de mon code. GitHub est un site qui héberge une copie de mon dépôt en ligne. Ce n'est pas la même chose : c'est Git qui fait les commits, GitHub ne fait que les stocker.

## Commit
Un commit est une photo de l'état du projet à un instant, avec un message qui dit ce qui a changé. La suite des commits montre comment le projet a avancé.

## .gitignore
La liste des fichiers que Git ne doit jamais suivre :
- `.venv/` et `node_modules/` : les dépendances installées. C'est lourd, et ça se réinstalle avec `pip` ou `npm`.
- `__pycache__/` : des fichiers générés automatiquement par Python.
- `.DS_Store` : un fichier caché créé par macOS.
- `.env` : les secrets, comme le mot de passe de la base.

Si un `.env` est commité, il reste dans l'historique même après l'avoir supprimé. Il faut alors changer tous les mots de passe.

## Dossier vide et .gitkeep
Git suit des fichiers, pas des dossiers, donc un dossier vide est invisible pour lui. On met dedans un fichier vide `.gitkeep` pour que le dossier existe dans le dépôt. Ce nom est juste une convention, n'importe quel fichier marcherait.

## Fichier brut
Le fichier téléchargé chez la NOAA n'est jamais modifié, pour trois raisons :
1. Prouver que les données viennent bien de la NOAA.
2. Pouvoir relancer l'import depuis le début si mon code a un bug.
3. Garder une version datée, parce que la NOAA corrige parfois les valeurs récentes.

## Anomalie
L'écart entre la température mesurée et la normale, en °C. +2 veut dire 2 °C plus chaud que d'habitude.

## Saisons glissantes (DJF, JFM, ...)
Des moyennes sur 3 mois qui avancent d'un mois à chaque ligne : DJF = décembre-janvier-février, JFM = janvier-février-mars. Ça lisse les variations d'un mois sur l'autre. Piège : DJF 1997 contient décembre 1996.

## ONI et RONI
L'ONI compare la température de la zone Niño 3.4 à sa moyenne sur 30 ans. Le RONI la compare à la moyenne de toutes les mers tropicales au même moment. Comme tout l'océan se réchauffe, l'ONI mélange El Niño et réchauffement général, alors que le RONI retire ce réchauffement. Il compare donc plus justement des épisodes de décennies différentes.

## El Niño et La Niña
- El Niño : l'indice est à +0,5 °C ou plus pendant au moins 5 saisons d'affilée.
- La Niña : l'indice est à -0,5 °C ou moins pendant au moins 5 saisons d'affilée.
