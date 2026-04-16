/**
 * lib/discovery-questions.ts
 *
 * Catalogue des questions métier Niji — 43 questions structurées sur 4 phases.
 * Module pur, stateless, sans dépendance React.
 *
 * Phases :
 *   p1_discovery  — 13 questions Discovery des flux (Step wizard Phase 1)
 *   p2_evaluation — 2 questions Évaluation PA (Step wizard Phase 2)
 *   p3_rfi        — 8 questions RFI pour éditeurs (génération livrable P3)
 *   p4_codir      — 5 questions CODIR (contexte livrable P4)
 *   dsi           — 5 questions techniques DSI
 */

import type { ClientProfile, DiscoveryAnswers } from './types';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type NijiQuestionType =
  | 'text'
  | 'boolean_with_detail'
  | 'number'
  | 'number_with_detail'
  | 'select'
  | 'multi_select_with_rank';

export type NijiQuestionPhase =
  | 'p1_discovery'
  | 'p2_evaluation'
  | 'p3_rfi'
  | 'p4_codir'
  | 'dsi';

export interface NijiQuestionOption {
  value: string;
  label: string;
}

export interface NijiDiscoveryQuestion {
  id: string;
  phase: NijiQuestionPhase;
  category: string;
  question: string;
  /** Template avec placeholders [sector_label], [erp_main], etc. */
  question_template?: string;
  objectif: string;
  /** Clé dans DiscoveryAnswers (peut être une extension V2) */
  field?: keyof DiscoveryAnswers | string;
  type: NijiQuestionType;
  options?: NijiQuestionOption[];
  /** N° du piège déclenché si la réponse est risquée */
  trigger_alert?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Hint dynamique affiché sous la question */
  dynamic_hint?: (profile: ClientProfile | null) => string | null;
  /** Surcharge complète du texte de la question selon le profil */
  dynamic_question?: (profile: ClientProfile | null) => string | null;
  /** Masquer la question si condition non remplie */
  show_if?: (
    profile: ClientProfile | null,
    answers: Partial<DiscoveryAnswers>
  ) => boolean;
}

// ---------------------------------------------------------------------------
// PHASE 1 — Discovery des flux (13 questions)
// ---------------------------------------------------------------------------

