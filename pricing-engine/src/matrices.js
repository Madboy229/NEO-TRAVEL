// Matrices de tarification Neotravel.
// Source : Brief "Automatisation des processus commerciaux" — Tableaux 2a / 2b / 2c / 3.
// Hypotheses equipe documentees dans docs/hypotheses-pricing.md.

export const COEFFICIENTS_SAISON = {
  basse: { mois: [11, 1, 2, 8], coefficient: -0.07 },
  moyenne: { mois: [12, 10, 9], coefficient: 0 },
  haute: { mois: [3, 4, 7], coefficient: 0.10 },
  tres_haute: { mois: [5, 6], coefficient: 0.15 },
};

export const COEFFICIENTS_DELAI = {
  DD_PRIORITAIRE: { min_jours: 0, max_jours: 2, coefficient: 0.10 },
  DD_URGENT: { min_jours: 2, max_jours: 7, coefficient: 0.05 },
  DD_NORMAL: { min_jours: 7, max_jours: 90, coefficient: -0.05 },
  DD_3MOISETPLUS: { min_jours: 90, max_jours: Infinity, coefficient: -0.10 },
};

export const COEFFICIENTS_CAPACITE = [
  { min: 0, max: 19, coefficient: -0.05 },
  { min: 20, max: 53, coefficient: 0 },
  { min: 54, max: 63, coefficient: 0.15 },
  { min: 64, max: 67, coefficient: 0.20 },
  { min: 68, max: 85, coefficient: 0.40 },
];

export const TARIFS_OPTIONS = {
  guide: 80,
  nuit_chauffeur: 120,
  peages_inclus: 0,
};

export const TVA_RATE = 0.10;
export const MARGE_COMMERCIALE = 0.15;
export const PRIX_PAR_KM = 2.50;
export const PRIX_MINIMUM = 350;
export const PEAGES_PAR_KM = 0.06;
