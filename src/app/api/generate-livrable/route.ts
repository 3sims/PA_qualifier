/**
 * app/api/generate-livrable/route.ts
 *
 * POST /api/generate-livrable
 * Génère le draft d'un livrable (P1-P6) via LLM.
 *
 * FAILURE MODES :
 *   400 : phase invalide ou données manquantes
 *   200 : toujours (stub si LLM indisponible)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callLLM, LLMConfigError } from '@/services/llm';
import {
  LIVRABLE_SYSTEM_PROMPT,
  buildP1LiverablePrompt,
  buildP2LiverablePrompt,
  buildP3LiverablePrompt,
  buildP4LiverablePrompt,
  buildP5LiverablePrompt,
  buildP6LiverablePrompt,
} from '@/lib/prompts/generate-livrable';

const Schema = z.object({
  phase: z.enum([
    'p1_discovery',
    'p2_gap',
    'p3_rfi',
    'p4_scoring',
    'p5_risks',
    'p6_roadmap',
  ]),
  wizard_answers:   z.record(z.unknown()).optional(),
  client_name:      z.string().optional(),
  client_profile:   z.record(z.unknown()).optional(),
  shortlisted_pas:  z.array(z.string()).optional(),
  eliminated_pas:   z.array(z.object({ name: z.string(), reason: z.string() })).optional(),
  active_alerts:    z.array(z.object({ title: z.string(), message: z.string() })).optional(),
  context_supplement: z.string().optional(),
  lead_time_min:    z.number().optional(),
  lead_time_max:    z.number().optional(),
  complexity_band:  z.string().optional(),
  deadline:         z.string().optional(),
});

function stubLivrable(phase: string): string {
  const stubs: Record<string, string> = {
    p1_discovery: `# Cartographie des flux de facturation

> ⚠️ **Draft non généré** — LLM_API_KEY non configuré. Éditez ce texte manuellement.

## Tableau synthétique

| Dimension | Valeur |
|-----------|--------|
| Système source | À renseigner |
| Format actuel | À renseigner |
| Volume émis | À renseigner |
| Volume reçu | À renseigner |
| Taux exceptions | À renseigner |

## Description narrative

*À compléter par le consultant.*

## Points d'attention

- À identifier lors de l'atelier de découverte`,

    p2_gap: `# Matrice de couverture PA

> ⚠️ **Draft non généré** — LLM_API_KEY non configuré. Éditez ce texte manuellement.

*À compléter après la phase de Gap Analysis.*`,

    p3_rfi: `# Tableau RFI ciblé

> ⚠️ **Draft non généré** — LLM_API_KEY non configuré. Éditez ce texte manuellement.

*Questions contractualisables à adresser aux éditeurs PA shortlistés.*`,

    p4_scoring: `# Grille de scoring pondérée + Recommandation CODIR

> ⚠️ **Draft non généré** — LLM_API_KEY non configuré. Éditez ce texte manuellement.

*Grille de scoring et recommandation à compléter après l'analyse RFI.*`,

    p5_risks: `# Points de vigilance et risques spécifiques

> ⚠️ **Draft non généré** — LLM_API_KEY non configuré. Éditez ce texte manuellement.

*Pièges actifs et risques spécifiques à documenter.*`,

    p6_roadmap: `# Séquençage recommandé — De l'atelier au go-live

> ⚠️ **Draft non généré** — LLM_API_KEY non configuré. Éditez ce texte manuellement.

*Planning des jalons à compléter selon le lead time estimé.*`,
  };
  return stubs[phase] ?? `> ⚠️ Draft non généré pour la phase ${phase}.`;
}

function buildUserPrompt(
  phase: string,
  data: z.infer<typeof Schema>
): string {
  const answers = (data.wizard_answers ?? {}) as Record<string, unknown>;
  const profile = (data.client_profile ?? {}) as Record<string, unknown>;

  switch (phase) {
    case 'p1_discovery':
      return buildP1LiverablePrompt(answers, data.client_name);

    case 'p2_gap':
      return buildP2LiverablePrompt(
        answers,
        data.shortlisted_pas ?? [],
        data.eliminated_pas ?? []
      );

    case 'p3_rfi':
      return buildP3LiverablePrompt(
        data.client_name,
        answers,
        data.shortlisted_pas ?? [],
        profile
      );

    case 'p4_scoring':
      return buildP4LiverablePrompt(
        data.client_name,
        answers,
        data.shortlisted_pas ?? [],
        data.eliminated_pas ?? [],
        data.lead_time_min ?? 12,
        data.lead_time_max ?? 20,
        profile
      );

    case 'p5_risks':
      return buildP5LiverablePrompt(
        data.client_name,
        answers,
        data.active_alerts ?? [],
        data.context_supplement,
        profile
      );

    case 'p6_roadmap':
      return buildP6LiverablePrompt(
        data.client_name,
        data.deadline ?? '>12mois',
        data.lead_time_min ?? 12,
        data.lead_time_max ?? 20,
        data.complexity_band ?? 'moderate',
        answers.erp_main as string | undefined
      );

    default:
      return `Génère un livrable pour la phase ${phase}.`;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: unknown;
    try { body = await request.json(); } catch {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error }, { status: 400 });
    }

    const { phase } = parsed.data;
    const userPrompt = buildUserPrompt(phase, parsed.data);

    try {
      const content = await callLLM({
        system:      LIVRABLE_SYSTEM_PROMPT,
        user:        userPrompt,
        maxTokens:   2500,
        temperature: 0.3,
      });
      return NextResponse.json({ content, phase }, { status: 200 });
    } catch (llmErr) {
      if (llmErr instanceof LLMConfigError) {
        return NextResponse.json(
          { content: stubLivrable(phase), phase, llm_unavailable: true },
          { status: 200 }
        );
      }
      throw llmErr;
    }
  } catch (err) {
    console.error('[API/generate-livrable] error:', err);
    return NextResponse.json({ error: 'Erreur de génération' }, { status: 500 });
  }
}
