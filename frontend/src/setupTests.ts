import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Ajoute à Vitest des vérifications pour le HTML, comme toBeInTheDocument().
import "@testing-library/jest-dom/vitest";

// Après chaque test, on efface la page affichée, pour que les tests restent indépendants.
afterEach(() => {
  cleanup();
});
