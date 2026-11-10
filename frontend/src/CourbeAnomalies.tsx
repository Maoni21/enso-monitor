import type { Observation } from "./types";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

type CourbeAnomaliesProps = {
  observations: Observation[];
};

/** Affiche la courbe des anomalies RONI au fil du temps. */
function CourbeAnomalies({ observations }: CourbeAnomaliesProps) {
    return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={observations}>
            <XAxis dataKey="date" />
            <YAxis />
            <Line dataKey="anomalie" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
}

export default CourbeAnomalies;