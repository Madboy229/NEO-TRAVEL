/**
 * Test de connectivite Airtable.
 *
 * Verifie que :
 *  - .env contient AIRTABLE_API_KEY et AIRTABLE_BASE_ID
 *  - les 4 tables existent (Demandes, Matrices, Devis, Logs)
 *  - la table Matrices contient bien les regles importees du CSV
 *
 * Usage : node --env-file=../.env scripts/test-airtable.js
 *   (depuis pricing-engine/)
 */

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.error("❌ AIRTABLE_API_KEY ou AIRTABLE_BASE_ID manquant dans .env");
  process.exit(1);
}

const TABLES = ["Demandes", "Matrices", "Devis", "Logs"];

async function fetchTable(tableName) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=100`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} sur ${tableName} — ${body}`);
  }
  const data = await res.json();
  return data.records;
}

console.log(`🔗 Connexion a Airtable base ${baseId}\n`);

let okCount = 0;
let failCount = 0;
for (const table of TABLES) {
  try {
    const records = await fetchTable(table);
    console.log(`✅ ${table.padEnd(10)} — ${records.length} enregistrement(s)`);
    okCount++;

    if (table === "Matrices") {
      const expected = 20;
      if (records.length === expected) {
        console.log(`   └─ Matrices contient bien les ${expected} regles attendues 🎉`);
      } else {
        console.log(`   ⚠️  Matrices contient ${records.length} lignes (${expected} attendues — verifie l'import CSV)`);
      }
    }
  } catch (err) {
    console.log(`❌ ${table.padEnd(10)} — ${err.message}`);
    failCount++;
  }
}

console.log(`\nResultat : ${okCount}/${TABLES.length} tables OK, ${failCount} en erreur.`);
process.exit(failCount === 0 ? 0 : 1);
