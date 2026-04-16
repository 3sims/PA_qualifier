'use client';

import { useState } from 'react';
import type { CustomUseCase } from '@/lib/types';

interface AddCustomUseCaseFormProps {
  onAdd: (uc: CustomUseCase) => void;
}

export function AddCustomUseCaseForm({ onAdd }: AddCustomUseCaseFormProps) {
  const [label, setLabel]           = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen]         = useState(false);

  const handleSubmit = () => {
    if (!label.trim()) return;
    onAdd({
      id:               `custom_${Date.now()}`,
      category:         'custom',
      label:            label.trim(),
      description:      description.trim() || undefined,
      requires_coverage: [],
    });
    setLabel('');
    setDescription('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
      >
        <span className="text-base leading-none">＋</span>
        Ajouter un cas d'usage spécifique
      </button>
    );
  }

  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 mt-2">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-700">
            Nom du cas d'usage <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex : Facturation inter-sociétés groupe"
            className="w-full mt-1 text-sm border border-slate-300 rounded px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700">
            Description <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez le cas d'usage en 1 phrase"
            className="w-full mt-1 text-sm border border-slate-300 rounded px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!label.trim()}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-40 hover:bg-blue-700"
          >
            Ajouter
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-sm text-slate-600 px-4 py-2 hover:text-slate-800"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
