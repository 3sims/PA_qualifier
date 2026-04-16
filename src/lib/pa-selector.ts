/**
 * lib/pa-selector.ts
 *
 * Construction de la liste de PA pour une session (union client + app).
 * Stateless, pur. Aucun import React.
 */

import type { PAProfile, PAInContext, PASource } from './types';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildUnknownCoverage(): PAProfile['coverage'] {
  return {
    emission:                '?',
    emission_confidence:     'unverified',
    reception:               '?',
    reception_confidence:    'unverified',
    avoirs:                  '?',
    avoirs_confidence:       'unverified',
    e_reporting:             '?',
    e_reporting_confidence:  'unverified',
    b2g_chorus:              '?',
    b2g_chorus_confidence:   'unverified',
    edi_edifact:             '?',
    edi_edifact_confidence:  'unverified',
    peppol:                  '?',
    peppol_confidence:       'unverified',
    archivage_10ans:         '?',
    archivage_10ans_confidence: 'unverified',
    iso27001:                '?',
    iso27001_confidence:     'unverified',
    api_rest:                '?',
    api_rest_confidence:     'unverified',
    support_fr:              '?',
    support_fr_confidence:   'unverified',
  };
}

function createMinimalPAProfile(name: string, source: PASource): PAInContext {
  return {
    id: slugify(name),
    name,
    status: 'unknown',
    data_hosting: 'FRANCE',
    lead_time_weeks_min: null,
    lead_time_weeks_max: null,
    erp_integrations: [],
    coverage: buildUnknownCoverage(),
    last_updated: null,
    pa_source: source,
  };
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Construit la liste PA combinant :
 *  - les PA recommandées par l'app (appRecommended)
 *  - les PA saisies par le client (clientShortlist)
 *
 * Ordre de tri : 'both' → 'client' → 'app'
 * Une PA cliente inconnue du seed → entrée minimale tout à '?'
 */
export function buildPAContext(
  allPAs: PAProfile[],
  appRecommended: PAProfile[],
  clientShortlist: string[]
): PAInContext[] {
  const appIds = new Set(appRecommended.map((p) => p.id));

  // PA clientes
  const clientPAs: PAInContext[] = clientShortlist.map((name) => {
    const found = allPAs.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (found) {
      const source: PASource = appIds.has(found.id) ? 'both' : 'client';
      return { ...found, pa_source: source };
    }
    // PA inconnue du seed → entrée minimale — JAMAIS éliminée automatiquement
    return createMinimalPAProfile(name, 'client');
  });

  // PA app non déjà dans la liste client
  const appOnlyPAs: PAInContext[] = appRecommended
    .filter(
      (p) =>
        !clientShortlist.some(
          (name) => name.toLowerCase() === p.name.toLowerCase()
        )
    )
    .map((p) => ({ ...p, pa_source: 'app' as PASource }));

  // Tri : both → client → app
  const order: Record<PASource, number> = { both: 0, client: 1, app: 2 };
  return [...clientPAs, ...appOnlyPAs].sort(
    (a, b) => order[a.pa_source] - order[b.pa_source]
  );
}

/**
 * Sélectionne les PA pertinentes depuis le catalogue selon le profil client.
 * Utilisée pour la recommandation "app".
 */
export function selectRelevantPAs(
  allPAs: PAProfile[],
  answers: {
    erp_main?: string;
    erp_tier?: string;
    data_hosting?: string;
    has_b2g?: string;
    certifications?: string[];
  }
): PAProfile[] {
  return allPAs
    .filter((pa) => pa.status !== 'radiée')
    .filter((pa) => {
      // Hébergement
      if (answers.data_hosting === 'FRANCE' && pa.data_hosting !== 'FRANCE') return false;
      if (answers.data_hosting === 'EU' && pa.data_hosting === 'INTL') return false;
      return true;
    });
}

/**
 * Détermine si une PA doit être marquée "données insuffisantes pour RFI".
 */
export function needsRFI(pa: PAInContext): boolean {
  if (pa.status === 'unknown') return true;
  const unknownCount = Object.entries(pa.coverage).filter(
    ([key, val]) => !key.endsWith('_confidence') && val === '?'
  ).length;
  return unknownCount >= 3;
}
