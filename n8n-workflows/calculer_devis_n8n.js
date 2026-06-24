/**
 * VERSION N8N — Code-tool calculer_devis() pour le nœud Tool/Code de l'AI Agent.
 *
 * Comment l'utiliser :
 * 1. Dans n8n, sous l'AI Agent, clique sur "+" en dessous de "Tool".
 * 2. Choisis "Custom Code Tool" (parfois listé "Tool: Code").
 * 3. Renseigne :
 *    - Name : calculer_devis
 *    - Description : voir bloc DESCRIPTION ci-dessous (a copier dans le champ).
 *    - Input Schema : voir bloc INPUT_SCHEMA ci-dessous (a coller en JSON).
 *    - Language : JavaScript
 *    - JavaScript Code : COPIE TOUT LE CODE EN DESSOUS DU MARQUEUR (cf. ligne ====)
 *
 * Ce fichier est synchronise avec pricing-engine/src/{matrices.js, calculer_devis.js}
 * mais tout est inline ici pour respecter le format auto-contenu attendu par n8n.
 *
 * --------------------------------------------------------------------------
 * DESCRIPTION (a coller dans le champ "Description" du Tool n8n) :
 *
 * Calcule de maniere deterministe le prix HT, la TVA et le prix TTC d'un devis
 * autocar Neotravel. A utiliser obligatoirement quand toutes les informations
 * du trajet ont ete collectees (nb_passagers, date_depart, date_demande,
 * distance_km). Retourne le total et le detail des coefficients appliques.
 * NE JAMAIS calculer un prix toi-meme — toujours passer par cet outil.
 *
 * --------------------------------------------------------------------------
 * INPUT_SCHEMA (a coller dans le champ "Input Schema" — format JSON Schema) :
 *
 * {
 *   "type": "object",
 *   "properties": {
 *     "nb_passagers": { "type": "number", "description": "Nombre de passagers (entier > 0 et <= 85)" },
 *     "date_depart":  { "type": "string", "description": "Date de depart au format ISO 8601 (ex: 2026-07-15T08:00:00Z)" },
 *     "date_demande": { "type": "string", "description": "Date de la demande au format ISO 8601 — utilise la date du jour si non specifiee" },
 *     "distance_km":  { "type": "number", "description": "Distance estimee du trajet en kilometres (> 0)" },
 *     "options": {
 *       "type": "array",
 *       "items": { "type": "string", "enum": ["guide", "nuit_chauffeur", "peages_inclus"] },
 *       "description": "Liste des options eventuelles (vide si aucune)"
 *     },
 *     "nb_nuits": { "type": "number", "description": "Nombre de nuits chauffeur (uniquement si option nuit_chauffeur)" },
 *     "nb_jours_guide": { "type": "number", "description": "Nombre de jours de presence du guide (uniquement si option guide)" },
 *     "peages_forfait": { "type": "number", "description": "Forfait peages explicite en EUR (optionnel — calcul auto sinon)" }
 *   },
 *   "required": ["nb_passagers", "date_depart", "distance_km"]
 * }
 * ==========================================================================
 * CODE A COPIER DANS LE CHAMP "JavaScript Code" DU TOOL N8N :
 * ==========================================================================
 */

// ===== Matrices Neotravel (cf. brief Tableaux 2a/2b/2c/3 + hypotheses equipe) =====
const COEFFICIENTS_SAISON = {
  basse:      { mois: [11, 1, 2, 8], coefficient: -0.07 },
  moyenne:    { mois: [12, 10, 9],   coefficient: 0 },
  haute:      { mois: [3, 4, 7],     coefficient: 0.10 },
  tres_haute: { mois: [5, 6],        coefficient: 0.15 },
};
const COEFFICIENTS_DELAI = {
  DD_PRIORITAIRE:  { min_jours: 0,  max_jours: 2,         coefficient: 0.10 },
  DD_URGENT:       { min_jours: 2,  max_jours: 7,         coefficient: 0.05 },
  DD_NORMAL:       { min_jours: 7,  max_jours: 90,        coefficient: -0.05 },
  DD_3MOISETPLUS:  { min_jours: 90, max_jours: Infinity,  coefficient: -0.10 },
};
const COEFFICIENTS_CAPACITE = [
  { min: 0,  max: 19, coefficient: -0.05 },
  { min: 20, max: 53, coefficient: 0 },
  { min: 54, max: 63, coefficient: 0.15 },
  { min: 64, max: 67, coefficient: 0.20 },
  { min: 68, max: 85, coefficient: 0.40 },
];
const TARIFS_OPTIONS = { guide: 80, nuit_chauffeur: 120 };
const TVA_RATE          = 0.10;
const MARGE_COMMERCIALE = 0.15;
const PRIX_PAR_KM       = 2.50;
const PRIX_MINIMUM      = 350;
const PEAGES_PAR_KM     = 0.06;

// ===== Helpers =====
function arrondi2(n) { return Math.round(n * 100) / 100; }

