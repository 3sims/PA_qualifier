/**
 * lib/pa-repository.ts
 *
 * Couche d'abstraction pour l'accès aux profils PA.
 * V1 : lecture depuis le fichier JSON local (pa-seed-v1.json)
 * V2 : Supabase — table `pa` de PA_selector (activé via .env.local)
 *
 * Bascule automatique : si NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (ou
 * SUPABASE_SERVICE_KEY) sont définis, SupabasePARepository est utilisé.
 * Sinon, JsonPARepository lit pa-seed-v1.json.
 *
 * Aucune route API ne doit importer pa-seed-v1.json directement.
 * Toutes les routes utilisent : import { paRepository } from '@/lib/pa-repository'
 */

import type {
  PAProfile,
  PAV2Coverage,
  PAERPIntegrationV2,
  PAExtendedFields,
  CoverageLevel,
  DataHosting,
} from './types';
import type { SupabasePARow } from './supabase';
import { supabaseAdmin } from './supabase';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface PASearchFilters {
  status?: PAProfile['status'];
  data_hosting?: PAProfile['data_hosting'];
  erp_id?: string;
  name_in?: string[];
}

export interface PARepository {
  findAll(): Promise<PAProfile[]>;
  findById(id: string): Promise<PAProfile | null>;
  findByNames(names: string[]): Promise<PAProfile[]>;
  searchByProfile(filters: PASearchFilters): Promise<PAProfile[]>;
}

// ---------------------------------------------------------------------------
// V1 — JSON file implementation (current)
// ---------------------------------------------------------------------------

class JsonPARepository implements PARepository {
  private data: PAProfile[];

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require('../data/pa-seed-v1.json') as { pa_profiles: PAProfile[] };
    this.data = raw.pa_profiles;
  }

  async findAll(): Promise<PAProfile[]> {
    return this.data;
  }

  async findById(id: string): Promise<PAProfile | null> {
    return this.data.find((pa) => pa.id === id) ?? null;
  }

  async findByNames(names: string[]): Promise<PAProfile[]> {
    const lower = names.map((n) => n.toLowerCase());
    return this.data.filter((pa) => lower.includes(pa.name.toLowerCase()));
  }

  async searchByProfile(filters: PASearchFilters): Promise<PAProfile[]> {
    return this.data.filter((pa) => {
      if (filters.status && pa.status !== filters.status) return false;
      if (filters.data_hosting && pa.data_hosting !== filters.data_hosting) return false;
      if (filters.erp_id) {
        const hasErp = pa.erp_integrations?.some((e) => e.erp_id === filters.erp_id);
        if (!hasErp) return false;
      }
      if (filters.name_in) {
        const lower = filters.name_in.map((n) => n.toLowerCase());
        if (!lower.includes(pa.name.toLowerCase())) return false;
      }
      return true;
    });
  }
}

// ---------------------------------------------------------------------------
// V2 — Supabase (table `pa` de PA_selector)
// ---------------------------------------------------------------------------

// Colonnes à sélectionner — on évite SELECT * pour limiter la bande passante
const PA_SELECT_COLUMNS = [
  'id', 'pa_slug', 'nom',
  'statut_immatriculation', 'souverainete_donnees',
  'emission_factures', 'reception_factures', 'gestion_avoirs',
  'e_reporting_transaction', 'e_reporting_paiement',
  'chorus_pro', 'traduction_edi', 'access_point_peppol',
  'archivage', 'certification_iso27001', 'api_disponible',
  'erp_natifs', 'derniere_mise_a_jour',
  'auth_double_facteur', 'signature_electronique',
  'support_ereporting_b2c', 'transformation_data_ereporting',
  'portail_fournisseur', 'utilise_ia', 'demo_possible',
  'clients_production_flux2', 'clients_production_flux3',
  'raccordement_annuaire_prod', 'extraction_non_structures',
  'nb_employes_range', 'clients_references_text',
  'workflow_validation', 'gestion_statuts',
  'cas_usage_couverture', 'cas_usage_tiers',
  'notes_de_frais_cu', 'autofacturation_cu19b',
  'configuration_initiale', 'marque_blanche',
  'pme_friendly', 'frais_setup', 'offre_gratuite',
  'tailles_cibles', 'secteurs_cibles',
].join(',');

