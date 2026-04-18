'use client';

import { useState } from 'react';
import type { ClientProfile } from '@/lib/types';

interface ClientProfileCardProps {
  profile: ClientProfile;
  loading?: boolean;
  llmUnavailable?: boolean;
  llmMessage?: string;
  companyName?: string;
  onConfirm: () => void;
  onSkip: () => void;
  onFieldUpdate: (field: keyof ClientProfile, value: unknown) => void;
  onProfileUpdate?: (partial: Partial<ClientProfile>) => void;
}

function ConfirmBadge({ fields, all }: { fields: string[]; all: string[] }) {
  if (fields.length === 0 || all.length === 0) return null;
  return (
    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
      À confirmer
    </span>
  );
}

function DataRow({ label, value, toConfirm }: { label: string; value: string | null; toConfirm: boolean }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="py-1.5 pr-3 text-xs text-slate-500 whitespace-nowrap">{label}</td>
      <td className="py-1.5 text-sm font-medium text-slate-900">
        {value ?? <span className="italic text-slate-400">Non trouvé</span>}
        {toConfirm && <ConfirmBadge fields={[label]} all={[label]} />}
      </td>
    </tr>
  );
}

export function ClientProfileCard({
  profile,
  loading = false,
  llmUnavailable = false,
  llmMessage,
  companyName,
  onConfirm,
  onSkip,
  onProfileUpdate,
}: ClientProfileCardProps) {
  const [pappersLoading, setPappersLoading] = useState(false);
  const [pappersMessage, setPappersMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePappersSearch = async () => {
    if (!companyName || !onProfileUpdate) return;
    setPappersLoading(true);
    setPappersMessage(null);
    try {
      const res = await fetch(`/api/enrich-pappers?q=${encodeURIComponent(companyName)}`);
      const data = await res.json() as { found: boolean; profile?: Partial<ClientProfile>; message?: string; error?: string };
      if (data.found && data.profile) {
        onProfileUpdate(data.profile);
        setPappersMessage({ type: 'success', text: 'Profil enrichi depuis Pappers.fr' });
      } else {
        setPappersMessage({ type: 'error', text: data.message ?? 'Entreprise non trouvée sur Pappers' });
      }
    } catch {
      setPappersMessage({ type: 'error', text: 'Erreur réseau Pappers' });
    } finally {
      setPappersLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mt-4">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          Enrichissement du profil client en cours…
        </div>
      </div>
    );
  }

  const fieldsToConfirm = new Set(profile.fields_to_confirm);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm mt-4 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Profil client enrichi
          </h3>
          {llmUnavailable && (
            <p className="text-xs text-amber-600 mt-0.5">
              ⚠️ {llmMessage ?? 'Enrichissement automatique indisponible'}
            </p>
          )}
          {!llmUnavailable && profile.confidence_score > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              Confiance : {profile.confidence_score}% · Sources : {profile.data_sources.join(', ')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {fieldsToConfirm.size > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              {fieldsToConfirm.size} champs à confirmer
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">

        {/* Bannière hallucination */}
        {profile.hallucination_detected && (
          <div className="rounded-lg border border-orange-300 bg-orange-50 p-3">
            <p className="text-sm font-medium text-orange-800">
              ⚠️ Enrichissement automatique incertain pour &ldquo;{companyName ?? profile.legal_name}&rdquo;
            </p>
            <p className="mt-1 text-xs text-orange-700">
              Les données légales n'ont pas pu être confirmées automatiquement.
              Complétez les champs manuellement ou utilisez Pappers ci-dessous.
            </p>
          </div>
        )}

        {/* Bouton Pappers + feedback */}
        {companyName && onProfileUpdate && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePappersSearch}
              disabled={pappersLoading}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              {pappersLoading
                ? <><span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /> Recherche…</>
                : <>🔍 Enrichir depuis Pappers.fr</>
              }
            </button>
            {pappersMessage && (
              <span className={`text-xs ${pappersMessage.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                {pappersMessage.type === 'success' ? '✓' : '✗'} {pappersMessage.text}
              </span>
            )}
          </div>
        )}

        {/* Bloc 1 — Données légales */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Données légales
          </h4>
          <table className="w-full">
            <tbody>
              <DataRow label="Raison sociale" value={profile.legal_name} toConfirm={fieldsToConfirm.has('legal_name')} />
              <DataRow label="SIREN" value={profile.siren} toConfirm={fieldsToConfirm.has('siren')} />
              <DataRow label="Siège social" value={profile.headquarters} toConfirm={fieldsToConfirm.has('headquarters')} />
              <DataRow label="Code NAF" value={profile.naf_code ? `${profile.naf_code} — ${profile.naf_label ?? ''}` : null} toConfirm={fieldsToConfirm.has('naf_code')} />
              <DataRow label="Établissements" value={profile.num_establishments !== null ? `${profile.num_establishments}` : null} toConfirm={fieldsToConfirm.has('num_establishments')} />
            </tbody>
          </table>
        </div>

        {/* Bloc 2 — Obligations réglementaires */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Obligations réglementaires DGFiP
          </h4>
          <table className="w-full">
            <tbody>
              <DataRow
                label="Catégorie"
                value={
                  profile.regulatory_category
                    ? `${profile.regulatory_category} (${profile.regulatory_category_confidence === 'confirmed' ? 'confirmé' : profile.regulatory_category_confidence === 'estimated' ? 'estimé' : 'inconnu'})`
                    : null
                }
                toConfirm={fieldsToConfirm.has('regulatory_category')}
              />
              <DataRow label="Deadline émission" value={profile.emission_deadline} toConfirm={fieldsToConfirm.has('emission_deadline')} />
              <DataRow label="Deadline réception" value={profile.reception_deadline} toConfirm={fieldsToConfirm.has('reception_deadline')} />
            </tbody>
          </table>
        </div>

        {/* Bloc 3 — Spécificités sectorielles */}
        {(profile.typical_b2b_flows.length > 0 || profile.sector_specific_constraints.length > 0) && (
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Spécificités sectorielles
            </h4>
            {profile.typical_b2b_flows.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-slate-500 mb-1">Flux B2B typiques du secteur :</div>
                <div className="flex flex-wrap gap-1">
                  {profile.typical_b2b_flows.map((f) => (
                    <span key={f} className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs text-blue-700">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.sector_specific_constraints.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Contraintes sectorielles :</div>
                <ul className="space-y-0.5">
                  {profile.sector_specific_constraints.map((c) => (
                    <li key={c} className="text-xs text-slate-700 flex items-start gap-1">
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Valider et continuer →
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Ignorer et saisir manuellement
        </button>
      </div>
    </div>
  );
}
