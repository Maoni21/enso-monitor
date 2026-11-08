import type { Comparaison, Indice, Observation } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

/** Erreur renvoyée par l'API, avec son code HTTP (404, 422, 500...). */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Appelle l'API, vérifie le code HTTP et renvoie le JSON de la réponse. */
async function lireJson<T>(chemin: string): Promise<T> {
  const reponse = await fetch(API_URL + chemin);
  if (!reponse.ok) {
    throw new ApiError(reponse.status, `Erreur ${reponse.status} sur ${chemin}`);
  }
  return (await reponse.json()) as T;
}

/** Renvoie les observations RONI, entre start et end s'ils sont fournis (format AAAA-MM-JJ). */
export function getObservations(start?: string, end?: string): Promise<Observation[]> {
  const params = new URLSearchParams();
  if (start) {
    params.set("start", start);
  }
  if (end) {
    params.set("end", end);
  }
  return lireJson<Observation[]>(`/observations?${params}`);
}

/** Renvoie la description de l'indice RONI et de sa source. */
export function getIndice(): Promise<Indice> {
  return lireJson<Indice>("/indice");
}

/** Renvoie la comparaison de deux épisodes, chacun défini par une date de début et de fin (AAAA-MM-JJ). */
export function getComparaison(debutA: string, finA: string, debutB: string, finB: string): Promise<Comparaison> {
  const params = new URLSearchParams();
  params.set("debut_a", debutA);
  params.set("fin_a", finA);
  params.set("debut_b", debutB);
  params.set("fin_b", finB);
  return lireJson<Comparaison>(`/comparaison?${params}`);
}
