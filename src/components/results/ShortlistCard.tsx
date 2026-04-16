'use client';

import type { ShortlistEntry, PASource } from '@/lib/types';

const SOURCE_BADGE: Record<PASource, { label: string; cls: string }> = {
  both:   { label: 'CLIENT + APP', cls: 'bg-green-100 text-green-700' },
  client: { label: 'CLIENT',       cls: 'bg-blue-100 text-blue-700' },
  app:    { label: 'APP',          cls: 'bg-slate-100 text-slate-600' },
};

interface ShortlistCardProps {
  entry: ShortlistEntry;
  paSource?: PASource;
  eliminatedReason?: string;
}

export function ShortlistCard({ entry, paSource, eliminatedReason }: ShortlistCardProps) {
  const badge = paSource ? SOURCE_BADGE[paSource] : null;

  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${eliminatedReason ? 'border-red-200 opacity-60' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-orange-500">#{entry.rank}</div>
            {badge && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                {badge.label}
              </span>
            )}
          </div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{entry.pa_name}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#0A0A23]">{entry.coverage_score}%</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">couverture</div>
        </div>
      </div>

      {eliminatedReason && (
        <div className="mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          ✗ {eliminatedReason}
        </div>
      )}

      {!eliminatedReason && (
        <>
          {entry.strengths.length > 0 && (
            <div className="mt-4">
              <div className="mb-1 text-xs font-semibold text-green-700">Forces</div>
              <ul className="space-y-1">
                {entry.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-600">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {entry.gaps.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-xs font-semibold text-orange-700">Gaps</div>
              <ul className="space-y-1">
                {entry.gaps.map((g) => (
                  <li key={g} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-orange-500">~</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {entry.unknown_features.length > 0 && (
            <div className="mt-3 rounded-md bg-slate-50 p-2">
              <div className="mb-1 text-xs font-semibold text-slate-500">À valider via RFI</div>
              <ul className="space-y-0.5">
                {entry.unknown_features.map((u) => (
                  <li key={u} className="text-xs text-slate-500">? {u}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
