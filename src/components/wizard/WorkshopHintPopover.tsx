'use client';

import { useState } from 'react';
import { getHintsForField } from '@/lib/workshop-hints';

interface WorkshopHintPopoverProps {
  fieldId: string;
  /** N'affiche le bouton que si viewMode = 'consultant' */
  visible?: boolean;
}

export function WorkshopHintPopover({ fieldId, visible = true }: WorkshopHintPopoverProps) {
  const [open, setOpen] = useState(false);
  const hints = getHintsForField(fieldId);

  if (!visible || hints.length === 0) return null;

  return (
    <div className="relative inline-block ml-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-slate-500 hover:text-orange-600 underline underline-offset-2 transition-colors"
        aria-expanded={open}
      >
        💬 Questions à poser
      </button>
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* Popover */}
          <div className="absolute left-0 top-6 z-20 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Questions à poser en atelier
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {hints.map((hint, i) => (
                <div key={i} className="border-t border-slate-100 pt-2 first:border-t-0 first:pt-0">
                  <p className="text-sm font-medium text-slate-800 mb-0.5">
                    {hint.question}
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="font-medium text-orange-600">Objectif :</span>{' '}
                    {hint.objectif}
                  </p>
                  {hint.formulation_example && (
                    <p className="mt-1 text-xs italic text-slate-400">
                      Ex : "{hint.formulation_example}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
