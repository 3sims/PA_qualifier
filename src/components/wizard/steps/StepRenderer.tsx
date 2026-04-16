'use client';

import type { DiscoveryAnswers } from '@/lib/types';
import { getQuestionsForStep } from '@/services/questionnaire';
import { QuestionField } from '../QuestionField';

interface StepRendererProps {
  step: 1 | 2 | 3 | 4 | 5;
  answers: Partial<DiscoveryAnswers>;
  errors: Record<string, string>;
  onChange: (questionId: keyof DiscoveryAnswers, value: unknown) => void;
}

export function StepRenderer({ step, answers, errors, onChange }: StepRendererProps) {
  const questions = getQuestionsForStep(step);
  return (
    <div>
      {questions.map((q) => (
        <QuestionField
          key={q.id}
          question={q}
          value={answers[q.id as keyof DiscoveryAnswers]}
          onChange={(v) => onChange(q.id as keyof DiscoveryAnswers, v)}
          error={errors[q.id]}
        />
      ))}
    </div>
  );
}
