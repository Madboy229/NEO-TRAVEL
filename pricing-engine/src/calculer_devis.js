// Moteur de tarification deterministe Neotravel.
// Regle d'or : le LLM decide, le code calcule.

import {
  COEFFICIENTS_SAISON,
  COEFFICIENTS_DELAI,
  COEFFICIENTS_CAPACITE,
  TARIFS_OPTIONS,
  TVA_RATE,
  MARGE_COMMERCIALE,
  PRIX_PAR_KM,
  PRIX_MINIMUM,
  PEAGES_PAR_KM,
} from "./matrices.js";

function coefficientSaison(dateDepart) {
  const mois = dateDepart.getUTCMonth() + 1;
  for (const [nom, regle] of Object.entries(COEFFICIENTS_SAISON)) {
    if (regle.mois.includes(mois)) {
      return { niveau: nom, coefficient: regle.coefficient };
    }
  }
  throw new Error(`Mois ${mois} non couvert par la matrice saisonnalite`);
}

function coefficientDelai(dateDemande, dateDepart) {
  const msParJour = 1000 * 60 * 60 * 24;
  const ecartJours = Math.floor((dateDepart - dateDemande) / msParJour);
  if (ecartJours < 0) {
    throw new Error("date_depart anterieure a date_demande");
  }
  for (const [code, regle] of Object.entries(COEFFICIENTS_DELAI)) {
    if (ecartJours >= regle.min_jours && ecartJours < regle.max_jours) {
      return { code, ecart_jours: ecartJours, coefficient: regle.coefficient };
    }
  }
  throw new Error(`Aucune tranche de delai pour ${ecartJours} jours`);
}

function coefficientCapacite(nbPassagers) {
  if (!Number.isInteger(nbPassagers) || nbPassagers <= 0) {
    throw new Error(`nb_passagers invalide : ${nbPassagers}`);
  }
  for (const tranche of COEFFICIENTS_CAPACITE) {
    if (nbPassagers >= tranche.min && nbPassagers <= tranche.max) {
      return { tranche: `${tranche.min}-${tranche.max}`, coefficient: tranche.coefficient };
    }
  }
  throw new Error(`nb_passagers ${nbPassagers} hors capacite maximale (85 passagers)`);
}

function arrondi2(n) {
  return Math.round(n * 100) / 100;
}

export function calculerDevis(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("payload manquant");
  }
  const champsRequis = ["nb_passagers", "date_depart", "date_demande", "distance_km"];
  for (const champ of champsRequis) {
    if (payload[champ] === undefined || payload[champ] === null) {
      throw new Error(`Champ requis manquant : ${champ}`);
    }
  }
  if (payload.distance_km <= 0) {
    throw new Error(`distance_km doit etre > 0 (recu : ${payload.distance_km})`);
  }

  const dateDepart = new Date(payload.date_depart);
  const dateDemande = new Date(payload.date_demande);
  if (Number.isNaN(dateDepart.getTime()) || Number.isNaN(dateDemande.getTime())) {
    throw new Error("date_depart ou date_demande invalide (format ISO 8601 attendu)");
  }

  const prixBase = PRIX_PAR_KM * payload.distance_km;

  const cSaison = coefficientSaison(dateDepart);
  const cDelai = coefficientDelai(dateDemande, dateDepart);
  const cCapacite = coefficientCapacite(payload.nb_passagers);

  const prixApresCoefs =
    prixBase *
    (1 + cSaison.coefficient) *
    (1 + cDelai.coefficient) *
    (1 + cCapacite.coefficient);

  const options = Array.isArray(payload.options) ? payload.options : [];
  const optionsAppliquees = [];
  let totalOptions = 0;

  if (options.includes("guide")) {
    const jours = payload.nb_jours_guide ?? 0;
    const montant = TARIFS_OPTIONS.guide * jours;
    optionsAppliquees.push({ option: "guide", jours, montant });
    totalOptions += montant;
  }
  if (options.includes("nuit_chauffeur")) {
    const nuits = payload.nb_nuits ?? 0;
    const montant = TARIFS_OPTIONS.nuit_chauffeur * nuits;
    optionsAppliquees.push({ option: "nuit_chauffeur", nuits, montant });
    totalOptions += montant;
  }
  if (options.includes("peages_inclus")) {
    const forfait = payload.peages_forfait ?? (payload.distance_km * PEAGES_PAR_KM);
    const calculAuto = payload.peages_forfait === undefined;
    optionsAppliquees.push({
      option: "peages_inclus",
      montant: arrondi2(forfait),
      calcul_automatique: calculAuto,
    });
    totalOptions += forfait;
  }

  const sousTotalHT = prixApresCoefs + totalOptions;
  const totalAvantMin = sousTotalHT * (1 + MARGE_COMMERCIALE);

  const prixMinimumApplique = totalAvantMin < PRIX_MINIMUM;
  const totalHT = prixMinimumApplique ? PRIX_MINIMUM : totalAvantMin;

  const tva = totalHT * TVA_RATE;
  const totalTTC = totalHT + tva;

  return {
    total_HT: arrondi2(totalHT),
    tva: arrondi2(tva),
    total_TTC: arrondi2(totalTTC),
    details: {
      prix_base: arrondi2(prixBase),
      prix_par_km: PRIX_PAR_KM,
      distance_km: payload.distance_km,
      coefficients_appliques: {
        saison: cSaison,
        delai: cDelai,
        capacite: cCapacite,
      },
      prix_apres_coefficients: arrondi2(prixApresCoefs),
      options_appliquees: optionsAppliquees,
      total_options: arrondi2(totalOptions),
      sous_total_HT: arrondi2(sousTotalHT),
      marge_commerciale: MARGE_COMMERCIALE,
      total_avant_minimum: arrondi2(totalAvantMin),
      prix_minimum_applique: prixMinimumApplique,
      prix_minimum: PRIX_MINIMUM,
      taux_tva: TVA_RATE,
    },
  };
}
