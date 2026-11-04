/** Página propia de El Ropero (entrada ropero/index.html en vite.config.ts). */
export const ROPERO_URL = "/ropero/";

export function goToRopero() {
  window.location.assign(ROPERO_URL);
}
