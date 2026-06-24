/**
 * Matrices de tarification Neotravel.
 *
 * Source : Brief "Automatisation des processus commerciaux" — Tableaux 2a / 2b / 2c / 3.
 * Toutes les valeurs ici sont determinees par le metier. Les modifier ne necessite
 * AUCUN changement dans le code de calcul (calculer_devis.js).
 *
 * En production ces matrices seront stockees dans la table Airtable "Matrices"
 * et le moteur ira les lire dynamiquement. Pour le prototype on les fige ici.
 */

// Tableau 2a — Coefficient Saisonnalite (selon le mois de date_depart)
export const COEFFICIENTS_SAISON = {
  basse: { mois: [11, 1, 2, 8], coefficient: -0.07 },
  moyenne: { mois: [12, 10, 9], coefficient: 0 },
  haute: { mois: [3, 4, 7], coefficient: 0.10 },
  tres_haute: { mois: [5, 6], coefficient: 0.15 },
};

// Tableau 2b — Ponderation Date Demande vs Date Depart (en jours d'ecart)
// Les seuils ne sont pas explicitement donnes dans le brief — valeurs par defaut
// raisonnables a confirmer avec le metier Neotravel.
export const COEFFICIENTS_DELAI = {
  DD_PRIORITAIRE: { min_jours: 0, max_jours: 2, coefficient: 0.10 },
  DD_URGENT: { min_jours: 2, max_jours: 7, coefficient: 0.05 },
  DD_NORMAL: { min_jours: 7, max_jours: 90, coefficient: -0.05 },
  DD_3MOISETPLUS: { min_jours: 90, max_jours: Infinity, coefficient: -0.10 },
};

// Tableau 2c — Ponderation Capacite (selon nb_passagers)
export const COEFFICIENTS_CAPACITE = [
  { min: 0, max: 19, coefficient: -0.05 },
  { min: 20, max: 53, coefficient: 0 },
  { min: 54, max: 63, coefficient: 0.15 },
  { min: 64, max: 67, coefficient: 0.20 },
  { min: 68, max: 85, coefficient: 0.40 },
];

// Tableau 3 — Supplements & options
export const TARIFS_OPTIONS = {
  guide: 80,            // EUR par jour de prestation
  nuit_chauffeur: 120,  // EUR par nuit
  peages_inclus: 0,     // forfait paramétrable par trajet (à passer en argument)
};

// Constantes globales
export const TVA_RATE = 0.10;
export const MARGE_COMMERCIALE = 0.15;

// Prix de base par km — Hypothese projet (cf. docs/hypotheses-pricing.md).
// 2.50 EUR/km : tarif marche autocaristes France 2024-2026 pour autocar 50+ places.
export const PRIX_PAR_KM = 2.50;

// Prix minimum d'une prestation — couvre la mobilisation d'un autocar et d'un chauffeur
// sur une demi-journee. Evite les devis "ridicules" pour des trajets tres courts.
export const PRIX_MINIMUM = 350;

// Taux automatique de calcul des peages autoroute (option peages_inclus sans forfait
// explicite). ~6 cts/km : moyenne reseau autoroutier francais pour autocar.
export const PEAGES_PAR_KM = 0.06;
