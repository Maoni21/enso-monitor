# Source des données

- **Indice :** RONI (Relative Oceanic Niño Index)
- **Producteur :** NOAA, Climate Prediction Center (CPC)
- **URL du fichier :** https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt
- **Page de référence :** https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/
- **Version :** RONI calculé à partir des températures de surface de la mer ERSST v6, période de référence 1991-2020
- **Date d'extraction :** 27/10/2026
- **Fichier brut :** `data/raw/roni_2026-10-27.txt` (jamais modifié)
- **Période couverte :** de DJF 1950 à JAS 2026 (920 saisons)
- **Unité :** °C. C'est un écart relatif, pas une température.
- **Format :** 3 colonnes. `SEAS` = saison de 3 mois glissants, `YR` = année, `ANOM` = valeur de l'indice.
- **Attention :** les dernières saisons de 2026 sont provisoires et peuvent encore être corrigées par la NOAA.

## Comment le RONI est calculé

1. On prend l'anomalie de température de la zone Niño 3.4 (5°N-5°S, 120°-170°W).
2. On lui retire l'anomalie moyenne de toutes les mers tropicales (20°N-20°S) au même moment.
3. On remet le résultat à l'échelle pour qu'il varie autant que l'indice d'origine.

Seuils utilisés dans l'application : El Niño si la valeur est ≥ +0,5 °C pendant au moins 5 saisons d'affilée, La Niña si elle est ≤ -0,5 °C pendant au moins 5 saisons d'affilée.

## Choix de l'indice

- **Besoin :** comparer de façon juste deux épisodes historiques de décennies différentes (par exemple 1997-98 et 2015-16).
- **Solutions envisagées :** ONI ou RONI. Le sujet demande d'en choisir un seul.
- **Choix final :** RONI.
- **Avantages :**
  - Il retire le réchauffement de fond de l'océan, donc les comparaisons entre décennies sont plus justes.
  - C'est l'indice utilisé par la NOAA pour le suivi officiel depuis février 2026.
  - Le fichier est simple : 3 colonnes.
- **Limites :**
  - Il n'y a pas de température réelle, seulement un écart relatif.
  - L'indice est récent : il y a moins de documentation et d'exemples.
  - Ses valeurs diffèrent de l'ONI, que citent beaucoup d'articles. Exemple pour JAS 2026 : ONI +2,16, RONI +1,69. L'interface doit indiquer clairement qu'il s'agit du RONI.
- **Vérification :**
  - Après l'import, comparer quelques valeurs en base avec le fichier brut (par exemple NDJ 1997 = 2,28 et NDJ 2015 = 2,25).
  - Vérifier que la base contient autant de saisons que le fichier (920).
