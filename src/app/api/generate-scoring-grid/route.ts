/**
 * app/api/generate-scoring-grid/route.ts
 *
 * POST /api/generate-scoring-grid
 * Génère la grille de scoring pondérée adaptée au profil client.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callLLM, extractJSON, LLMConfigError } from '@/services/llm';
import { SCORING_GRID_SYSTEM_PROMPT, buildScoringGridPrompt } from '@/lib/prompts/scoring-grid';

const Schema = z.object({
  deadline_pressure: z.enum(['low', 'medium', 'high', 'critical']),
  erp_tier: z.string().optional(),
  data_sovereignty_required: z.boolean(),
  budget_constraint: z.enum(['none', 'moderate', 'strict']),
  has_b2g: z.boolean().optional(),
});

interface ScoringCritere {
  id: string;
  label: string;
  poids_pct: number;
  justification: string;
}

interface ScoringGrid {
  criteres: ScoringCritere[];
  note_consultant: string;
}

const DEFAULT_GRID: ScoringGrid = {
  criteres: [
    { id: 'erp_integration',   label: 'Connecteur ERP natif',              poids_pct: 20, justification: 'Critère clé pour réduire le lead time et les risques d\'intégration' },
    { id: 'functional_coverage', label: 'Couverture fonctionnelle',         poids_pct: 25, justification: 'Émission + réception + avoirs + e-reporting' },
    { id: 'lead_time',         label: 'Lead time contractuel',              poids_pct: 15, justification: 'Délai entre signature et premier flux en production' },
    { id: 'hosting',           label: 'Hébergement & souveraineté',         poids_pct: 10, justification: 'Localisation des données et sous-traitants' },
    { id: 'archiving',         label: 'Archivage probant',                  poids_pct: 10, justification: 'NF Z 42-013, 10 ans minimum' },
    { id: 'support',           label: 'Support francophone & SLA',          poids_pct: 10, justification: 'SLA contractuels, équipes FR, canal de support' },
    { id: 'maturity',          label: 'Maturité produit & références',      poids_pct:  5, justification: 'Nb clients en production, ancienneté' },
    { id: 'pricing',           label: 'Rapport qualité-prix',               poids_pct:  5, justification: 'TCO sur 3 ans (licence + mise en œuvre + run)' },
  ],
  note_consultant: 'Grille par défaut. Validez les pondérations avec le commanditaire avant l\'envoi du RFP.',
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    try {
      const rawResponse = await callLLM({
        system:      SCORING_GRID_SYSTEM_PROMPT,
        user:        buildScoringGridPrompt(parsed.data),
        maxTokens:   2000,
        temperature: 0.2,
      });

      const grid = extractJSON<ScoringGrid>(rawResponse);
      return NextResponse.json({ grid }, { status: 200 });
    } catch (llmErr) {
      if (llmErr instanceof LLMConfigError) {
        return NextResponse.json(
          { grid: DEFAULT_GRID, llm_unavailable: true },
          { status: 200 }
        );
      }
      throw llmErr;
    }
  } catch (err) {
    console.error('[API/generate-scoring-grid] error:', err);
    return NextResponse.json({ error: 'Erreur de génération' }, { status: 500 });
  }
}
