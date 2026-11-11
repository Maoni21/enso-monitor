import type { Observation } from "./types";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Tooltip } from "recharts";

import { formaterAnomalie } from "./interpretation";

type CourbeAnomaliesProps = {
  observations: Observation[];
};

/** Affiche la courbe des anomalies RONI au fil du temps, avec les mêmes données en tableau. */
function CourbeAnomalies({ observations }: CourbeAnomaliesProps) {
  // App n'affiche la courbe que s'il y a au moins une observation.
  const premiere = observations[0];
  const derniere = observations[observations.length - 1];

  return (
    <figure>
      <figcaption>
        Anomalie de l'indice RONI, en °C, du {premiere.date} au {derniere.date}. Au-dessus de +0,5 °C :
        conditions El Niño. En dessous de −0,5 °C : conditions La Niña.
      </figcaption>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={observations}>
          <Tooltip />
          <XAxis dataKey="date" tickFormatter={(date: string) => date.slice(0, 4)} minTickGap={30} />
          <YAxis unit=" °C" domain={[-3, 3]} />
          <Line dataKey="anomalie" dot={false} name="Anomalie RONI" unit=" °C" stroke="var(--accent)" />
          <ReferenceLine y={0.5} label="El Niño" stroke="var(--text)" strokeDasharray="4 4" />
          <ReferenceLine y={-0.5} label="La Niña" stroke="var(--text)" strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>

      {/* Les mêmes données en tableau, pour les personnes qui ne peuvent pas lire le graphique. */}
      <details>
        <summary>Voir les données sous forme de tableau</summary>
        <div className="tableau-defilant tableau-donnees">
          <table>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Saison</th>
                <th scope="col">Anomalie</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((observation) => (
                <tr key={observation.date}>
                  <td>{observation.date}</td>
                  <td>{observation.saison}</td>
                  <td>{formaterAnomalie(observation.anomalie)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

export default CourbeAnomalies;
