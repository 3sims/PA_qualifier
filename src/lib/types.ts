/**
 * lib/types.ts
 *
 * SOURCE DE VERITE — Toutes les interfaces TypeScript partagées.
 * Ne jamais dupliquer ces types ailleurs dans le codebase.
 */

// ---------------------------------------------------------------------------
// DOMAIN PRIMITIVES
// ---------------------------------------------------------------------------

export type CompanySize = 'TPE' | 'PME' | 'ETI' | 'GE';
export type Geography = 'FRANCE' | 'EU' | 'INTL';
export type Deadline = '<3mois' | '3-6mois' | '6-12mois' | '>12mois';
export type InvoiceVolume = '<100' | '100-500' | '500-2000' | '2000-10000' | '>10000';
export type ERPTier = 'tier1' | 'tier2' | 'niche' | 'custom' | 'none';
export type DataHosting = 'FRANCE' | 'EU' | 'INTL';
export type ComplexityBand = 'simple' | 'moderate' | 'high' | 'critical';
export type FeatureConfidence = 'official' | 'indicative' | 'unverified' | 'validated';
export type CoverageStatus = 'covered' | 'partial' | 'unknown' | 'not_covered';
export type PriorityKey =
  | 'erp_integration'
  | 'functional_coverage'
  | 'cost'
  | 'support_quality'
  | 'security_sovereignty';

// ---------------------------------------------------------------------------
// V2 — PA COVERAGE MODEL
// ---------------------------------------------------------------------------

/** Niveau de couverture fonctionnelle V2 */
export type CoverageLevel = '✓' | '~' | '?' | '✗';
/** Niveau de confiance de la donnée */
export type ConfidenceLevel = 'official' | 'indicative' | 'unverified';

/** Objet de couverture structuré par feature (remplace l'ancien tableau capabilities) */
export interface PAV2Coverage {
  emission: CoverageLevel;
  emission_confidence: ConfidenceLevel;
  reception: CoverageLevel;
  reception_confidence: ConfidenceLevel;
  avoirs: CoverageLevel;
  avoirs_confidence: ConfidenceLevel;
  e_reporting: CoverageLevel;
  e_reporting_confidence: ConfidenceLevel;
  b2g_chorus: CoverageLevel;
  b2g_chorus_confidence: ConfidenceLevel;
  edi_edifact: CoverageLevel;
  edi_edifact_confidence: ConfidenceLevel;
  peppol: CoverageLevel;
  peppol_confidence: ConfidenceLevel;
  archivage_10ans: CoverageLevel;
  archivage_10ans_confidence: ConfidenceLevel;
  iso27001?: CoverageLevel;
  iso27001_confidence?: ConfidenceLevel;
  api_rest?: CoverageLevel;
  api_rest_confidence?: ConfidenceLevel;
  support_fr?: CoverageLevel;
  support_fr_confidence?: ConfidenceLevel;
  // Index signature pour accès dynamique via feature key
  [key: string]: CoverageLevel | ConfidenceLevel | undefined;
}

/** Intégration ERP V2 — structure enrichie */
export interface PAERPIntegrationV2 {
  erp_id: string;
  erp_name: string;
  integration_type: 'native' | 'api' | 'certified_partner' | 'connector';
  connector_version?: string;
  coverage: ('emis' | 'recus' | 'avoirs')[];
  doc_url?: string;
  last_verified?: string;
}

// ---------------------------------------------------------------------------
// V2 — CONTEXT & ENRICHMENT
// ---------------------------------------------------------------------------

/** Origine d'une PA dans le contexte de la session */
export type PASource = 'client' | 'app' | 'both';

/** Vue courante de la page résultats */
export type ViewMode = 'client' | 'consultant';

/** Profil client enrichi par LLM */
export interface ClientProfile {
  legal_name: string | null;
  trade_name: string | null;
  siren: string | null;
  creation_date: string | null;
  capital: string | null;
  headquarters: string | null;
  naf_code: string | null;
  naf_label: string | null;
  convention_collective: string | null;
  num_establishments: number | null;
  regulatory_category: 'GE' | 'ETI' | 'PME' | 'TPE' | null;
  regulatory_category_confidence: 'confirmed' | 'estimated' | 'unknown';
  emission_deadline: string | null;
  reception_deadline: string | null;
  sector_label: string | null;
  typical_b2b_flows: string[];
  sector_specific_constraints: string[];
  fields_to_confirm: string[];
  enrichment_date: string;
  data_sources: string[];
  confidence_score: number;
  /** true si le LLM a retourné une raison sociale incohérente avec le nom saisi */
  hallucination_detected?: boolean;
}

