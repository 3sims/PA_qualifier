/**
 * lib/gap-analysis.ts
 *
 * Moteur de matching PA V2 : prend les answers client + liste de PA + catalogue de features
 * et produit une shortlist triée avec critères éliminatoires.
 *
 * Stateless, pur. Aucune dépendance réseau, aucun effet de bord.
 *
 * FAILURE MODES :
 *   - Liste de PA vide → retourne []
 *   - Coverage manquante → feature marquée '?' (inconnu)
 *   - Aucune PA éligible après filtrage → retourne []
 */

import type {
  DiscoveryAnswers,
  PAProfile,
  PAInContext,
  PASource,
  FeatureCatalogItem,
  ShortlistEntry,
  PriorityKey,
  CoverageLevel,
  LeadTimeEstimate,
} from './types';

// ---------------------------------------------------------------------------
// PRIORITY MULTIPLIERS
// ---------------------------------------------------------------------------

const PRIORITY_MULTIPLIERS = [3, 2.4, 1.8, 1.3, 1] as const;

const PRIORITY_FEATURES: Record<PriorityKey, string[]> = {
  erp_integration: ['erp_sap_native', 'erp_sage_native', 'erp_cegid_native'],
  functional_coverage: ['emission_b2b', 'reception_b2b', 'peppol_support', 'edi_support'],
  cost: [],
  support_quality: ['support_fr'],
  security_sovereignty: ['iso27001', 'archiving_nf_z42013', 'data_hosting'],
};

// ---------------------------------------------------------------------------
// COVERAGE HELPERS
// ---------------------------------------------------------------------------

/**
 * Convertit un CoverageLevel V2 en score numérique [0..1].
 */
function coverageLevelToScore(level: CoverageLevel | undefined): number {
  if (!level) return 0;
  switch (level) {
    case '✓': return 1;
    case '~': return 0.5;
    case '?': return 0;
    case '✗': return 0;
    default:  return 0;
  }
}

/**
 * Calcule le score d'une feature pour une PA donnée.
 * Prend en compte les features ERP via erp_integrations et les autres via coverage.
 */
function getFeatureScore(
  pa: PAProfile,
  feature: FeatureCatalogItem,
  answers: Partial<DiscoveryAnswers>
): number {
  // Features ERP : lookup dans erp_integrations
  if (['erp_sap_native', 'erp_sage_native', 'erp_cegid_native'].includes(feature.id)) {
    const erpIdMap: Record<string, string[]> = {
      erp_sap_native:   ['sap_s4hana', 'sap_ecc'],
      erp_sage_native:  ['sage_x3', 'sage_100', 'sage_50'],
      erp_cegid_native: ['cegid_xrp', 'cegid_loop'],
    };
    const targetIds = erpIdMap[feature.id] ?? [];
    const integration = pa.erp_integrations.find((e) => targetIds.includes(e.erp_id));
    if (!integration) return 0;
    return integration.integration_type === 'native' ? 1 : 0.5;
  }

  // Feature hébergement : traitement spécial (vérifiée dans isEligible, ici bonus)
  if (feature.id === 'data_hosting') {
    if (answers.data_hosting === 'FRANCE' && pa.data_hosting === 'FRANCE') return 1;
    if (answers.data_hosting === 'EU' && (pa.data_hosting === 'FRANCE' || pa.data_hosting === 'EU')) return 1;
    return 0.5;
  }

  // Toutes les autres features : via coverage_key dans l'objet coverage
  const coverageKey = feature.coverage_key;
  if (!coverageKey) return 0;
  const level = pa.coverage[coverageKey] as CoverageLevel | undefined;
  return coverageLevelToScore(level);
}

// ---------------------------------------------------------------------------
// ELIGIBILITY — Passe 1 bloquante
// ---------------------------------------------------------------------------

export interface EliminatoryCriterion {
  id: string;
  label: string;
  check: (pa: PAProfile, answers: Partial<DiscoveryAnswers>, leadTime?: LeadTimeEstimate) => boolean;
  message: string;
  badge?: string;
}

