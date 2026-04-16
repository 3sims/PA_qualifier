/**
 * lib/lead-time.ts
 *
 * Calcul du lead time d'intégration PA selon le profil technique.
 * Stateless, pur. Aucun import React.
 */

import type { ERPTier, LeadTimeEstimate } from './types';

/**
 * Calcule l'estimation de lead time basée sur les caractéristiques
 * d'intégration du client.
 */
export function calculateLeadTime(
  erp_tier: ERPTier | undefined,
  has_middleware: boolean,
  nb_siret: number,
  volume_mensuel_approx: number
): LeadTimeEstimate {
  let min: number;
  let max: number;
  let scenario: 'native' | 'api' | 'custom';
  let assumption: string;

  // Scénario de base selon ERP tier
  if (erp_tier === 'tier1' || erp_tier === 'tier2') {
    if (has_middleware) {
      // Connecteur natif via middleware existant
      min = 10;
      max = 16;
      scenario = 'native';
      assumption = 'Connecteur natif PA disponible pour cet ERP + middleware existant';
    } else {
      // Connecteur natif sans middleware
      min = 12;
      max = 20;
      scenario = 'native';
      assumption = 'Connecteur natif PA disponible pour cet ERP';
    }
  } else if (erp_tier === 'niche') {
    // Intégration API
    min = 16;
    max = 24;
    scenario = 'api';
    assumption = 'Intégration via API REST — connecteur natif non disponible';
  } else if (erp_tier === 'custom') {
    // Sur-mesure
    min = 20;
    max = 32;
    scenario = 'custom';
    assumption = 'ERP spécifique — développement d\'intégration sur-mesure requis';
  } else {
    // Aucun ERP (none) ou non renseigné
    min = 8;
    max = 16;
    scenario = 'api';
    assumption = 'Intégration directe PA sans ERP ou via portail';
  }

  // Facteurs majorants
  if (nb_siret > 5) {
    min += 2;
    max += 4;
  }
  if (nb_siret > 20) {
    min += 2;
    max += 4;
  }
  if (volume_mensuel_approx > 2000) {
    min += 2;
    max += 2;
  }

  return { min_weeks: min, max_weeks: max, scenario, assumption };
}

/**
 * Convertit le libellé de volume annuel en approximation mensuelle.
 */
export function volumeToMonthlyApprox(
  volumeAnnuel: string | undefined
): number {
  const map: Record<string, number> = {
    '<100':       8,
    '100-500':    40,
    '500-2000':   150,
    '2000-10000': 600,
    '>10000':     1000,
  };
  return map[volumeAnnuel ?? ''] ?? 0;
}

/**
 * Convertit nb_entities en nombre de SIRETs.
 */
export function entitiesToSiretCount(nbEntities: string | undefined): number {
  const map: Record<string, number> = {
    '1':   1,
    '2-5': 3,
    '6-20': 12,
    '20+': 25,
  };
  return map[nbEntities ?? ''] ?? 1;
}

/**
 * Libellés lisibles du scénario d'intégration.
 */
export const LEAD_TIME_SCENARIO_LABELS: Record<'native' | 'api' | 'custom', string> = {
  native: 'Connecteur natif',
  api:    'Intégration API',
  custom: 'Intégration sur-mesure',
};

/**
 * Retourne le nombre de semaines avant la deadline.
 * (Dupliqué de gap-analysis pour que ce module reste autonome)
 */
export function deadlineToAvailableWeeks(deadline: string | undefined): number | null {
  if (!deadline) return null;
  const map: Record<string, number> = {
    '<3mois':   12,
    '3-6mois':  26,
    '6-12mois': 52,
    '>12mois':  104,
  };
  return map[deadline] ?? null;
}

/**
 * Détermine si la deadline est réaliste par rapport au lead time estimé.
 */
export function isDeadlineReachable(
  deadlineWeeks: number | null,
  estimate: LeadTimeEstimate,
  bufferWeeks = 4
): 'ok' | 'tight' | 'impossible' {
  if (deadlineWeeks === null) return 'ok';
  if (deadlineWeeks < estimate.min_weeks) return 'impossible';
  if (deadlineWeeks < estimate.min_weeks + bufferWeeks) return 'tight';
  return 'ok';
}