/** Alerte contextuelle (7 Pièges) */
export interface ContextualAlert {
  piege_id: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  severity: 'warning' | 'critical' | 'info';
  step: 0 | 1 | 2 | 3 | 4 | 5 | 'results';
  title: string;
  message: string;
  situation_concrete?: string;
  regle: string;
  detail?: string;
}

/** Hint d'atelier pour le guide animateur */
export interface WorkshopHint {
  question: string;
  objectif: string;
  phase: 'p0_profil' | 'p1_discovery' | 'p2_gap' | 'p3_rfi' | 'p4_rfp' | 'diagnostic_si';
  formulation_example?: string;
}

/** Estimation de lead time */
export interface LeadTimeEstimate {
  min_weeks: number;
  max_weeks: number;
  scenario: 'native' | 'api' | 'custom';
  assumption: string;
}

/** Risque spécifique client (LLM-assisted) */
export interface ClientSpecificRisk {
  id: string;
  title: string;
  description: string;
  probability: 'faible' | 'modérée' | 'élevée';
  impact: 'faible' | 'modéré' | 'critique';
  risk_score: number;
  mitigation_actions: string[];
  mitigation_owner: string;
  mitigation_deadline: string;
}

// ---------------------------------------------------------------------------
// USE CASES
// ---------------------------------------------------------------------------

export interface UseCase {
  id: string;
  category: 'core' | 'complex' | 'technical' | 'regulatory' | 'custom';
  label: string;
  description: string;
  requires_coverage: string[];
  scoring_weight_impact?: Partial<Record<PriorityKey, number>>;
  trigger_alert?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  auto_select?: (profile: ClientProfile | null, answers: Partial<DiscoveryAnswers>) => boolean;
}

export interface CustomUseCase {
  id: string;
  category: 'custom';
  label: string;
  description?: string;
  requires_coverage: string[];
}

/** État global du wizard V2 */
export interface WizardState {
  client_profile?: ClientProfile;
  client_pa_shortlist: string[];
  pa_in_context: PAInContext[];
  answers: Partial<DiscoveryAnswers>;
  livrables: {
    p1?: string;
    p2?: string;
    p3?: string;
    p4?: string;
    p5?: string;
    p6?: string;
  };
  use_cases: {
    selected_ids: string[];
    custom: CustomUseCase[];
  };
  view_mode?: ViewMode;
}

// ---------------------------------------------------------------------------
// DISCOVERY ANSWERS (23 questions)
// ---------------------------------------------------------------------------

export interface DiscoveryAnswers {
  // Étape 1 — Contexte
  company_size: CompanySize;
  sector: string;
  nb_entities: '1' | '2-5' | '6-20' | '20+';
  geography: Geography;
  deadline: Deadline;
  // Étape 2 — Architecture SI
  erp_main: string;
  erp_tier: ERPTier;
  erp_version?: string;
  accounting_software: string;
  p2p_tool: string;
  invoice_format_out: 'PDF' | 'EDI' | 'mixed' | 'other';
  archiving: 'GED' | 'SAE' | 'none' | 'tbd';
  has_od_sc: 'yes' | 'no' | 'in_progress';
  has_middleware?: boolean;
  has_edi?: boolean;
  // Étape 3 — Flux
  volume_emitted: InvoiceVolume;
  volume_received: InvoiceVolume;
  volume_emis_mensuel?: number;
  exception_rate: '<5%' | '5-15%' | '15-30%' | '>30%';
  taux_litiges_pct?: number;
  nb_approvers: '1' | '2-3' | '4+' | 'variable';
  has_b2g: 'yes' | 'no' | 'future';
  has_autofactures: 'yes' | 'no' | 'tbd';
  has_avoirs?: boolean;
  nb_siret_actifs?: number;
  archivage_systeme?: string;
  // Étape 4 — Contraintes
  data_hosting: DataHosting;
  certifications: string[];
  archiving_probant: 'yes' | 'no' | 'tbd';
  budget_monthly: '<500' | '500-2k' | '2k-5k' | '>5k' | 'undefined';
  internal_resources: 'dedicated' | 'partial' | 'none';
  it_owner_availability?: string;
  has_it_freeze?: boolean;
  // Étape 5 — Priorités (ordre par importance, index 0 = plus important)
  priorities: PriorityKey[];
  codir_priorities_ranked?: string[];
  // Benchmark & écosystème
  has_existing_pa_connector?: boolean;
  ecosystem_edi_capability?: string;
  team_benchmark_participants?: string;
  benchmark_last_updated?: 'post_sept_2025' | 'partial' | 'pre_2025' | 'unknown';
  benchmark_validated_references?: string;
}