export const DISCOVERY_QUESTIONS: NijiDiscoveryQuestion[] = [
  {
    id: 'erp_system',
    phase: 'p1_discovery',
    category: 'ERP / Systèmes',
    question:
      "Quel est votre système de gestion actuel — ERP, outil de facturation, ou les deux ? Quelle version ?",
    objectif: "Identifier immédiatement les PA compatibles (connecteur natif)",
    field: 'erp_main',
    type: 'text',
    dynamic_hint: (profile) =>
      profile?.naf_code
        ? `Secteur ${profile.naf_label ?? profile.naf_code} — certains ERP sont dominants dans ce secteur`
        : null,
  },
  {
    id: 'existing_pa_connector',
    phase: 'p1_discovery',
    category: 'ERP / Systèmes',
    question:
      "Avez-vous déjà un connecteur ou une intégration avec une PA en place ou en cours d'évaluation ?",
    objectif: "Détecter si un choix implicite existe déjà",
    field: 'has_existing_pa_connector',
    type: 'boolean_with_detail',
  },
  {
    id: 'ecosystem_suppliers_clients',
    phase: 'p1_discovery',
    category: 'Écosystème',
    question:
      "Parmi vos 10 principaux fournisseurs et 10 principaux clients, lesquels ont déjà une PA ou une capacité EDI ?",
    objectif: "Évaluer les flux contraints et la compatibilité amont/aval",
    field: 'ecosystem_edi_capability',
    type: 'text',
  },
  {
    id: 'team_involvement',
    phase: 'p1_discovery',
    category: 'Opérationnel',
    question:
      "Qui dans vos équipes opérations/comptabilité a participé à ce benchmark, et qui sera l'utilisateur final ?",
    objectif: "Identifier les biais et les besoins réels terrain",
    field: 'team_benchmark_participants',
    type: 'text',
    trigger_alert: 7,
  },
  {
    id: 'volume',
    phase: 'p1_discovery',
    category: 'Volumétrie',
    question:
      "Combien de factures émettez-vous et recevez-vous par mois ? Y a-t-il une saisonnalité marquée ?",
    objectif: "Dimensionner et qualifier les PA viables",
    field: 'volume_emis_mensuel',
    type: 'number_with_detail',
  },
  {
    id: 'exceptions',
    phase: 'p1_discovery',
    category: 'Flux complexes',
    question:
      "Quel est votre taux de litiges et d'avoirs ? Qui les initie — vous ou vos clients/fournisseurs ?",
    objectif: "Évaluer la maturité requise sur la gestion des exceptions",
    field: 'taux_litiges_pct',
    type: 'number_with_detail',
  },
  {
    id: 'b2g_autofactures',
    phase: 'p1_discovery',
    category: 'Flux complexes',
    question:
      "Avez-vous des flux Chorus Pro (facturation à des clients publics) ? Des autofactures avec certains fournisseurs ?",
    objectif: "Détecter des cas d'usage non couverts par des PA standard",
    field: 'has_b2g',
    type: 'boolean_with_detail',
  },
  {
    id: 'multi_sites',
    phase: 'p1_discovery',
    category: 'Multi-sites',
    question:
      "La facturation est-elle centralisée ou fait-elle intervenir plusieurs établissements séparément ?",
    objectif: "Qualifier le périmètre d'intégration (1 SIRET ou plusieurs ?)",
    field: 'nb_siret_actifs',
    type: 'number',
    dynamic_question: (profile) =>
      profile?.num_establishments && profile.num_establishments > 1
        ? `La facturation est-elle centralisée ou font intervenir vos ${profile.num_establishments} établissements séparément ?`
        : null,
  },
  {
    id: 'archivage',
    phase: 'p1_discovery',
    category: 'Archivage',
    question:
      "Comment archivez-vous vos factures actuellement ? Sur quelle durée ? Quel système ?",
    objectif: "Anticiper les exigences d'archivage probant (10 ans minimum)",
    field: 'archivage_systeme',
    type: 'text',
  },
  {
    id: 'benchmark_freshness',
    phase: 'p1_discovery',
    category: 'Benchmark existant',
    question:
      "Les données de votre benchmark ont-elles été mises à jour après septembre 2025 ? Certaines PA ont été rachetées ou modifié leur roadmap.",
    objectif: "Évaluer la fraîcheur des données du benchmark historique",
    field: 'benchmark_last_updated',
    type: 'select',
    options: [
      { value: 'post_sept_2025', label: 'Oui — mis à jour après sept. 2025' },
      { value: 'partial', label: 'Partiellement — certaines données récentes' },
      { value: 'pre_2025', label: 'Non — données antérieures à 2025' },
      { value: 'unknown', label: 'Inconnu' },
    ],
    trigger_alert: 3,
  },
  {
    id: 'benchmark_validation',
    phase: 'p1_discovery',
    category: 'Benchmark existant',
    question:
      "Pour chaque PA shortlistée : la fonctionnalité a-t-elle été validée sur un projet réel dans votre secteur ? Avez-vous une référence client ?",
    objectif: "Distinguer fonctionnalités déclarées vs validées en production",
    field: 'benchmark_validated_references',
    type: 'text',
  },
  {
    id: 'codir_priorities',
    phase: 'p1_discovery',
    category: 'Priorités',
    question:
      "Quels sont les critères non négociables pour votre CODIR : délai, coût, intégration ERP, souveraineté des données ou autre ?",
    objectif: "Aligner la pondération de la grille de scoring sur les vraies priorités",
    field: 'codir_priorities_ranked',
    type: 'multi_select_with_rank',
    options: [
      { value: 'lead_time', label: 'Délai / Lead time' },
      { value: 'cost', label: 'Coût' },
      { value: 'erp_integration', label: 'Intégration ERP native' },
      { value: 'security_sovereignty', label: 'Souveraineté données' },
      { value: 'functional_coverage', label: 'Fonctionnel' },
      { value: 'support_quality', label: 'SLA / Support' },
    ],
  },
];

// ---------------------------------------------------------------------------
// PHASE 2 — Questions d'évaluation PA (2 questions)
// ---------------------------------------------------------------------------

export const PA_EVALUATION_QUESTIONS: NijiDiscoveryQuestion[] = [
  {
    id: 'pa_immatriculation',
    phase: 'p2_evaluation',
    category: 'Immatriculation',
    question:
      "Pour chaque PA retenue : immatriculation définitive ou sous réserve ? Date obtenue ?",
    objectif: "Éliminer les PA à risque pour un go-live sept. 2026",
    type: 'text',
    trigger_alert: 4,
  },
  {
    id: 'pa_hosting',
    phase: 'p2_evaluation',
    category: 'Hébergement',
    question:
      "Où sont hébergées les données de chaque PA shortlistée ? Quelle certification ISO 27001 ?",
    objectif: "Appliquer le critère éliminatoire souveraineté",
    field: 'data_hosting',
    type: 'text',
    trigger_alert: 5,
  },
];

