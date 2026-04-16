/**
 * lib/rfi-priority.ts
 *
 * Priorisation des PA pour le tableau RFI ciblé.
 * Stateless, pur. Aucun import React.
 */

import type { PAInContext, PAV2Coverage, CoverageLevel } from './types';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function countUndocumentedItems(pa: PAInContext): number {
  let count = 0;
  for (const [key, val] of Object.entries(pa.coverage)) {
    if (key.endsWith('_confidence')) continue;
    if ((val as CoverageLevel) === '?') count++;
  }
  return count;
}

function getRFIPriorityScore(pa: PAInContext): number {
  let score = 0;
  // PA clientes prioritaires
  if (pa.pa_source === 'client') score += 10;
  if (pa.pa_source === 'both') score += 8;
  // Données insuffisantes = RFI obligatoire
  if (pa.status === 'unknown') score += 5;
  // Items non documentés dans la matrice
  score += countUndocumentedItems(pa);
  return score;
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Retourne les PA priorisées pour le RFI (max 5).
 * - PA clientes non éliminées en tête
 * - PA avec le plus de points '?' dans la matrice
 */
export function prioritizeForRFI(pas: PAInContext[]): PAInContext[] {
  return pas
    .filter((pa) => !pa.eliminated_reason)
    .sort((a, b) => getRFIPriorityScore(b) - getRFIPriorityScore(a))
    .slice(0, 5);
}

/**
 * Retourne les items '?' d'une PA (points à couvrir dans le RFI).
 */
export function getUndocumentedItems(pa: PAInContext): Array<{
  key: string;
  label: string;
}> {
  const LABEL_MAP: Partial<Record<keyof PAV2Coverage, string>> = {
    emission:       'Émission B2B conforme',
    reception:      'Réception B2B',
    avoirs:         'Gestion des avoirs',
    e_reporting:    'e-Reporting DGFiP',
    b2g_chorus:     'Connecteur Chorus Pro (B2G)',
    edi_edifact:    'Support EDI / EDIFACT',
    peppol:         'Access Point PEPPOL',
    archivage_10ans:'Archivage probant 10 ans',
    iso27001:       'ISO 27001',
    api_rest:       'API REST',
    support_fr:     'Support francophone',
  };

  const items: Array<{ key: string; label: string }> = [];
  for (const [key, val] of Object.entries(pa.coverage)) {
    if (key.endsWith('_confidence')) continue;
    if ((val as CoverageLevel) === '?') {
      items.push({
        key,
        label: LABEL_MAP[key as keyof PAV2Coverage] ?? key,
      });
    }
  }
  return items;
}
