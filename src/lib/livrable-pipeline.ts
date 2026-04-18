/**
 * lib/livrable-pipeline.ts
 *
 * Pipeline incrémental des livrables P1→P6.
 * Chaque livrable reçoit les outputs validés des phases précédentes comme contexte.
 * Stateless, pur, sans dépendance React.
 */

import type { ClientProfile, PAInContext, DiscoveryAnswers, CustomUseCase } from './types';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export type LivrablePhase =
  | 'p1_discovery'
  | 'p2_gap'
  | 'p3_rfi'
  | 'p4_scoring'
  | 'p5_risks'
  | 'p6_roadmap';

export interface LivrableInput {
  phase: LivrablePhase;
  client_name?: string;
  client_profile?: ClientProfile | null;
  context_supplement?: string;
  answers: Partial<DiscoveryAnswers>;
  shortlisted_pas: string[];
  eliminated_pas: Array<{ name: string; reason: string }>;
  active_alerts: Array<{ title: string; message: string }>;
  lead_time_min?: number;
  lead_time_max?: number;
  complexity_band?: string;
  deadline?: string;
  use_cases?: { selected_ids: string[]; custom: CustomUseCase[] };
  pa_in_context?: PAInContext[];
  // Outputs validés des phases précédentes
  p1_validated?: string;
  p2_validated?: string;
  p3_validated?: string;
  p4_validated?: string;
  p5_validated?: string;
}

/**
 * Dépendances entre phases.
 * Une phase ne peut être générée que si ses dépendances ont été validées.
 * - p4 dépend de p2 (p3 optionnel enrichit le scoring)
 * - p6 dépend de p4 (p5 optionnel enrichit la roadmap)
 */
export const LIVRABLE_DEPENDENCIES: Record<LivrablePhase, LivrablePhase[]> = {
  p1_discovery: [],
  p2_gap:       ['p1_discovery'],
  p3_rfi:       ['p2_gap'],
  p4_scoring:   ['p2_gap'],
  p5_risks:     ['p4_scoring'],
  p6_roadmap:   ['p4_scoring'],
};

export const LIVRABLE_LABELS: Record<LivrablePhase, string> = {
  p1_discovery: 'P1 — Cartographie des flux',
  p2_gap:       'P2 — Matrice de couverture',
  p3_rfi:       'P3 — Tableau RFI ciblé',
  p4_scoring:   'P4 — Grille scoring CODIR',
  p5_risks:     'P5 — 7 Pièges + Risques',
  p6_roadmap:   'P6 — Roadmap séquençage',
};

/**
 * Vérifie si un livrable peut être généré selon l'état actuel des livrables.
 */
export function canGenerateLivrable(
  phase: LivrablePhase,
  livrables: Partial<Record<string, string | null>>
): boolean {
  const deps = LIVRABLE_DEPENDENCIES[phase];
  return deps.every((dep) => {
    const key = dep.replace('_', '') as string;
    // Map phase key to livrable state key: 'p1_discovery' → 'p1', 'p2_gap' → 'p2', etc.
    const shortKey = dep.split('_')[0];
    return !!(livrables[shortKey] || livrables[dep] || livrables[key]);
  });
}

/**
 * Extrait la clé courte d'une phase ('p1_discovery' → 'p1').
 */
export function phaseToKey(phase: LivrablePhase): string {
  return phase.split('_')[0];
}

// ---------------------------------------------------------------------------
// Prompt builders incrémentaux
// ---------------------------------------------------------------------------

function contextBlock(input: LivrableInput): string {
  const company = input.client_name ?? input.client_profile?.legal_name ?? 'le client';
  const sector = input.client_profile?.naf_label ?? input.client_profile?.sector_label ?? 'secteur non précisé';
  const erp = (input.answers.erp_main as string | undefined) ?? 'ERP non renseigné';
  const deadline = input.deadline ?? input.answers.deadline ?? input.client_profile?.emission_deadline ?? 'deadline non définie';
  const hasContext = input.context_supplement && input.context_supplement.trim().length > 0;

  return `## CONTEXTE CONSULTANT — PRIORITÉ ABSOLUE
${hasContext ? input.context_supplement : 'Aucun contexte additionnel.'}

## PROFIL CLIENT
- Entreprise : ${company}
- Secteur : ${sector}
- ERP : ${erp} (tier : ${(input.answers.erp_tier as string | undefined) ?? '?'})
- Deadline légale/CODIR : ${deadline}
- Catégorie DGFiP : ${input.client_profile?.regulatory_category ?? 'inconnue'}
- Nb établissements : ${input.client_profile?.num_establishments ?? (input.answers.nb_siret_actifs ?? 1)}`;
}

