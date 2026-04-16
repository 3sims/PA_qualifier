'use client';

import type { QuestionStep } from '@/lib/types';

interface StepIndicatorProps {
  steps: QuestionStep[];
  currentStep: number;
  onJump?: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onJump }: StepIndicatorProps) {
  return (
    <nav aria-label="Progression" className="mb-8">
      <ol className="flex items-center gap-2">
        {steps.map((step, idx) => {
          const done = step.id < currentStep;
          const active = step.id === currentStep;
          return (
            <li key={step.id} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => onJump?.(step.id)}
                disabled={!onJump || step.id > currentStep}
                className={[
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  active && 'bg-[#0A0A23] text-white',
                  done && 'bg-orange-500 text-white hover:bg-orange-600',
                  !active && !done && 'bg-slate-100 text-slate-500',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span
                  className={[
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                    active ? 'bg-orange-500 text-white' : done ? 'bg-white text-orange-600' : 'bg-slate-300 text-white',
                  ].join(' ')}
                >
                  {done ? '✓' : step.id}
                </span>
                <span className="hidden sm:inline">{step.title}</span>
              </button>
              {idx < steps.length - 1 && <div className="h-[2px] flex-1 bg-slate-200" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
