import { useState } from "react";
import type { FormEvent } from "react";

import { getComparaison, messageErreur } from "./api";
import { formaterAnomalie, interpreter, saisonDuPic } from "./interpretation";
import type { Comparaison } from "./types";

/** Permet de choisir deux périodes et affiche leurs statistiques côte à côte. */
function ComparaisonEpisodes() {
  // Périodes préremplies avec deux grands épisodes El Niño : 1997-1998 et 2015-2016.
  const [debutA, setDebutA] = useState<string>("1997-04-01");
  const [finA, setFinA] = useState<string>("1998-06-01");
  const [debutB, setDebutB] = useState<string>("2015-01-01");
  const [finB, setFinB] = useState<string>("2016-06-01");
  const [comparaison, setComparaison] = useState<Comparaison | null>(null);
  const [chargement, setChargement] = useState<boolean>(false);
  const [erreur, setErreur] = useState<string | null>(null);

  /** Appelée quand on valide le formulaire : demande la comparaison à l'API. */
  function comparer(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault(); // empêche le navigateur de recharger la page
    setChargement(true);
    setErreur(null);
    getComparaison(debutA, finA, debutB, finB)
      .then((resultat) => setComparaison(resultat))
      .catch((e) => {
        setComparaison(null);
        setErreur(
          messageErreur(
            e,
            "Vérifiez les deux périodes : chaque début doit être avant sa fin, et chaque période doit contenir des données (de 1950 à 2026).",
          ),
        );
      })
      .finally(() => setChargement(false));
  }

  return (
    <section aria-labelledby="titre-comparaison">
      <h2 id="titre-comparaison">Comparer deux épisodes</h2>

      <form onSubmit={comparer} className="comparaison-formulaire">
        <fieldset>
          <legend>Épisode A</legend>
          <label htmlFor="debut-a">Du</label>
          <input id="debut-a" type="date" required value={debutA} onChange={(e) => setDebutA(e.target.value)} />
          <label htmlFor="fin-a">Au</label>
          <input id="fin-a" type="date" required value={finA} onChange={(e) => setFinA(e.target.value)} />
        </fieldset>
        <fieldset>
          <legend>Épisode B</legend>
          <label htmlFor="debut-b">Du</label>
          <input id="debut-b" type="date" required value={debutB} onChange={(e) => setDebutB(e.target.value)} />
          <label htmlFor="fin-b">Au</label>
          <input id="fin-b" type="date" required value={finB} onChange={(e) => setFinB(e.target.value)} />
        </fieldset>
        <button type="submit" disabled={chargement}>
          {chargement ? "Comparaison en cours…" : "Comparer"}
        </button>
      </form>

      {erreur && <p role="alert" className="erreur">{erreur}</p>}

      {comparaison && (
        <>
          <div className="tableau-defilant">
            <table>
              <caption>
                Indice {comparaison.indice}, seuil El Niño : +{formaterAnomalie(comparaison.seuil)}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Statistique</th>
                  <th scope="col">Épisode A</th>
                  <th scope="col">Épisode B</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Période</th>
                  <td>{comparaison.episode_a.debut} → {comparaison.episode_a.fin}</td>
                  <td>{comparaison.episode_b.debut} → {comparaison.episode_b.fin}</td>
                </tr>
                <tr>
                  <th scope="row">Nombre de saisons</th>
                  <td>{comparaison.episode_a.nb_saisons}</td>
                  <td>{comparaison.episode_b.nb_saisons}</td>
                </tr>
                <tr>
                  <th scope="row">Pic</th>
                  <td>{formaterAnomalie(comparaison.episode_a.pic)} ({saisonDuPic(comparaison.episode_a)})</td>
                  <td>{formaterAnomalie(comparaison.episode_b.pic)} ({saisonDuPic(comparaison.episode_b)})</td>
                </tr>
                <tr>
                  <th scope="row">Moyenne</th>
                  <td>{formaterAnomalie(comparaison.episode_a.moyenne)}</td>
                  <td>{formaterAnomalie(comparaison.episode_b.moyenne)}</td>
                </tr>
                <tr>
                  <th scope="row">Durée au-dessus du seuil (saisons consécutives)</th>
                  <td>{comparaison.episode_a.duree_el_nino}</td>
                  <td>{comparaison.episode_b.duree_el_nino}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>{interpreter(comparaison)}</p>
          <p className="avertissement">
            Ces chiffres décrivent l'indice {comparaison.indice} avec un seuil de +{formaterAnomalie(comparaison.seuil)} :
            un autre indice (comme l'ONI) ou un autre seuil peut changer la conclusion. Le terme « Super El Niño »
            n'est pas une catégorie scientifique officielle. Les valeurs des derniers mois sont provisoires et peuvent
            être révisées par la NOAA. Cette comparaison décrit le passé et ne constitue pas une prévision.
          </p>
        </>
      )}
    </section>
  );
}

export default ComparaisonEpisodes;
