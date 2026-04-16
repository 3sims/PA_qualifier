'use client';

import type { ComplexityBand } from '@/lib/types';
import { LEAD_TIME_SCENARIO_LABELS } from '@/lib/lead-time';

interface ComplexityScoreProps {
  score: number;
  band: ComplexityBand;
  leadTimeMin: number;
  leadTimeMax: number;
  deadline?: string;
  deadlineWeeks?: number | null;
  scenario?: 'native' | 'api' | 'custom';
}

const BAND_COLORS: Record<ComplexityBand, { stroke: string; bg: string; label: string }> = {
  simple: { stroke: '#16A34A', bg: 'bg-green-50 text-green-800', label: 'Simple' },
  moderate: { stroke: '#EAB308', bg: 'bg-yellow-50 text-yellow-800', label: 'Modérée' },
  high: { stroke: '#F97316', bg: 'bg-orange-50 text-orange-800', label: 'Élevée' },
  critical: { stroke: '#DC2626', bg: 'bg-red-50 text-red-800', label: 'Critique' },
};

export function ComplexityScore({
  score,
  band,
  leadTimeMin,
  leadTimeMax,
  deadlineWeeks,
  scenario,
}: ComplexityScoreProps) {
  const colors = BAND_COLORS[band];
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  const deadlineWarning =
    deadlineWeeks !== null && deadlineWeeks !== undefined && deadlineWeeks < leadTimeMax;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="12"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={colors.stroke}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
            <text
              x="70"
              y="68"
              textAnchor="middle"
              className="fill-slate-900 font-bold"
              fontSize="30"
            >
              {score}
            </text>
            <text
              x="70"
              y="88"
              textAnchor="middle"
              className="fill-slate-400"
              fontSize="11"
            >
              / 100
            </text>
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Complexité de la mission
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${colors.bg}`}
            >
              {colors.label}
            </span>
          </div>
          <div className="mt-4 text-sm text-slate-700">
            <span className="font-semibold">Lead time estimé :</span>{' '}
            <span className="text-slate-900">
              {leadTimeMin} à {leadTimeMax} semaines
            </span>
          </div>
          {scenario && (
            <div className="mt-1 text-xs text-slate-500">
              Scénario : {LEAD_TIME_SCENARIO_LABELS[scenario]}
            </div>
          )}
          {deadlineWarning && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              ⚠ La deadline cible ({deadlineWeeks} semaines) est inférieure au lead time maximum
              estimé. Le projet risque un glissement ou nécessite un périmètre réduit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
