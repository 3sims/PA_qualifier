'use client';

import type { Question } from '@/lib/types';

interface QuestionFieldProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

export function QuestionField({ question, value, onChange, error }: QuestionFieldProps) {
  const labelId = `label-${question.id}`;

  return (
    <div className="mb-6">
      <label id={labelId} className="mb-1 block text-sm font-semibold text-slate-900">
        {question.label}
        {question.required && <span className="ml-1 text-orange-500">*</span>}
      </label>
      {question.description && (
        <p className="mb-3 text-xs text-slate-500">{question.description}</p>
      )}
      {renderInput(question, value, onChange)}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function renderInput(
  q: Question,
  value: unknown,
  onChange: (v: unknown) => void
): React.ReactNode {
  switch (q.type) {
    case 'radio':
      return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {q.options?.map((opt) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={[
                  'rounded-lg border p-3 text-left transition-colors',
                  selected
                    ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                ].join(' ')}
              >
                <div className="text-sm font-semibold text-slate-900">{opt.label}</div>
                {opt.description && (
                  <div className="mt-0.5 text-xs text-slate-500">{opt.description}</div>
                )}
              </button>
            );
          })}
        </div>
      );

    case 'select':
      return (
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="">— Sélectionner —</option>
          {q.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case 'multiselect': {
      const selected = (Array.isArray(value) ? value : []) as string[];
      const toggle = (v: string) => {
        if (selected.includes(v)) {
          onChange(selected.filter((x) => x !== v));
        } else {
          onChange([...selected, v]);
        }
      };
      return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {q.options?.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={[
                  'flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors',
                  checked
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.value)}
                  className="mt-0.5 h-4 w-4 accent-orange-500"
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">{opt.label}</div>
                  {opt.description && (
                    <div className="text-xs text-slate-500">{opt.description}</div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      );
    }

    case 'ranking': {
      const initial = q.options?.map((o) => o.value) ?? [];
      const current = (Array.isArray(value) && (value as string[]).length === initial.length
        ? (value as string[])
        : initial) as string[];

      const move = (from: number, to: number) => {
        if (to < 0 || to >= current.length) return;
        const next = [...current];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        onChange(next);
      };

      return (
        <ol className="space-y-2">
          {current.map((val, idx) => {
            const opt = q.options?.find((o) => o.value === val);
            if (!opt) return null;
            return (
              <li
                key={val}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">{opt.label}</div>
                  {opt.description && (
                    <div className="text-xs text-slate-500">{opt.description}</div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(idx, idx - 1)}
                    disabled={idx === 0}
                    className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-30"
                    aria-label="Monter"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, idx + 1)}
                    disabled={idx === current.length - 1}
                    className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-30"
                    aria-label="Descendre"
                  >
                    ↓
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      );
    }

    case 'text':
      return (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      );

    default:
      return null;
  }
}
