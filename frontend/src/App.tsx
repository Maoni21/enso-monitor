import { useEffect, useState } from "react";
import CourbeAnomalies from "./CourbeAnomalies";
import { getIndice, getObservations, messageErreur } from "./api";
import type { Indice, Observation } from "./types";

type SourceProps = {
  indice: Indice;
};

/** Affiche l'indice, son unité, sa source et la date d'extraction des données. */
function Source({ indice }: SourceProps) {
  return (
    <p className="source">
      Indice {indice.nom} ({indice.nom_complet}), en {indice.unite}. Source : {indice.producteur},{" "}
      {indice.version}. Données extraites le {indice.date_extraction}.
    </p>
  );
}

function App() {
  const [indice, setIndice] = useState<Indice | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [chargement, setChargement] = useState<boolean>(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    // Si l'API ne répond pas, le message d'erreur des observations le signale déjà.
    getIndice()
      .then((resultat) => setIndice(resultat))
      .catch(() => setIndice(null));
  }, []);

  useEffect(() => {
    getObservations(start, end)
      .then((resultat) => setObservations(resultat))
      .catch((e) => {
        setObservations([]);
        setErreur(messageErreur(e, "La date de début doit être avant la date de fin."));
      })
      .finally(() => setChargement(false));
  }, [start, end]);

  /** Appelée quand l'utilisateur change une date : affiche « Chargement… » et efface l'ancienne erreur. */
  function preparerChargement() {
    setChargement(true);
    setErreur(null);
  }

  return (
    <main>
      <h1>ENSO Monitor</h1>
      <p>Exploration de l'indice RONI de la NOAA</p>
      {indice && <Source indice={indice} />}

      <fieldset>
        <legend>Période</legend>
        <label htmlFor="debut">Du</label>
        <input
          id="debut"
          type="date"
          value={start}
          onChange={(e) => {
            setStart(e.target.value);
            preparerChargement();
          }}
        />
        <label htmlFor="fin">Au</label>
        <input
          id="fin"
          type="date"
          value={end}
          onChange={(e) => {
            setEnd(e.target.value);
            preparerChargement();
          }}
        />
      </fieldset>

      {erreur && <p role="alert" className="erreur">{erreur}</p>}
      <p role="status">
        {chargement && "Chargement des observations…"}
        {!chargement && !erreur && observations.length === 0 && "Aucune observation sur cette période."}
        {!chargement && observations.length > 0 && `${observations.length} observations chargées`}
      </p>
      {observations.length > 0 && <CourbeAnomalies observations={observations} />}
    </main>
  );
}

export default App;
