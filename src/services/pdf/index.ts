/**
 * services/pdf/index.ts
 *
 * Génération du rapport PA au format PDF (V1 Draft).
 * Utilise @react-pdf/renderer côté SERVEUR uniquement (API route).
 * Ne doit jamais être importé depuis un composant 'use client'.
 *
 * FAILURE MODES :
 *   - Mission sans analyse (shortlist manquante) → section vide, pas de crash
 *   - Rendering échoue → l'erreur remonte à l'API route qui renvoie 500
 */

import { pathToFileURL } from 'node:url';
import * as nodeModule from 'node:module';
import ReactPDF, { renderToBuffer } from '@react-pdf/renderer';

// Next 15 injects its own React 19 canary (symbol `react.transitional.element`)
// for server-side compilation. react-pdf is externalized and loads userland
// react@18 (symbol `react.element`). Creating elements with Next's React
// produces $$typeof values react-pdf's reconciler doesn't recognize, which
// surfaces as React error #31. Bypass webpack by resolving react via a
// Node-native createRequire anchored on the current working directory, which
// returns the same react@18 instance react-pdf uses internally.
const nodeRequire = nodeModule.createRequire(pathToFileURL(process.cwd() + '/').href);
const React = nodeRequire('react') as typeof import('react');
const { Document, Page, Text, View, StyleSheet } = ReactPDF;
import type { Mission, ShortlistEntry } from '@/lib/types';
import { QUESTIONNAIRE_CONFIG } from '@/lib/questions.config';

// ---------------------------------------------------------------------------
// STYLE — Palette Niji (navy + orange)
// ---------------------------------------------------------------------------

const COLORS = {
  primary: '#0A0A23',
  accent: '#F97316',
  light: '#F5F5FA',
  border: '#E2E2EC',
  text: '#111827',
  muted: '#6B7280',
  success: '#16A34A',
  warning: '#EAB308',
  danger: '#DC2626',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.text,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 45,
    backgroundColor: COLORS.white,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.accent,
  },
  h1: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  h2: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 10,
    marginTop: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  h3: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.accent,
    fontFamily: 'Helvetica-Bold',
  },
  meta: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 4,
  },
  p: { fontSize: 10, color: COLORS.text, lineHeight: 1.5, marginBottom: 4 },
  muted: { fontSize: 9, color: COLORS.muted },
  kpiRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
  kpi: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 10,
  },
  kpiLabel: { fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  kpiValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: COLORS.primary, marginTop: 4 },
  kpiSub: { fontSize: 9, color: COLORS.muted, marginTop: 2 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    alignSelf: 'flex-start',
  },
  shortlistCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  shortlistHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rank: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.accent },
  paName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: COLORS.primary },
  listItem: { fontSize: 9, marginBottom: 2, color: COLORS.text },
  bulletOk: { color: COLORS.success, fontFamily: 'Helvetica-Bold' },
  bulletGap: { color: COLORS.warning, fontFamily: 'Helvetica-Bold' },
  bulletUnk: { color: COLORS.muted, fontFamily: 'Helvetica-Bold' },
  matrixRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 4,
  },
  matrixHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.light,
    paddingVertical: 4,
    fontFamily: 'Helvetica-Bold',
  },
  matrixCellLabel: { flex: 2, fontSize: 9, paddingHorizontal: 4 },
  matrixCell: { flex: 1, fontSize: 9, textAlign: 'center', paddingHorizontal: 4 },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 45,
    right: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
  },
  footerText: { fontSize: 8, color: COLORS.muted },
  disclaimer: {
    backgroundColor: COLORS.light,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    padding: 12,
    marginTop: 12,
  },
});

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function bandColor(band: Mission['complexity_band']): string {
  switch (band) {
    case 'simple':
      return COLORS.success;
    case 'moderate':
      return COLORS.warning;
    case 'high':
      return COLORS.accent;
    case 'critical':
      return COLORS.danger;
    default:
      return COLORS.muted;
  }
}

function bandLabel(band: Mission['complexity_band']): string {
  switch (band) {
    case 'simple':
      return 'Simple';
    case 'moderate':
      return 'Modérée';
    case 'high':
      return 'Élevée';
    case 'critical':
      return 'Critique';
    default:
      return 'N/A';
  }
}