/** Tronque un livrable validé à MAX_CHARS pour limiter les tokens d'entrée. */
const PREV_MAX_CHARS = 1200;
function truncateLivrable(text: string): string {
  return text.length > PREV_MAX_CHARS
    ? text.slice(0, PREV_MAX_CHARS) + '\n[…tronqué]'
    : text;
}

function previousLivrables(input: LivrableInput): string {
  const sections: string[] = [];
  if (input.p1_validated) sections.push(`### P1 — Cartographie des flux (validé)\n${truncateLivrable(input.p1_validated)}`);
  if (input.p2_validated) sections.push(`### P2 — Matrice de couverture (validé)\n${truncateLivrable(input.p2_validated)}`);
  if (input.p3_validated) sections.push(`### P3 — RFI ciblé (validé)\n${truncateLivrable(input.p3_validated)}`);
  if (input.p4_validated) sections.push(`### P4 — Scoring CODIR (validé)\n${truncateLivrable(input.p4_validated)}`);
  if (input.p5_validated) sections.push(`### P5 — Pièges + Risques (validé)\n${truncateLivrable(input.p5_validated)}`);
  if (sections.length === 0) return '';
  return `## LIVRABLES PRÉCÉDENTS VALIDÉS\n${sections.join('\n\n')}`;
}

export function buildP3IncrementalPrompt(input: LivrableInput): string {
  const company = input.client_name ?? input.client_profile?.legal_name ?? 'le client';
  const erp = (input.answers.erp_main as string | undefined) ?? 'ERP non renseigné';
  const volume = (input.answers.volume_emis_mensuel as number | undefined)
    ?? (input.answers.volume_emitted as string | undefined)
    ?? 'volume non renseigné';
  const nbSiret = input.client_profile?.num_establishments ?? (input.answers.nb_siret_actifs ?? 1);
  const useCaseIds = input.use_cases?.selected_ids ?? [];

  const pasText = input.shortlisted_pas.length > 0
    ? input.shortlisted_pas.map((pa) => `- ${pa}`).join('\n')
    : 'Aucune PA shortlistée';

  return `${contextBlock(input)}

## PA SHORTLISTÉES (cibles du RFI)
${pasText}

${previousLivrables(input)}

## USE CASES ACTIVÉS
${useCaseIds.length > 0 ? useCaseIds.join(', ') : 'use cases standard'}

## MISSION — Tableau RFI ciblé pour ${input.shortlisted_pas.length} PA

Génère un tableau RFI avec des questions UNIQUEMENT sur :
1. Les points "?" ou "~" de la matrice P2 (incertitudes de couverture)
2. Les use cases activés ci-dessus
3. L'intégration avec ${erp} (${volume} fac/mois, ${nbSiret} SIRET(s))

Règles absolues :
- JAMAIS de question fermée (oui/non)
- TOUJOURS contractualisable — réponse engageable par écrit
- Personnaliser avec l'ERP, le volume, le secteur, les use cases

Format de sortie : tableau Markdown
Colonnes : Thème | Priorité | Question | ${input.shortlisted_pas.map((pa) => `**${pa}**`).join(' | ')} | Niveau de confiance attendu
Priorité : 🔴 Critique / 🟡 Important / ⚪ Informatif
Niveau de confiance attendu : Contractuel / Indicatif / Déclaratif

Thèmes obligatoires : Intégration ${erp}, Lead time garanti, Couverture avoirs, e-Reporting, Immatriculation DGFiP définitive, Hébergement données, Exit clause / portabilité`;
}

