'use client';

interface Jalon {
  id: string;
  label: string;
  semaine_relative: number;
  statut: 'ok' | 'tight' | 'impossible';
  description: string;
}

interface ProjectTimelineProps {
  jalons: Jalon[];
  alerte_chemin_critique?: string | null;
  leadTimeMin: number;
  leadTimeMax: number;
  deadlineWeeks?: number | null;
}

const STATUT_STYLES: Record<string, string> = {
  ok:         'bg-green-500',
  tight:      'bg-amber-500',
  impossible: 'bg-red-500',
};

const STATUT_TEXT: Record<string, string> = {
  ok:         'text-green-700',
  tight:      'text-amber-700',
  impossible: 'text-red-700',
};

const STATUT_BADGE: Record<string, string> = {
  ok:         'bg-green-50 border-green-200 text-green-700',
  tight:      'bg-amber-50 border-amber-200 text-amber-700',
  impossible: 'bg-red-50 border-red-200 text-red-700',
};

export function ProjectTimeline({
  jalons,
  alerte_chemin_critique,
  leadTimeMin,
  leadTimeMax,
  deadlineWeeks,
}: ProjectTimelineProps) {
  const hasCriticalIssue = jalons.some((j) => j.statut === 'impossible');
  const hasTight = jalons.some((j) => j.statut === 'tight');

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">Séquençage recommandé</h3>
        <div className="text-xs text-slate-500">
          Lead time estimé : {leadTimeMin}–{leadTimeMax} sem.
          {deadlineWeeks && ` · Deadline : ${deadlineWeeks} sem.`}
        </div>
      </div>

      {(alerte_chemin_critique || hasCriticalIssue) && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800">
          🔴 {alerte_chemin_critique ?? 'Go-live impossible dans les délais actuels — chemin critique sous tension'}
        </div>
      )}

      {!hasCriticalIssue && hasTight && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">
          ⚠️ Chemin critique sous tension — réduisez le délai de décision
        </div>
      )}

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-slate-200" />

        <div className="space-y-3">
          {jalons.map((jalon) => (
            <div key={jalon.id} className="flex items-start gap-3 pl-8 relative">
              {/* Dot */}
              <div
                className={`absolute left-2 top-1.5 h-3 w-3 rounded-full border-2 border-white ${STATUT_STYLES[jalon.statut]} -translate-x-1/2`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold ${STATUT_TEXT[jalon.statut]}`}>
                    {jalon.label}
                  </span>
                  {jalon.semaine_relative > 0 && (
                    <span className={`text-xs rounded border px-1.5 py-0.5 ${STATUT_BADGE[jalon.statut]}`}>
                      J+{jalon.semaine_relative} sem.
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{jalon.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" /> OK
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Sous tension
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> Impossible
        </span>
      </div>
    </div>
  );
}
