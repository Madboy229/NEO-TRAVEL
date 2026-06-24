/**
 * Tests unitaires du moteur calculer_devis().
 *
 * Couvre :
 *  - Cas type du dossier de cadrage (golden set)
 *  - Chaque niveau de saisonnalite (basse, moyenne, haute, tres haute)
 *  - Chaque tranche de delai (prioritaire, urgent, normal, 3 mois+)
 *  - Chaque tranche de capacite (<=19, 20-53, 54-63, 64-67, 68-85)
 *  - Toutes les options (guide, nuit_chauffeur, peages)
 *  - Cas limites et erreurs (capacite > 85, distance <= 0, dates incoherentes...)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculerDevis } from "../src/calculer_devis.js";

// ============================================================
// Helpers : payload de base reutilisable
// ============================================================
function basePayload(overrides = {}) {
  return {
    nb_passagers: 34,
    date_depart: "2026-07-15T08:00:00Z",   // 15 juillet — saison haute
    date_demande: "2026-06-23T12:00:00Z",  // ecart ~22 jours — DD_NORMAL
    distance_km: 150,
    options: [],
    ...overrides,
  };
}

// ============================================================
// 1. Golden set — payload de reference du dossier de cadrage §5.2
// ============================================================
test("Golden set : payload de reference du cadrage", () => {
  const payload = {
    nb_passagers: 34,
    date_depart: "2026-07-15T08:00:00Z",
    date_demande: "2026-06-23T12:00:00Z",
    distance_km: 150,
    options: ["nuit_chauffeur", "peages_inclus"],
    nb_nuits: 1,
    peages_forfait: 45,
  };
  const devis = calculerDevis(payload);

  assert.equal(devis.details.coefficients_appliques.saison.niveau, "haute");
  assert.equal(devis.details.coefficients_appliques.delai.code, "DD_NORMAL");
  assert.equal(devis.details.coefficients_appliques.capacite.tranche, "20-53");
  assert.ok(devis.total_HT > 0);
  assert.ok(devis.total_TTC > devis.total_HT);
  assert.equal(Math.round(devis.tva * 100), Math.round(devis.total_HT * 10));
});

// ============================================================
// 2. Saisonnalite — un test par niveau
// ============================================================
test("Saison BASSE (fevrier) : coefficient -7%", () => {
  const devis = calculerDevis(basePayload({
    date_depart: "2027-02-10T08:00:00Z",
    date_demande: "2026-12-01T12:00:00Z",
  }));
  assert.equal(devis.details.coefficients_appliques.saison.niveau, "basse");
  assert.equal(devis.details.coefficients_appliques.saison.coefficient, -0.07);
});

test("Saison MOYENNE (septembre) : coefficient 0%", () => {
  const devis = calculerDevis(basePayload({
    date_depart: "2026-09-10T08:00:00Z",
    date_demande: "2026-06-23T12:00:00Z",
  }));
  assert.equal(devis.details.coefficients_appliques.saison.niveau, "moyenne");
  assert.equal(devis.details.coefficients_appliques.saison.coefficient, 0);
});

test("Saison HAUTE (avril) : coefficient +10%", () => {
  const devis = calculerDevis(basePayload({
    date_depart: "2027-04-10T08:00:00Z",
    date_demande: "2026-12-01T12:00:00Z",
  }));
  assert.equal(devis.details.coefficients_appliques.saison.niveau, "haute");
  assert.equal(devis.details.coefficients_appliques.saison.coefficient, 0.10);
});

test("Saison TRES HAUTE (mai) : coefficient +15%", () => {
  const devis = calculerDevis(basePayload({
    date_depart: "2027-05-10T08:00:00Z",
    date_demande: "2026-12-01T12:00:00Z",
  }));
  assert.equal(devis.details.coefficients_appliques.saison.niveau, "tres_haute");
  assert.equal(devis.details.coefficients_appliques.saison.coefficient, 0.15);
});

// ============================================================
// 3. Delai date_demande -> date_depart — un test par tranche
// ============================================================
test("Delai PRIORITAIRE (< 2 jours) : +10%", () => {
  const devis = calculerDevis(basePayload({
    date_depart: "2026-06-24T08:00:00Z",
    date_demande: "2026-06-23T12:00:00Z",  // ~0.8 jour
  }));
  assert.equal(devis.details.coefficients_appliques.delai.code, "DD_PRIORITAIRE");
});

test("Delai URGENT (2-7 jours) : +5%", () => {
  const devis = calculerDevis(basePayload({
    date_depart: "2026-06-28T08:00:00Z",
    date_demande: "2026-06-23T12:00:00Z",  // ~5 jours
  }));
  assert.equal(devis.details.coefficients_appliques.delai.code, "DD_URGENT");
});

test("Delai NORMAL (7-90 jours) : -5%", () => {
  const devis = calculerDevis(basePayload({
    date_depart: "2026-07-15T08:00:00Z",
    date_demande: "2026-06-23T12:00:00Z",  // ~22 jours
  }));
  assert.equal(devis.details.coefficients_appliques.delai.code, "DD_NORMAL");
});

test("Delai 3 MOIS ET PLUS : -10%", () => {
  const devis = calculerDevis(basePayload({
    date_depart: "2026-12-01T08:00:00Z",
    date_demande: "2026-06-23T12:00:00Z",  // ~161 jours
  }));
  assert.equal(devis.details.coefficients_appliques.delai.code, "DD_3MOISETPLUS");
});

// ============================================================
// 4. Capacite — un test par tranche
// ============================================================
test("Capacite <= 19 : -5%", () => {
  const devis = calculerDevis(basePayload({ nb_passagers: 15 }));
  assert.equal(devis.details.coefficients_appliques.capacite.coefficient, -0.05);
});

test("Capacite 20-53 : 0%", () => {
  const devis = calculerDevis(basePayload({ nb_passagers: 40 }));
  assert.equal(devis.details.coefficients_appliques.capacite.coefficient, 0);
});

test("Capacite 54-63 : +15%", () => {
  const devis = calculerDevis(basePayload({ nb_passagers: 60 }));
  assert.equal(devis.details.coefficients_appliques.capacite.coefficient, 0.15);
});

test("Capacite 64-67 : +20%", () => {
  const devis = calculerDevis(basePayload({ nb_passagers: 65 }));
  assert.equal(devis.details.coefficients_appliques.capacite.coefficient, 0.20);
});

test("Capacite 68-85 : +40%", () => {
  const devis = calculerDevis(basePayload({ nb_passagers: 80 }));
  assert.equal(devis.details.coefficients_appliques.capacite.coefficient, 0.40);
});

// ============================================================
// 5. Options : guide, nuit_chauffeur, peages
// ============================================================
test("Option guide : +80 EUR par jour", () => {
  const devis = calculerDevis(basePayload({
    options: ["guide"],
    nb_jours_guide: 3,
  }));
  const optGuide = devis.details.options_appliquees.find(o => o.option === "guide");
  assert.equal(optGuide.montant, 240);  // 80 * 3
});

test("Option nuit_chauffeur : +120 EUR par nuit", () => {
  const devis = calculerDevis(basePayload({
    options: ["nuit_chauffeur"],
    nb_nuits: 2,
  }));
  const optNuit = devis.details.options_appliquees.find(o => o.option === "nuit_chauffeur");
  assert.equal(optNuit.montant, 240);  // 120 * 2
});

test("Option peages : forfait paramétrable", () => {
  const devis = calculerDevis(basePayload({
    options: ["peages_inclus"],
    peages_forfait: 75,
  }));
  const optPeages = devis.details.options_appliquees.find(o => o.option === "peages_inclus");
  assert.equal(optPeages.montant, 75);
  assert.equal(optPeages.calcul_automatique, false);
});

test("Option peages : calcul automatique si pas de forfait fourni (0.06 EUR/km)", () => {
  const devis = calculerDevis(basePayload({
    distance_km: 200,
    options: ["peages_inclus"],
    // peages_forfait absent volontairement
  }));
  const optPeages = devis.details.options_appliquees.find(o => o.option === "peages_inclus");
  assert.equal(optPeages.montant, 12);  // 200 * 0.06
  assert.equal(optPeages.calcul_automatique, true);
});

test("Combinaison de plusieurs options", () => {
  const devis = calculerDevis(basePayload({
    options: ["guide", "nuit_chauffeur", "peages_inclus"],
    nb_jours_guide: 2,
    nb_nuits: 1,
    peages_forfait: 50,
  }));
  assert.equal(devis.details.options_appliquees.length, 3);
  assert.equal(devis.details.total_options, 160 + 120 + 50);  // 330
});

// ============================================================
// 6. Marge commerciale, TVA et prix minimum
// ============================================================
test("Marge commerciale +15% appliquee avant TVA", () => {
  const devis = calculerDevis(basePayload({
    nb_passagers: 30,
    date_depart: "2026-09-10T08:00:00Z",   // saison moyenne (0%)
    date_demande: "2026-06-23T12:00:00Z",  // ~79j -> DD_NORMAL (-5%)
    distance_km: 500,                       // assez long pour passer au-dessus du minimum
    options: [],
  }));
  // prix_base = 2.50 * 500 = 1250
  // apres coefs = 1250 * 1.0 * 0.95 * 1.0 = 1187.50
  // marge +15% = 1187.50 * 1.15 = 1365.625
  // TVA 10% = 136.5625
  assert.equal(devis.details.sous_total_HT, 1187.5);
  assert.equal(devis.total_HT, 1365.63);
  assert.equal(devis.details.prix_minimum_applique, false);
  assert.equal(devis.tva, 136.56);
  assert.equal(devis.total_TTC, 1502.19);
});

test("Prix minimum 350 EUR applique sur tres petit trajet", () => {
  const devis = calculerDevis(basePayload({
    nb_passagers: 10,                       // -5%
    date_depart: "2026-09-10T08:00:00Z",   // saison moyenne 0%
    date_demande: "2026-06-23T12:00:00Z",  // -5% (DD_NORMAL)
    distance_km: 50,                        // 2.50 * 50 = 125
    options: [],
  }));
  // prix calcule ~ 125 * 0.95 * 0.95 * 1.15 = 129.74 EUR (sous le minimum)
  assert.equal(devis.details.prix_minimum_applique, true);
  assert.equal(devis.total_HT, 350);
  assert.equal(devis.tva, 35);
  assert.equal(devis.total_TTC, 385);
});

// ============================================================
// 7. Cas limites et erreurs
// ============================================================
test("Erreur : payload manquant", () => {
  assert.throws(() => calculerDevis(null), /payload manquant/);
});

test("Erreur : champ requis manquant", () => {
  assert.throws(
    () => calculerDevis({ nb_passagers: 30, date_depart: "2026-07-15T08:00:00Z" }),
    /Champ requis manquant/
  );
});

test("Erreur : distance_km <= 0", () => {
  assert.throws(
    () => calculerDevis(basePayload({ distance_km: 0 })),
    /distance_km doit etre > 0/
  );
});

test("Erreur : date_depart anterieure a date_demande", () => {
  assert.throws(
    () => calculerDevis(basePayload({
      date_depart: "2026-06-01T08:00:00Z",
      date_demande: "2026-06-23T12:00:00Z",
    })),
    /date_depart anterieure a date_demande/
  );
});

test("Erreur : capacite > 85 (hors gabarit autocar)", () => {
  assert.throws(
    () => calculerDevis(basePayload({ nb_passagers: 100 })),
    /hors capacite maximale/
  );
});

test("Erreur : nb_passagers = 0", () => {
  assert.throws(
    () => calculerDevis(basePayload({ nb_passagers: 0 })),
    /nb_passagers invalide/
  );
});

test("Erreur : date invalide", () => {
  assert.throws(
    () => calculerDevis(basePayload({ date_depart: "pas une date" })),
    /date_depart ou date_demande invalide/
  );
});
