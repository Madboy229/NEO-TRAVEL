# Neotravel — Automatisation des Processus Commerciaux

Prototype de digitalisation du parcours commercial Neotravel :
captation prospects, qualification IA, tarification déterministe, devis
automatisés, séquences emailing et dashboard de pilotage.

> Projet d'étude — MBA1 4e année. Soutenance : 1er juillet 2026.

## Stack technique (Option A)

| Brique | Outil |
|---|---|
| Frontend (landing conversationnelle) | React + Vite |
| Orchestrateur / Agent IA | n8n (Cloud) |
| LLM | OpenAI GPT-4o-mini via Vercel AI Gateway (clé école `vck_*`) |
| Base CRM | Airtable (4 tables) |
| Envoi emails | Resend |
| Moteur de tarification | Node.js pur (code déterministe) |

## Règle d'or

L'IA décide, le code calcule. Le prix d'un devis est **toujours** calculé par
`calculer_devis()`, jamais par le LLM.

## Structure du dépôt

```
neotravel-project/
├── pricing-engine/        Moteur de tarification déterministe + tests
│   ├── src/
│   │   ├── matrices.js    Tableaux de coefficients
│   │   └── calculer_devis.js
│   └── tests/
├── frontend/              Landing React + chat conversationnel
├── n8n-workflows/         Exports JSON des workflows n8n
└── docs/                  Dossier de cadrage, prompts, schémas
```

## Démarrage rapide

### Moteur de tarification

```bash
cd pricing-engine
npm install
npm test
```

### Variables d'environnement

Copier `.env.example` en `.env` et renseigner les clés.
