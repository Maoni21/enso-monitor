import { expect, test } from "vitest";

import { formaterAnomalie, interpreter, saisonDuPic } from "./interpretation";
import type { Comparaison } from "./types";

// Les vraies valeurs RONI des épisodes 1997-1998 et 2015-2016 (voir la passation).
const COMPARAISON: Comparaison = {
  indice: "RONI",
  seuil: 0.5,
  episode_a: {
    debut: "1997-04-01", fin: "1998-06-01", nb_saisons: 15,
    pic: 2.28, date_pic: "1997-12-01", saison_pic: "NDJ", moyenne: 1.5, duree_el_nino: 12,
  },
  episode_b: {
    debut: "2015-01-01", fin: "2016-06-01", nb_saisons: 18,
    pic: 2.25, date_pic: "2015-12-01", saison_pic: "NDJ", moyenne: 1.3, duree_el_nino: 14,
  },
};

test("formaterAnomalie écrit le nombre à la française avec l'unité", () => {
  expect(formaterAnomalie(2.28)).toBe("2,28 °C");
  expect(formaterAnomalie(-0.5)).toBe("-0,50 °C");
});

test("saisonDuPic donne la saison et l'année du pic", () => {
  expect(saisonDuPic(COMPARAISON.episode_a)).toBe("NDJ 1997");
});

test("un écart de pic de 0,03 °C n'est pas présenté comme une différence d'intensité", () => {
  const texte = interpreter(COMPARAISON);
  expect(texte).toContain("presque identique");
  expect(texte).toContain("12 saisons consécutives");
  expect(texte).toContain("contre 14");
});

test("un grand écart de pic désigne l'épisode le plus intense", () => {
  const texte = interpreter({ ...COMPARAISON, episode_b: { ...COMPARAISON.episode_b, pic: 1.2 } });
  expect(texte).toContain("L'épisode A a le pic le plus élevé");
});
