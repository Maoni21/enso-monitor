import type { Comparaison, StatistiquesEpisode } from "./types";

/** Écart de pic en dessous duquel on considère que deux épisodes ont la même intensité. */
const ECART_NEGLIGEABLE = 0.1;

/** Écrit une anomalie en français, avec 2 décimales et l'unité : 2.28 donne « 2,28 °C ». */
export function formaterAnomalie(valeur: number): string {
  return `${valeur.toFixed(2).replace(".", ",")} °C`;
}

/** Donne la saison du pic avec son année : NDJ et 1997-12-01 donnent « NDJ 1997 ». */
export function saisonDuPic(episode: StatistiquesEpisode): string {
  return `${episode.saison_pic} ${episode.date_pic.slice(0, 4)}`;
}

/** Rédige une interprétation prudente de la comparaison de deux épisodes. */
export function interpreter(comparaison: Comparaison): string {
  const a = comparaison.episode_a;
  const b = comparaison.episode_b;
  const ecart = Math.abs(a.pic - b.pic);

  let phrasePic: string;
  if (ecart < ECART_NEGLIGEABLE) {
    phrasePic = `Les deux épisodes ont un pic presque identique (écart de ${formaterAnomalie(ecart)}) : cet écart est trop faible pour dire que l'un est plus intense que l'autre.`;
  } else {
    const plusFort = a.pic > b.pic ? "A" : "B";
    phrasePic = `L'épisode ${plusFort} a le pic le plus élevé, avec un écart de ${formaterAnomalie(ecart)}.`;
  }

  const phraseDuree = `L'épisode A reste ${a.duree_el_nino} saisons consécutives au-dessus du seuil, contre ${b.duree_el_nino} pour l'épisode B.`;

  return `${phrasePic} ${phraseDuree}`;
}
