/**
 * app/api/enrich-pappers/route.ts
 *
 * GET /api/enrich-pappers?q=<company_name>
 * Enrichit le profil client depuis l'API Pappers.fr (SIRENE + INPI + Bodacc).
 *
 * Variables requises : PAPPERS_API_KEY dans .env.local
 * Clé gratuite : app.pappers.fr → API → Créer une clé (1 000 appels/mois)
 *
 * FAILURE MODES :
 *   400 : paramètre q manquant
 *   500 : PAPPERS_API_KEY manquant
 *   200 : toujours (found: false si entreprise non trouvée)
 */

import { NextRequest } from 'next/server';
import type { ClientProfile } from '@/lib/types';

const PAPPERS_BASE = 'https://api.pappers.fr/v2';

// ---------------------------------------------------------------------------
// Mapping Pappers → ClientProfile
// ---------------------------------------------------------------------------

type EffectifTranche =
  | '00' | 'NN' | '10' | '11' | '12'
  | '21' | '22' | '31' | '32'
  | '41' | '42' | '51' | '52' | '53';

function mapEffectifToCategory(tranche: string | null): {
  category: 'GE' | 'ETI' | 'PME' | 'TPE' | null;
  confidence: 'confirmed' | 'estimated' | 'unknown';
} {
  const mapping: Record<EffectifTranche, 'GE' | 'ETI' | 'PME' | 'TPE'> = {
    '53': 'GE', '52': 'GE', '51': 'ETI',
    '42': 'ETI', '41': 'ETI',
    '32': 'PME', '31': 'PME', '22': 'PME', '21': 'PME',
    '12': 'TPE', '11': 'TPE', '10': 'TPE', '00': 'TPE', 'NN': 'TPE',
  };
  if (!tranche) return { category: null, confidence: 'unknown' };
  const category = (mapping as Record<string, 'GE' | 'ETI' | 'PME' | 'TPE' | undefined>)[tranche] ?? null;
  return { category, confidence: category ? 'estimated' : 'unknown' };
}

function computeEmissionDeadline(category: 'GE' | 'ETI' | 'PME' | 'TPE' | null): string | null {
  if (category === 'GE' || category === 'ETI') return '2026-09-01';
  if (category === 'PME' || category === 'TPE') return '2027-09-01';
  return null;
}

function computePappersConfidence(data: Record<string, unknown>): number {
  let score = 0;
  if (data['siren']) score += 30;
  const siege = (data['siege'] ?? {}) as Record<string, unknown>;
  const ul = (data['unite_legale'] ?? {}) as Record<string, unknown>;
  if (siege['code_naf'] ?? ul['code_naf']) score += 20;
  if (siege['adresse_ligne_1']) score += 20;
  if (ul['tranche_effectif_salarie']) score += 15;
  if (ul['date_creation']) score += 15;
  return Math.min(score, 100);
}

function computeFieldsToConfirm(data: Record<string, unknown>): string[] {
  const fields: string[] = [];
  const ul = (data['unite_legale'] ?? {}) as Record<string, unknown>;
  const siege = (data['siege'] ?? {}) as Record<string, unknown>;
  if (!ul['tranche_effectif_salarie']) fields.push('regulatory_category');
  if (!(siege['code_naf'] ?? ul['code_naf'])) fields.push('naf_code');
  if (!siege['adresse_ligne_1']) fields.push('headquarters');
  return fields;
}

function mapPappersToClientProfile(
  data: Record<string, unknown>,
  inputName: string
): Partial<ClientProfile> {
  const ul = (data['unite_legale'] ?? {}) as Record<string, unknown>;
  const siege = (data['siege'] ?? {}) as Record<string, unknown>;

  const cat = mapEffectifToCategory(ul['tranche_effectif_salarie'] as string | null ?? null);

  const headquarters = siege['adresse_ligne_1']
    ? `${siege['adresse_ligne_1'] as string}, ${siege['code_postal'] as string ?? ''} ${siege['ville'] as string ?? ''}`.trim()
    : null;

  return {
    legal_name:                    (ul['denomination'] as string | null) ?? inputName,
    trade_name:                    (ul['sigle'] as string | null) ?? null,
    siren:                         (data['siren'] as string | null) ?? null,
    creation_date:                 (ul['date_creation'] as string | null) ?? null,
    capital:                       data['capital']
      ? `${(data['capital'] as number).toLocaleString('fr-FR')} €`
      : null,
    headquarters,
    naf_code:                      (siege['code_naf'] as string | null) ?? (ul['code_naf'] as string | null) ?? null,
    naf_label:                     (siege['libelle_code_naf'] as string | null) ?? (ul['libelle_code_naf'] as string | null) ?? null,
    convention_collective:         null,
    num_establishments:            (data['nombre_etablissements_ouverts'] as number | null) ?? null,
    regulatory_category:           cat.category,
    regulatory_category_confidence: cat.confidence,
    emission_deadline:             computeEmissionDeadline(cat.category),
    reception_deadline:            '2026-09-01',
    enrichment_date:               new Date().toISOString(),
    data_sources:                  ['pappers.fr'],
    confidence_score:              computePappersConfidence(data),
    fields_to_confirm:             computeFieldsToConfirm(data),
    hallucination_detected:        false,
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query) {
    return Response.json({ error: 'Paramètre q requis' }, { status: 400 });
  }

  const apiKey = process.env.PAPPERS_API_KEY;
  if (!apiKey) {
    return Response.json(
      { found: false, error: 'PAPPERS_API_KEY non configuré dans .env.local' },
      { status: 500 }
    );
  }

  try {
    // Étape 1 — Recherche par nom
    const searchRes = await fetch(
      `${PAPPERS_BASE}/recherche?q=${encodeURIComponent(query)}&precision=approximative&api_token=${apiKey}`,
      { next: { revalidate: 3600 } }
    );

    if (!searchRes.ok) {
      return Response.json(
        { found: false, error: `Pappers search erreur ${searchRes.status}` },
        { status: 200 }
      );
    }

    const searchData = await searchRes.json() as { resultats?: Array<{ siren?: string }> };
    const firstResult = searchData.resultats?.[0];

    if (!firstResult?.siren) {
      return Response.json({ found: false, message: `Entreprise "${query}" non trouvée sur Pappers` });
    }

    // Étape 2 — Détail par SIREN
    const detailRes = await fetch(
      `${PAPPERS_BASE}/entreprise?siren=${firstResult.siren}&api_token=${apiKey}`,
      { next: { revalidate: 3600 } }
    );

    if (!detailRes.ok) {
      return Response.json(
        { found: false, error: `Pappers detail erreur ${detailRes.status}` },
        { status: 200 }
      );
    }

    const detail = await detailRes.json() as Record<string, unknown>;
    const profile = mapPappersToClientProfile(detail, query);

    return Response.json({ found: true, profile, source: 'pappers' });

  } catch (error) {
    console.error('[API/enrich-pappers] error:', error);
    return Response.json(
      { found: false, error: 'Erreur Pappers API' },
      { status: 500 }
    );
  }
}
