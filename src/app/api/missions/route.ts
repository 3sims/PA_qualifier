/**
 * app/api/missions/route.ts
 *
 * POST /api/missions  → crée une nouvelle mission (draft)
 * GET  /api/missions?id=... → récupère une mission existante
 *
 * FAILURE MODES :
 *   400 : body invalide
 *   404 : mission inconnue (GET)
 *   500 : erreur interne
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { Mission } from '@/lib/types';
import { ServerMissionStore } from '@/services/storage';

const CreateMissionSchema = z.object({
  client_name: z.string().min(1, 'client_name requis'),
  client_sector: z.string().min(1, 'client_sector requis'),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body JSON invalide.' }, { status: 400 });
    }

    const parsed = CreateMissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation: ' + parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const mission: Mission = {
      id: randomUUID(),
      client_name: parsed.data.client_name,
      client_sector: parsed.data.client_sector,
      status: 'draft',
      answers: {},
      created_at: now,
      updated_at: now,
    };

    await ServerMissionStore.save(mission);

    return NextResponse.json({ mission }, { status: 201 });
  } catch (err) {
    console.error('[API/missions] error', err);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const mission = await ServerMissionStore.get(id);
  if (!mission) return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 });

  return NextResponse.json({ mission }, { status: 200 });
}
