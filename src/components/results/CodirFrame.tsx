'use client';

import { useState } from 'react';
import type { PAInContext, PAV2Coverage, CoverageLevel } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScoringCriterion {
  label: string;
  weight: number; // 0-100 (%)
  scores: Record<string, number>; // pa_id → score 0-10
}

export interface LeadTimeEstimationPA {
  pa_name: string;
  scenario: 'native' | 'api' | 'custom';
  min_weeks: number;
  max_weeks: number;
}

export interface CodirFrameProps {
  shortlistedPAs: PAInContext[];
  scoringCriteria?: ScoringCriterion[];
  leadTimeData?: LeadTimeEstimationPA[];
  contractClauses?: string[];
  livrableP4Content?: string | null;
  onGenerate?: () => void;
  isGenerating?: boolean;
  generateError?: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PA_COLORS = [
  '#2563EB', '#16A34A', '#EA580C', '#9333EA', '#0891B2',
] as const;

const COVERAGE_SYMBOL: Record<CoverageLevel, string> = {
  '✓': '✓', '~': '~', '?': '?', '✗': '✗',
};
const COVERAGE_COLOR: Record<CoverageLevel, string> = {
  '✓': 'text-green-700 bg-green-50',
  '~': 'text-amber-700 bg-amber-50',
  '?': 'text-slate-500 bg-slate-50',
  '✗': 'text-red-700 bg-red-50',
};

const SCENARIO_LABELS: Record<string, string> = {
  native: 'Connecteur natif',
  api:    'Intégration API',
  custom: 'Sur-mesure',
};

const FUNCTIONAL_FEATURES: Array<{ key: keyof PAV2Coverage; label: string; category: 'o2c' | 'p2p' | 'compliance' }> = [
  { key: 'emission',       label: 'Émission factures',        category: 'o2c' },
  { key: 'reception',      label: 'Réception factures',       category: 'p2p' },
  { key: 'avoirs',         label: 'Gestion avoirs',           category: 'o2c' },
  { key: 'e_reporting',    label: 'e-Reporting fiscal',       category: 'compliance' },
  { key: 'b2g_chorus',     label: 'B2G Chorus Pro',           category: 'compliance' },
  { key: 'edi_edifact',    label: 'EDI / EDIFACT',            category: 'p2p' },
  { key: 'peppol',         label: 'PEPPOL',                   category: 'p2p' },
  { key: 'archivage_10ans', label: 'Archivage 10 ans',        category: 'compliance' },
  { key: 'iso27001',       label: 'ISO 27001',                category: 'compliance' },
  { key: 'api_rest',       label: 'API REST ouverte',         category: 'o2c' },
  { key: 'support_fr',     label: 'Support France',           category: 'compliance' },
];

type TabId = 'scores' | 'fonctionnel' | 'technique' | 'conformite' | 'pricing' | 'risques';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'scores',      label: 'Scores globaux' },
  { id: 'fonctionnel', label: 'Fonctionnel' },
  { id: 'technique',   label: 'Technique' },
  { id: 'conformite',  label: 'Conformité' },
  { id: 'pricing',     label: 'Pricing & Lead time' },
  { id: 'risques',     label: 'Risques' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CoverageCell({ level }: { level: CoverageLevel | undefined }) {
  const l = level ?? '?';
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${COVERAGE_COLOR[l]}`}>
      {COVERAGE_SYMBOL[l]}
    </span>
  );
}

function PABadge({ pa, color }: { pa: PAInContext; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-xs font-semibold text-slate-800 truncate max-w-[80px]">{pa.name}</span>
      {pa.pa_source !== 'app' && (
        <span className="rounded-full bg-blue-100 px-1 py-0.5 text-[9px] font-bold text-blue-700 uppercase">
          {pa.pa_source === 'client' ? 'CLI' : 'CLI+APP'}
        </span>
      )}
    </div>
  );
}

function ScoreBar({ score, max = 10, color }: { score: number; max?: number; color: string }) {
  const pct = Math.min((score / max) * 100, 100);
  const textColor = score >= 7 ? 'text-green-700' : score >= 5 ? 'text-amber-700' : 'text-red-700';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className={`text-xs font-bold w-5 text-right ${textColor}`}>{score}</span>
    </div>
  );
}

// Radar chart — SVG natif (pas de dépendance externe)
function RadarChart({ pas, criteria, paColors }: {
  pas: PAInContext[];
  criteria: ScoringCriterion[];
  paColors: readonly string[];
}) {
  if (criteria.length === 0 || pas.length === 0) return null;
  const cx = 140; const cy = 140; const r = 100;
  const n = criteria.length;
  const angles = criteria.map((_, i) => (i * 2 * Math.PI) / n - Math.PI / 2);

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const gridPath = (level: number) => {
    return angles
      .map((a, i) => {
        const { x, y } = toXY(a, r * level);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ') + ' Z';
  };

  const paScore = (pa: PAInContext, criterionIdx: number) =>
    criteria[criterionIdx].scores[pa.id] ?? criteria[criterionIdx].scores[pa.name] ?? 0;

  const paPath = (pa: PAInContext) => {
    return angles
      .map((a, i) => {
        const score = paScore(pa, i);
        const { x, y } = toXY(a, (score / 10) * r);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ') + ' Z';
  };

  return (
    <svg width="280" height="280" className="mx-auto">
      {/* Grid */}
      {gridLevels.map((lv) => (
        <path key={lv} d={gridPath(lv)} fill="none" stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {/* Axes */}
      {angles.map((a, i) => {
        const { x, y } = toXY(a, r);
        const { x: lx, y: ly } = toXY(a, r + 18);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="#cbd5e1" strokeWidth="1" />
            <text x={lx.toFixed(1)} y={ly.toFixed(1)} textAnchor="middle" dominantBaseline="middle"
              fontSize="8" fill="#64748b" className="text-slate-500">
              {criteria[i].label.length > 12 ? criteria[i].label.slice(0, 12) + '…' : criteria[i].label}
            </text>
          </g>
        );
      })}
      {/* PA areas */}
      {pas.slice(0, 5).map((pa, i) => (
        <path key={pa.id} d={paPath(pa)}
          fill={paColors[i % paColors.length]}
          fillOpacity={0.12}
          stroke={paColors[i % paColors.length]}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tabs content
// ---------------------------------------------------------------------------

function TabScores({ pas, criteria, paColors, onGenerate, isGenerating, generateError }: {
  pas: PAInContext[];
  criteria: ScoringCriterion[];
  paColors: readonly string[];
  onGenerate?: () => void;
  isGenerating?: boolean;
  generateError?: string | null;
}) {
  // Try pa.id first (internal key), fall back to pa.name (LLM-generated key)
  const getScore = (c: ScoringCriterion, pa: PAInContext) =>
    c.scores[pa.id] ?? c.scores[pa.name] ?? 0;

  const weightedTotal = (pa: PAInContext) => {
    let total = 0;
    for (const c of criteria) {
      total += (getScore(c, pa) * c.weight) / 100;
    }
    return total;
  };

  const ranked = [...pas].sort((a, b) => weightedTotal(b) - weightedTotal(a));

  if (criteria.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center gap-4">
        <div className="text-sm text-slate-500 text-center max-w-xs">
          La grille de scoring CODIR n'a pas encore été générée.
          Cliquez sur le bouton pour l'alimenter automatiquement à partir de tous les livrables disponibles.
        </div>
        {generateError && (
          <p className="text-xs text-red-600 text-center max-w-xs">{generateError}</p>
        )}
        {onGenerate && (
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Génération en cours…
              </>
            ) : (
              'Générer la restitution CODIR'
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Radar */}
      <RadarChart pas={pas} criteria={criteria} paColors={paColors} />

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2 pr-3 text-left text-slate-500 font-medium w-40">Critère</th>
              <th className="py-2 pr-2 text-center text-slate-500 font-medium w-10">Poids</th>
              {ranked.map((pa, i) => (
                <th key={pa.id} className="py-2 px-2 text-center min-w-[80px]">
                  <PABadge pa={pa} color={paColors[i % paColors.length]} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteria.map((c) => (
              <tr key={c.label} className="border-b border-slate-100">
                <td className="py-1.5 pr-3 text-slate-700">{c.label}</td>
                <td className="py-1.5 pr-2 text-center text-slate-500">{c.weight}%</td>
                {ranked.map((pa, i) => (
                  <td key={pa.id} className="py-1.5 px-2">
                    <ScoreBar score={getScore(c, pa)} color={paColors[i % paColors.length]} />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t-2 border-slate-300 font-bold">
              <td className="py-2 pr-3 text-slate-900">Score pondéré</td>
              <td className="py-2 pr-2 text-center text-slate-500">100%</td>
              {ranked.map((pa, i) => {
                const total = weightedTotal(pa);
                return (
                  <td key={pa.id} className="py-2 px-2">
                    <span className={`text-sm font-bold ${total >= 7 ? 'text-green-700' : total >= 5 ? 'text-amber-700' : 'text-red-700'}`}>
                      {total.toFixed(1)}/10
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Podium */}
      {ranked.length >= 1 && (
        <div className="flex gap-3 justify-center flex-wrap">
          {ranked.slice(0, 3).map((pa, i) => {
            const medals = ['Recommandé', 'Alternative', 'À évaluer'];
            const colors = ['bg-green-50 border-green-300 text-green-800', 'bg-blue-50 border-blue-300 text-blue-800', 'bg-slate-50 border-slate-300 text-slate-700'];
            return (
              <div key={pa.id} className={`rounded-xl border px-4 py-3 text-center min-w-[100px] ${colors[i]}`}>
                <div className="text-lg font-bold">{['🥇', '🥈', '🥉'][i]}</div>
                <div className="text-sm font-bold mt-1">{pa.name}</div>
                <div className="text-xs mt-0.5">{medals[i]}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabCoverage({ pas, category, paColors }: {
  pas: PAInContext[];
  category: 'o2c' | 'p2p' | 'compliance';
  paColors: readonly string[];
}) {
  const features = FUNCTIONAL_FEATURES.filter((f) => f.category === category);
  const categoryLabels: Record<string, string> = {
    o2c: 'Émission O2C',
    p2p: 'Réception P2P',
    compliance: 'Conformité & Technique',
  };
  return (
    <div className="overflow-x-auto">
      <h4 className="text-sm font-semibold text-slate-700 mb-3">{categoryLabels[category]}</h4>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="py-2 pr-4 text-left text-slate-500 font-medium">Fonctionnalité</th>
            {pas.map((pa, i) => (
              <th key={pa.id} className="py-2 px-2 text-center">
                <PABadge pa={pa} color={paColors[i % paColors.length]} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((f) => (
            <tr key={f.key as string} className="border-b border-slate-100">
              <td className="py-1.5 pr-4 text-slate-700">{f.label}</td>
              {pas.map((pa) => (
                <td key={pa.id} className="py-1.5 px-2 text-center">
                  <CoverageCell level={pa.coverage?.[f.key as string] as CoverageLevel | undefined} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabPricing({ pas, leadTimeData, contractClauses, paColors }: {
  pas: PAInContext[];
  leadTimeData: LeadTimeEstimationPA[];
  contractClauses: string[];
  paColors: readonly string[];
}) {
  return (
    <div className="space-y-6">
      {/* Lead time par PA */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Lead time par scénario d'intégration</h4>
        {leadTimeData.length > 0 ? (
          <div className="space-y-2">
            {leadTimeData.map((lt, i) => {
              const color = paColors[i % paColors.length];
              const maxWeeks = 32;
              const minPct = (lt.min_weeks / maxWeeks) * 100;
              const maxPct = (lt.max_weeks / maxWeeks) * 100;
              return (
                <div key={lt.pa_name} className="flex items-center gap-3">
                  <span className="w-24 text-xs font-medium text-slate-700 truncate">{lt.pa_name}</span>
                  <div className="flex-1 relative h-5 bg-slate-100 rounded">
                    <div
                      className="absolute h-full rounded opacity-80"
                      style={{
                        left: `${minPct}%`,
                        width: `${maxPct - minPct}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span className="w-28 text-xs text-slate-600 whitespace-nowrap">
                    {lt.min_weeks}–{lt.max_weeks} sem. · {SCENARIO_LABELS[lt.scenario]}
                  </span>
                </div>
              );
            })}
            <div className="flex gap-4 mt-1 text-[10px] text-slate-400">
              {[0, 8, 16, 24, 32].map((w) => (
                <span key={w} style={{ marginLeft: w === 0 ? '7rem' : undefined }}>{w}s</span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Données disponibles après génération du livrable P4.</p>
        )}
      </div>

      {/* Lead time PA seed */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Lead time PA (données seed)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4 text-left text-slate-500">PA</th>
                <th className="py-2 px-2 text-center text-slate-500">Min (sem.)</th>
                <th className="py-2 px-2 text-center text-slate-500">Max (sem.)</th>
                <th className="py-2 px-2 text-center text-slate-500">Hébergement</th>
                <th className="py-2 px-2 text-center text-slate-500">Statut</th>
              </tr>
            </thead>
            <tbody>
              {pas.map((pa, i) => (
                <tr key={pa.id} className="border-b border-slate-100">
                  <td className="py-1.5 pr-4"><PABadge pa={pa} color={paColors[i % paColors.length]} /></td>
                  <td className="py-1.5 px-2 text-center">{pa.lead_time_weeks_min ?? '—'}</td>
                  <td className="py-1.5 px-2 text-center">{pa.lead_time_weeks_max ?? '—'}</td>
                  <td className="py-1.5 px-2 text-center">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${pa.data_hosting === 'FRANCE' ? 'bg-green-100 text-green-700' : pa.data_hosting === 'EU' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {pa.data_hosting}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${pa.status === 'immatriculée' ? 'bg-green-100 text-green-700' : pa.status === 'en_cours' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {pa.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clauses contractuelles */}
      {contractClauses.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Clauses contractuelles non négociables</h4>
          <ol className="space-y-1.5 list-decimal list-inside">
            {contractClauses.map((clause, i) => (
              <li key={i} className="text-xs text-slate-700">{clause}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function TabRisques({ pas, livrableP4Content }: {
  pas: PAInContext[];
  livrableP4Content?: string | null;
}) {
  // Statuts DGFiP immatriculation
  const immatStatus = pas.map((pa) => ({
    pa,
    label: pa.status === 'immatriculée'
      ? 'Immatriculée DGFiP'
      : pa.status === 'en_cours'
      ? 'En cours'
      : 'Statut inconnu',
    color: pa.status === 'immatriculée'
      ? 'bg-green-100 text-green-800 border-green-300'
      : pa.status === 'en_cours'
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : 'bg-slate-100 text-slate-600 border-slate-200',
  }));

  const pièges = [
    { id: 1, label: 'Connecteur ERP ambigu' },
    { id: 2, label: 'Complexité sous-estimée' },
    { id: 3, label: 'Données benchmark obsolètes' },
    { id: 4, label: 'Immatriculation incertaine' },
    { id: 5, label: 'Hébergement non qualifié' },
    { id: 6, label: 'Lead time sous-estimé' },
    { id: 7, label: 'Ressources internes absentes' },
  ];

  return (
    <div className="space-y-6">
      {/* Immatriculation */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Immatriculation DGFiP</h4>
        <div className="flex flex-wrap gap-2">
          {immatStatus.map(({ pa, label, color }) => (
            <div key={pa.id} className={`rounded-lg border px-3 py-2 text-xs ${color}`}>
              <div className="font-bold">{pa.name}</div>
              <div className="mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 7 Pièges — check rapide */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Les 7 Pièges — statut</h4>
        <p className="text-xs text-slate-500 mb-3">Consultez le livrable P5 pour la contextualisation détaillée.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {pièges.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-slate-400 text-sm font-bold">{p.id}</span>
              <span className="text-xs text-slate-700">{p.label}</span>
              <span className="ml-auto text-[10px] text-slate-400">→ voir P5</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommandation issue de P4 si disponible */}
      {livrableP4Content && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <h4 className="text-xs font-semibold text-blue-800 mb-1">Recommandation CODIR (extrait P4)</h4>
          <p className="text-xs text-blue-700 line-clamp-4">{livrableP4Content.slice(0, 400)}…</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CodirFrame({
  shortlistedPAs,
  scoringCriteria = [],
  leadTimeData = [],
  contractClauses = [],
  livrableP4Content,
  onGenerate,
  isGenerating,
  generateError,
}: CodirFrameProps) {
  const [activeTab, setActiveTab] = useState<TabId>('scores');

  if (shortlistedPAs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Aucune PA shortlistée à afficher dans la restitution CODIR.
      </div>
    );
  }

  const pas = shortlistedPAs.slice(0, 5);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-base font-bold text-slate-900">Restitution CODIR Interactive</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {pas.length} PA analysées · Données issues de la Gap Analysis et du Livrable P4
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex overflow-x-auto border-b border-slate-200 px-2 pt-2 gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex-shrink-0 rounded-t-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-white border border-b-white border-slate-200 -mb-px text-orange-600'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {activeTab === 'scores' && (
          <TabScores
            pas={pas}
            criteria={scoringCriteria}
            paColors={PA_COLORS}
            onGenerate={onGenerate}
            isGenerating={isGenerating}
            generateError={generateError}
          />
        )}
        {activeTab === 'fonctionnel' && (
          <div className="space-y-6">
            <TabCoverage pas={pas} category="o2c" paColors={PA_COLORS} />
            <TabCoverage pas={pas} category="p2p" paColors={PA_COLORS} />
          </div>
        )}
        {activeTab === 'technique' && (
          <TabCoverage pas={pas} category="compliance" paColors={PA_COLORS} />
        )}
        {activeTab === 'conformite' && (
          <div className="space-y-4">
            <TabCoverage pas={pas} category="compliance" paColors={PA_COLORS} />
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Hébergement des données</h4>
              <div className="flex flex-wrap gap-2">
                {pas.map((pa, i) => (
                  <div key={pa.id} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: PA_COLORS[i % PA_COLORS.length] }} />
                      <span className="font-semibold text-slate-800">{pa.name}</span>
                    </div>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${pa.data_hosting === 'FRANCE' ? 'bg-green-100 text-green-700' : pa.data_hosting === 'EU' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {pa.data_hosting}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'pricing' && (
          <TabPricing
            pas={pas}
            leadTimeData={leadTimeData}
            contractClauses={contractClauses}
            paColors={PA_COLORS}
          />
        )}
        {activeTab === 'risques' && (
          <TabRisques pas={pas} livrableP4Content={livrableP4Content} />
        )}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-flex w-5 h-5 rounded bg-green-50 items-center justify-center text-green-700 font-bold text-xs">✓</span> Couvert</span>
        <span className="flex items-center gap-1"><span className="inline-flex w-5 h-5 rounded bg-amber-50 items-center justify-center text-amber-700 font-bold text-xs">~</span> Partiel</span>
        <span className="flex items-center gap-1"><span className="inline-flex w-5 h-5 rounded bg-slate-50 items-center justify-center text-slate-500 font-bold text-xs">?</span> Inconnu</span>
        <span className="flex items-center gap-1"><span className="inline-flex w-5 h-5 rounded bg-red-50 items-center justify-center text-red-700 font-bold text-xs">✗</span> Non couvert</span>
        <span className="ml-auto"><span className="rounded-full bg-blue-100 px-1.5 py-0.5 font-bold text-blue-700 text-[9px]">CLI</span> PA identifiée par le client</span>
      </div>
    </div>
  );
}
