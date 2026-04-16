/**
 * lib/prompts/generate-livrable.ts
 *
 * Prompts pour la génération des livrables de chaque phase.
 * Versionné ici.
 */

export const LIVRABLE_SYSTEM_PROMPT = `Tu es un consultant expert en transformation digitale financière et en sélection de Plateformes Agréées (PA) pour la réforme DGFiP de facturation électronique B2B française.

Tu génères des livrables professionnels en français, exploitables directement dans un dossier de sélection PA. Ton ton est factuel, structuré, et orienté décision CODIR. Pas de superflu.

Format : Markdown structuré avec titres, tableaux et listes. Maximum 800 mots.`;

export function buildP1LiverablePrompt(answers: Record<string, unknown>, clientName?: string): string {
  return `Génère le livrable "Cartographie des flux de facturation" pour ${clientName ?? 'le client'}.

Données de découverte :
\`\`\`json
${JSON.stringify(answers, null, 2)}
\`\`\`

Livrable attendu :
1. **Tableau synthétique** : systèmes sources → formats actuels → volumes (émis + reçus) → exceptions notables
2. **Paragraphe narratif** (3-5 phrases) : "Qui émet quoi, depuis quel système, vers qui, dans quel format, avec quelles exceptions ?"
3. **Points d'attention détectés** (liste) : flux spéciaux, risques, ambiguïtés à clarifier

Format : Markdown. Sois factuel et direct.`;
}

export function buildP2LiverablePrompt(
  answers: Record<string, unknown>,
  shortlistedPAs: string[],
  eliminatedPAs: Array<{ name: string; reason: string }>
): string {
  return `Génère le livrable "Matrice de couverture des PA shortlistées" pour ce profil client.

Données client :
\`\`\`json
${JSON.stringify(answers, null, 2)}
\`\`\`

PA shortlistées : ${shortlistedPAs.join(', ')}
PA éliminées : ${eliminatedPAs.map((p) => `${p.name} (${p.reason})`).join(', ') || 'Aucune'}

Livrable attendu :
1. **Tableau de couverture** comparant les PA shortlistées sur les critères clés (émission, réception, avoirs, e-reporting, hébergement, ERP, archivage)
2. **Section "PA éliminées"** avec justification claire pour chaque PA écartée
3. **Note sur la fraîcheur des données** : toute donnée non datée doit être mentionnée comme indicative

Format : Markdown. Le tableau est le cœur du livrable.`;
}

// ---------------------------------------------------------------------------
// P3 — Tableau RFI ciblé
// ---------------------------------------------------------------------------

export function buildP3LiverablePrompt(
  clientName: string | undefined,
  answers: Record<string, unknown>,
  shortlistedPAs: string[],
  profile?: Record<string, unknown>
): string {
  const company = clientName ?? 'le client';
  const erp = (answers.erp_main as string) ?? 'ERP non précisé';
  const volume = (answers.volume_emis_mensuel as number) ?? (answers.volume_emitted as string) ?? 'volume non précisé';
  const deadline = (answers.deadline as string) ?? 'deadline non précisée';
  const sector = (profile?.sector_label as string) ?? (profile?.naf_label as string) ?? 'secteur non précisé';
  const nbSiret = (profile?.num_establishments as number) ?? 1;

  return `Génère un tableau RFI ciblé pour ${shortlistedPAs.length} PA shortlistées : ${shortlistedPAs.join(', ')}.

Contexte client : ${company}, ERP ${erp}, volume ${volume}/mois, deadline ${deadline}, secteur ${sector}.

Pour chaque PA, génère des questions contractualisables (jamais de question fermée oui/non).

Modèles de formulation :
- Intégration ERP : "Décrivez le mécanisme d'intégration avec ${erp}. Périmètre couvert (émis + reçus + avoirs + e-reporting) ? Joignez la doc technique."
- Lead time : "Pour ce profil (${volume}/mois, ${erp}, ${nbSiret} établissement(s)), quel est le délai contractuel entre signature et premier flux en production ? Donnez 3 références récentes comparables."
- Avoirs : "Décrivez le cycle de vie d'un avoir : qui initie, quels statuts, comment notifié, comment transmis à l'administration fiscale ?"
- Références secteur ${sector} : "Citez 3 références clients dans le secteur ${sector} avec coordonnées de contact."
- Immatriculation : "Quelle est votre date d'immatriculation définitive DGFiP ? Si 'sous réserve' : date estimée ?"
- Exit clause : "Quelles sont vos clauses de portabilité des données et de résiliation anticipée ?"
- Continuité : "Que se passe-t-il pour nos données si vous perdez votre immatriculation ou êtes rachetés ?"

Format de sortie : tableau Markdown avec colonnes ${shortlistedPAs.map((pa) => `**${pa}**`).join(' | ')}
Chaque cellule : question + colonne "Réponse PA" vide + indicateur de priorité (🔴 critique / 🟡 important / ⚪ informatif).`;
}

