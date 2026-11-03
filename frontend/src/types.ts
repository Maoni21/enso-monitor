export type Observation = {
  date: string;
  saison: string;
  anomalie: number;
};

export type Indice = {
  nom: string;
  nom_complet: string;
  unite: string;
  producteur: string;
  url: string;
  version: string;
  date_extraction: string;
};

export type StatistiquesEpisode = {
  debut: string;
  fin: string;
  nb_saisons: number;
  pic: number;
  date_pic: string;
  saison_pic: string;
  moyenne: number;
  duree_el_nino: number;
};

export type Comparaison = {
  indice: string;
  seuil: number;
  episode_a: StatistiquesEpisode;
  episode_b: StatistiquesEpisode;
};