function getAnswerLabel(questionId: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Non renseigné';
  const q = QUESTIONNAIRE_CONFIG.questions.find((x) => x.id === questionId);
  if (!q || !q.options) return String(value);

  if (Array.isArray(value)) {
    return value
      .map((v) => q.options!.find((o) => o.value === v)?.label ?? String(v))
      .join(', ');
  }
  return q.options.find((o) => o.value === value)?.label ?? String(value);
}

// ---------------------------------------------------------------------------
// DOCUMENT
// ---------------------------------------------------------------------------

interface DocProps {
  mission: Mission;
}

function ReportDocument({ mission }: DocProps) {
  const generatedAt = formatDate(new Date().toISOString());
  const shortlist = mission.shortlist ?? [];
  const top3 = shortlist.slice(0, 3);
  const complexityBandColor = bandColor(mission.complexity_band);

  const h = React.createElement;

  // PAGE 1 — Résumé exécutif
  const page1 = h(Page, { size: 'A4', style: styles.page, key: 'p1' },
    h(View, { style: styles.header },
      h(Text, { style: styles.h1 }, 'Rapport de pré-diagnostic PA'),
      h(Text, { style: styles.subtitle }, mission.client_name),
      h(Text, { style: styles.meta }, `Secteur : ${mission.client_sector} · Généré le ${generatedAt}`),
    ),
    h(Text, { style: styles.h2 }, 'Résumé exécutif'),
    h(Text, { style: styles.p },
      `Ce pré-diagnostic identifie le niveau de complexité de la mise en conformité de ${mission.client_name} à la réforme DGFiP de facturation électronique B2B, et propose une shortlist indicative de Plateformes Agréées.`
    ),
    h(View, { style: styles.kpiRow },
      h(View, { style: styles.kpi },
        h(Text, { style: styles.kpiLabel }, 'Score de complexité'),
        h(Text, { style: [styles.kpiValue, { color: complexityBandColor }] },
          `${mission.complexity_score ?? 'N/A'}${mission.complexity_score !== undefined ? ' / 100' : ''}`
        ),
        h(Text, { style: styles.kpiSub }, `Bande : ${bandLabel(mission.complexity_band)}`),
      ),
      h(View, { style: styles.kpi },
        h(Text, { style: styles.kpiLabel }, 'Lead time estimé'),
        h(Text, { style: styles.kpiValue },
          mission.lead_time_weeks_min
            ? `${mission.lead_time_weeks_min}-${mission.lead_time_weeks_max}`
            : 'N/A'
        ),
        h(Text, { style: styles.kpiSub }, 'semaines'),
      ),
      h(View, { style: styles.kpi },
        h(Text, { style: styles.kpiLabel }, 'PA shortlistées'),
        h(Text, { style: styles.kpiValue }, `${shortlist.length}`),
        h(Text, { style: styles.kpiSub }, 'sur 10 évaluées'),
      ),
    ),
    h(Text, { style: styles.h2 }, 'Profil SI synthétique'),
    ...['erp_main', 'accounting_software', 'p2p_tool', 'invoice_format_out', 'archiving', 'has_b2g', 'volume_emitted', 'volume_received']
      .map((qid) =>
        h(View, { key: qid, style: { marginBottom: 4 } },
          h(Text, { style: styles.muted },
            (QUESTIONNAIRE_CONFIG.questions.find((q) => q.id === qid)?.label ?? qid) + ' :'
          ),
          h(Text, { style: styles.p }, getAnswerLabel(qid, mission.answers[qid as keyof typeof mission.answers]))
        )
      ),
    h(View, { style: styles.footer, fixed: true },
      h(Text, { style: styles.footerText }, `${mission.client_name} — Pré-diagnostic PA — DRAFT`),
      h(Text, { style: styles.footerText, render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber} / ${totalPages}` }),
    ),
  );

  // PAGE 2 — Shortlist détaillée
  const page2 = h(Page, { size: 'A4', style: styles.page, key: 'p2' },
    h(Text, { style: styles.h1 }, 'Shortlist détaillée'),
    h(Text, { style: styles.muted }, `Top ${top3.length} PA identifiées selon vos priorités`),
    ...top3.map((entry: ShortlistEntry) =>
      h(View, { key: entry.pa_id, style: styles.shortlistCard },
        h(View, { style: styles.shortlistHeader },
          h(View, null,
            h(Text, { style: styles.rank }, `#${entry.rank}`),
            h(Text, { style: styles.paName }, entry.pa_name),
          ),
          h(Text, { style: [styles.kpiValue, { fontSize: 14 }] }, `${entry.coverage_score}%`),
        ),
        h(Text, { style: styles.h3 }, 'Forces'),
        ...(entry.strengths.length > 0
          ? entry.strengths.map((s, i) =>
              h(Text, { key: `s${i}`, style: styles.listItem }, `✓  ${s}`)
            )
          : [h(Text, { key: 'none-s', style: styles.muted }, 'Aucune force majeure identifiée.')]),
        h(Text, { style: [styles.h3, { marginTop: 8 }] }, 'Gaps'),
        ...(entry.gaps.length > 0
          ? entry.gaps.map((g, i) =>
              h(Text, { key: `g${i}`, style: styles.listItem }, `~  ${g}`)
            )
          : [h(Text, { key: 'none-g', style: styles.muted }, 'Aucun gap critique identifié.')]),
        h(Text, { style: [styles.h3, { marginTop: 8 }] }, 'À valider via RFI'),
        ...(entry.unknown_features.length > 0
          ? entry.unknown_features.map((u, i) =>
              h(Text, { key: `u${i}`, style: styles.listItem }, `?  ${u}`)
            )
          : [h(Text, { key: 'none-u', style: styles.muted }, 'Données suffisantes.')]),
      )
    ),
    h(View, { style: styles.footer, fixed: true },
      h(Text, { style: styles.footerText }, `${mission.client_name} — Pré-diagnostic PA — DRAFT`),
      h(Text, { style: styles.footerText, render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber} / ${totalPages}` }),
    ),
  );

  // PAGE 3 — Disclaimer
  const page3 = h(Page, { size: 'A4', style: styles.page, key: 'p3' },
    h(Text, { style: styles.h1 }, 'Méthodologie & disclaimer'),
    h(View, { style: styles.disclaimer },
      h(Text, { style: styles.h3 }, 'Document à portée indicative'),
      h(Text, { style: styles.p },
        'Ce rapport constitue un pré-diagnostic basé sur les réponses fournies au questionnaire et sur des données publiques non validées par les Plateformes Agréées. Il ne se substitue pas à une analyse approfondie du SI ni à une démarche RFI/RFP formelle auprès des éditeurs.'
      ),
      h(Text, { style: [styles.p, { marginTop: 6 }] },
        'Les scores de couverture reflètent un matching entre vos exigences et des capacités déclarées par les PA sur leurs sites et communications publiques. La fiabilité des données est marquée "indicative" ou "unverified" tant qu\'elle n\'a pas été confirmée par la PA elle-même.'
      ),
    ),
    h(Text, { style: styles.h2 }, 'Prochaines étapes recommandées'),
    h(Text, { style: styles.listItem }, '1. Envoi d\'un RFI aux 3 PA shortlistées pour valider les capacités indicatives'),
    h(Text, { style: styles.listItem }, '2. Démo produit centrée sur vos flux spécifiques (volumes, exceptions, ERP)'),
    h(Text, { style: styles.listItem }, '3. Chiffrage détaillé : licence + mise en œuvre + run sur 3 ans'),
    h(Text, { style: styles.listItem }, '4. Validation DSI / DPO sur hébergement et certifications'),
    h(View, { style: styles.footer, fixed: true },
      h(Text, { style: styles.footerText }, `${mission.client_name} — Pré-diagnostic PA — DRAFT`),
      h(Text, { style: styles.footerText, render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `${pageNumber} / ${totalPages}` }),
    ),
  );

  return h(Document,
    {
      title: `Pré-diagnostic PA — ${mission.client_name}`,
      author: 'PA Selection Studio',
      subject: 'Rapport de sélection Plateforme Agréée',
    },
    page1, page2, page3
  );
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

export async function generateMissionReport(mission: Mission): Promise<Buffer> {
  const element = ReportDocument({ mission }) as unknown as Parameters<typeof renderToBuffer>[0];
  return renderToBuffer(element);
}

export function buildReportFilename(mission: Mission): string {
  const client = (mission.client_name || 'client')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
  const date = new Date().toISOString().slice(0, 10);
  return `pa-prediag_${client}_${date}.pdf`;
}
