/**
 * app/api/enrich-client/route.ts
 *
 * POST /api/enrich-client
 * Pipeline 2 étapes :
 *   1. Tavily — 3 recherches web parallèles sur l'entreprise
 *   2. Claude — structure les snippets en ClientProfile JSON
 *
 * FAILURE MODES :
 *   400 : company_name absent
 *   200 : toujours — en cas d'erreur Tavily ou Claude, retourne profil vide
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import { callLLM, extractJSON } from '@/services/llm';
import type { ClientProfile } from '@/lib/types';

const Schema = z.object({
  company_name:       z.string().min(1),
  context_supplement: z.string().optional(),
});

function emptyProfile(companyName: string): ClientProfile {
  return {
    legal_name:                    companyName,
    trade_name:                    null,
    siren:                         null,
    creation_date:                 null,
    capital:                       null,
    headquarters:                  null,
    naf_code:                      null,
    naf_label:                     null,
    convention_collective:         null,
    num_establishments:            null,
    regulatory_category:           null,
    regulatory_category_confidence:'unknown',
    emission_deadline:             null,
    reception_deadline:            null,
    sector_label:                  null,
    typical_b2b_flows:             [],
    sector_specific_constraints:   [],
    fields_to_confirm: [
      'regulatory_category',
      'emission_deadline',
      'sector_label',
      'erp_main',
      'num_establishments',
    ],
    enrichment_date:  new Date().toISOString(),
    data_sources:     [],
    confidence_score: 0,
  };
}

// ---------------------------------------------------------------------------
// Étape 1 — Tavily search
// ---------------------------------------------------------------------------

async function fetchWebSnippets(companyName: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return '';

  const client = tavily({ apiKey });

  const [legalResult, sectorResult, regulatoryResult] = await Promise.allSettled([
    client.search(`${companyName} SIREN siège social capital NAF`, {
      maxResults:  3,
      searchDepth: 'basic',
    }),
    client.search(`${companyName} secteur activité ERP facturation fournisseurs`, {
      maxResults:  3,
      searchDepth: 'basic',
    }),
    client.search(`${companyName} facturation électronique réforme 2026 catégorie PME ETI`, {
      maxResults:  2,
      searchDepth: 'basic',
    }),
  ]);

  const snippets = [legalResult, sectorResult, regulatoryResult]
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof client.search>>>).value.results ?? [])
    .map((r) => `SOURCE: ${r.url}\n${r.content}`)
    .join('\n\n---\n\n')
    .slice(0, 8000);

  return snippets;
}

// ---------------------------------------------------------------------------
// Étape 2 — Claude structure les résultats
// ---------------------------------------------------------------------------

function buildStructuringPrompt(
  companyName: string,
  contextSupplement: string | undefined,
  snippets: string,
): string {
  const today = new Date().toISOString();
  return `Tu es un expert en facturation électronique française (réforme 2026).
Voici des extraits de pages web sur l'entreprise "${companyName}".
Contexte additionnel du consultant : ${contextSupplement ?? 'aucun'}

EXTRAITS WEB :
${snippets || 'Aucun résultat trouvé.'}

À partir de ces extraits, extrais et structure les informations dans ce JSON exact.
Si une information n'est pas présente dans les extraits, utilise null.
Retourne UNIQUEMENT du JSON valide, sans commentaire ni markdown.

{
  "legal_name": string | null,
  "trade_name": string | null,
  "siren": string | null,
  "creation_date": string | null,
  "capital": string | null,
  "headquarters": string | null,
  "naf_code": string | null,
  "naf_label": string | null,
  "convention_collective": string | null,
  "num_establishments": number | null,
  "regulatory_category": "GE" | "ETI" | "PME" | "TPE" | null,
  "regulatory_category_confidence": "confirmed" | "estimated" | "unknown",
  "emission_deadline": string | null,
  "reception_deadline": string | null,
  "sector_label": string | null,
  "typical_b2b_flows": string[],
  "sector_specific_constraints": string[],
  "fields_to_confirm": string[],
  "enrichment_date": "${today}",
  "data_sources": string[],
  "confidence_score": number
}

Règles deadlines DGFiP :
- GE/ETI : emission_deadline = "2026-09-01", reception_deadline = "2026-09-01"
- PME/TPE : emission_deadline = "2027-09-01", reception_deadline = "2026-09-01"
- Catégorie inconnue : laisser null sur les deux deadlines et ajouter "regulatory_category" dans fields_to_confirm

Règle confidence_score :
- 80-100 : SIREN trouvé + NAF trouvé + siège trouvé
- 50-79  : au moins 2 champs légaux trouvés
- 20-49  : données partielles
- 0-19   : aucune donnée légale trouvée`;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Vérification des variables d'environnement
  const missingVars: string[] = [];
  if (!process.env.LLM_API_KEY)    missingVars.push('LLM_API_KEY');
  if (!process.env.TAVILY_API_KEY) missingVars.push('TAVILY_API_KEY');
  if (missingVars.length > 0) {
    return NextResponse.json(
      {
        profile:         emptyProfile(''),
        llm_unavailable: true,
        message:         `Variables manquantes : ${missingVars.join(', ')}. Configurez .env.local.`,
      },
      { status: 200 },
    );
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'company_name requis' }, { status: 400 });
  }

  const { company_name, context_supplement } = parsed.data;

  // Étape 1 — Tavily (échec silencieux : on continue avec snippets vides)
  let snippets = '';
  try {
    snippets = await fetchWebSnippets(company_name);
  } catch (tavilyErr) {
    console.warn('[API/enrich-client] Tavily error (continuing without web data):', tavilyErr);
  }

  // Étape 2 — Claude structure
  try {
    const raw = await callLLM({
      system:      'Tu es un assistant expert en entreprises françaises et facturation électronique. Tu réponds uniquement en JSON valide.',
      user:        buildStructuringPrompt(company_name, context_supplement, snippets),
      maxTokens:   2000,
      temperature: 0.1,
    });

    const profile = extractJSON<ClientProfile>(raw);
    if (!profile.enrichment_date) {
      profile.enrichment_date = new Date().toISOString();
    }

    return NextResponse.json({ profile, source: 'tavily+llm' }, { status: 200 });
  } catch (llmErr) {
    console.error('[API/enrich-client] Claude error:', llmErr);
    return NextResponse.json(
      {
        profile:         emptyProfile(company_name),
        llm_unavailable: true,
        source:          'fallback',
        message:         `Enrichissement échoué : ${llmErr instanceof Error ? llmErr.message : String(llmErr)}`,
      },
      { status: 200 },
    );
  }
}