function boolToCoverage(val: boolean | null | undefined): CoverageLevel {
  if (val === true) return '✓';
  if (val === false) return '✗';
  return '?';
}

function mapTriStateOui(val: string | null | undefined): CoverageLevel {
  if (!val) return '?';
  const v = val.toLowerCase();
  if (v === 'oui') return '✓';
  if (v === 'prochainement') return '~';
  if (v === 'non') return '✗';
  return '?';
}

function mapClientsFlux2(val: string | null | undefined): CoverageLevel {
  if (!val) return '?';
  if (val === 'oui') return '✓';
  if (val === 'tests_seulement') return '~';
  if (val === 'non') return '✗';
  return '?';
}

function mapEreportingB2c(
  val: SupabasePARow['support_ereporting_b2c']
): CoverageLevel {
  if (!val) return '?';
  if (val === 'toutes_sources') return '✓';
  if (val === 'ticket_z_seulement' || val === 'factures_b2c_seulement') return '~';
  if (val === 'pas_agrege') return '✗';
  return '?';
}

function mapTransfoEreporting(
  val: SupabasePARow['transformation_data_ereporting']
): CoverageLevel {
  if (!val) return '?';
  if (val === 'les_deux') return '✓';
  if (val === 'multiples_formats') return '~';
  if (val === 'xml_seulement') return '✗';
  return '?';
}

function mapOcrIa(val: string | null | undefined): CoverageLevel {
  if (val === null || val === undefined) return '?';
  const v = String(val).toLowerCase();
  if (v === 'ocr_ia' || v.includes('ocr')) return '✓';
  if (v === 'non' || v === 'aucun' || v === '') return '✗';
  return '~';
}

function mapNotesDeFrais(val: string | null | undefined): CoverageLevel {
  if (val === null || val === undefined) return '?';
  const v = String(val).toLowerCase();
  if (v.includes('tous')) return '✓';
  if (v.includes('non') || v.includes('aucun')) return '✗';
  return '~';
}

function mapCoverage(row: SupabasePARow): PAV2Coverage {
  const peppolMap: Record<string, CoverageLevel> = { oui: '✓', prochainement: '~', non: '✗' };
  const peppolLevel: CoverageLevel = (row.access_point_peppol ? peppolMap[row.access_point_peppol] : '?') ?? '?';

  let archivageLevel: CoverageLevel = '?';
  if (row.archivage === 'valeur_probante' || row.archivage === 'nf461') archivageLevel = '✓';
  else if (row.archivage === 'simple') archivageLevel = '~';
  else if (row.archivage === 'non') archivageLevel = '✗';

  const eReporting = (row.e_reporting_transaction || row.e_reporting_paiement) ?? null;

  return {
    emission:                  boolToCoverage(row.emission_factures),
    emission_confidence:       'indicative',
    reception:                 boolToCoverage(row.reception_factures),
    reception_confidence:      'indicative',
    avoirs:                    boolToCoverage(row.gestion_avoirs),
    avoirs_confidence:         'indicative',
    e_reporting:               boolToCoverage(eReporting),
    e_reporting_confidence:    'indicative',
    b2g_chorus:                boolToCoverage(row.chorus_pro),
    b2g_chorus_confidence:     'indicative',
    edi_edifact:               boolToCoverage(row.traduction_edi),
    edi_edifact_confidence:    'indicative',
    peppol:                    peppolLevel,
    peppol_confidence:         'indicative',
    archivage_10ans:           archivageLevel,
    archivage_10ans_confidence:'indicative',
    iso27001:                  boolToCoverage(row.certification_iso27001),
    iso27001_confidence:       'indicative',
    api_rest:                  boolToCoverage(row.api_disponible),
    api_rest_confidence:       'indicative',
    support_fr:                '?',
    support_fr_confidence:     'indicative',
    auth_2fa:                  boolToCoverage(row.auth_double_facteur),
    auth_2fa_confidence:       'indicative',
    signature_electronique:    boolToCoverage(row.signature_electronique),
    signature_electronique_confidence: 'indicative',
    portail_fournisseur:       boolToCoverage(row.portail_fournisseur),
    portail_fournisseur_confidence: 'indicative',
    utilise_ia:                boolToCoverage(row.utilise_ia),
    utilise_ia_confidence:     'indicative',
    clients_flux2:             mapClientsFlux2(row.clients_production_flux2),
    clients_flux2_confidence:  'indicative',
    clients_flux3:             boolToCoverage(row.clients_production_flux3),
    clients_flux3_confidence:  'indicative',
    ereporting_b2c:            mapEreportingB2c(row.support_ereporting_b2c),
    ereporting_b2c_confidence: 'indicative',
    transfo_ereporting:        mapTransfoEreporting(row.transformation_data_ereporting),
    transfo_ereporting_confidence: 'indicative',
    annuaire_prod:             mapTriStateOui(row.raccordement_annuaire_prod),
    annuaire_prod_confidence: 'indicative',
    ocr_ia:                    mapOcrIa(row.extraction_non_structures),
    ocr_ia_confidence:         'indicative',
    demo_disponible:           boolToCoverage(row.demo_possible),
    demo_disponible_confidence: 'indicative',
    notes_de_frais:            mapNotesDeFrais(row.notes_de_frais_cu),
    notes_de_frais_confidence: 'indicative',
  };
}

