'use client';

import { useState } from 'react';

interface DraftLivrablePanelProps {
  phase: 'p1_discovery' | 'p2_gap' | 'p3_rfi' | 'p4_scoring' | 'p5_risks' | 'p6_roadmap';
  phaseName: string;
  livrableName: string;
  /** Contenu validé (ou null si non encore généré) */
  content: string | null;
  /** Callback quand le consultant valide/modifie le livrable */
  onValidate: (content: string) => void;
  /** Callback pour régénérer via LLM */
  onRegenerate: () => Promise<void>;
  loading?: boolean;
  /** Message d'erreur à afficher si la génération a échoué */
  error?: string;
}

export function DraftLivrablePanel({
  phase: _phase,
  phaseName,
  livrableName,
  content,
  onValidate,
  onRegenerate,
  loading = false,
  error,
}: DraftLivrablePanelProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content ?? '');
  const [validated, setValidated] = useState(!!content);

  const handleEdit = () => {
    setEditValue(content ?? '');
    setEditing(true);
    setValidated(false);
  };

  const handleSave = () => {
    onValidate(editValue);
    setEditing(false);
    setValidated(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditValue(content ?? '');
  };

  const handleRegenerate = async () => {
    setValidated(false);
    setEditing(false);
    await onRegenerate();
  };

  return (
    <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50/50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-orange-200">
        <div className="flex items-center gap-2">
          <span className="text-base">📄</span>
          <div>
            <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
              Draft — {phaseName}
            </div>
            <div className="text-sm font-bold text-slate-800">{livrableName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {validated ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
              ✓ Validé
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              À valider par le consultant
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            ⚠️ Échec de génération : {error}
          </div>
        )}

        {!content && !loading && (
          <div className="py-6 text-center text-sm text-slate-500">
            <p className="mb-3">{error ? 'La génération a échoué. Réessayez.' : 'Le livrable n\'a pas encore été généré.'}</p>
            <button
              type="button"
              onClick={handleRegenerate}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              {error ? '🔄 Réessayer' : '✨ Générer le draft'}
            </button>
          </div>
        )}

        {loading && (
          <div className="py-6 text-center text-sm text-slate-500">
            <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mr-2" />
            Génération en cours…
          </div>
        )}

        {content && !editing && (
          <>
            <div className="prose prose-sm max-w-none text-slate-700">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {content}
              </pre>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-orange-100 pt-3">
              <button
                type="button"
                onClick={handleEdit}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                ✏️ Éditer
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={loading}
                className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-50"
              >
                🔄 Régénérer
              </button>
              {!validated && (
                <button
                  type="button"
                  onClick={() => { onValidate(content); setValidated(true); }}
                  className="ml-auto rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                >
                  ✓ Valider
                </button>
              )}
            </div>
          </>
        )}

        {editing && (
          <>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm font-mono focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              rows={12}
            />
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
              >
                ✓ Enregistrer et valider
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
