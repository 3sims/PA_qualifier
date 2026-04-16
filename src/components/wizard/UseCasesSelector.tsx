'use client';

import type { ClientProfile, DiscoveryAnswers, CustomUseCase } from '@/lib/types';
import {
  PREDEFINED_USE_CASES,
  USE_CASE_CATEGORY_LABELS,
  getAutoSelectedIds,
} from '@/lib/use-cases';
import { AddCustomUseCaseForm } from './AddCustomUseCaseForm';

interface UseCasesSelectorProps {
  profile: ClientProfile | null;
  answers: Partial<DiscoveryAnswers>;
  selectedIds: string[];
  customUseCases: CustomUseCase[];
  onChange: (id: string) => void;
  onAddCustom: (uc: CustomUseCase) => void;
  onRemoveCustom: (idx: number) => void;
}

const CATEGORY_ORDER: Array<'core' | 'complex' | 'technical' | 'regulatory' | 'custom'> = [
  'core',
  'complex',
  'technical',
  'regulatory',
  'custom',
];

export function UseCasesSelector({
  profile,
  answers,
  selectedIds,
  customUseCases,
  onChange,
  onAddCustom,
  onRemoveCustom,
}: UseCasesSelectorProps) {
  const autoIds = getAutoSelectedIds(profile, answers);

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Cochez tous les cas d'usage qui s'appliquent à votre organisation.</strong>
          <br />
          Les use cases sélectionnés sont évalués dans la Gap Analysis et pondèrent automatiquement la grille de scoring.
        </p>
        {autoIds.length > 0 && (
          <p className="mt-1.5 text-xs text-blue-600">
            {autoIds.length} use case(s) pré-sélectionné(s) selon votre profil.
          </p>
        )}
      </div>

      {/* Groupes par catégorie */}
      {CATEGORY_ORDER.map((cat) => {
        if (cat === 'custom') return null; // section custom en bas
        const items = PREDEFINED_USE_CASES.filter((uc) => uc.category === cat);
        if (items.length === 0) return null;

        return (
          <div key={cat}>
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              {USE_CASE_CATEGORY_LABELS[cat]}
              {cat === 'core' && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal normal-case tracking-normal">
                  Obligatoires
                </span>
              )}
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {items.map((uc) => {
                const isCore = uc.category === 'core';
                const isSelected = selectedIds.includes(uc.id);
                const isAutoDetected = autoIds.includes(uc.id);

                return (
                  <label
                    key={uc.id}
                    className={[
                      'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                      isCore
                        ? 'cursor-default border-slate-200 bg-slate-50'
                        : 'cursor-pointer',
                      !isCore && isSelected
                        ? 'border-blue-300 bg-blue-50'
                        : !isCore
                        ? 'border-slate-200 hover:border-blue-200'
                        : '',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => !isCore && onChange(uc.id)}
                      disabled={isCore}
                      className="mt-0.5 accent-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-sm font-medium ${isCore ? 'text-slate-500' : 'text-slate-800'}`}>
                          {uc.label}
                        </span>
                        {isAutoDetected && !isCore && (
                          <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                            Détecté
                          </span>
                        )}
                        {isCore && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                            Toujours actif
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{uc.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Use cases personnalisés */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          {USE_CASE_CATEGORY_LABELS['custom']}
        </h4>

        {customUseCases.map((uc, idx) => (
          <div key={uc.id} className="flex items-start gap-2 mb-2">
            <div className="flex-1 rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-sm font-medium text-slate-800">{uc.label}</div>
              {uc.description && (
                <p className="mt-0.5 text-xs text-slate-500">{uc.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onRemoveCustom(idx)}
              className="mt-1 text-slate-400 hover:text-red-500 text-sm px-1"
              title="Supprimer"
            >
              ✕
            </button>
          </div>
        ))}

        <AddCustomUseCaseForm onAdd={onAddCustom} />
      </div>

      {/* Résumé */}
      {selectedIds.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800">
            <strong>{selectedIds.length + customUseCases.length} use case(s) sélectionné(s)</strong> —
            La Gap Analysis évaluera ces critères sur chaque PA. Les pondérations de la grille de scoring seront ajustées en conséquence.
          </p>
        </div>
      )}
    </div>
  );
}
