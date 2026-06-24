# Hypothèses de tarification — Projet Neotravel

> Document support pour le Livrable 3 (Documentation de passation).
> Il documente les choix de valeurs non spécifiées dans le brief de l'école.

## Contexte

Le brief de démarrage v6 (page 6, section "Matrices à implémenter") indique que la
ligne **Distance** doit être traitée comme suit :

> *"Distance en km, prix/km, prix minimum → **Déterminer la base de calcul**"*

Le document "Règles de pricing Neotravel" référencé en ressource n°4 du brief n'a
pas été fourni avec les annexes. Les valeurs ci-dessous représentent donc nos
**hypothèses de travail**, choisies par l'équipe sur la base d'études tarifaires
publiques du marché autocariste français. Elles sont centralisées dans
[`pricing-engine/src/matrices.js`](../pricing-engine/src/matrices.js) et dans la
table Airtable `Matrices` — modifier ces valeurs ne nécessite aucun changement
de code dans `calculer_devis()`.

## Valeurs déterminées par l'équipe

### 1. Prix de base par kilomètre

| Paramètre | Valeur |
|---|---|
| `PRIX_PAR_KM` | **2,50 €/km** |

**Justification.** Le marché de la location d'autocar avec chauffeur en France
2024-2026 affiche des tarifs publics oscillant entre **2 et 3 €/km** pour un
autocar de gabarit standard (50 à 65 places) sur des trajets de moyenne distance,
hors haute saison. La valeur médiane retenue est donc 2,50 €/km. Cette base
constitue le point de départ avant application des coefficients saisonnalité /
urgence / capacité, et avant supplément options.

**Sources de référence** : sites comparateurs (autocar.fr, Citytransfer.fr),
publications des fédérations FNTV et OTRE.

### 2. Prix minimum d'une prestation

| Paramètre | Valeur |
|---|---|
| `PRIX_MINIMUM` | **350 € HT** |

**Justification.** Mobiliser un autocar et un chauffeur génère un coût plancher
incompressible : carburant, amortissement véhicule, salaire chauffeur (env. 6 h
de service incluant temps de mise à disposition), assurance. Ce minimum protège
le partenaire autocariste contre des devis "ridicules" pour des trajets très
courts (par exemple, 30 km à 10 passagers en basse saison aboutirait sinon à un
devis de l'ordre de 100 €, non viable). Si le calcul théorique tombe en dessous
de ce seuil, le moteur le remonte automatiquement à 350 € HT et le détaille dans
la sortie via le champ `prix_minimum_applique`.

### 3. Seuils de tranches de délai (date_demande → date_depart)

Le brief définit 4 codes (`DD_PRIORITAIRE`, `DD_URGENT`, `DD_NORMAL`,
`DD_3MOISETPLUS`) et leurs coefficients, mais **ne précise pas les seuils en
jours** correspondants. Choix retenus :

| Code | Seuil retenu | Coefficient | Justification |
|---|---|---|---|
| `DD_PRIORITAIRE` | `< 2 jours` | +10 % | Mobilisation last-minute : forte tension sur la disponibilité partenaire, négociation tarifaire impossible. |
| `DD_URGENT` | `2 à 7 jours` | +5 % | Fenêtre courte : moins de marge pour identifier le meilleur partenaire. |
| `DD_NORMAL` | `7 jours à 3 mois` | -5 % | Délai standard de réservation autocaristes : visibilité suffisante pour négocier. |
| `DD_3MOISETPLUS` | `≥ 3 mois (90 j)` | -10 % | Anticipation forte : optimisation possible des plannings partenaires. |

### 4. Forfait péages automatique

| Paramètre | Valeur |
|---|---|
| `PEAGES_PAR_KM` | **0,06 €/km** |

**Justification.** Lorsque l'option `peages_inclus` est sélectionnée sans
forfait explicite passé au moteur, le système calcule automatiquement
`distance_km × 0,06`. Cette moyenne pondérée correspond au coût péage observé
sur le réseau autoroutier français (catégorie autocar/poids-lourd allégé) pour
un trajet mixte autoroute / routes nationales. Un forfait personnalisé peut
toujours être passé en paramètre pour les trajets aux conditions spécifiques
(passage tunnel, traversée frontalière, etc.).

## Comment ajuster ces valeurs

Toute modification se fait à **deux endroits** :

1. **Code** : éditer les constantes dans
   [`pricing-engine/src/matrices.js`](../pricing-engine/src/matrices.js)
2. **Données** : éditer la ligne correspondante dans la table Airtable
   `Matrices` (ID `PRIX-01`, `PRIX-02`, `OPTION-05`, ou les `DELAI-XX` pour les
   seuils)

Aucun changement n'est requis dans `calculer_devis.js` : les matrices y sont
lues sans hardcoding.

## Validation auprès du métier Neotravel

En conditions réelles, ces hypothèses devraient être validées par :

- Le **gérant** (Julien Le Viavant) pour le positionnement tarifaire et le
  prix minimum
- L'**équipe commerciale** pour les seuils de tranches de délai (cohérence
  avec leurs pratiques actuelles)
- Les **partenaires autocaristes** pour le prix minimum et le forfait péages
  (cohérence avec leurs propres grilles)

À défaut, ces valeurs servent de **base par défaut** documentée et auditable.
