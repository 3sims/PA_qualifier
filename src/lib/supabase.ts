/**
 * lib/supabase.ts
 *
 * Clients Supabase singleton — deux variantes :
 *   - `supabasePublic`  : client côté navigateur (anon key, RLS appliquée)
 *   - `supabaseAdmin`   : client côté serveur uniquement (service_role key, bypass RLS)
 *
 * Les deux ne sont instanciés que si les variables d'env sont présentes.
 * En V1 (mode JSON), les deux valent `null` et le code ne les appelle pas.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types de la table `pa` tels qu'ils existent dans Supabase (PA_selector)
// ---------------------------------------------------------------------------

export interface SupabasePARow {
  id: string;
  pa_slug: string;
  nom: string;
  nom_benchmark?: string;
  site_web?: string | null;
  immatriculation_dgfip?: boolean | null;
  date_immatriculation?: string | null;
  statut_immatriculation?: 'active' | 'suspendue' | 'retiree' | null;
  origine_geo?: string | null;
  siege_social_ville?: string | null;
  siege_social_pays?: string | null;
  nb_employes_range?: string | null;
  type_acteur?: string | null;
  tailles_cibles?: string | null;
  secteurs_cibles?: string[] | null;
  marches_cibles?: string | null;
  pme_friendly?: boolean | null;
  marque_blanche?: boolean | null;
  internationalisation?: boolean | null;
  raccordement_annuaire_prod?: string | null;
  access_point_peppol?: 'oui' | 'prochainement' | 'non' | null;
  clients_production_flux2?: string | null;
  clients_production_flux3?: boolean | null;
  nb_clients?: number | null;
  type_solution?: string | null;
  configuration_initiale?: string | null;
  niveau_integration_erp?: string | null;
  erp_natifs?: string[] | null;
  api_disponible?: boolean | null;
  sandbox_disponible?: boolean | null;
  formats_supportes?: string[] | null;
  traduction_edi?: boolean | null;
  sso?: boolean | null;
  emission_factures?: boolean | null;
  reception_factures?: boolean | null;
  e_reporting_transaction?: boolean | null;
  e_reporting_paiement?: boolean | null;
  multi_entites?: boolean | null;
  multi_devises?: boolean | null;
  gestion_avoirs?: boolean | null;
  chorus_pro?: boolean | null;
  extraction_non_structures?: string | null;
  utilise_ia?: boolean | null;
  archivage?: 'valeur_probante' | 'nf461' | 'simple' | 'non' | null;
  nf461?: boolean | null;
  certification_iso27001?: boolean | null;
  rgpd_dpa_disponible?: boolean | null;
  souverainete_donnees?: 'france' | 'ue' | 'hors_ue' | 'non_communique' | null;
  support_niveau?: string | null;
  onboarding_score?: number | null;
  demo_possible?: boolean | null;
  modele_economique?: string | null;
  modele_tarifaire?: string | null;
  gamme_tarifaire?: string | null;
  frais_setup?: boolean | null;
  offre_gratuite?: boolean | null;
  portail_fournisseur?: boolean | null;
  clients_references_text?: string | null;
  workflow_validation?: string | null;
  gestion_statuts?: string | null;
  cas_usage_couverture?: string | null;
  cas_usage_tiers?: string | null;
  notes_de_frais_cu?: string | null;
  autofacturation_cu19b?: string | null;
  auth_double_facteur?: boolean | null;
  signature_electronique?: boolean | null;
  support_ereporting_b2c?: 'pas_agrege' | 'ticket_z_seulement' | 'factures_b2c_seulement' | 'toutes_sources' | null;
  transformation_data_ereporting?: 'xml_seulement' | 'multiples_formats' | 'les_deux' | null;
  data_completeness?: number | null;
  derniere_mise_a_jour?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function makePublicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Client public (anon key) — lecture seule côté navigateur ou server.
 * La table `pa` autorise la lecture anonyme via RLS policy `pa_select_anon`.
 * Pas besoin de service_role key pour les lectures PA.
 */
export const supabasePublic: SupabaseClient | null = makePublicClient();

/**
 * Client admin (service_role) — optionnel, pour les opérations d'écriture.
 * Bypass RLS. Ne jamais exposer côté client.
 */
export const supabaseAdmin: SupabaseClient | null = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return makePublicClient(); // fallback anon pour les lectures
  return createClient(url, key, { auth: { persistSession: false } });
})();