// ---------------------------------------------------------------------------
// P4 — Grille de scoring + recommandation CODIR
// ---------------------------------------------------------------------------

export function buildP4LiverablePrompt(
  clientName: string | undefined,
  answers: Record<string, unknown>,
  shortlistedPAs: string[],
  eliminatedPAs: Array<{ name: string; reason: string }>,
  leadTimeMin: number,
  leadTimeMax: number,
  profile?: Record<string, unknown>
): string {
  const company = clientName ?? 'le client';
  const erp = (answers.erp_main as string) ?? 'ERP non précisé';
  const deadline = (answers.deadline as string) ?? '>12mois';
  const sector = (profile?.sector_label as string) ?? (profile?.naf_label as string) ?? 'secteur non précisé';
  const naf = (profile?.naf_label as string) ?? 'secteur non précisé';
  const codirPriorities = (answers.codir_priorities_ranked as string[]) ?? [];
  const hosting = (answers.data_hosting as string) ?? 'non précisé';

  const deadlineWeeksMap: Record<string, number> = {
    '<3mois': 12, '3-6mois': 26, '6-12mois': 52, '>12mois': 104
  };
  const weeksUntil = deadlineWeeksMap[deadline] ?? 52;
  const isUrgent = weeksUntil < 24;

  return `Génère la grille de scoring pondérée et la recommandation CODIR pour ${company}.

Profil client : ${company}, secteur ${sector} (${naf}), ERP ${erp}, deadline ${deadline} (${weeksUntil} semaines), hébergement requis : ${hosting}.
Lead time estimé : ${leadTimeMin}-${leadTimeMax} semaines.
Priorités CODIR déclarées : ${codirPriorities.length > 0 ? codirPriorities.join(', ') : 'non précisées'}.

PA shortlistées : ${shortlistedPAs.join(', ')}
PA éliminées : ${eliminatedPAs.map((p) => `${p.name} (${p.reason})`).join(', ') || 'Aucune'}

## PARTIE 1 — Grille de scoring pondérée (total = 100%)

Propose des pondérations adaptées au profil. Règles :
${isUrgent ? '- ⚠️ Deadline urgente (< 24 semaines) : Lead time ≥ 20%' : ''}
${(answers.erp_tier === 'tier1') ? '- ERP Tier 1 : Connecteur ERP ≥ 20%' : ''}
${(hosting === 'FRANCE') ? '- Hébergement France exigé : Souveraineté ≥ 15%' : ''}
- Aligner sur les priorités CODIR déclarées

Critères à évaluer (proposer pondérations en %) :
1. Immatriculation DGFiP définitive
2. Intégration ERP native (connecteur certifié)
3. Lead time garanti ≤ deadline - 4 semaines
4. Couverture fonctionnelle (émis + reçus + avoirs + e-reporting)
5. Hébergement France/UE + ISO 27001
6. Coût total 3 ans (setup + run)
7. SLA disponibilité + support FR

## PARTIE 2 — Estimation lead time par scénario

- Connecteur natif pour ${erp} : 12 semaines minimum
- Intégration API : 16-20 semaines
- Sur-mesure : 20-32 semaines

Identifier le scénario applicable pour ${erp} et chaque PA shortlistée.

## PARTIE 3 — Clauses contractuelles non négociables

Lister les 5 clauses prioritaires pour ${company} avec justification contextuelle.

## PARTIE 4 — Recommandation CODIR

Synthèse argumentée (1 page max) pour la décision CODIR.
${isUrgent ? "⚠️ ALERTE : Chemin critique tendu — préciser les actions d'urgence." : ''}

Format : Markdown structuré avec tableaux. Factuel, orienté décision.`;
}

// ---------------------------------------------------------------------------
// P5 — 7 Pièges actifs + Risques spécifiques
// ---------------------------------------------------------------------------