// ---------------------------------------------------------------------------
// QUESTION CONFIG TYPES
// ---------------------------------------------------------------------------

export type QuestionType =
  | 'radio'
  | 'select'
  | 'multiselect'
  | 'ranking'
  | 'text';

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface Question {
  id: keyof DiscoveryAnswers;
  step: 1 | 2 | 3 | 4 | 5;
  type: QuestionType;
  label: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[];
  searchable?: boolean; // for select with long lists (ERP)
}

export interface QuestionStep {
  id: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
}

export interface QuestionnaireConfig {
  version: string;
  steps: QuestionStep[];
  questions: Question[];
}

// ---------------------------------------------------------------------------
// MISSION & RESULTS
// ---------------------------------------------------------------------------

export interface ShortlistEntry {
  pa_id: string;
  pa_name: string;
  rank: number;
  coverage_score: number;
  strengths: string[];
  gaps: string[];
  unknown_features: string[];
  /** Source de la PA dans la session (client, app, ou both) */
  pa_source?: PASource;
}

export interface Mission {
  id: string;
  client_name: string;
  client_sector: string;
  status: 'draft' | 'in_progress' | 'completed';
  answers: Partial<DiscoveryAnswers>;
  complexity_score?: number;
  complexity_band?: ComplexityBand;
  lead_time_weeks_min?: number;
  lead_time_weeks_max?: number;
  shortlist?: ShortlistEntry[];
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// PA PROFILES (seed data)
// ---------------------------------------------------------------------------

export type PACategory =
  | 'specialist_fr'
  | 'erp_vendor'
  | 'fintech'
  | 'p2p'
  | 'tpe_pme'
  | 'international';

/** V1 capability — conservé pour rétrocompatibilité */
export interface PACapability {
  feature_key: string;
  feature_value: boolean | 'partial' | string;
  source: 'dgfip' | 'scrape' | 'rfi_response' | 'mission_validated';
  confidence: FeatureConfidence;
  last_updated: string;
}

/** V1 ERP integration — conservé pour rétrocompatibilité */
export interface PAERPIntegration {
  erp_id: string;
  integration_type: 'native' | 'api' | 'certified_partner' | 'connector';
  confidence: FeatureConfidence;
}

/** PAProfile V2 — format canonique du seed data */
export interface PAProfile {
  id: string;
  name: string;
  status: 'immatriculée' | 'en_cours' | 'radiée' | 'unknown';
  data_hosting: DataHosting | 'unknown';
  lead_time_weeks_min: number | null;
  lead_time_weeks_max: number | null;
  erp_integrations: PAERPIntegrationV2[];
  coverage: PAV2Coverage;
  last_updated: string | null;
  // Champs V1 optionnels (rétrocompatibilité)
  dgfip_id?: string;
  category?: PACategory;
  capabilities?: PACapability[];
}

/** PA dans le contexte d'une session (avec origine et état d'élimination) */
export interface PAInContext extends PAProfile {
  pa_source: PASource;
  client_benchmark_notes?: string;
  eliminated_reason?: string;
}

// ---------------------------------------------------------------------------
// FEATURE CATALOG
// ---------------------------------------------------------------------------

export interface FeatureCatalogItem {
  id: string;
  category: 'o2c' | 'p2p' | 'compliance' | 'technical' | 'support';
  name: string;
  description: string;
  weight_default: number;
  is_eliminatory: boolean;
  /** Clé dans PAV2Coverage (undefined = feature spéciale traitée manuellement) */
  coverage_key?: string;
  rfi_question_template: string;
}

// ---------------------------------------------------------------------------
// STORAGE CONTRACT
// ---------------------------------------------------------------------------

export interface StorageAdapter {
  save(key: string, data: unknown): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

// ---------------------------------------------------------------------------
// API CONTRACTS
// ---------------------------------------------------------------------------

export interface CreateMissionRequest {
  client_name: string;
  client_sector: string;
}

export interface CreateMissionResponse {
  mission: Mission;
}

export interface UpdateAnswerRequest {
  mission_id: string;
  question_id: keyof DiscoveryAnswers;
  answer_value: unknown;
}

export interface UpdateAnswerResponse {
  updated: boolean;
}

export interface AnalyzeRequest {
  mission_id: string;
}

export interface AnalyzeResponse {
  complexity_score: number;
  complexity_band: ComplexityBand;
  lead_time_min: number;
  lead_time_max: number;
  shortlist: ShortlistEntry[];
}

export interface ReportRequest {
  mission_id: string;
}
