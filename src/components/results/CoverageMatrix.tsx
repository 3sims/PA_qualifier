'use client';

import type { ShortlistEntry, PAInContext, CoverageLevel, ViewMode } from '@/lib/types';

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  both:   { label: 'CLIENT + APP', cls: 'bg-green-100 text-green-700 border-green-200' },
  client: { label: 'CLIENT',       cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  app:    { label: 'APP',          cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const COVERAGE_DISPLAY: Record<CoverageLevel, { icon: string; cls: string }> = {
  '✓': { icon: '✓', cls: 'text-green-600 font-bold' },
  '~': { icon: '~', cls: 'text-amber-500 font-bold' },
  '?': { icon: '?', cls: 'text-slate-400' },
  '✗': { icon: '✗', cls: 'text-red-500 font-bold' },
};

interface CoverageMatrixProps {
  shortlist: ShortlistEntry[];
  /** PA étendues avec origine (optionnel — active le tri et les badges) */
  paInContext?: PAInContext[];
  /** PA éliminées à afficher dans la section séparée */
  eliminatedPAs?: (PAInContext & { eliminated_reason: string })[];
  viewMode?: ViewMode;
}

export function CoverageMatrix({
  shortlist,
  paInContext,
  eliminatedPAs,
  viewMode = 'client',
}: CoverageMatrixProps) {
  if (shortlist.length === 0) return null;

  // Map des PA avec leur source (si disponible)
  const sourceMap = new Map<string, PAInContext['pa_source']>(
    paInContext?.map((p) => [p.id, p.pa_source]) ?? []
  );

  // Trier la shortlist selon l'ordre both → client → app
  const sortOrder: Record<string, number> = { both: 0, client: 1, app: 2 };
  const sorted = [...shortlist].sort((a, b) => {
    const sa = sortOrder[sourceMap.get(a.pa_id) ?? 'app'] ?? 2;
    const sb = sortOrder[sourceMap.get(b.pa_id) ?? 'app'] ?? 2;
    return sa - sb;
  });

  const clientEliminated = eliminatedPAs?.filter(
    (p) => p.pa_source === 'client' || p.pa_source === 'both'
  );

  return (
    <div className="space-y-4">
      {/* Matrice principale */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Critère</th>
              {sorted.map((e) => {
                const source = sourceMap.get(e.pa_id);
                const badge = source ? SOURCE_BADGE[source] : null;
                return (
                  <th key={e.pa_id} className="px-4 py-3 text-center">
                    <div>{e.pa_name}</div>
                    {badge && (
                      <div className={`mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                        {badge.label}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td className="px-4 py-3 font-semibold text-slate-700">Couverture globale</td>
              {sorted.map((e) => (
                <td key={e.pa_id} className="px-4 py-3 text-center font-bold text-[#0A0A23]">
                  {e.coverage_score}%
                </td>
              ))}
            </tr>
            <tr className="border-t border-slate-100">
              <td className="px-4 py-3 font-semibold text-slate-700">Forces</td>
              {sorted.map((e) => (
                <td key={e.pa_id} className="px-4 py-3 text-center text-green-600">
                  {e.strengths.length > 0 ? `✓ ${e.strengths.length}` : '–'}
                </td>
              ))}
            </tr>
            <tr className="border-t border-slate-100">
              <td className="px-4 py-3 font-semibold text-slate-700">Gaps</td>
              {sorted.map((e) => (
                <td key={e.pa_id} className="px-4 py-3 text-center text-orange-500">
                  {e.gaps.length > 0 ? `~ ${e.gaps.length}` : '✓'}
                </td>
              ))}
            </tr>
            <tr className="border-t border-slate-100">
              <td className="px-4 py-3 font-semibold text-slate-700">À valider (RFI)</td>
              {sorted.map((e) => (
                <td key={e.pa_id} className="px-4 py-3 text-center text-slate-500">
                  {e.unknown_features.length > 0 ? `? ${e.unknown_features.length}` : '✓'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
          Légende :{' '}
          <span className="text-green-600">✓ Couvert</span> ·{' '}
          <span className="text-amber-500">~ Partiel</span> ·{' '}
          <span className="text-slate-500">? Inconnu</span> ·{' '}
          <span className="text-red-500">✗ Non couvert</span>
          {viewMode === 'consultant' && (
            <span className="ml-3 text-slate-400">
              · Données sources : indicatives sauf mention contraire
            </span>
          )}
        </div>
      </div>

      {/* Section PA clientes non retenues */}
      {clientEliminated && clientEliminated.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2 mb-3">
            <span className="text-lg">⚠️</span>
            <div>
              <div className="text-sm font-bold text-amber-900">
                PA identifiées par le client — Non retenues
              </div>
              <p className="text-xs text-amber-700 mt-0.5">
                Ces PA figuraient dans le benchmark client mais ont été écartées sur critères éliminatoires.
                Cette section est destinée à la présentation CODIR pour justifier les exclusions de manière objective.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {clientEliminated.map((pa) => (
              <div key={pa.id} className="flex items-start gap-2 rounded-lg bg-white border border-amber-200 px-3 py-2">
                <span className="text-red-500 font-bold text-sm mt-0.5">✗</span>
                <div>
                  <span className="text-sm font-semibold text-slate-800">{pa.name}</span>
                  <span className="ml-2 text-xs text-red-600">{pa.eliminated_reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PA app éliminées (mode consultant uniquement) */}
      {viewMode === 'consultant' && eliminatedPAs && eliminatedPAs.filter(
        (p) => p.pa_source === 'app'
      ).length > 0 && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-3">
          <div className="text-xs font-semibold text-red-700 mb-2">PA éliminées (app)</div>
          <div className="space-y-1">
            {eliminatedPAs
              .filter((p) => p.pa_source === 'app')
              .map((pa) => (
                <div key={pa.id} className="text-xs text-red-600">
                  <span className="font-medium">{pa.name}</span> : {pa.eliminated_reason}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
