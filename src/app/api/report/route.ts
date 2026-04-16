/**
 * app/api/report/route.ts
 *
 * POST /api/report
 * Génère le PDF du rapport pour une mission déjà analysée.
 *
 * FAILURE MODES :
 *   400 : body invalide / mission non analysée
 *   404 : mission introuvable
 *   500 : erreur de rendu PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ServerMissionStore } from '@/services/storage';
import { generateMissionReport, buildReportFilename } from '@/services/pdf';

const ReportSchema = z.object({ mission_id: z.string().min(1) });

export async function POST(request: NextRequest): Promise<NextResponse | Response> {
  const t0 = Date.now();
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 });
    }

    const parsed = ReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation échouée' }, { status: 400 });
    }

    const mission = await ServerMissionStore.get(parsed.data.mission_id);
    if (!mission) {
      return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 });
    }

    if (mission.complexity_score === undefined || !mission.shortlist) {
      return NextResponse.json(
        { error: "La mission doit d'abord être analysée (POST /api/analyze)." },
        { status: 400 }
      );
    }

    const buffer = await generateMissionReport(mission);
    const filename = buildReportFilename(mission);

    console.log('[API/report] PDF generated', {
      mission_id: mission.id,
      size: buffer.length,
      ms: Date.now() - t0,
    });

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[API/report] error', err);
    return NextResponse.json({ error: 'Erreur de génération PDF' }, { status: 500 });
  }
}
