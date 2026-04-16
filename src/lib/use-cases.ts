/**
 * lib/use-cases.ts
 *
 * Catalogue des use cases métier PA Qualifier.
 * Module pur, stateless, sans dépendance React.
 *
 * Les use cases sélectionnés :
 *  - filtrent les critères évalués dans la Gap Analysis
 *  - pondèrent la grille de scoring
 *  - génèrent les questions RFI ciblées (P3)
 */

import type { ClientProfile, DiscoveryAnswers, UseCase, CustomUseCase } from './types';

// ---------------------------------------------------------------------------
// CATALOGUE
// ---------------------------------------------------------------------------

export const PREDEFINED_USE_CASES: UseCase[] = [

  // ── CORE ────────────────────────────────────────────────────────────────
  {
    id: 'emission_factures',
    category: 'core',
    label: 'Émission de factures',
    description: 'Envoi de factures électroniques à vos clients B2B',
    requires_coverage: ['emission'],
    auto_select: () => true,
  },
  {
    id: 'reception_factures',
    category: 'core',
    label: 'Réception de factures',
    description: 'Réception des factures de vos fournisseurs',
    requires_coverage: ['reception'],
    auto_select: () => true,
  },
  {
    id: 'e_reporting',
    category: 'core',
    label: 'E-reporting',
    description:
      "Transmission des données de transaction à la DGFiP (flux non couverts par e-invoicing)",
    requires_coverage: ['e_reporting'],
    auto_select: () => true,
  },

  // ── COMPLEX ─────────────────────────────────────────────────────────────
  {
    id: 'gestion_avoirs',
    category: 'complex',
    label: 'Gestion des avoirs / notes de crédit',
    description: "Émission et réception d'avoirs, cycle de vie complet",
    requires_coverage: ['avoirs'],
    scoring_weight_impact: { functional_coverage: 5 },
    auto_select: (_profile, answers) => !!answers.has_avoirs,
  },
  {
    id: 'workflow_validation',
    category: 'complex',
    label: "Workflow de validation (circuit d'approbation)",
    description: 'Validation des factures fournisseurs avant paiement, multi-niveaux',
    requires_coverage: ['workflow_approval'],
    scoring_weight_impact: { functional_coverage: 3 },
  },
  {
    id: 'gestion_litiges',
    category: 'complex',
    label: 'Gestion des litiges',
    description: 'Contestation de factures, suivi des écarts, résolution',
    requires_coverage: ['dispute_management'],
    auto_select: (_profile, answers) =>
      answers.taux_litiges_pct != null && answers.taux_litiges_pct > 5,
  },
  {
    id: 'rapprochement_3way',
    category: 'complex',
    label: 'Rapprochement 3-way (commande / BL / facture)',
    description:
      'Matching automatique entre bon de commande, bon de livraison et facture',
    requires_coverage: ['three_way_matching'],
    scoring_weight_impact: { functional_coverage: 5 },
    auto_select: (profile) =>
      profile?.naf_code
        ? ['45', '46', '51'].some((code) => profile.naf_code!.startsWith(code))
        : false,
  },
  {
    id: 'autofactures',
    category: 'complex',
    label: 'Autofactures (self-billing)',
    description: "Mécanisme où le client émet la facture au nom du fournisseur",
    requires_coverage: ['self_billing'],
    auto_select: (_profile, answers) => answers.has_autofactures === 'yes',
  },
  {
    id: 'portail_fournisseurs',
    category: 'complex',
    label: 'Portail fournisseurs',
    description:
      "Interface web pour fournisseurs sans capacité EDI (saisie manuelle, upload PDF)",
    requires_coverage: ['supplier_portal'],
    auto_select: (profile) =>
      profile?.naf_code
        ? ['45', '46', '47'].some((code) => profile.naf_code!.startsWith(code))
        : false,
  },

  // ── TECHNICAL ───────────────────────────────────────────────────────────
  {
    id: 'edi_edifact',
    category: 'technical',
    label: 'Flux EDI EDIFACT',
    description:
      'Échange de messages EDIFACT (INVOIC, ORDERS, DESADV) avec partenaires',
    requires_coverage: ['edi_edifact'],
    scoring_weight_impact: { erp_integration: 5 },
    trigger_alert: 1,
    auto_select: (_profile, answers) => !!answers.has_edi,
  },
  {
    id: 'peppol',
    category: 'technical',
    label: 'Réseau PEPPOL',
    description:
      'Émission/réception via le réseau PEPPOL BIS 3.0 (format cible réforme française)',
    requires_coverage: ['peppol'],
    auto_select: () => true,
  },
  {
    id: 'multi_siret',
    category: 'technical',
    label: 'Multi-établissements / multi-SIRET',
    description:
      'Facturation depuis plusieurs SIRET actifs, périmètre multi-sites',
    requires_coverage: ['multi_entity'],
    scoring_weight_impact: { erp_integration: 3 },
    auto_select: (profile) => (profile?.num_establishments ?? 1) > 1,
  },
  {
    id: 'archivage_probant',
    category: 'technical',
    label: 'Archivage légal probant (10 ans)',
    description:
      "Conservation des factures avec valeur probante, accès après résiliation",
    requires_coverage: ['archivage_10ans'],
    auto_select: () => true,
  },

  // ── REGULATORY ──────────────────────────────────────────────────────────
  {
    id: 'b2g_chorus',
    category: 'regulatory',
    label: 'Flux B2G — Chorus Pro',
    description:
      'Facturation électronique vers clients du secteur public via Chorus Pro',
    requires_coverage: ['b2g_chorus'],
    auto_select: (_profile, answers) => answers.has_b2g === 'yes',
  },
  {
    id: 'international',
    category: 'regulatory',
    label: 'Facturation internationale (hors France)',
    description: "Émission ou réception de factures avec partenaires étrangers",
    requires_coverage: ['international_invoicing'],
  },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Retourne les IDs des use cases à pré-cocher automatiquement selon
 * le profil enrichi et les réponses déjà fournies.
 */
export function getAutoSelectedIds(
  profile: ClientProfile | null,
  answers: Partial<DiscoveryAnswers>
): string[] {
  return PREDEFINED_USE_CASES.filter(
    (uc) => uc.auto_select?.(profile, answers) ?? false
  ).map((uc) => uc.id);
}

/**
 * Retourne les use cases sélectionnés (prédéfinis + custom).
 */
export function getSelectedUseCases(
  selectedIds: string[],
  customUseCases: CustomUseCase[]
): Array<UseCase | CustomUseCase> {
  const predefined = PREDEFINED_USE_CASES.filter((uc) =>
    selectedIds.includes(uc.id)
  );
  return [...predefined, ...customUseCases];
}

/**
 * Déduplique et retourne toutes les coverage keys requises
 * par les use cases sélectionnés.
 */
export function buildRequiredCoverageKeys(
  selectedIds: string[],
  customUseCases: CustomUseCase[]
): string[] {
  const all = getSelectedUseCases(selectedIds, customUseCases);
  return [...new Set(all.flatMap((uc) => uc.requires_coverage))];
}

/**
 * Calcule l'impact cumulé sur les pondérations de scoring
 * à partir des use cases sélectionnés.
 */
export function computeScoringWeightImpact(
  selectedIds: string[]
): Partial<Record<string, number>> {
  const impact: Partial<Record<string, number>> = {};
  for (const uc of PREDEFINED_USE_CASES) {
    if (!selectedIds.includes(uc.id) || !uc.scoring_weight_impact) continue;
    for (const [key, delta] of Object.entries(uc.scoring_weight_impact)) {
      impact[key] = (impact[key] ?? 0) + (delta ?? 0);
    }
  }
  return impact;
}

export const USE_CASE_CATEGORY_LABELS: Record<UseCase['category'], string> = {
  core:       'Flux essentiels',
  complex:    'Flux complexes',
  technical:  'Contraintes techniques',
  regulatory: 'Obligations réglementaires',
  custom:     "Cas d'usage spécifiques",
};