function mapExtended(row: SupabasePARow): PAExtendedFields {
  return {
    nb_employes_range:       row.nb_employes_range ?? null,
    clients_references:      row.clients_references_text ?? null,
    workflow_validation:     row.workflow_validation ?? null,
    gestion_statuts:         row.gestion_statuts ?? null,
    cas_usage_couverture:    row.cas_usage_couverture ?? null,
    cas_usage_tiers:         row.cas_usage_tiers ?? null,
    notes_de_frais_cu:       row.notes_de_frais_cu ?? null,
    autofacturation:         row.autofacturation_cu19b ?? null,
    configuration_initiale:  row.configuration_initiale ?? null,
    marque_blanche:          row.marque_blanche ?? null,
    pme_friendly:            row.pme_friendly ?? null,
    frais_setup:             row.frais_setup ?? null,
    offre_gratuite:          row.offre_gratuite ?? null,
    tailles_cibles:          row.tailles_cibles ?? null,
    secteurs_cibles:         row.secteurs_cibles ?? null,
  };
}

function mapDataHosting(val: SupabasePARow['souverainete_donnees']): DataHosting | 'unknown' {
  if (val === 'france') return 'FRANCE';
  if (val === 'ue')     return 'EU';
  if (val === 'hors_ue') return 'INTL';
  return 'unknown';
}

function mapStatus(val: SupabasePARow['statut_immatriculation']): PAProfile['status'] {
  if (val === 'active')    return 'immatriculée';
  if (val === 'suspendue') return 'en_cours';
  if (val === 'retiree')   return 'radiée';
  return 'unknown';
}

function mapERPIntegrations(row: SupabasePARow): PAERPIntegrationV2[] {
  const raw: unknown = row.erp_natifs;
  const names: string[] = Array.isArray(raw)
    ? raw.filter((n): n is string => typeof n === 'string')
    : typeof raw === 'string' && raw.trim()
      ? [raw.trim()]
      : [];
  if (names.length === 0) return [];
  return names.map((name) => ({
    erp_id:           name.toLowerCase().replace(/\s+/g, '_'),
    erp_name:         name,
    integration_type: 'native' as const,
    coverage:         ['emis', 'recus'] as ('emis' | 'recus' | 'avoirs')[],
  }));
}