export function buildP4IncrementalPrompt(input: LivrableInput): string {
  const company = input.client_name ?? input.client_profile?.legal_name ?? 'le client';
  const deadline = input.deadline ?? input.answers.deadline ?? '>12mois';
  const codirPriorities = (input.answers.codir_priorities_ranked as string[] | undefined) ?? [];
  const useCaseIds = input.use_cases?.selected_ids ?? [];
  const hosting = (input.answers.data_hosting as string | undefined) ?? 'non précisé';
  const deadlineWeeks: Record<string, number> = {
    '<3mois': 12, '3-6mois': 26, '6-12mois': 52, '>12mois': 104
  };
  const weeksUntil = deadlineWeeks[deadline] ?? 52;
  const isUrgent = weeksUntil < 24;
  const ltMin = input.lead_time_min ?? 12;
  const ltMax = input.lead_time_max ?? 20;

  return `${contextBlock(input)}

## PA SHORTLISTÉES
${input.shortlisted_pas.map((pa) => `- ${pa}`).join('\n') || 'Aucune'}

## PA ÉLIMINÉES
${input.eliminated_pas.map((p) => `- ${p.name} : ${p.reason}`).join('\n') || 'Aucune'}

${previousLivrables(input)}

## USE CASES ACTIVÉS
${useCaseIds.join(', ') || 'standard'}

## MISSION — Grille de scoring pondérée + Recommandation CODIR pour ${company}

### PARTIE 1 — Pondérations dynamiques (total = 100%)
${isUrgent ? '⚠️ Deadline urgente (< 24 semaines) : Lead time ≥ 20%' : ''}
${(input.answers.erp_tier === 'tier1' || input.answers.erp_tier === 'tier2') ? '- ERP Tier 1/2 : Connecteur ERP ≥ 20%' : ''}
${hosting === 'FRANCE' ? '- Hébergement France exigé : Souveraineté ≥ 15%' : ''}
Priorités CODIR déclarées : ${codirPriorities.join(', ') || 'non précisées'}
Use cases actifs à pondérer : ${useCaseIds.join(', ') || 'standard'}

Critères minimum (adapter les %) :
1. Immatriculation DGFiP définitive (éliminatoire)
2. Connecteur ERP natif
3. Lead time garanti ≤ deadline - 4 semaines (${weeksUntil - 4} sem. max)
4. Couverture fonctionnelle (émis + reçus + avoirs + e-reporting)
5. Hébergement France/UE + ISO 27001
6. Coût total 3 ans (setup + run)
7. SLA disponibilité + support FR

### PARTIE 2 — Score par PA (0 à 10 par critère)
Pour chaque PA shortlistée, noter chaque critère. Calculer le score pondéré total.
Afficher en tableau markdown.

### PARTIE 3 — Lead time par scénario d'intégration
- Connecteur natif disponible : 12 semaines min
- Intégration API : 16-20 semaines
- Intégration sur-mesure : 20-32 semaines
Lead time estimé global : ${ltMin}-${ltMax} semaines
Préciser le scénario applicable pour chaque PA.

### PARTIE 4 — Clauses contractuelles non négociables
5 clauses prioritaires pour ${company}, contextualisées.

### PARTIE 5 — Recommandation CODIR
${isUrgent ? '⚠️ ALERTE : Chemin critique tendu — inclure actions urgence.' : ''}
Synthèse argumentée : PA recommandée, PA alternative, PA à exclure.
Si PA cliente → justification renforcée obligatoire si non recommandée.

Format : Markdown structuré avec tableaux.

---
### BLOC JSON MACHINE-READABLE (obligatoire — ne pas omettre ni modifier la structure)
Après la recommandation CODIR, ajoute IMPÉRATIVEMENT un bloc JSON entre \`\`\`json et \`\`\` :
\`\`\`json
{
  "scoring_criteria": [
    { "label": "Nom du critère", "weight": 25, "scores": { "${input.shortlisted_pas[0] ?? 'PA1'}": 8 } }
  ],
  "lead_time_data": [
    { "pa_name": "${input.shortlisted_pas[0] ?? 'PA1'}", "scenario": "native", "min_weeks": 12, "max_weeks": 16 }
  ],
  "contract_clauses": ["Clause 1…", "Clause 2…", "Clause 3…", "Clause 4…", "Clause 5…"]
}
\`\`\`
Noms PA (utiliser exactement comme clés scores) : ${input.shortlisted_pas.join(', ')}
Scénario : "native" = connecteur ERP natif · "api" = intégration API · "custom" = sur-mesure
Les poids totalisent 100 %. Scores = entiers 0–10.`;
}