export function buildP5LiverablePrompt(
  clientName: string | undefined,
  answers: Record<string, unknown>,
  activeAlerts: Array<{ title: string; message: string }>,
  contextSupplement?: string,
  profile?: Record<string, unknown>
): string {
  const company = clientName ?? 'le client';
  const sector = (profile?.sector_label as string) ?? (profile?.naf_label as string) ?? 'secteur non précisé';
  const alertsText = activeAlerts.length > 0
    ? activeAlerts.map((a) => `- **${a.title}** : ${a.message}`).join('\n')
    : 'Aucun piège actif détecté';

  return `Génère la section "Points de vigilance et risques spécifiques" pour ${company}.

Contexte client : ${company}, secteur ${sector}.
${contextSupplement ? `Contexte additionnel : ${contextSupplement}` : ''}
Réponses discovery :
\`\`\`json
${JSON.stringify(answers, null, 2)}
\`\`\`

## PARTIE 1 — Les 7 Pièges à éviter (pièges actifs EN PREMIER)

Pièges actifs détectés sur ce profil (${activeAlerts.length}/${7}) :
${alertsText}

Pour chaque piège ACTIF :
- Titre du piège
- Situation concrète contextualisée à ${company} (pas générique)
- Règle à appliquer

Pour les pièges NON actifs : afficher en grisé avec "(non applicable à ce profil)"

Les 7 pièges à couvrir :
1. Connecteur ERP ambigu — périmètre non documenté
2. Roadmap PA inconnue — fonctionnalités promises non livrées
3. Données benchmark obsolètes — antérieures à sept. 2025
4. Immatriculation DGFiP incertaine — statut "sous réserve"
5. Hébergement non qualifié — souveraineté des données à risque
6. Budget sous-estimé — TCO réel vs prix affiché
7. Ressources internes absentes — pas de chef de projet dédié

## PARTIE 2 — Risques spécifiques au profil ${company}

Pour chaque risque identifié :
- **Titre**
- Description contextualisée (pas générique)
- Probabilité : faible / modérée / élevée
- Impact : faible / modéré / critique
- Score risque (probabilité × impact sur 9)
- Actions de mitigation concrètes (2-3 actions)
- Owner de la mitigation
- Deadline de mitigation

Priorité aux risques avec score ≥ 6.

Format : Markdown structuré. Maximum 1000 mots.`;
}

// ---------------------------------------------------------------------------
// P6 — Roadmap séquençage
// ---------------------------------------------------------------------------

export function buildP6LiverablePrompt(
  clientName: string | undefined,
  deadline: string,
  leadTimeMin: number,
  leadTimeMax: number,
  complexityBand: string,
  erp?: string
): string {
  const company = clientName ?? 'le client';
  const today = new Date().toISOString().split('T')[0];
  const deadlineWeeksMap: Record<string, number> = {
    '<3mois': 12, '3-6mois': 26, '6-12mois': 52, '>12mois': 104
  };
  const weeksUntil = deadlineWeeksMap[deadline] ?? 52;
  const isCritical = weeksUntil < leadTimeMin + 8;
  const erpLabel = erp ?? 'ERP non précisé';

  return `Génère le séquençage recommandé "De l'atelier au go-live" pour ${company}.

Contexte :
- Client : ${company}
- Deadline légale / CODIR : ${deadline} (${weeksUntil} semaines depuis aujourd'hui)
- Lead time estimé : ${leadTimeMin} à ${leadTimeMax} semaines
- Scénario ERP : ${erpLabel} (complexité ${complexityBand})
- Date aujourd'hui : ${today}

## Planning à rebours depuis la deadline

Calcule les jalons à rebours depuis J+${weeksUntil} semaines (aujourd'hui = semaine 0) :

Jalons à placer (10 jalons) :
1. Atelier qualification des flux (3h) — semaine 0 (maintenant)
2. Décision CODIR — semaine 1-2
3. RFI ciblé (3-5 PA) — semaine 2-4
4. Analyse RFI + scoring pondéré — semaine 4-7
5. Signature PA + lancement intégration ERP — semaine 7-9 (IMPÉRATIF)
6. Développements d'intégration — ${leadTimeMin} semaines
7. Tests d'intégration — +2-4 semaines
8. Recette utilisateur + formation — +2-3 semaines
9. Pilote en production — +2 semaines
10. GO-LIVE OPÉRATIONNEL — avant semaine ${weeksUntil}

Pour chaque jalon :
- Date estimée (semaine du XX/XX à partir d'aujourd'hui ${today})
- Durée
- Actions clés (3 bullet points max)
- Statut : ✅ réalisable / ⚠️ sous tension / 🔴 impossible

${isCritical ? `## ⚠️ ALERTE CHEMIN CRITIQUE

Le délai disponible (${weeksUntil} sem.) est inférieur au lead time minimum + buffer (${leadTimeMin + 8} sem.).
Le go-live est à risque. Indiquer :
1. Les 3 actions d'urgence prioritaires à déclencher immédiatement
2. Les décisions CODIR à accélérer
3. Le scénario de contingence si le go-live sept. 2026 est impossible` : ''}

Format : tableau Markdown + section alertes si applicable. 800 mots max.`;
}
