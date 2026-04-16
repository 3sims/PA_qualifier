/**
 * app/api/analyze-risks/route.ts
 *
 * POST /api/analyze-risks
 * Génère les risques spécifiques client via LLM.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callLLM, extractJSON, LLMConfigError } from '@/services/llm';
import { ANALYZE_RISKS_SYSTEM_PROMPT, buildAnalyzeRisksPrompt } from '@/lib/prompts/analyze-risks';
import type { ClientSpecificRisk } from '@/lib/types';

const Schema = z.object({
  client_profile: z.record(z.unknown()).optional().default({}),
  answers: z.record(z.unknown()),
  active_alerts: z.array(z.object({ title: z.string(), message: z.string() })).default([]),
  client_pa_shortlist: z.array(z.string()).default([]),
});

const DEFAULT_RISKS: ClientSpecificRisk[] = [
  {
    id: 'lead_time_risk',
    title: 'Délai d\'intégration sous-estimé',
    description: 'Le lead time PA peut dépasser les estimations initiales en cas de complexité ERP non anticipée.',
    probability: 'modérée',
    impact:      'critique',
    risk_score:  6,
    mitigation_actions: [
      'Exiger un planning détaillé de mise en œuvre lors du RFP',
      'Contractualiser des jalons intermédiaires avec pénalités de retard',
      'Prévoir 4 semaines de buffer dans le planning',
    ],
    mitigation_owner:    'Chef de projet consultant',
    mitigation_deadline: 'Avant signature du contrat PA',
  },
  {
    id: 'erp_integration_risk',
    title: 'Complexité d\'intégration ERP non documentée',
    description: 'Les connecteurs PA peuvent ne pas couvrir tous les flux (avoirs, autofactures) ou toutes les versions ERP.',
    probability: 'modérée',
    impact:      'modéré',
    risk_score:  4,
    mitigation_actions: [
      'Demander la documentation technique du connecteur ERP en RFI',
      'Exiger 3 références clients avec même ERP et même version',
      'Tester le connecteur sur un environnement de pré-production',
    ],
    mitigation_owner:    'DSI + PA sélectionnée',
    mitigation_deadline: 'Phase de qualification technique',
  },
];

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

    const { client_profile, answers, active_alerts, client_pa_shortlist } = parsed.data;

    try {
      const rawResponse = await callLLM({
        system:      ANALYZE_RISKS_SYSTEM_PROMPT,
        user:        buildAnalyzeRisksPrompt(client_profile, answers, active_alerts, client_pa_shortlist),
        maxTokens:   3000,
        temperature: 0.2,
      });

      const risks = extractJSON<ClientSpecificRisk[]>(rawResponse);
      return NextResponse.json({ risks }, { status: 200 });
    } catch (llmErr) {
      if (llmErr instanceof LLMConfigError) {
        return NextResponse.json(
          { risks: DEFAULT_RISKS, llm_unavailable: true },
          { status: 200 }
        );
      }
      throw llmErr;
    }
  } catch (err) {
    console.error('[API/analyze-risks] error:', err);
    return NextResponse.json({ error: 'Erreur d\'analyse' }, { status: 500 });
  }
}