// ---------------------------------------------------------------------------
// PHASE 3 — Questions RFI pour les éditeurs PA (8 questions)
// ---------------------------------------------------------------------------

export const RFI_QUESTIONS_FOR_EDITORS: NijiDiscoveryQuestion[] = [
  {
    id: 'rfi_immatriculation',
    phase: 'p3_rfi',
    category: 'Immatriculation',
    question:
      "Quelle est votre date d'immatriculation définitive DGFiP ? Si 'sous réserve' : à quelle date estimez-vous l'obtention ?",
    objectif: "Obtenir un engagement écrit sur la capacité à opérer au 1er sept. 2026",
    type: 'text',
  },
  {
    id: 'rfi_contract',
    phase: 'p3_rfi',
    category: 'Contrat',
    question:
      "Pouvez-vous partager un contrat-type ? Quelles sont vos clauses de portabilité des données et de résiliation anticipée ?",
    objectif: "Évaluer les risques de lock-in et de sortie",
    type: 'text',
  },
  {
    id: 'rfi_references',
    phase: 'p3_rfi',
    category: 'Références',
    question:
      "Avez-vous des références clients dans le secteur [sector_label] ? Contact disponible pour échange ?",
    question_template:
      "Avez-vous des références clients dans le secteur [sector_label] ? Contact disponible pour échange ?",
    objectif: "Vérifier l'adéquation sectorielle de la PA",
    type: 'text',
  },
  {
    id: 'rfi_lead_time',
    phase: 'p3_rfi',
    category: 'Lead time',
    question:
      "Pour un profil similaire ([volume]/mois, [erp_main], [nb_siret] établissements), quel est le délai contractuel entre signature et premier flux en production ? Donnez 3 références récentes.",
    question_template:
      "Pour un profil similaire ([volume]/mois, [erp_main], [nb_siret] établissements), quel est le délai contractuel entre signature et premier flux en production ? Donnez 3 références récentes.",
    objectif: "Obtenir une estimation réaliste et contractualisable",
    type: 'text',
  },
  {
    id: 'rfi_connector',
    phase: 'p3_rfi',
    category: 'Connecteur',
    question:
      "Décrivez précisément le mécanisme d'intégration avec [erp_main version erp_version] : connecteur natif certifié, API REST, flux fichier ? Périmètre couvert (émis + reçus + avoirs + e-reporting) ?",
    question_template:
      "Décrivez précisément le mécanisme d'intégration avec [erp_main version erp_version] : connecteur natif certifié, API REST, flux fichier ? Périmètre couvert (émis + reçus + avoirs + e-reporting) ?",
    objectif: "Lever l'ambiguïté sur le périmètre du connecteur",
    type: 'text',
    trigger_alert: 1,
  },
  {
    id: 'rfi_pricing',
    phase: 'p3_rfi',
    category: 'Tarification',
    question:
      "Quel est votre modèle tarifaire exact pour [volume]/mois ? Coût setup, abonnement mensuel, coût à la facture, options supplémentaires ?",
    question_template:
      "Quel est votre modèle tarifaire exact pour [volume]/mois ? Coût setup, abonnement mensuel, coût à la facture, options supplémentaires ?",
    objectif: "Calculer le TCO réel sur 3 ans",
    type: 'text',
  },
  {
    id: 'rfi_continuity',
    phase: 'p3_rfi',
    category: 'Continuité',
    question:
      "Que se passe-t-il pour nos données et notre conformité si vous perdez votre immatriculation ou si vous êtes rachetés ?",
    objectif: "Évaluer le risque de continuité et la clause d'exit",
    type: 'text',
  },
  {
    id: 'rfi_commitment',
    phase: 'p3_rfi',
    category: 'Engagement',
    question:
      "Pouvez-vous vous engager contractuellement sur une date de go-live ? Avec quelles pénalités en cas de retard ?",
    objectif: "Transformer l'estimation en engagement contractuel",
    type: 'text',
  },
];

// ---------------------------------------------------------------------------
// PHASE CODIR — Questions à préparer (5 questions)
// ---------------------------------------------------------------------------