export function buildP5IncrementalPrompt(input: LivrableInput): string {
  const company = input.client_name ?? input.client_profile?.legal_name ?? 'le client';
  const sector = input.client_profile?.naf_label ?? input.client_profile?.sector_label ?? 'secteur non précisé';
  const activeAlertsText = input.active_alerts.length > 0
    ? input.active_alerts.map((a) => `- **${a.title}** : ${a.message}`).join('\n')
    : 'Aucun piège actif détecté automatiquement';

  return `${contextBlock(input)}

## ALERTES ACTIVES (${input.active_alerts.length}/7 pièges détectés)
${activeAlertsText}

${previousLivrables(input)}

## MISSION — Pièges actifs + Risques spécifiques pour ${company}

### PARTIE 1 — Les 7 Pièges (contextualisés à ce client)

Pour chaque piège, évaluer s'il est ACTIF sur ce profil spécifique.
Si actif : décrire la situation CONCRÈTE spécifique à ${company} (utiliser les données P1-P4).
Si non actif : marquer "(non applicable à ce profil)"

Les 7 Pièges :
1. PA "par défaut ERP" sans vérification du périmètre réel du connecteur
2. Complexité d'intégration sous-estimée vs richesse fonctionnelle réelle
3. Données de benchmark non datées ou antérieures à sept. 2025
4. Confusion "immatriculé DGFiP" vs "opérationnel en production"
5. Souveraineté des données (hébergement hors UE sans qualification)
6. Lead time réel sous-estimé par rapport aux engagements contractuels
7. Opérationnels métier non impliqués dans le projet de sélection

### PARTIE 2 — Risques spécifiques au profil ${company} — secteur ${sector}

Identifier 4-6 risques prioritaires (score ≥ 6/9).
Pour chaque risque :
- **Titre** (spécifique, pas générique)
- Description contextualisée (utiliser les données des phases précédentes)
- Probabilité : faible / modérée / élevée
- Impact : faible / modéré / critique
- Score (probabilité × impact / 9)
- 3 actions de mitigation concrètes + owner + deadline

Priorité aux risques avec score ≥ 6/9.
Format : Markdown structuré. Maximum 1000 mots.`;
}

// ---------------------------------------------------------------------------
// Date utilities — P6 retroplanning (working days Mon–Fri, no holidays)
// ---------------------------------------------------------------------------

function frFmt(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function addWeeksToDate(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + Math.round(weeks * 7));
  return d;
}

/** Returns working-day distance (Mon–Fri). Positive = to is after from. */
function p6WorkingDaysBetween(from: Date, to: Date): number {
  const sign = to >= from ? 1 : -1;
  const start = sign > 0 ? from : to;
  const end   = sign > 0 ? to   : from;
  let count = 0;
  const cur = new Date(start);
  cur.setDate(cur.getDate() + 1);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count * sign;
}

