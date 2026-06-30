# Flow d'envoi du devis par email avec consentement

Document support pour le Livrable 3 (Documentation de passation).

## Choix du service email : Brevo

Le brief mentionne **Resend ou Brevo** (page 27, Option A et B).
Nous avons retenu **Brevo** pour ces raisons :

| Critère | Resend | Brevo (retenu) |
|---|---|---|
| Tier gratuit | 3000 emails/mois | 300 emails/jour |
| Envoi à n'importe quelle adresse sans domaine vérifié | ❌ Non — limité à l'adresse d'inscription | ✅ Oui |
| Validation expéditeur | Domaine DNS requis | Validation par email simple |
| Intégration n8n | Native | Native |
| Démo soutenance | Bloquant : le jury ne peut pas tester avec son email | ✅ Compatible |

**Argument soutenance** : nous avons d'abord testé Resend mais découvert que sans
configuration DNS d'un domaine personnalisé, l'envoi est limité à l'adresse
d'inscription, bloquant pour démontrer le produit au jury. Brevo permet l'envoi
libre tout en restant dans les outils suggérés par le brief.

## Architecture du flow

```
[Client tape sa demande]
        ↓
[AI Agent — conversation, qualification]
        ↓
[Tool save_demande]      → enregistre la fiche prospect dans Airtable
        ↓
[Tool calculer_devis]    → calcul déterministe du prix (code, pas LLM)
        ↓
[Tool save_devis]        → enregistre le devis dans Airtable (Statut_Engagement = Genere)
        ↓
[Agent présente le devis]
        ↓
[Agent demande le CONSENTEMENT pour l'envoi par email]
        ↓
   ┌────┴────┐
   │         │
  OUI       NON
   │         └─── "Le devis reste enregistré, un conseiller vous recontactera"
   │
[Tool envoyer_devis_par_email]   → Brevo envoie un email HTML formaté
        ↓
[Tool update_devis_status]       → Airtable: Statut_Engagement = Envoye
        ↓
[Agent confirme l'envoi au client]
        ↓
[Workflow de relances (Phase 7) prend le relais — J+2, J+3, J+7]
```

## Garde-fous mis en place

### 1. Consentement explicite avant envoi
Le system prompt force l'agent à **demander l'accord** du client avant d'envoyer
l'email. Aligné avec :
- Le Livret technique p4 (Human In The Loop)
- L'esprit RGPD du Livret technique p8 (consentement, minimisation)

### 2. Pas d'envoi tant que le devis n'est pas calculé
Le tool `envoyer_devis_par_email` n'est appelable qu'**après** `save_devis`.
Le prompt force l'ordre :
1. save_demande
2. calculer_devis
3. save_devis
4. présentation au client
5. demande de consentement
6. envoi si consentement

### 3. Synchronisation Airtable
Après chaque envoi réussi, le tool `update_devis_status` met le statut Airtable
à `Envoye`, démarrant ainsi le compteur pour les relances automatiques.

### 4. Pas d'hallucination d'envoi
Le prompt interdit explicitement à l'agent de dire "je vais envoyer un email"
ou "un email a été envoyé" sans avoir effectivement appelé le tool Brevo.

## Statuts de devis (cycle de vie)

| Statut | Quand | Acteur |
|---|---|---|
| **Genere** | Devis calculé et enregistré, en attente | Agent IA + tool save_devis |
| **Envoye** | Email envoyé au client avec succès | Agent IA + tool envoyer_devis_par_email |
| **Relance_1** | J+2 (urgent) ou J+3 (standard) après envoi sans réponse | Workflow de relances (Phase 7) |
| **Relance_2** | J+7 après Relance_1 sans réponse | Workflow de relances (Phase 7) |
| **Cloture** | Après Relance_2 sans réponse | Workflow de relances (Phase 7) |
| **Accepte** | Le client a confirmé sa réservation | Commercial humain ou réponse client traitée |
| **Refuse** | Le client a refusé le devis | Commercial humain ou réponse client traitée |

## Tools n8n impliqués

| Tool | Type | Action |
|---|---|---|
| `save_demande` | Airtable Tool | Create record dans Demandes |
| `calculer_devis` | Custom Code Tool | Calcul déterministe (code JS isolé) |
| `save_devis` | Airtable Tool | Create record dans Devis (statut Genere) |
| `envoyer_devis_par_email` | Brevo Tool | Send transactional email avec template HTML |
| `update_devis_status` | Airtable Tool | Update Statut_Engagement → Envoye |
| `lookup_matrices` | Airtable Tool | Read records dans Matrices (lecture seule) |

## Variables d'environnement requises

Voir `.env.example`. À recopier dans le `.env` local :

```env
BREVO_API_KEY=xkeysib-...
BREVO_FROM_EMAIL=kdarkaoui56@gmail.com
BREVO_FROM_NAME=Neotravel
```

## Limitations connues

1. **Pas encore de PDF en pièce jointe** — l'email contient toutes les infos du
   devis directement dans le HTML. Le PDF sera ajouté en Phase 6B.
2. **Pas encore de gestion des bounces** — si l'email est invalide, Brevo ne
   notifie pas l'agent. À traiter via les webhooks Brevo plus tard.
3. **Compteur de relances non synchronisé** avec `Date_Derniere_Relance` — sera
   construit en Phase 7 (workflow de relances).
