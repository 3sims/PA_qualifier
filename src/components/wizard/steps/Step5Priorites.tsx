'use client';
import { StepRenderer } from './StepRenderer';
import type { DiscoveryAnswers } from '@/lib/types';

export function Step5Priorites(props: {
  answers: Partial<DiscoveryAnswers>;
  errors: Record<string, string>;
  onChange: (q: keyof DiscoveryAnswers, v: unknown) => void;
}) {
  return <StepRenderer step={5} {...props} />;
}
