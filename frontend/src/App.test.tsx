import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import App from "./App";
import { ApiError, getIndice, getObservations } from "./api";
import type { Observation } from "./types";

// On remplace les appels à l'API par de fausses fonctions :
// le test ne dépend ni du serveur ni de la base de données.
vi.mock("./api", async (importOriginal) => {
  const original = await importOriginal<typeof import("./api")>();
  return { ...original, getIndice: vi.fn(), getObservations: vi.fn() };
});

// La comparaison a ses propres champs « Du » et « Au » : on cherche ceux du groupe « Période ».
function champPeriode(nom: string): HTMLElement {
  return within(screen.getByRole("group", { name: "Période" })).getByLabelText(nom);
}

// On remplace aussi la courbe Recharts, qui ne sait pas se dessiner dans jsdom.
// La fausse courbe affiche simplement combien de points elle a reçus.
vi.mock("./CourbeAnomalies", () => ({
  default: ({ observations }: { observations: Observation[] }) => (
    <p>Courbe : {observations.length} points</p>
  ),
}));

const TOUTES: Observation[] = [
  { date: "1997-06-01", saison: "MJJ", anomalie: 1.2 },
  { date: "1997-12-01", saison: "NDJ", anomalie: 2.28 },
  { date: "2015-12-01", saison: "NDJ", anomalie: 2.25 },
  { date: "2020-12-01", saison: "NDJ", anomalie: -1.2 },
];
const ANNEE_1997: Observation[] = [TOUTES[0], TOUTES[1]];

beforeEach(() => {
  vi.mocked(getIndice).mockResolvedValue({
    nom: "RONI",
    nom_complet: "Relative Oceanic Niño Index",
    unite: "°C",
    producteur: "NOAA Climate Prediction Center",
    url: "https://www.cpc.ncep.noaa.gov/data/indices/RONI.ascii.txt",
    version: "ERSST v6",
    date_extraction: "2026-10-27",
  });
  // La fausse API suit les mêmes règles que la vraie :
  // - une période inversée est refusée avec le code 422 ;
  // - l'année 1997 renvoie 2 observations, et toute la période en renvoie 4.
  vi.mocked(getObservations).mockImplementation(async (start, end) => {
    if (start && end && start > end) {
      throw new ApiError(422, "Erreur 422");
    }
    return start === "1997-01-01" && end === "1997-12-31" ? ANNEE_1997 : TOUTES;
  });
});

test("changer la période met à jour la courbe", async () => {
  // Préparer : afficher l'application, qui charge toute la période.
  render(<App />);
  expect(await screen.findByText("Courbe : 4 points")).toBeInTheDocument();

  // Agir : l'utilisateur choisit du 1er janvier au 31 décembre 1997.
  fireEvent.change(champPeriode("Du"), { target: { value: "1997-01-01" } });
  fireEvent.change(champPeriode("Au"), { target: { value: "1997-12-31" } });

  // Vérifier : l'API a reçu la période, et la courbe n'a plus que 2 points.
  expect(await screen.findByText("Courbe : 2 points")).toBeInTheDocument();
  expect(getObservations).toHaveBeenLastCalledWith("1997-01-01", "1997-12-31");
});

test("une période inversée affiche un message d'erreur", async () => {
  // Préparer : afficher l'application, qui charge toute la période.
  render(<App />);
  expect(await screen.findByText("Courbe : 4 points")).toBeInTheDocument();

  // Agir : l'utilisateur met une date de début APRÈS la date de fin.
  fireEvent.change(champPeriode("Du"), { target: { value: "1998-01-01" } });
  fireEvent.change(champPeriode("Au"), { target: { value: "1997-01-01" } });

  // Vérifier : le message d'erreur est annoncé, et la courbe n'est plus affichée.
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "La date de début doit être avant la date de fin.",
  );
  expect(screen.queryByText(/Courbe/)).not.toBeInTheDocument();
});
