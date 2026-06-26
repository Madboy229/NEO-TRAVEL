# Choix du modèle LLM — Argumentation

Document support pour le Livrable 1 (Dossier de cadrage) et la défense en soutenance.
Le brief de démarrage (page 25) liste 6 critères de justification du choix de modèle.

## Modèle retenu

**`openai/gpt-4o-mini`** servi via **Vercel AI Gateway**.

## Infrastructure d'accès

Vercel AI Gateway est un proxy multi-providers fourni par l'école au format clé `vck_*`.

### Avantages
- **Un seul endpoint, plusieurs providers** : OpenAI, Anthropic Claude, Google Gemini,
  Mistral, etc. — switch de modèle sans toucher au code n8n
- **Budget centralisé** : la consommation est tracée côté Vercel, ce qui correspond au
  cadre du crédit IA alloué par l'école (10-15 € / groupe)
- **API compatible OpenAI** : on utilise le nœud "OpenAI Chat Model" de n8n en pointant
  simplement sur l'URL `https://ai-gateway.vercel.sh/v1`

### Configuration n8n
- Nœud : **OpenAI Chat Model**
- Credential : custom (API Key = clé `vck_*`, Base URL = `https://ai-gateway.vercel.sh/v1`)
- Modèle : `openai/gpt-4o-mini`
- Retry On Fail : activé (3 tentatives, attente 2000 ms)

## Justification du choix `gpt-4o-mini` selon les 6 critères du brief

### 1. Coût estimé
- **0,15 $ / M tokens input** et **0,60 $ / M tokens output**
- Pour une conversation type (1500-2500 tokens input + 200-500 tokens output), coût
  unitaire ≈ **0,0007 $** par devis généré
- Le budget projet (10-15 €) couvre confortablement **plus de 5000 démonstrations**

### 2. Qualité des réponses
- Très bonne qualité conversationnelle en français
- Excellent suivi d'instructions complexes (utile pour notre prompt de 80+ lignes)
- Fiable sur la collecte progressive d'informations multi-tours

### 3. Latence
- 800 ms à 1,5 s pour une réponse simple, 1,5 à 2,5 s pour une réponse avec appel d'outil
- Acceptable pour un chatbot temps réel (perception utilisateur < 3 s = bonne UX)

### 4. Capacité à produire des sorties structurées
- Support natif du **JSON Schema** via "Structured Outputs"
- Tool calling fiable et stable (critère **fondamental** pour notre architecture
  Agent + 4 outils déterministes)
- N'invente quasiment pas de champs ou de format hors schéma

### 5. Limites observées pendant les tests
- Tendance à **réappeler un outil déjà exécuté** sur des conversations longues → résolu
  par l'instruction explicite "NE PAS RAPPELER CET OUTIL" dans le prompt
- Tendance à **inventer une confirmation d'action** (ex: "un email vient d'être envoyé")
  → résolu par instruction explicite "N'annonce JAMAIS qu'un email a été envoyé"
- Aucune hallucination de prix observée (le calcul est délégué au tool `calculer_devis`,
  qui est le garde-fou principal)

### 6. Adéquation avec les usages réels du projet
- Conversation prospect en français : ✅
- Détection de complétude des données : ✅
- Choix correct du bon outil au bon moment (qualification → calcul → sauvegarde) : ✅
- Gestion de l'escalade humaine : ✅
- Respect des règles métier (pas de remise, pas d'invention) : ✅ (renforcé par prompt)

## Alternatives envisagées (et écartées)

| Modèle | Raison de ne pas le retenir comme défaut |
|---|---|
| **`google/gemini-2.5-flash`** | Choix initial, abandonné à cause d'instabilités 503 sur le tier gratuit et de quotas variables selon les régions. Performant mais moins prévisible. |
| **`google/gemini-1.5-flash`** | Stable et gratuit, mais moins bon en tool-calling multi-étapes que GPT-4o-mini sur nos tests. |
| **`anthropic/claude-haiku-4-5`** | Excellent en tool-calling mais coût légèrement supérieur ; non disponible sur certains catalogues du gateway au moment du choix. Bon plan B. |
| **`openai/gpt-4o`** | Surdimensionné pour notre cas, coûte ~15× plus cher que `gpt-4o-mini` sans gain perceptible sur notre prompt. |

## Règle d'or rappelée

> **Le LLM ne calcule jamais de prix.**
> Tout calcul tarifaire est délégué à l'outil déterministe `calculer_devis()`.
> Le LLM se contente de structurer la demande, choisir les outils et formuler la réponse.

Cette règle est implémentée à **deux niveaux** :
1. Dans le **prompt système** : interdiction explicite et répétée.
2. Dans l'**architecture** : le LLM n'a accès à aucune matrice tarifaire,
   il doit obligatoirement passer par `calculer_devis()`.