function coefficientSaison(dateDepart) {
  const mois = dateDepart.getUTCMonth() + 1;
  for (const [nom, regle] of Object.entries(COEFFICIENTS_SAISON)) {
    if (regle.mois.includes(mois)) return { niveau: nom, coefficient: regle.coefficient };
  }
  throw new Error(`Mois ${mois} non couvert`);
}
function coefficientDelai(dateDemande, dateDepart) {
  const ecart = Math.floor((dateDepart - dateDemande) / 86400000);
  if (ecart < 0) throw new Error("date_depart anterieure a date_demande");
  for (const [code, r] of Object.entries(COEFFICIENTS_DELAI)) {
    if (ecart >= r.min_jours && ecart < r.max_jours) {
      return { code, ecart_jours: ecart, coefficient: r.coefficient };
    }
  }
  throw new Error(`Aucune tranche pour ${ecart} jours`);
}
function coefficientCapacite(nb) {
  if (!Number.isInteger(nb) || nb <= 0) throw new Error(`nb_passagers invalide : ${nb}`);
  for (const t of COEFFICIENTS_CAPACITE) {
    if (nb >= t.min && nb <= t.max) return { tranche: `${t.min}-${t.max}`, coefficient: t.coefficient };
  }
  throw new Error(`nb_passagers ${nb} hors capacite maximale (85)`);
}

// ===== Fonction principale =====
function calculerDevis(p) {
  if (!p) throw new Error("payload manquant");
  for (const c of ["nb_passagers", "date_depart", "distance_km"]) {
    if (p[c] === undefined || p[c] === null) throw new Error(`Champ requis manquant : ${c}`);
  }
  if (p.distance_km <= 0) throw new Error(`distance_km doit etre > 0`);

  const dateDepart  = new Date(p.date_depart);
  const dateDemande = p.date_demande ? new Date(p.date_demande) : new Date();
  if (isNaN(dateDepart.getTime())) throw new Error("date_depart invalide");
  if (isNaN(dateDemande.getTime())) throw new Error("date_demande invalide");

  const prixBase   = PRIX_PAR_KM * p.distance_km;
  const cSaison    = coefficientSaison(dateDepart);
  const cDelai     = coefficientDelai(dateDemande, dateDepart);
  const cCapacite  = coefficientCapacite(p.nb_passagers);

  const prixApresCoefs = prixBase
    * (1 + cSaison.coefficient)
    * (1 + cDelai.coefficient)
    * (1 + cCapacite.coefficient);

  const options          = Array.isArray(p.options) ? p.options : [];
  const optionsAppliquees = [];
  let totalOptions = 0;

  if (options.includes("guide")) {
    const jours = p.nb_jours_guide ?? 0;
    const m = TARIFS_OPTIONS.guide * jours;
    optionsAppliquees.push({ option: "guide", jours, montant: m });
    totalOptions += m;
  }
  if (options.includes("nuit_chauffeur")) {
    const nuits = p.nb_nuits ?? 0;
    const m = TARIFS_OPTIONS.nuit_chauffeur * nuits;
    optionsAppliquees.push({ option: "nuit_chauffeur", nuits, montant: m });
    totalOptions += m;
  }
  if (options.includes("peages_inclus")) {
    const forfait = p.peages_forfait ?? (p.distance_km * PEAGES_PAR_KM);
    optionsAppliquees.push({
      option: "peages_inclus",
      montant: arrondi2(forfait),
      calcul_automatique: p.peages_forfait === undefined,
    });
    totalOptions += forfait;
  }

  const sousTotalHT  = prixApresCoefs + totalOptions;
  const totalAvantMin = sousTotalHT * (1 + MARGE_COMMERCIALE);
  const prixMinApplique = totalAvantMin < PRIX_MINIMUM;
  const totalHT  = prixMinApplique ? PRIX_MINIMUM : totalAvantMin;
  const tva      = totalHT * TVA_RATE;
  const totalTTC = totalHT + tva;

  return {
    total_HT:  arrondi2(totalHT),
    tva:       arrondi2(tva),
    total_TTC: arrondi2(totalTTC),
    details: {
      prix_base: arrondi2(prixBase),
      prix_par_km: PRIX_PAR_KM,
      distance_km: p.distance_km,
      coefficients_appliques: { saison: cSaison, delai: cDelai, capacite: cCapacite },
      prix_apres_coefficients: arrondi2(prixApresCoefs),
      options_appliquees: optionsAppliquees,
      total_options: arrondi2(totalOptions),
      sous_total_HT: arrondi2(sousTotalHT),
      marge_commerciale: MARGE_COMMERCIALE,
      total_avant_minimum: arrondi2(totalAvantMin),
      prix_minimum_applique: prixMinApplique,
      prix_minimum: PRIX_MINIMUM,
      taux_tva: TVA_RATE,
    },
  };
}

// ===== POINT D'ENTREE N8N =====
// L'AI Agent passe les arguments du tool dans la query.
// Selon la version de n8n, ils sont accessibles via :
//   - $input.first().json.query     (versions recentes)
//   - $json                         (anciennes versions)
//   - les variables directement     (versions tres recentes)
//
// Le wrapper ci-dessous prend en charge ces cas et retourne le devis.

const args =
  (typeof query !== "undefined" && query) ||
  ($input.first()?.json?.query) ||
  ($input.first()?.json) ||
  {};

try {
  const devis = calculerDevis(args);
  return JSON.stringify(devis);
} catch (err) {
  return JSON.stringify({ erreur: err.message, args_recus: args });
}
