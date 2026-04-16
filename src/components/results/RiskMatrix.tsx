'use client';

import type { ClientSpecificRisk } from '@/lib/types';

interface RiskMatrixProps {
  risks: ClientSpecificRisk[];
  loading?: boolean;
}

const PROBABILITY_COLORS: Record<string, string> = {
  faible:   'bg-green-100 text-green-700',
  modérée:  'bg-amber-100 text-amber-700',
  élevée:   'bg-red-100 text-red-700',
};

const IMPACT_COLORS: Record<string, string> = {
  faible:   'bg-green-100 text-green-700',
  modéré:   'bg-amber-100 text-amber-700',
  critique: 'bg-red-100 text-red-700',
};

function RiskScoreCell({ score }: { score: number }) {
  const color =
    score >= 7 ? 'bg-red-500'
    : score >= 4 ? 'bg-amber-500'
    : 'bg-green-500';
  return (
    <div
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${color}`}
    >
      {score}
    </div>
  );
}

export function RiskMatrix({ risks, loading = false }: RiskMatrixProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-slate-900">Risques spécifiques</h3>
        <div className="py-6 text-center text-sm text-slate-400">
          <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mr-2" />
          Analyse en cours…
        </div>
      </div>
    );
  }

  if (risks.length === 0) return null;

  const sorted = [...risks].sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900">Risques spécifiques</h3>
        <p className="text-xs text-slate-500 mt-0.5">Score = probabilité × impact (1-9)</p>
      </div>

      <div className="divide-y divide-slate-100">
        {sorted.map((risk) => (
          <div key={risk.id} className="px-5 py-4">
            <div className="flex items-start gap-3">
              <RiskScoreCell score={risk.risk_score} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-slate-900">{risk.title}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${PROBABILITY_COLORS[risk.probability]}`}>
                    P: {risk.probability}
                  </span>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${IMPACT_COLORS[risk.impact]}`}>
                    I: {risk.impact}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{risk.description}</p>
                {risk.mitigation_actions.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-500 mb-1">Actions de mitigation :</div>
                    <ul className="space-y-0.5">
                      {risk.mitigation_actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                          <span className="text-orange-500 mt-0.5">→</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                  <span>Responsable : <span className="text-slate-600">{risk.mitigation_owner}</span></span>
                  <span>Échéance : <span className="text-slate-600">{risk.mitigation_deadline}</span></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
