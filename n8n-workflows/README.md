# Workflows n8n — Neotravel

Ce dossier contient les **exports JSON** des 3 workflows n8n du prototype, le **code source** du tool deterministe `calculer_devis`, et le **template HTML** des emails de relance.

## Contenu

| Fichier | Role |
|---|---|
| `01-agent-commercial.json` | Workflow principal — Chat Trigger + AI Agent + 4 tools (save_demande, calculer_devis, save_devis, send_devis_with_pdf) |
| `02-envoi-devis-pdf.json` | Sub-workflow declenche par `send_devis_with_pdf` — genere le PDF via PDFShift, envoie l'email Brevo avec PDF en piece jointe, met a jour le statut Airtable |
| `03-relances-automatiques.json` | Workflow de relances — Schedule Trigger toutes les minutes, 3 branches (Relance_1 a J+3, Relance_2 a J+7, Cloture a J+14 — intervalles raccourcis pour la demo) |
| `calculer_devis_n8n.js` | Code source du tool `calculer_devis` (a coller dans le noeud Custom Code Tool de l'AI Agent) |
| `relance-email-template.html` | Template HTML des emails de relance (a coller dans les noeuds Brevo des branches Relance_1 et Relance_2) |

## Comment reimporter ces workflows dans une nouvelle instance n8n

### Prerequis

- Compte n8n Cloud actif (ou instance self-hosted)
- Credentials configurees pour les services suivants :
  - **Vercel AI Gateway** (cle `vck_*`) — pour le modele LLM
  - **Airtable** (token Personal Access)
  - **Brevo** (cle API)
  - **PDFShift** (cle API)
- Base Airtable `Neotravel-CRM` avec les 4 tables (Demandes, Matrices, Devis, Logs)

### Procedure d'import

Pour chacun des 3 fichiers JSON :

1. Dans n8n, va sur **Workflows**
2. Clique sur **`+ Add workflow`** → **Import from File**
3. Selectionne le `.json` correspondant
4. Le workflow s'ouvre dans l'editeur

### Reconnexion des credentials

Apres import, chaque noeud externe (Airtable, Brevo, PDFShift, OpenAI/Vercel) affichera un avertissement "credential missing".

Pour chacun :

1. Clique sur le noeud concerne
2. Champ **Credential** → **`+ Create New Credential`** (ou selectionne une credential existante)
3. Renseigne la cle API correspondante depuis ton fichier `.env` (voir `../.env.example`)
4. Save

### Ordre d'import recommande

1. **`02-envoi-devis-pdf.json`** en premier (sub-workflow, doit exister avant que le principal puisse le referencer)
2. **`01-agent-commercial.json`** ensuite (referencera le sub-workflow precedent dans le tool `send_devis_with_pdf`)
3. **`03-relances-automatiques.json`** en dernier (independant)

### Publication

Une fois les credentials reconnectees :

1. Workflow principal et workflow relances : clique sur **Publish** (toggle en haut a droite)
2. Sub-workflow envoi devis : pas besoin de Publish (declenche par le workflow principal)

## Configuration de demo vs production

Les intervalles de relances ont ete raccourcis pour la demo pendant la soutenance.
Pour passer en valeurs de production, ouvrir `03-relances-automatiques.json` ou les
modifier directement dans n8n :

| Transition | Demo | Production |
|---|---|---|
| Envoye → Relance_1 | `DATETIME_DIFF(NOW(), {Date_Envoi}, 'minutes') >= 2` | `DATETIME_DIFF(NOW(), {Date_Envoi}, 'days') >= 3` |
| Relance_1 → Relance_2 | `... 'minutes') >= 5` | `... 'days') >= 7` |
| Relance_2 → Cloture | `... 'minutes') >= 10` | `... 'days') >= 14` |

Source des intervalles production : FAQ projet Neotravel (relance J+3 et J+7, max 2 relances puis cloture).

## Note sur les credentials dans les JSON

Les exports n8n contiennent uniquement les **references** des credentials (sous forme d'identifiants internes type `"id": "abc123"`), pas les cles API en clair. Les cles restent stockees dans l'instance n8n source. Il faut donc recreer les credentials a l'import.
