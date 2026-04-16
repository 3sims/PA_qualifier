'use client';

import type { ViewMode } from '@/lib/types';

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange('client')}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
          mode === 'client'
            ? 'bg-[#0A0A23] text-white'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        👤 Vue client
      </button>
      <button
        type="button"
        onClick={() => onChange('consultant')}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
          mode === 'consultant'
            ? 'bg-orange-500 text-white'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        🔧 Vue consultant
      </button>
    </div>
  );
}