export function buildP6IncrementalPrompt(input: LivrableInput): string {
  const company   = input.client_name ?? input.client_profile?.legal_name ?? 'le client';
  const deadlineKey = input.deadline ?? (input.answers.deadline as string | undefined) ?? '>12mois';
  const deadlineWeeksMap: Record<string, number> = {
    '<3mois': 12, '3-6mois': 26, '6-12mois': 52, '>12mois': 104,
  };
  const weeksUntil = deadlineWeeksMap[deadlineKey] ?? 52;
  const ltMin = input.lead_time_min ?? 12;
  const ltMax = input.lead_time_max ?? 20;
  const erp   = (input.answers.erp_main as string | undefined) ?? 'ERP non renseigné';

  // ---- Concrete date calculations ----
  const today = new Date();

  // Go-live target = today + deadline bucket in calendar weeks
  const goLiveDate = addWeeksToDate(today, weeksUntil);

  // Total time needed (selection → go-live):
  //   Selection phase  :  9 weeks  (atelier → CODIR → RFI → analyse → signature)
  //   Post-signature   :  ltMax weeks (integration) + 4 (tests) + 3 (UAT) + 2 (pilot) + 2 (buffer) = ltMax+11
  const selectionWeeks   = 9;
  const postSignatureWks = ltMax + 11;
  const totalWeeksNeeded = selectionWeeks + postSignatureWks;

  const latestStartDate  = addWeeksToDate(goLiveDate, -totalWeeksNeeded);
  const delayWD          = p6WorkingDaysBetween(latestStartDate, today); // >0 = late
  const isLate           = delayWD > 0;
  const delayWeeks       = Math.ceil(Math.abs(delayWD) / 5);

  // Retroplanning anchors (calendar dates, backward from go-live)
  const piloteDate    = addWeeksToDate(goLiveDate, -2);
  const uatDate       = addWeeksToDate(goLiveDate, -(2 + 3));
  const testsDate     = addWeeksToDate(goLiveDate, -(2 + 3 + 4));
  const devStartDate  = addWeeksToDate(goLiveDate, -(2 + 3 + 4 + ltMax));
  const signatureDate = addWeeksToDate(goLiveDate, -(2 + 3 + 4 + ltMax + 2));
  const rfiAnalyse    = addWeeksToDate(goLiveDate, -(2 + 3 + 4 + ltMax + 2 + 3));
  const rfiDate       = addWeeksToDate(goLiveDate, -(2 + 3 + 4 + ltMax + 2 + 3 + 2));
  const codirDate     = addWeeksToDate(goLiveDate, -(2 + 3 + 4 + ltMax + 2 + 3 + 2 + 2));

  const delayBlock = isLate
    ? `## ⚠️ RETARD DÉTECTÉ — PLAN DE RATTRAPAGE OBLIGATOIRE
Le projet aurait dû démarrer le **${frFmt(latestStartDate)}** au plus tard.
Retard actuel : **${delayWD} jours ouvrés** (~${delayWeeks} semaine${delayWeeks !== 1 ? 's' : ''}).

Dans le livrable, inclure obligatoirement :
1. **Phases compressibles** (gain estimé) :
   - Sélection parallélisée (RFI + scoring simultanés) → -2 à -3 sem.
   - Tests anticipés sur environnement partiel → -2 sem.
   - UAT périmètre minimal pour go-live partiel → -1 sem.
2. **Actions d'urgence à déclencher sous 48h** :
   - Go/no-go CODIR en format flash (1h max)
   - RFI express : 5 questions critiques max par PA
   - Contractualisation fast-track avec clause de démarrage immédiat
3. **Scénario go-live partiel** si le rattrapage dépasse ${ltMin} semaines :
   - Go-live émission seule avant deadline
   - Montée en charge progressive post-deadline (réception, e-reporting)
`
    : `## ✅ Planning réalisable — ${delayWeeks} semaine${delayWeeks !== 1 ? 's' : ''} de marge
Démarrage au plus tard : **${frFmt(latestStartDate)}** — marge disponible : **${Math.abs(delayWD)} jours ouvrés**
`;

  return `${contextBlock(input)}

Date d'aujourd'hui : **${frFmt(today)}**
**Date go-live cible : ${frFmt(goLiveDate)}** (dans ${weeksUntil} semaines calendaires)
Lead time intégration ${erp} : ${ltMin}–${ltMax} semaines
**Date de début au plus tard : ${frFmt(latestStartDate)}**

${delayBlock}
${previousLivrables(input)}

## MISSION — Rétro-planning à rebours depuis le go-live pour ${company}

Génère un planning à rebours depuis le **${frFmt(goLiveDate)}**.
Calcule chaque date en **jours ouvrés** (lundi–vendredi, hors weekends).
Les dates ci-dessous sont des ancres de départ — affine selon les risques P5 et le contexte client.

### 10 jalons obligatoires

| # | Jalon | Date cible | Durée | Statut | Owner |
|---|-------|-----------|-------|--------|-------|
| 10 | GO-LIVE opérationnel | **${frFmt(goLiveDate)}** | — | calc. | DSI + éditeur |
| 9 | Pilote en production | ${frFmt(piloteDate)} | 2 sem. | calc. | DSI + utilisateurs |
| 8 | Recette UAT + formation | ${frFmt(uatDate)} | 3 sem. | calc. | DAF + métier |
| 7 | Tests d'intégration ${erp} | ${frFmt(testsDate)} | 4 sem. | calc. | DSI + éditeur |
| 6 | Développements intégration | ${frFmt(devStartDate)} | ${ltMax} sem. | calc. | Éditeur |
| 5 | Signature contrat + lancement | ${frFmt(signatureDate)} | 2 sem. | calc. | DG + DAF |
| 4 | Analyse RFI + scoring CODIR | ${frFmt(rfiAnalyse)} | 3 sem. | calc. | Consultant |
| 3 | RFI ciblé (3–5 PA) | ${frFmt(rfiDate)} | 2 sem. | calc. | Consultant |
| 2 | CODIR go/no-go | ${frFmt(codirDate)} | 2 sem. | calc. | DG + CODIR |
| 1 | Atelier qualification des flux | **${frFmt(latestStartDate)}** | 3h | ${isLate ? '🔴 Dépassé' : '✅ À planifier'} | Consultant |

Pour chaque jalon, développe :
- La **date réelle en jours ouvrés** (recalculée depuis ${frFmt(goLiveDate)}, ±ajustement context)
- Le **statut** : ✅ Réalisable / ⚠️ Sous tension / 🔴 Impossible
- Les **3 actions prioritaires** spécifiques à ${company}
- Le **risque P5 associé** s'il existe (citer le titre exact du risque)
- L'**owner recommandé** (DSI, DAF, DG, Consultant, Éditeur)
${isLate ? `
### Plan de rattrapage — ${delayWeeks} sem. à récupérer
Reprends les jalons compressibles et donne les nouvelles dates si la compression est appliquée.
Calcule le nouveau go-live estimé avec le plan d'urgence.` : ''}

Format : tableau Markdown des 10 jalons + actions + ${isLate ? 'plan de rattrapage obligatoire' : 'synthèse des marges'}. 900 mots max.`;
}
