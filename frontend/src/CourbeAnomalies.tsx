import type { Observation } from "./types";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Tooltip } from "recharts";

type CourbeAnomaliesProps = {
  observations: Observation[];
};

/** Affiche la courbe des anomalies RONI au fil du temps. */
function CourbeAnomalies({ observations }: CourbeAnomaliesProps) {
    return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={observations}>
            <Tooltip />
            <XAxis dataKey="date" />
            <YAxis unit=" °C" domain={[-3, 3]} />
            <Line dataKey="anomalie" dot={false} name="Anomalie RONI" unit=" °C"/>
            <ReferenceLine y={0.5} label="El Niño" />
            <ReferenceLine y={-0.5} label="La Niña" />
          </LineChart>
        </ResponsiveContainer>
      );
}

export default CourbeAnomalies;