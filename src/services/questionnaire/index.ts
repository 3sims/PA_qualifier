/**
 * services/questionnaire/index.ts
 *
 * Logique métier du questionnaire PA : validation, progression, étape courante.
 * Stateless et pur.
 *
 * FAILURE MODES :
 *   - Answers vides → progression = 0, aucune étape valide
 *   - Question inconnue → ignorée (pas d'erreur)
 */

import type {
  DiscoveryAnswers,
  Question,
  QuestionnaireConfig,
} from '@/lib/types';
import { QUESTIONNAIRE_CONFIG } from '@/lib/questions.config';
import { ERP_TOP30 } from '@/lib/questions.config';

// ---------------------------------------------------------------------------
// GETTERS
// ---------------------------------------------------------------------------

export function getConfig(): QuestionnaireConfig {
  return QUESTIONNAIRE_CONFIG;
}

export function getQuestionsForStep(step: number): Question[] {
  return QUESTIONNAIRE_CONFIG.questions.filter((q) => q.step === step);
}

export function getTotalQuestions(): number {
  return QUESTIONNAIRE_CONFIG.questions.length;
}

// ---------------------------------------------------------------------------
// ERP tier lookup — auto-fill
// ---------------------------------------------------------------------------

export function getErpTier(erpId: string): DiscoveryAnswers['erp_tier'] | null {
  const match = ERP_TOP30.find((e) => e.value === erpId);
  return match ? (match.tier as DiscoveryAnswers['erp_tier']) : null;
}

// ---------------------------------------------------------------------------
// VALIDATION
// ---------------------------------------------------------------------------

export function isAnswerValid(q: Question, value: unknown): boolean {
  if (!q.required) return true;
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/**
 * Valide toutes les questions d'une étape.
 * Retourne { ok, errors: {questionId: message} }.
 */
export function validateStep(
  step: number,
  answers: Partial<DiscoveryAnswers>
): { ok: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const questions = getQuestionsForStep(step);

  for (const q of questions) {
    const value = answers[q.id as keyof DiscoveryAnswers];
    if (!isAnswerValid(q, value)) {
      errors[q.id] = 'Ce champ est requis.';
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

// ---------------------------------------------------------------------------
// PROGRESSION
// ---------------------------------------------------------------------------

/**
 * Nombre de questions requises répondues sur le total (tous steps confondus).
 */
export function calculateProgress(answers: Partial<DiscoveryAnswers>): {
  answered: number;
  total: number;
  percentage: number;
} {
  const all = QUESTIONNAIRE_CONFIG.questions;
  const answered = all.filter((q) => isAnswerValid(q, answers[q.id as keyof DiscoveryAnswers])).length;
  const total = all.length;
  return {
    answered,
    total,
    percentage: total === 0 ? 0 : Math.round((answered / total) * 100),
  };
}

/**
 * Retourne true si assez de questions sont répondues pour lancer l'analyse (≥ 20).
 */
export function canAnalyze(answers: Partial<DiscoveryAnswers>): boolean {
  return calculateProgress(answers).answered >= 20;
}
