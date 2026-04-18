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
// Anti-hallucination helpers
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\bsas\b|\bsarl\b|\bsa\b|\bsasu\b|\beurl\b|\bsci\b|\bsas\s+à\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function levenshteinSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

function isProfileCoherent(
  profile: ClientProfile,
  companyName: string
): { valid: boolean; reason?: string } {
  if (!profile.legal_name && !profile.trade_name) {
    return { valid: false, reason: 'no_name_found' };
  }

  const inputNorm = normalize(companyName);
  if (!inputNorm) return { valid: true }; // nom trop court pour valider

  const legalNorm = normalize(profile.legal_name ?? '');
  const tradeNorm = normalize(profile.trade_name ?? '');

  // Contrôle 1 : correspondance directe
  if (
    (legalNorm && (legalNorm.includes(inputNorm) || inputNorm.includes(legalNorm))) ||
    (tradeNorm && (tradeNorm.includes(inputNorm) || inputNorm.includes(tradeNorm)))
  ) {
    return { valid: true };
  }

  // Contrôle 2 : similarité Levenshtein ≥ 70%
  const similarity = Math.max(
    legalNorm ? levenshteinSimilarity(inputNorm, legalNorm) : 0,
    tradeNorm ? levenshteinSimilarity(inputNorm, tradeNorm) : 0
  );

  if (similarity >= 0.70) return { valid: true };

  return {
    valid: false,
    reason: `Raison sociale retournée ("${profile.legal_name ?? profile.trade_name}") ne correspond pas à "${companyName}" (similarité ${Math.round(similarity * 100)}%)`,
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
  const hasContext = contextSupplement && contextSupplement.trim().length > 0;

  return `## CONTEXTE CONSULTANT — PRIORITÉ ABSOLUE (source de vérité N°1)
${hasContext ? contextSupplement : 'Aucun contexte additionnel fourni par le consultant.'}

RÈGLE : Si le contexte consultant contient une information explicite (ERP, deadline, taille, secteur, nombre d'établissements), utiliser cette valeur EXACTEMENT, sans inférence.

---

## DONNÉES WEB sur l'entreprise "${companyName}"
${snippets || 'Aucun résultat web trouvé.'}

---

## MISSION
Tu es un expert en facturation électronique française (réforme 2026).
Extrais et structure les informations sur "${companyName}" dans ce JSON exact.
CONTRAINTE ABSOLUE : legal_name ou trade_name doit contenir "${companyName}" ou une raison sociale clairement identifiable comme celle de "${companyName}". En cas de doute, utilise "${companyName}" comme legal_name.
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
- Catégorie inconnue : null sur les deux deadlines, ajouter "regulatory_category" dans fields_to_confirm

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

  // Étape 1 — Tavily (échec silencieux)
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

    // Validation anti-hallucination
    const coherenceCheck = isProfileCoherent(profile, company_name);
    if (!coherenceCheck.valid) {
      console.warn('[API/enrich-client] Profil incohérent détecté :', coherenceCheck.reason);
      // Nullifier les champs légaux potentiellement hallucinés
      profile.legal_name = null;
      profile.trade_name = null;
      profile.siren = null;
      profile.creation_date = null;
      profile.capital = null;
      profile.headquarters = null;
      profile.naf_code = null;
      profile.fields_to_confirm = [
        'legal_name', 'trade_name', 'siren', 'creation_date',
        'capital', 'headquarters', 'naf_code', 'num_establishments',
      ];
      profile.confidence_score = Math.min(profile.confidence_score, 15);
      profile.hallucination_detected = true;
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
