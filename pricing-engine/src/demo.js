// Demo CLI du moteur de tarification. Usage : npm run demo

import { calculerDevis } from "./calculer_devis.js";

const payloadExemple = {
  nb_passagers: 34,
  date_depart: "2026-07-15T08:00:00Z",
  date_demande: "2026-06-23T12:00:00Z",
  distance_km: 150,
  options: ["nuit_chauffeur", "peages_inclus"],
  nb_nuits: 1,
  peages_forfait: 45,
};

const devis = calculerDevis(payloadExemple);
console.log("=== PAYLOAD ===");
console.log(JSON.stringify(payloadExemple, null, 2));
console.log("\n=== DEVIS CALCULE ===");
console.log(JSON.stringify(devis, null, 2));
