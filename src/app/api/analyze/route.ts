/**
 * app/api/analyze/route.ts
 *
 * POST /api/analyze
 * Calcule score de complexité + lead time + shortlist PA pour une mission.
 *
 * Prérequis : ≥ 20 questions répondues (sinon 400).
 *
 * FAILURE MODES :
 *   400 : progression insuffisante
 *   404 : mission introuvable
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ServerMissionStore } from '@/services/storage';
import {
  calculateComplexityScore,
  getComplexityBand,
} from '@/lib/scoring';
import {
  calculateLeadTime,
  volumeToMonthlyApprox,
  entitiesToSiretCount,
} from '@/lib/lead-time';
import {
  runGapAnalysis,
  runGapAnalysisV2,
  buildShortlistEntries,
} from '@/lib/gap-analysis';
import { buildPAContext, selectRelevantPAs } from '@/lib/pa-selector';
import { calculateProgress } from '@/services/questionnaire';
import { paRepository } from '@/lib/pa-repository';
import type { FeatureCatalogItem } from '@/lib/types';
import featuresCatalog from '@/data/features-catalog.json';

const AnalyzeSchema = z.object({
  mission_id:          z.string().min(1),
  client_pa_shortlist: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    const parsed = AnalyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation échouée' }, { status: 400 });
    }

    const mission = await ServerMissionStore.get(parsed.data.mission_id);
    if (!mission) {
      return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 });
    }

    const progress = calculateProgress(mission.answers);
    if (progress.answered < 20) {
      return NextResponse.json(
        {
          error: `Impossible d'analyser : ${progress.answered}/${progress.total} questions répondues (minimum 20).`,
        },
        { status: 400 }
      );
    }

    const score = calculateComplexityScore(mission.answers);
    const band = getComplexityBand(score);
    const ltRaw = calculateLeadTime(
      mission.answers.erp_tier,
      mission.answers.has_middleware ?? false,
      entitiesToSiretCount(mission.answers.nb_entities),
      volumeToMonthlyApprox(mission.answers.volume_emitted)
    );
    // Minimum absolu méthodologie : aucun lead time < 12 semaines
    const leadMin = Math.max(ltRaw.min_weeks, 12);
    const leadMax = ltRaw.max_weeks;

    const paProfiles = await paRepository.findAll();
    const features = (featuresCatalog as { features: FeatureCatalogItem[] }).features;
    const clientShortlist = parsed.data.client_pa_shortlist ?? [];

    let shortlist;
    let eliminatedClientPAs: Array<{ name: string; reason: string }> = [];

    if (clientShortlist.length > 0) {
      // Analyse enrichie : inclut les PA clientes + PA éliminées
      const appRecommended = selectRelevantPAs(paProfiles, mission.answers);
      const paContext = buildPAContext(paProfiles, appRecommended, clientShortlist);
      const { shortlisted, eliminated } = runGapAnalysisV2(
        mission.answers,
        paContext,
        features
      );

      // Forcer l'inclusion des PA clientes (même si hors top-5 app)
      const clientPAs = shortlisted.filter(
        (p) => p.pa_source === 'client' || p.pa_source === 'both'
      );
      const appOnly = shortlisted.filter((p) => p.pa_source === 'app');
      const maxApp = Math.max(0, 5 - clientPAs.length);
      const combined = [...clientPAs, ...appOnly.slice(0, maxApp)];

      shortlist = buildShortlistEntries(mission.answers, combined, features);

      eliminatedClientPAs = eliminated
        .filter((p) => p.pa_source === 'client' || p.pa_source === 'both')
        .map((p) => ({ name: p.name, reason: p.eliminated_reason }));
    } else {
      // Analyse standard sans PA clientes
      shortlist = runGapAnalysis(mission.answers, paProfiles, features);
    }

    mission.complexity_score = score;
    mission.complexity_band = band;
    mission.lead_time_weeks_min = leadMin;
    mission.lead_time_weeks_max = leadMax;
    mission.shortlist = shortlist;
    mission.status = 'completed';
    mission.updated_at = new Date().toISOString();
    await ServerMissionStore.save(mission);

    return NextResponse.json(
      {
        complexity_score: score,
        complexity_band: band,
        lead_time_min: leadMin,
        lead_time_max: leadMax,
        lead_time_scenario: ltRaw.scenario,
        shortlist,
        eliminated_client_pas: eliminatedClientPAs,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[API/analyze] error', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
