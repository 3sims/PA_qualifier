/**
 * app/api/answers/route.ts
 *
 * PUT /api/answers
 * Upsert idempotent d'une réponse pour une mission donnée.
 * Même question_id → écrase la valeur précédente.
 *
 * FAILURE MODES :
 *   400 : body invalide
 *   404 : mission introuvable
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ServerMissionStore } from '@/services/storage';
import type { DiscoveryAnswers } from '@/lib/types';

const UpdateAnswerSchema = z.object({
  mission_id: z.string().min(1),
  question_id: z.string().min(1),
  answer_value: z.unknown(),
});

export async function PUT(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    const parsed = UpdateAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation échouée' }, { status: 400 });
    }

    const { mission_id, question_id, answer_value } = parsed.data;
    const mission = await ServerMissionStore.get(mission_id);
    if (!mission) {
      return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 });
    }

    mission.answers = {
      ...mission.answers,
      [question_id]: answer_value as never,
    } as Partial<DiscoveryAnswers>;
    mission.status = 'in_progress';
    mission.updated_at = new Date().toISOString();
    await ServerMissionStore.save(mission);

    return NextResponse.json({ updated: true }, { status: 200 });
  } catch (err) {
    console.error('[API/answers] error', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
