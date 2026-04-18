/**
 * lib/dynamic-questions.ts
 *
 * Adapte le texte et la visibilité des questions NijiDiscoveryQuestion
 * selon le profil client enrichi et les réponses existantes.
 *
 * Module pur, stateless, sans dépendance React.
 */

import type { ClientProfile, DiscoveryAnswers } from './types';
import type { NijiDiscoveryQuestion } from './discovery-questions';

// ---------------------------------------------------------------------------
// SUBSTITUTIONS DE TEMPLATE
// ---------------------------------------------------------------------------

/**
 * Remplace les placeholders dans un template de question par les valeurs
 * du profil client et des réponses existantes.
 */
export function resolveTemplate(
  template: string,
  profile: ClientProfile | null,
  answers: Partial<DiscoveryAnswers>
): string {
  return template
    .replace(
      '[sector_label]',
      profile?.sector_label ?? profile?.naf_label ?? 'votre secteur'
    )
    .replace('[erp_main]', answers.erp_main ?? 'votre ERP')
    .replace('[erp_version]', answers.erp_version ?? 'version X')
    .replace(
      '[volume]',
      answers.volume_emis_mensuel != null
        ? `${answers.volume_emis_mensuel}`
        : answers.volume_emitted ?? 'votre volume'
    )
    .replace(
      '[nb_siret]',
      profile?.num_establishments != null
        ? `${profile.num_establishments}`
        : 'vos'
    )
    .replace('[scoring_weights_summary]', 'pondérations à définir en CODIR');
}

// ---------------------------------------------------------------------------
// ADAPTATION DYNAMIQUE
// ---------------------------------------------------------------------------

/**
 * Retourne le texte final de la question, adapté au profil et aux réponses.
 * Priorité :
 *  1. dynamic_question callback (surcharge complète)
 *  2. question_template avec substitutions
 *  3. question statique
 */
export function buildDynamicQuestion(
  question: NijiDiscoveryQuestion,
  profile: ClientProfile | null,
  answers: Partial<DiscoveryAnswers>
): string {
  // 1. dynamic_question surcharge complète
  if (question.dynamic_question) {
    const override = question.dynamic_question(profile);
    if (override) return override;
  }

  // 2. Template avec substitutions
  if (question.question_template) {
    return resolveTemplate(question.question_template, profile, answers);
  }

  // 3. Question statique
  return question.question;
}

/**
 * Retourne le hint dynamique pour une question, ou null s'il n'y en a pas.
 */
export function buildDynamicHint(
  question: NijiDiscoveryQuestion,
  profile: ClientProfile | null
): string | null {
  if (!question.dynamic_hint) return null;
  return question.dynamic_hint(profile);
}

// ---------------------------------------------------------------------------
// FILTRAGE DES QUESTIONS
// ---------------------------------------------------------------------------

/**
 * Filtre les questions à afficher selon le profil client et les réponses.
 * Les questions sans `show_if` sont toujours incluses.
 */
export function filterQuestionsForProfile(
  questions: NijiDiscoveryQuestion[],
  profile: ClientProfile | null,
  answers: Partial<DiscoveryAnswers>
): NijiDiscoveryQuestion[] {
  return questions.filter((q) => {
    if (!q.show_if) return true;
    return q.show_if(profile, answers);
  });
}

// ---------------------------------------------------------------------------
// EXTRACTION DEPUIS LE CONTEXTE CONSULTANT
// ---------------------------------------------------------------------------

/**
 * Patterns heuristiques pour détecter des réponses dans le contexte libre
 * du consultant. Retourne la valeur extraite ou null.
 */
const CONTEXT_PATTERNS: Partial<Record<keyof DiscoveryAnswers, RegExp>> = {
  erp_main:               /\b(sap|sage|cegid|dynamics|oracle|netsuite|divalto|ciel|pennylane|quadratus|ibiza)\b/i,
  has_b2g:                /\bchorus(?:\s*pro)?\b|\bsecteur public\b|\bcollectivit|\bfacturation\s*publique\b/i,
  deadline:               /\b(septembre|sept\.?)\s*202[67]\b|\b1er\s+sept/i,
  benchmark_last_updated: /\b([3-9]|[1-9]\d)\s*ans?\s*de\s*benchmark\b|\bbenchmark.*20(20|21|22|23)\b/i,
  has_avoirs:             /\bavoirs?\b|\bnotes?\s*de\s*crédit\b/i,
};

/**
 * Tente d'extraire une réponse à un champ donné depuis le contexte libre
 * du consultant. Retourne la valeur brute extraite, ou null si non trouvée.
 */
export function extractAnswerFromContext(
  field: keyof DiscoveryAnswers,
  contextSupplement: string
): string | null {
  if (!contextSupplement) return null;
  const pattern = CONTEXT_PATTERNS[field];
  if (!pattern) return null;
  const match = contextSupplement.match(pattern);
  return match ? match[0] : null;
}

/**
 * Retourne les questions Discovery Phase 1 adaptées au profil.
 * Inclut le nombre d'établissements dans la question multi-sites si disponible.
 */
export function getDiscoveryQuestionsForProfile(
  questions: NijiDiscoveryQuestion[],
  profile: ClientProfile | null,
  answers: Partial<DiscoveryAnswers>
): Array<NijiDiscoveryQuestion & { resolved_question: string; hint: string | null }> {
  return filterQuestionsForProfile(questions, profile, answers).map((q) => ({
    ...q,
    resolved_question: buildDynamicQuestion(q, profile, answers),
    hint: buildDynamicHint(q, profile),
  }));
}