function rowToPAProfile(row: SupabasePARow): PAProfile {
  return {
    id:                  row.id,
    name:                row.nom,
    status:              mapStatus(row.statut_immatriculation),
    data_hosting:        mapDataHosting(row.souverainete_donnees),
    lead_time_weeks_min: null,
    lead_time_weeks_max: null,
    erp_integrations:    mapERPIntegrations(row),
    coverage:            mapCoverage(row),
    extended:            mapExtended(row),
    last_updated:        row.derniere_mise_a_jour ?? null,
    dgfip_id:            row.pa_slug,
  };
}

class SupabasePARepository implements PARepository {
  private get client() {
    if (!supabaseAdmin) {
      throw new Error('[pa-repository] Client Supabase non initialisé — vérifier les variables d\'env.');
    }
    return supabaseAdmin;
  }

  async findAll(): Promise<PAProfile[]> {
    const { data, error } = await this.client
      .from('pa')
      .select(PA_SELECT_COLUMNS)
      .order('nom');
    if (error) throw new Error(`[pa-repository] findAll: ${error.message}`);
    return (data as unknown as SupabasePARow[]).map(rowToPAProfile);
  }

  async findById(id: string): Promise<PAProfile | null> {
    const { data, error } = await this.client
      .from('pa')
      .select(PA_SELECT_COLUMNS)
      .eq('id', id)
      .limit(1)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null; // not found
      throw new Error(`[pa-repository] findById: ${error.message}`);
    }
    return rowToPAProfile(data as unknown as SupabasePARow);
  }

  async findByNames(names: string[]): Promise<PAProfile[]> {
    const lower = names.map((n) => n.toLowerCase());
    const { data, error } = await this.client
      .from('pa')
      .select(PA_SELECT_COLUMNS);
    if (error) throw new Error(`[pa-repository] findByNames: ${error.message}`);
    return (data as unknown as SupabasePARow[])
      .filter((row) => lower.includes(row.nom.toLowerCase()))
      .map(rowToPAProfile);
  }

  async searchByProfile(filters: PASearchFilters): Promise<PAProfile[]> {
    let query = this.client.from('pa').select(PA_SELECT_COLUMNS);

    if (filters.status) {
      const supabaseStatus =
        filters.status === 'immatriculée' ? 'active' :
        filters.status === 'en_cours'     ? 'suspendue' :
        filters.status === 'radiée'       ? 'retiree' : null;
      if (supabaseStatus) query = query.eq('statut_immatriculation', supabaseStatus);
    }

    if (filters.data_hosting) {
      const supabaseHosting =
        filters.data_hosting === 'FRANCE' ? 'france' :
        filters.data_hosting === 'EU'     ? 'ue' :
        filters.data_hosting === 'INTL'   ? 'hors_ue' : null;
      if (supabaseHosting) query = query.eq('souverainete_donnees', supabaseHosting);
    }

    if (filters.erp_id) {
      query = query.contains('erp_natifs', [filters.erp_id]);
    }

    if (filters.name_in) {
      const nomList = filters.name_in;
      query = query.in('nom', nomList);
    }

    const { data, error } = await query;
    if (error) throw new Error(`[pa-repository] searchByProfile: ${error.message}`);
    return (data as unknown as SupabasePARow[]).map(rowToPAProfile);
  }
}

// ---------------------------------------------------------------------------
// Factory — bascule automatique V1 ↔ V2 selon les variables d'environnement
// ---------------------------------------------------------------------------

function createPARepository(): PARepository {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (hasSupabase) {
    console.info('[pa-repository] Mode Supabase activé (table `pa` de PA_selector)');
    return new SupabasePARepository();
  }
  console.info('[pa-repository] Mode JSON local (pa-seed-v1.json)');
  return new JsonPARepository();
}

/**
 * Singleton utilisé dans toutes les routes API.
 * Remplace tout import direct de pa-seed-v1.json.
 *
 * Usage :
 *   import { paRepository } from '@/lib/pa-repository';
 *   const allPAs = await paRepository.findAll();
 */
export const paRepository: PARepository = createPARepository();