export const ELIMINATORY_CRITERIA: EliminatoryCriterion[] = [
  {
    id: 'hosting_incompatible',
    label: 'Hébergement des données',
    check: (pa, answers) =>
      answers.data_hosting === 'FRANCE' && pa.data_hosting !== 'FRANCE',
    message: 'Hébergement hors France — incompatible avec les exigences client',
  },
  {
    id: 'hosting_eu_incompatible',
    label: 'Hébergement UE',
    check: (pa, answers) =>
      answers.data_hosting === 'EU' && pa.data_hosting === 'INTL',
    message: 'Hébergement hors UE — incompatible avec les exigences client',
  },
  {
    id: 'not_officially_registered',
    label: 'Immatriculation DGFiP',
    check: (pa) => pa.status === 'radiée',
    message: 'PA radiée de la liste DGFiP — non éligible',
    badge: 'radiée',
  },
  {
    id: 'missing_iso27001',
    label: 'ISO 27001',
    check: (pa, answers) => {
      const required = answers.certifications ?? [];
      if (!required.includes('ISO27001')) return false;
      const level = pa.coverage.iso27001 as CoverageLevel | undefined;
      return level !== '✓';
    },
    message: 'ISO 27001 non certifiée — exigé par le client',
  },
  {
    id: 'missing_archiving_cert',
    label: 'NF Z 42-013',
    check: (pa, answers) => {
      const required = answers.certifications ?? [];
      if (!required.includes('NF_Z42013')) return false;
      const level = pa.coverage.archivage_10ans as CoverageLevel | undefined;
      return level !== '✓';
    },
    message: 'Archivage probant NF Z 42-013 non certifié — exigé par le client',
  },
];

/**
 * Construit le message d'élimination, en renforçant pour les PA clientes.
 */
export function buildEliminationReason(
  criterion: EliminatoryCriterion,
  pa: PAInContext | PAProfile,
  paSource?: PASource
): string {
  const base = criterion.message;
  const source = (pa as PAInContext).pa_source ?? paSource;
  if (source === 'client' || source === 'both') {
    return `[PA identifiée par le client] ${base} — ` +
      `Recommandation : exclure de la shortlist CODIR avec justification documentée`;
  }
  return base;
}

/**
 * Retourne la raison d'élimination si la PA est éliminée, null sinon.
 */
