import { useEffect, useState } from "react";
import CourbeAnomalies from "./CourbeAnomalies";
import { getIndice, getObservations } from "./api";
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

  useEffect(() => {
    getIndice().then((resultat) => setIndice(resultat));
  }, []);

  useEffect(()=> {
    getObservations().then((resultat) => setObservations(resultat));
  }, []);

  return (
    <main>
      <h1>ENSO Monitor</h1>
      <p>Exploration de l'indice RONI de la NOAA</p>
      <p>{observations.length} observations chargées</p>
      {indice && <Source indice={indice} />}
      <CourbeAnomalies observations={observations} />
    </main>
  );
}

export default App;
