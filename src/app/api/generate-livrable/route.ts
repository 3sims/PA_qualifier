/**
 * app/api/generate-livrable/route.ts
 *
 * POST /api/generate-livrable
 * Génère le draft d'un livrable (P1-P6) via LLM.
 * Pipeline incrémental : chaque phase reçoit les livrables validés des phases précédentes.
 *
 * FAILURE MODES :
 *   400 : phase invalide ou données manquantes
 *   200 : toujours (stub si LLM indisponible)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callLLM, LLMConfigError, LLMAPIError } from '@/services/llm';
import {
  LIVRABLE_SYSTEM_PROMPT,
  buildP1LiverablePrompt,
  buildP2LiverablePrompt,
} from '@/lib/prompts/generate-livrable';
import {
  buildP3IncrementalPrompt,
  buildP4IncrementalPrompt,
  buildP5IncrementalPrompt,
  buildP6IncrementalPrompt,
  type LivrableInput,
} from '@/lib/livrable-pipeline';

const Schema = z.object({
  phase: z.enum([
    'p1_discovery',
    'p2_gap',
    'p3_rfi',
    'p4_scoring',
    'p5_risks',
    'p6_roadmap',
  ]),
  wizard_answers:    z.record(z.unknown()).optional(),
  client_name:       z.string().optional(),
  client_profile:    z.record(z.unknown()).optional(),
  shortlisted_pas:   z.array(z.string()).optional(),
  eliminated_pas:    z.array(z.object({ name: z.string(), reason: z.string() })).optional(),
  active_alerts:     z.array(z.object({ title: z.string(), message: z.string() })).optional(),
  context_supplement: z.string().optional(),
  lead_time_min:     z.number().optional(),
  lead_time_max:     z.number().optional(),
  complexity_band:   z.string().optional(),
  deadline:          z.string().optional(),
  use_cases:         z.object({
    selected_ids: z.array(z.string()),
    custom:       z.array(z.object({
      id: z.string(), category: z.string(), label: z.string(),
      description: z.string().optional(), requires_coverage: z.array(z.string()),
    })),
  }).optional(),
  // Livrables validés des phases précédentes (pipeline incrémental)
  p1_validated: z.string().optional(),
  p2_validated: z.string().optional(),
  p3_validated: z.string().optional(),
  p4_validated: z.string().optional(),
  p5_validated: z.string().optional(),
});

function stubLivrable(phase: string): string {
  const stubs: Record<string, string> = {
    p1_discovery: `# Cartographie des flux de facturation\n\n> ⚠️ **Draft non généré** — LLM_API_KEY non configuré. Éditez ce texte manuellement.\n\n## Tableau synthétique\n\n| Dimension | Valeur |\n|-----------|--------|\n| Système source | À renseigner |\n| Format actuel | À renseigner |\n| Volume émis | À renseigner |\n| Volume reçu | À renseigner |\n| Taux exceptions | À renseigner |\n\n## Description narrative\n\n*À compléter par le consultant.*\n\n## Points d'attention\n\n- À identifier lors de l'atelier de découverte`,
    p2_gap:       `# Matrice de couverture PA\n\n> ⚠️ **Draft non généré** — LLM_API_KEY non configuré. Éditez ce texte manuellement.\n\n*À compléter après la phase de Gap Analysis.*`,
    p3_rfi:       `# Tableau RFI ciblé\n\n> ⚠️ **Draft non généré** — LLM_API_KEY non configuré. Éditez ce texte manuellement.\n\n*Questions contractualisables à adresser aux éditeurs PA shortlistés.*`,
    p4_scoring:   `# Grille de scoring pondérée + Recommandation CODIR\n\n> ⚠️ **Draft non généré** — LLM_API_KEY non configuré. Éditez ce texte manuellement.\n\n*Grille de scoring et recommandation à compléter après l'analyse RFI.*`,
    p5_risks:     `# Points de vigilance et risques spécifiques\n\n> ⚠️ **Draft non généré** — LLM_API_KEY non configuré. Éditez ce texte manuellement.\n\n*Pièges actifs et risques spécifiques à documenter.*`,
    p6_roadmap:   `# Séquençage recommandé — De l'atelier au go-live\n\n> ⚠️ **Draft non généré** — LLM_API_KEY non configuré. Éditez ce texte manuellement.\n\n*Planning des jalons à compléter selon le lead time estimé.*`,
  };
  return stubs[phase] ?? `> ⚠️ Draft non généré pour la phase ${phase}.`;
}

function buildUserPrompt(phase: string, data: z.infer<typeof Schema>): string {
  const answers = (data.wizard_answers ?? {}) as Record<string, unknown>;
  const profile = (data.client_profile ?? {}) as Record<string, unknown>;

  // P1 et P2 utilisent les anciens builders (pas de contexte incrémental nécessaire)
  if (phase === 'p1_discovery') {
    return buildP1LiverablePrompt(answers, data.client_name);
  }
  if (phase === 'p2_gap') {
    return buildP2LiverablePrompt(answers, data.shortlisted_pas ?? [], data.eliminated_pas ?? []);
  }

  // P3-P6 : pipeline incrémental
  const input: LivrableInput = {
    phase:              phase as LivrableInput['phase'],
    client_name:        data.client_name,
    client_profile:     Object.keys(profile).length > 0 ? (profile as unknown as import('@/lib/types').ClientProfile) : undefined,
    context_supplement: data.context_supplement,
    answers:            answers as Partial<import('@/lib/types').DiscoveryAnswers>,
    shortlisted_pas:    data.shortlisted_pas ?? [],
    eliminated_pas:     data.eliminated_pas ?? [],
    active_alerts:      data.active_alerts ?? [],
    lead_time_min:      data.lead_time_min,
    lead_time_max:      data.lead_time_max,
    complexity_band:    data.complexity_band,
    deadline:           data.deadline,
    use_cases:          data.use_cases as LivrableInput['use_cases'],
    p1_validated:       data.p1_validated,
    p2_validated:       data.p2_validated,
    p3_validated:       data.p3_validated,
    p4_validated:       data.p4_validated,
    p5_validated:       data.p5_validated,
  };

  switch (phase) {
    case 'p3_rfi':     return buildP3IncrementalPrompt(input);
    case 'p4_scoring': return buildP4IncrementalPrompt(input);
    case 'p5_risks':   return buildP5IncrementalPrompt(input);
    case 'p6_roadmap': return buildP6IncrementalPrompt(input);
    default:           return `Génère un livrable pour la phase ${phase}.`;
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
    let userPrompt: string;
    try {
      userPrompt = buildUserPrompt(phase, parsed.data);
    } catch (promptErr) {
      console.error('[API/generate-livrable] Erreur dans buildUserPrompt phase=%s:', phase, promptErr);
      const msg = promptErr instanceof Error ? promptErr.message : String(promptErr);
      return NextResponse.json({ error: `Erreur de construction du prompt : ${msg}` }, { status: 500 });
    }

    try {
      const content = await callLLM({
        system:      LIVRABLE_SYSTEM_PROMPT,
        user:        userPrompt,
        maxTokens:   2000,
        temperature: 0.3,
        timeout:     90_000,
      });
      return NextResponse.json({ content, phase }, { status: 200 });
    } catch (llmErr) {
      if (llmErr instanceof LLMConfigError) {
        return NextResponse.json(
          { content: stubLivrable(phase), phase, llm_unavailable: true },
          { status: 200 }
        );
      }
      if (llmErr instanceof LLMAPIError) {
        console.error('[API/generate-livrable] LLM API error:', llmErr.message);
        return NextResponse.json(
          { error: `LLM indisponible : ${llmErr.message}` },
          { status: 502 }
        );
      }
      throw llmErr;
    }
  } catch (err) {
    console.error('[API/generate-livrable] error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erreur de génération : ${message}` }, { status: 500 });
  }
}