function getEliminationReason(
  pa: PAProfile,
  answers: Partial<DiscoveryAnswers>,
  paSource?: PASource
): string | null {
  for (const criterion of ELIMINATORY_CRITERIA) {
    if (criterion.check(pa, answers)) {
      return buildEliminationReason(criterion, pa as PAInContext, paSource);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// SCORING
// ---------------------------------------------------------------------------

function scorePA(
  answers: Partial<DiscoveryAnswers>,
  pa: PAProfile,
  features: FeatureCatalogItem[]
): { score: number; maxScore: number } {
  const priorities = answers.priorities ?? [];
  let score = 0;
  let maxScore = 0;

  for (const feature of features) {
    const featureScore = getFeatureScore(pa, feature, answers);

    // Multiplicateur selon priorité
    let mult = 1;
    for (let i = 0; i < priorities.length; i++) {
      const prio = priorities[i];
      if (PRIORITY_FEATURES[prio].includes(feature.id)) {
        mult = PRIORITY_MULTIPLIERS[Math.min(i, PRIORITY_MULTIPLIERS.length - 1)];
        break;
      }
    }

    const weight = feature.weight_default * mult;
    score += featureScore * weight;
    maxScore += weight;
  }

  // Bonus intégration ERP principal
  if (answers.erp_main) {
    const integration = pa.erp_integrations.find((e) => e.erp_id === answers.erp_main);
    if (integration) {
      const bonus = integration.integration_type === 'native' ? 20 : 10;
      score += bonus;
      maxScore += 20;
    } else {
      maxScore += 20;
    }
  }

  return { score, maxScore };
}

// ---------------------------------------------------------------------------
// STRENGTHS / GAPS / UNKNOWNS
// ---------------------------------------------------------------------------

function buildStrengths(pa: PAProfile, features: FeatureCatalogItem[]): string[] {
  const strengths: string[] = [];
  const sorted = [...features].sort((a, b) => b.weight_default - a.weight_default);
  for (const feature of sorted) {
    if (strengths.length >= 3) break;
    if (feature.coverage_key && feature.weight_default >= 5) {
      const level = pa.coverage[feature.coverage_key] as CoverageLevel | undefined;
      if (level === '✓') strengths.push(feature.name);
    } else if (
      ['erp_sap_native', 'erp_sage_native', 'erp_cegid_native'].includes(feature.id) &&
      feature.weight_default >= 5
    ) {
      const erpIdMap: Record<string, string[]> = {
        erp_sap_native:   ['sap_s4hana', 'sap_ecc'],
        erp_sage_native:  ['sage_x3', 'sage_100', 'sage_50'],
        erp_cegid_native: ['cegid_xrp', 'cegid_loop'],
      };
      const targets = erpIdMap[feature.id] ?? [];
      const native = pa.erp_integrations.find(
        (e) => targets.includes(e.erp_id) && e.integration_type === 'native'
      );
      if (native) strengths.push(feature.name);
    }
  }
  return strengths;
}

function buildGaps(pa: PAProfile, features: FeatureCatalogItem[]): string[] {
  const gaps: string[] = [];
  const sorted = [...features].sort((a, b) => b.weight_default - a.weight_default);
  for (const feature of sorted) {
    if (gaps.length >= 3) break;
    if (feature.coverage_key && feature.weight_default >= 5) {
      const level = pa.coverage[feature.coverage_key] as CoverageLevel | undefined;
      if (level === '✗') {
        gaps.push(feature.name);
      } else if (level === '~') {
        gaps.push(`${feature.name} (partiel)`);
      }
    }
  }
  return gaps;
}

function buildUnknownFeatures(pa: PAProfile, features: FeatureCatalogItem[]): string[] {
  const unknown: string[] = [];
  for (const feature of features) {
    if (!feature.coverage_key) continue;
    const level = pa.coverage[feature.coverage_key] as CoverageLevel | undefined;
    if (level === '?' || level === undefined) {
      unknown.push(feature.name);
    }
  }
  return unknown.slice(0, 3);
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Point d'entrée principal V2 : produit la shortlist triée.
 * (Compatible avec l'appel depuis api/analyze/route.ts)
 */
export function runGapAnalysis(
  answers: Partial<DiscoveryAnswers>,
  paProfiles: PAProfile[],
  featuresCatalog: FeatureCatalogItem[]
): ShortlistEntry[] {
  // 1. Filtrer (critères éliminatoires)
  const eligible = paProfiles.filter(
    (pa) => getEliminationReason(pa, answers) === null
  );

  // 2. Scorer
  const scored = eligible.map((pa) => {
    const { score, maxScore } = scorePA(answers, pa, featuresCatalog);
    const coverage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    return { pa, coverage };
  });

  // 3. Trier décroissant et top 5
  scored.sort((a, b) => b.coverage - a.coverage);
  const top = scored.slice(0, 5);

  // 4. Construire ShortlistEntry
  return top.map((entry, idx) => ({
    pa_id:            entry.pa.id,
    pa_name:          entry.pa.name,
    rank:             idx + 1,
    coverage_score:   entry.coverage,
    strengths:        buildStrengths(entry.pa, featuresCatalog),
    gaps:             buildGaps(entry.pa, featuresCatalog),
    unknown_features: buildUnknownFeatures(entry.pa, featuresCatalog),
  }));
}

/**
 * Version étendue : retourne aussi les PA éliminées et leurs raisons.
 * Utilisée par les composants V2 (CoverageMatrix, DraftLivrable…).
 */
export function runGapAnalysisV2(
  answers: Partial<DiscoveryAnswers>,
  paProfiles: (PAProfile | PAInContext)[],
  featuresCatalog: FeatureCatalogItem[]
): {
  shortlisted: PAInContext[];
  eliminated: (PAInContext & { eliminated_reason: string })[];
} {
  const shortlisted: PAInContext[] = [];
  const eliminated: (PAInContext & { eliminated_reason: string })[] = [];

  for (const pa of paProfiles) {
    const paCtx: PAInContext = 'pa_source' in pa
      ? pa as PAInContext
      : { ...pa, pa_source: 'app' as PASource };

    const reason = getEliminationReason(pa, answers, paCtx.pa_source);
    if (reason) {
      eliminated.push({ ...paCtx, eliminated_reason: reason });
    } else {
      shortlisted.push(paCtx);
    }
  }

  // Scorer et trier les shortlistées
  const scored = shortlisted.map((pa) => {
    const { score, maxScore } = scorePA(answers, pa, featuresCatalog);
    const coverage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    return { pa, coverage };
  });
  scored.sort((a, b) => b.coverage - a.coverage);

  return {
    shortlisted: scored.map((e) => e.pa),
    eliminated,
  };
}

/**
 * Construit des ShortlistEntry[] à partir d'une liste de PAInContext déjà triée.
 * Utilisé par le route analyze quand client_pa_shortlist est fourni.
 */
export function buildShortlistEntries(
  answers: Partial<DiscoveryAnswers>,
  sortedPAs: PAInContext[],
  featuresCatalog: FeatureCatalogItem[]
): (ShortlistEntry & { pa_source: PASource })[] {
  return sortedPAs.map((pa, idx) => {
    const { score, maxScore } = scorePA(answers, pa, featuresCatalog);
    const coverage_score = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    return {
      pa_id:            pa.id,
      pa_name:          pa.name,
      rank:             idx + 1,
      coverage_score,
      strengths:        buildStrengths(pa, featuresCatalog),
      gaps:             buildGaps(pa, featuresCatalog),
      unknown_features: buildUnknownFeatures(pa, featuresCatalog),
      pa_source:        pa.pa_source,
    };
  });
}

/** Semaines disponibles avant la deadline client */
export function getWeeksUntilDeadline(
  deadline: DiscoveryAnswers['deadline'] | undefined
): number | null {
  if (!deadline) return null;
  const map: Record<string, number> = {
    '<3mois':   12,
    '3-6mois':  26,
    '6-12mois': 52,
    '>12mois':  104,
  };
  return map[deadline] ?? null;
}
