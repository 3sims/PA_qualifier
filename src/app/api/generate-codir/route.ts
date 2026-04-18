/**
 * app/api/generate-codir/route.ts
 *
 * POST /api/generate-codir
 * Génère la grille de scoring CODIR interactive (JSON structuré) à partir de
 * tous les livrables disponibles et du profil client.
 *
 * FAILURE MODES :
 *   400 : données manquantes / pas de PA shortlistée
 *   200 : toujours (stub si LLM indisponible)
 *   502 : erreur LLM API
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callLLM, LLMConfigError, LLMAPIError, extractJSON } from '@/services/llm';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const Schema = z.object({
  shortlisted_pas:  z.array(z.string()).min(1, 'Au moins 1 PA shortlistée requise'),
  eliminated_pas:   z.array(z.object({ name: z.string(), reason: z.string() })).optional(),
  client_name:      z.string().optional(),
  wizard_answers:   z.record(z.unknown()).optional(),
  p1_validated:     z.string().optional(),
  p2_validated:     z.string().optional(),
  p3_validated:     z.string().optional(),
  p4_validated:     z.string().optional(),
  p5_validated:     z.string().optional(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CodirData {
  scoring_criteria: Array<{
    label: string;
    weight: number;
    scores: Record<string, number>;
  }>;
  lead_time_data: Array<{
    pa_name: string;
    scenario: string;
    min_weeks: number;
    max_weeks: number;
  }>;
  contract_clauses: string[];
}

// ---------------------------------------------------------------------------
// Stub (LLM indisponible)
// ---------------------------------------------------------------------------

function stubCodirData(pas: string[]): CodirData {
  const scores = Object.fromEntries(pas.map((p) => [p, 7]));
  return {
    scoring_criteria: [
      { label: 'Couverture fonctionnelle', weight: 30, scores: { ...scores } },
      { label: 'Intégration technique',    weight: 25, scores: { ...scores } },
      { label: 'Conformité réglementaire', weight: 20, scores: { ...scores } },
      { label: 'Pricing & Lead time',      weight: 15, scores: { ...scores } },
      { label: 'Risques & Maturité',       weight: 10, scores: { ...scores } },
    ],
    lead_time_data: pas.map((p) => ({
      pa_name:   p,
      scenario:  'api',
      min_weeks: 12,
      max_weeks: 20,
    })),
    contract_clauses: [
      'SLA support N1 France — réponse < 4h ouvrées garantie',
      'Portabilité des données — export CSV/JSON en fin de contrat sans surcoût',
      'Immatriculation DGFiP confirmée avant signature du bon de commande',
      'Réversibilité — 90 jours d\'assistance post-résiliation inclus',
      'Conformité continue — mises à jour réglementaires incluses dans le forfait annuel',
    ],
  };
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `Tu es un expert en sélection de plateformes d'automatisation de la facturation électronique (PA/PDP/PPF).
Tu génères une grille de scoring CODIR complète pour évaluer des PA shortlistées.
Réponds UNIQUEMENT avec un objet JSON valide — aucun texte avant ou après, aucun bloc markdown.`;

const TRUNC = 700;
const trunc = (s?: string) =>
  s ? (s.length > TRUNC ? s.slice(0, TRUNC) + '…' : s) : null;

function buildPrompt(data: z.infer<typeof Schema>): string {
  const pas = data.shortlisted_pas;
  const answers = (data.wizard_answers ?? {}) as Record<string, unknown>;
  const erp = String(answers.erp_main ?? answers.erp_tier ?? 'ERP non précisé');
  const deadline = String(answers.deadline ?? 'non précisé');
  const b2g = String(answers.has_b2g ?? answers.b2g_clients ?? 'non précisé');
  const hosting = String(answers.data_hosting ?? 'non précisé');

  const livrablesCtx = [
    trunc(data.p1_validated) ? `### P1 — Discovery\n${trunc(data.p1_validated)}` : '',
    trunc(data.p2_validated) ? `### P2 — Gap Analysis\n${trunc(data.p2_validated)}` : '',
    trunc(data.p3_validated) ? `### P3 — RFI\n${trunc(data.p3_validated)}` : '',
    trunc(data.p4_validated) ? `### P4 — Scoring CODIR\n${trunc(data.p4_validated)}` : '',
    trunc(data.p5_validated) ? `### P5 — Risques\n${trunc(data.p5_validated)}` : '',
  ].filter(Boolean).join('\n\n');

  const eliminatedCtx = (data.eliminated_pas ?? []).length > 0
    ? (data.eliminated_pas ?? []).map((e) => `- ${e.name} : ${e.reason}`).join('\n')
    : 'Aucune';

  // Example scores (will be replaced by LLM)
  const exScores = Object.fromEntries(pas.map((p) => [p, 7]));
  const exLeadTime = pas.map((p) => ({
    pa_name: p, scenario: 'native', min_weeks: 12, max_weeks: 20,
  }));

  return `# Grille de scoring CODIR — ${data.client_name ?? 'Client'}

## Contexte client
- ERP principal : ${erp}
- Deadline go-live : ${deadline}
- B2G (Chorus Pro) : ${b2g}
- Hébergement requis : ${hosting}

## PA shortlistées (${pas.length})
${pas.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## PA éliminées
${eliminatedCtx}

${livrablesCtx ? `## Contexte livrables\n${livrablesCtx}\n` : ''}
## MISSION

Génère une grille de scoring pondérée pour évaluer les ${pas.length} PA en CODIR.
Adapte les scores au contexte client et aux livrables disponibles.

Retourne UNIQUEMENT ce JSON (remplace les valeurs 7 par tes scores réels basés sur le contexte) :

{
  "scoring_criteria": [
    { "label": "Couverture fonctionnelle", "weight": 30, "scores": ${JSON.stringify(exScores)} },
    { "label": "Intégration technique",    "weight": 25, "scores": ${JSON.stringify(exScores)} },
    { "label": "Conformité réglementaire", "weight": 20, "scores": ${JSON.stringify(exScores)} },
    { "label": "Pricing & Lead time",      "weight": 15, "scores": ${JSON.stringify(exScores)} },
    { "label": "Risques & Maturité",       "weight": 10, "scores": ${JSON.stringify(exScores)} }
  ],
  "lead_time_data": ${JSON.stringify(exLeadTime, null, 2)},
  "contract_clauses": [
    "Clause SLA N1 France — réponse < 4h ouvrées",
    "Portabilité données — export CSV/JSON en fin de contrat",
    "Immatriculation DGFiP avant signature",
    "Réversibilité — 90j assistance post-résiliation",
    "Conformité continue — mises à jour réglementaires incluses"
  ]
}

CONTRAINTES ABSOLUES :
- Les poids totalisent exactement 100
- Les scores sont des entiers entre 0 et 10
- Les clés de "scores" utilisent EXACTEMENT ces noms : ${pas.join(', ')}
- Scénario lead_time_data : "native" si connecteur ERP natif dispo, "api" si intégration API, "custom" si sur-mesure
- Les clauses contractuelles sont adaptées au profil client (ERP, deadline, hébergement)`;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error },
        { status: 400 }
      );
    }

    const { data } = parsed;
    const userPrompt = buildPrompt(data);

    try {
      const text = await callLLM({
        system:      SYSTEM_PROMPT,
        user:        userPrompt,
        maxTokens:   1500,
        temperature: 0.2,
        timeout:     60_000,
      });

      let codirData: CodirData;
      try {
        codirData = extractJSON<CodirData>(text);
      } catch {
        console.warn('[API/generate-codir] JSON extraction failed, returning stub');
        return NextResponse.json(
          { ...stubCodirData(data.shortlisted_pas), llm_parse_error: true },
          { status: 200 }
        );
      }

      return NextResponse.json(codirData, { status: 200 });
    } catch (llmErr) {
      if (llmErr instanceof LLMConfigError) {
        return NextResponse.json(
          { ...stubCodirData(data.shortlisted_pas), llm_unavailable: true },
          { status: 200 }
        );
      }
      if (llmErr instanceof LLMAPIError) {
        console.error('[API/generate-codir] LLM API error:', llmErr.message);
        return NextResponse.json(
          { error: `LLM indisponible : ${llmErr.message}` },
          { status: 502 }
        );
      }
      throw llmErr;
    }
  } catch (err) {
    console.error('[API/generate-codir] error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erreur : ${message}` }, { status: 500 });
  }
}
