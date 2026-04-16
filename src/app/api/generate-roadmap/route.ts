/**
 * app/api/generate-roadmap/route.ts
 *
 * POST /api/generate-roadmap
 * Génère la roadmap projet séquencée via LLM.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callLLM, extractJSON, LLMConfigError } from '@/services/llm';
import { ROADMAP_SYSTEM_PROMPT, buildRoadmapPrompt } from '@/lib/prompts/generate-roadmap';

const Schema = z.object({
  deadline: z.string(),
  lead_time_min: z.number(),
  lead_time_max: z.number(),
  complexity_band: z.string(),
  client_name: z.string().optional(),
});

interface Jalon {
  id: string;
  label: string;
  semaine_relative: number;
  statut: 'ok' | 'tight' | 'impossible';
  description: string;
}

interface Roadmap {
  jalons: Jalon[];
  alerte_chemin_critique: string | null;
}

function buildDefaultRoadmap(leadTimeMin: number): Roadmap {
  return {
    jalons: [
      { id: 'atelier',     label: 'Atelier qualification des flux',           semaine_relative: 0,                statut: 'ok',  description: 'Atelier de découverte avec les équipes métier et IT' },
      { id: 'codir',       label: 'Décision CODIR',                           semaine_relative: 3,                statut: 'ok',  description: 'Présentation shortlist PA + validation budget' },
      { id: 'rfi_envoi',   label: 'Envoi RFI (3-5 PA)',                       semaine_relative: 5,                statut: 'ok',  description: 'RFI ciblé sur les points non documentés' },
      { id: 'rfi_analyse', label: 'Analyse RFI + scoring',                    semaine_relative: 8,                statut: 'ok',  description: 'Dépouillement, scoring pondéré, recommandation' },
      { id: 'signature',   label: 'Signature PA + lancement intégration',     semaine_relative: 10,               statut: 'ok',  description: 'Contractualisation + kick-off technique' },
      { id: 'integration', label: 'Intégration ERP',                          semaine_relative: 10 + leadTimeMin, statut: 'ok',  description: 'Développement connecteur + configuration PA' },
      { id: 'recette',     label: 'Recette utilisateur + formation',          semaine_relative: 10 + leadTimeMin + 3, statut: 'ok', description: 'Tests fonctionnels, formation équipes' },
      { id: 'pilote',      label: 'Pilote en production',                     semaine_relative: 10 + leadTimeMin + 6, statut: 'ok', description: 'Premier flux réels en production contrôlée' },
      { id: 'golive',      label: 'GO-LIVE OPÉRATIONNEL',                     semaine_relative: 10 + leadTimeMin + 8, statut: 'ok', description: 'Conformité réglementaire atteinte' },
    ],
    alerte_chemin_critique: null,
  };
}

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

    const { deadline, lead_time_min, lead_time_max, complexity_band, client_name } = parsed.data;

    try {
      const rawResponse = await callLLM({
        system:      ROADMAP_SYSTEM_PROMPT,
        user:        buildRoadmapPrompt(
          deadline,
          { min_weeks: lead_time_min, max_weeks: lead_time_max },
          complexity_band,
          client_name
        ),
        maxTokens:   2000,
        temperature: 0.2,
      });

      const roadmap = extractJSON<Roadmap>(rawResponse);
      return NextResponse.json({ roadmap }, { status: 200 });
    } catch (llmErr) {
      if (llmErr instanceof LLMConfigError) {
        return NextResponse.json(
          { roadmap: buildDefaultRoadmap(lead_time_min), llm_unavailable: true },
          { status: 200 }
        );
      }
      throw llmErr;
    }
  } catch (err) {
    console.error('[API/generate-roadmap] error:', err);
    return NextResponse.json({ error: 'Erreur de génération' }, { status: 500 });
  }
}
