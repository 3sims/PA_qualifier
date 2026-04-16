/**
 * app/api/generate-rfi/route.ts
 *
 * POST /api/generate-rfi
 * Génère les questions RFI ciblées pour les PA shortlistées.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callLLM, extractJSON, LLMConfigError } from '@/services/llm';
import { RFI_SYSTEM_PROMPT, buildRFIPrompt } from '@/lib/prompts/rfi-generation';

const Schema = z.object({
  shortlisted_pas: z.array(z.string()).min(1),
  undocumented_items: z.array(z.object({ pa: z.string(), item: z.string() })),
  client_profile: z.record(z.unknown()).optional().default({}),
  answers: z.record(z.unknown()),
});

interface RFIQuestion {
  pa_name: string;
  question: string;
  point_reference: string;
  priorite: 'critique' | 'importante' | 'informative';
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

    const { shortlisted_pas, undocumented_items, client_profile, answers } = parsed.data;

    try {
      const rawResponse = await callLLM({
        system:      RFI_SYSTEM_PROMPT,
        user:        buildRFIPrompt(shortlisted_pas, undocumented_items, client_profile, answers),
        maxTokens:   3000,
        temperature: 0.2,
      });

      const questions = extractJSON<RFIQuestion[]>(rawResponse);
      return NextResponse.json({ questions }, { status: 200 });
    } catch (llmErr) {
      if (llmErr instanceof LLMConfigError) {
        return NextResponse.json(
          { questions: [], llm_unavailable: true },
          { status: 200 }
        );
      }
      throw llmErr;
    }
  } catch (err) {
    console.error('[API/generate-rfi] error:', err);
    return NextResponse.json({ error: 'Erreur de génération' }, { status: 500 });
  }
}
