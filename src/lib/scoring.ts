/**
 * lib/scoring.ts
 *
 * Algorithme de scoring de complexité de mission et calcul de lead time.
 * Stateless, pur, aucun side effect. Testable unitairement.
 *
 * FAILURE MODES :
 *   - Réponses partielles : les facteurs manquants ne contribuent pas au score
 *   - Score max théorique ~185 → normalisé sur 100
 */

import type { DiscoveryAnswers, ComplexityBand } from './types';

/**
 * Calcule un score de complexité [0..100] à partir des réponses.
 * Pondérations ajustées pour refléter les leviers principaux :
 * multi-entités, international, volumes, ERP custom, deadline, ressources.
 */
export function calculateComplexityScore(answers: Partial<DiscoveryAnswers>): number {
  let score = 0;

  // Périmètre organisationnel
  if (answers.nb_entities === '2-5') score += 10;
  if (answers.nb_entities === '6-20') score += 15;
  if (answers.nb_entities === '20+') score += 20;

  if (answers.geography === 'EU') score += 10;
  if (answers.geography === 'INTL') score += 20;

  // Flux spéciaux
  if (answers.has_b2g === 'yes') score += 10;
  if (answers.has_autofactures === 'yes') score += 10;

  // Volumes
  if (answers.volume_received === '2000-10000') score += 10;
  if (answers.volume_received === '>10000') score += 15;

  if (answers.volume_emitted === '500-2000') score += 8;
  if (answers.volume_emitted === '>10000') score += 12;

  // ERP
  if (answers.erp_tier === 'custom') score += 20;
  if (answers.erp_tier === 'niche') score += 12;

  // Exceptions
  if (answers.exception_rate === '15-30%') score += 8;
  if (answers.exception_rate === '>30%') score += 12;

  // Exigences de sécurité / conformité
  if (
    answers.certifications?.includes('HDS') ||
    answers.certifications?.includes('SecNumCloud')
  ) {
    score += 15;
  }

  if (answers.archiving_probant === 'yes') score += 10;
  if (answers.deadline === '<3mois') score += 20;
  if (answers.internal_resources === 'none') score += 15;

  return Math.min(Math.round(score / 1.85), 100);
}

/**
 * Transforme un score numérique en bande qualitative.
 */
export function getComplexityBand(score: number): ComplexityBand {
  if (score <= 25) return 'simple';
  if (score <= 50) return 'moderate';
  if (score <= 75) return 'high';
  return 'critical';
}

/**
 * Convertit une deadline en semaines max disponibles (pire cas).
 * Utilisé pour détecter les incompatibilités deadline vs lead time.
 */
export function deadlineToWeeks(deadline: DiscoveryAnswers['deadline'] | undefined): number | null {
  if (!deadline) return null;
  const map: Record<DiscoveryAnswers['deadline'], number> = {
    '<3mois': 12,
    '3-6mois': 26,
    '6-12mois': 52,
    '>12mois': 104,
  };
  return map[deadline];
}