export const CODIR_QUESTIONS: NijiDiscoveryQuestion[] = [
  {
    id: 'codir_erp_default',
    phase: 'p4_codir',
    category: 'CODIR',
    question:
      "Pourquoi cette PA plutôt que celle recommandée par notre intégrateur ERP ?",
    objectif: "Avoir une réponse documentée basée sur le scoring et les critères éliminatoires",
    type: 'text',
  },
  {
    id: 'codir_risk',
    phase: 'p4_codir',
    category: 'CODIR',
    question:
      "Quel est le risque concret si la PA n'est pas prête le 1er septembre ? Quelle est notre exposition légale ?",
    objectif: "Anticiper la question avant qu'elle ne soit posée",
    type: 'text',
  },
  {
    id: 'codir_reversibility',
    phase: 'p4_codir',
    category: 'CODIR',
    question:
      "Peut-on changer de PA après si ça ne convient pas ? À quel coût et délai ?",
    objectif: "Préparer la réponse sur l'exit clause et la portabilité",
    type: 'text',
  },
  {
    id: 'codir_total_cost',
    phase: 'p4_codir',
    category: 'CODIR',
    question:
      "Combien coûte le projet au total — pas juste la PA, mais aussi l'intégration, la formation, le pilote ?",
    objectif: "Distinguer coût de la PA vs coût du projet complet",
    type: 'text',
  },
  {
    id: 'codir_scoring_validation',
    phase: 'p4_codir',
    category: 'CODIR',
    question:
      "Pondérations de la grille à valider en CODIR avant l'envoi du RFP — [scoring_weights_summary] — êtes-vous alignés sur ces priorités ?",
    question_template:
      "Pondérations de la grille à valider en CODIR avant l'envoi du RFP — [scoring_weights_summary] — êtes-vous alignés sur ces priorités ?",
    objectif: "Aligner toutes les parties prenantes AVANT d'évaluer les PA",
    type: 'text',
  },
];

// ---------------------------------------------------------------------------
// PHASE DSI — Questions techniques (5 questions)
// ---------------------------------------------------------------------------

export const DSI_QUESTIONS: NijiDiscoveryQuestion[] = [
  {
    id: 'erp_version_detail',
    phase: 'dsi',
    category: 'Architecture',
    question:
      "Quelle est la version exacte de votre ERP et son mode de déploiement (on-premise, cloud, hybride) ?",
    objectif: "Identifier les contraintes d'intégration (API disponibles, connecteurs certifiés)",
    field: 'erp_version',
    type: 'text',
  },
  {
    id: 'middleware',
    phase: 'dsi',
    category: 'Architecture',
    question:
      "Avez-vous un middleware ou une couche d'intégration existante (SAP PI/PO, BTP, MuleSoft, autre) ?",
    objectif: "Évaluer si un connecteur natif PA peut s'appuyer sur l'existant",
    field: 'has_middleware',
    type: 'boolean_with_detail',
  },
  {
    id: 'edi_flows',
    phase: 'dsi',
    category: 'EDI',
    question:
      "Avez-vous des flux EDI actifs avec certains fournisseurs ou clients ? Quels formats (EDIFACT, PRICAT, ORDERS) ?",
    objectif: "Détecter les flux qui devront continuer sans interruption",
    field: 'has_edi',
    type: 'boolean_with_detail',
    show_if: (profile) =>
      profile?.naf_code
        ? ['45', '46', '47', '28', '29'].some((code) =>
            profile.naf_code!.startsWith(code)
          )
        : false,
  },
  {
    id: 'it_owner',
    phase: 'dsi',
    category: 'Ressources',
    question:
      "Qui est le responsable SI en charge de ce projet ? Quelle est sa disponibilité pour le projet d'intégration ?",
    objectif: "Estimer la capacité interne à piloter l'intégration technique",
    field: 'it_owner_availability',
    type: 'text',
    trigger_alert: 7,
  },
  {
    id: 'it_freeze',
    phase: 'dsi',
    category: 'Calendrier',
    question:
      "Avez-vous des fenêtres de gel des développements (freeze IT) avant septembre 2026 ?",
    objectif: "Anticiper les contraintes du calendrier d'intégration",
    field: 'has_it_freeze',
    type: 'boolean_with_detail',
  },
];

// ---------------------------------------------------------------------------
// ALL QUESTIONS — catalogue complet
// ---------------------------------------------------------------------------

export const ALL_NIJI_QUESTIONS: NijiDiscoveryQuestion[] = [
  ...DISCOVERY_QUESTIONS,
  ...PA_EVALUATION_QUESTIONS,
  ...RFI_QUESTIONS_FOR_EDITORS,
  ...CODIR_QUESTIONS,
  ...DSI_QUESTIONS,
];
