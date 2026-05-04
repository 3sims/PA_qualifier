/**
 * scripts/import-analyse-pdp.mjs
 *
 * Importe les données de l'analyse PDP depuis un CSV (format : pa_slug;colonne;ancienne_valeur;nouvelle_valeur)
 * et met à jour la table `pa` + insère des enregistrements dans `pa_sources`.
 *
 * Usage :
 *   node --env-file=.env.local scripts/import-analyse-pdp.mjs <chemin_csv>
 *
 * Variables d'env requises :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (ou SUPABASE_SERVICE_KEY)
 */

import { createClient } from '@supabase/supabase-js';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// Config & constantes
// ---------------------------------------------------------------------------

const CSV_PATH = process.argv[2]
  ? resolve(process.argv[2])
  : resolve('c:/Users/lcattoire/Downloads/pa_rows_updates_only.csv (2026-05-04).csv');

const RUN_DATE = '2026-05-04';
const RUN_ID   = `analyse_pdp_${RUN_DATE.replace(/-/g, '')}`;

// Colonnes CSV qui n'existent pas dans la table `pa` → ignorées
const SKIP_COLUMNS = new Set([
  'auth_double_facteur',
  'signature_electronique',
  'support_ereporting_b2c',
  'transformation_data_ereporting',
  ' CII ou Factur-X"',       // entrée corrompue dans le CSV
  'CII ou Factur-X',
]);

// ---------------------------------------------------------------------------
// Mapping nom de colonne CSV → nom de colonne DB
// ---------------------------------------------------------------------------
const COLUMN_MAP = {
  clients_production_flux_2: 'clients_production_flux2',
  clients_production_flux_3: 'clients_production_flux3',
  autofacturation_cu_19b:    'autofacturation_cu19b',
  clients_references:        'clients_references_text',  // texte libre → nouvelle colonne
};

// ---------------------------------------------------------------------------
// Colonnes booléennes (TRUE/FALSE → true/false/null)
// ---------------------------------------------------------------------------
const BOOLEAN_COLUMNS = new Set([
  'automatisation_validation',
  'chorus_pro',
  'clients_production_flux3',
  'demo_possible',
  'frais_setup',
  'marque_blanche',
  'multi_devises',
  'multi_entites',
  'portail_fournisseur',
  'traduction_edi',
  'utilise_ia',
]);

// ---------------------------------------------------------------------------
// Colonnes texte libre (pas de conversion)
// ---------------------------------------------------------------------------
const TEXT_COLUMNS = new Set([
  'annuaire_consultation_mode',
  'annuaire_maj_autonome',
  'nb_employes_range',
  'clients_references_text',
]);

// ---------------------------------------------------------------------------
// Conversion de valeurs
// ---------------------------------------------------------------------------

/**
 * Convertit une valeur CSV selon le type de colonne DB.
 * Retourne `undefined` si la valeur est invalide / non convertible (la colonne sera sautée).
 * Retourne `null` si la valeur est explicitement vide (SET col = NULL).
 */
function convertValue(dbCol, rawValue) {
  const v = rawValue?.trim() ?? '';

  // Valeur vide → NULL
  if (v === '') return null;

  // Colonnes texte libre
  if (TEXT_COLUMNS.has(dbCol)) return v;

  // Colonnes booléennes
  if (BOOLEAN_COLUMNS.has(dbCol)) {
    const upper = v.toUpperCase();
    if (upper === 'TRUE' || upper === 'OUI' || upper === '1') return true;
    if (upper === 'FALSE' || upper === 'NON' || upper === '0') return false;
    // Textes indicatifs pour marque_blanche
    if (dbCol === 'marque_blanche') {
      const lower = v.toLowerCase();
      if (lower.includes('marque blanche') || lower.includes('marque grise') || lower.includes('blanc')) return true;
    }
    // Textes indicatifs pour clients_production_flux3
    if (dbCol === 'clients_production_flux3') {
      const lower = v.toLowerCase();
      if (lower.startsWith('oui')) return true;
      if (lower.startsWith('non')) return false;
    }
    console.warn(`  ⚠ Valeur booléenne non reconnue pour ${dbCol}: "${v}" → ignoré`);
    return undefined;
  }

  // Conversions enum spécifiques
  switch (dbCol) {
    case 'cas_usage_couverture': {
      const map = {
        '10_20': '10_20',
        '20_30': '20_30',
        '30_36': '30_36',
        '36':    'tous_36_plus',
        '36_plus': 'tous_36_plus',
        'tous_36_plus': 'tous_36_plus',
        '0_10': '0_10',
      };
      const r = map[v.toLowerCase()];
      if (!r) { console.warn(`  ⚠ cas_usage_couverture inconnu: "${v}" → ignoré`); return undefined; }
      return r;
    }
    case 'cas_usage_tiers': {
      const map = {
        'oui_tous': 'tous',
        'tous':     'tous',
        'certains': 'certains',
        'non':      'non',
      };
      const r = map[v.toLowerCase()];
      if (!r) { console.warn(`  ⚠ cas_usage_tiers inconnu: "${v}" → ignoré`); return undefined; }
      return r;
    }
    case 'workflow_validation': {
      const map = {
        'complet':           'complet',
        'basique':           'statuts_seulement',
        'statuts_seulement': 'statuts_seulement',
        'non':               'non',
      };
      const r = map[v.toLowerCase()];
      if (!r) { console.warn(`  ⚠ workflow_validation inconnu: "${v}" → ignoré`); return undefined; }
      return r;
    }
    case 'clients_production_flux2': {
      const lower = v.toLowerCase();
      if (lower.startsWith('oui') && !lower.includes('test')) return 'oui';
      if (lower.includes('test') || lower.includes('quelques') || lower.includes('transit')) return 'tests_seulement';
      if (lower.startsWith('non')) return 'non';
      console.warn(`  ⚠ clients_production_flux2 inconnu: "${v}" → ignoré`);
      return undefined;
    }
    case 'autofacturation_cu19b': {
      const map = {
        'oui_vendeur_acheteur': 'vendeur_et_acheteur',
        'vendeur_et_acheteur':  'vendeur_et_acheteur',
        'oui_vendeur_seul':     'vendeur_seulement',
        'vendeur_seulement':    'vendeur_seulement',
        'non':                  'non',
      };
      const r = map[v.toLowerCase()];
      if (!r) { console.warn(`  ⚠ autofacturation_cu19b inconnu: "${v}" → ignoré`); return undefined; }
      return r;
    }
    case 'configuration_initiale': {
      const map = {
        'libre_acces':       'libre_acces',
        'systematique':      'setup_obligatoire',
        'setup_obligatoire': 'setup_obligatoire',
      };
      const r = map[v.toLowerCase()];
      if (!r) { console.warn(`  ⚠ configuration_initiale inconnu: "${v}" → ignoré`); return undefined; }
      return r;
    }
    case 'notes_de_frais_cu': {
      const map = { 'tous': 'tous', 'oui_tous': 'tous', 'certains': 'certains', 'non': 'non' };
      const r = map[v.toLowerCase()];
      if (!r) { console.warn(`  ⚠ notes_de_frais_cu inconnu: "${v}" → ignoré`); return undefined; }
      return r;
    }
    // Colonnes enum dont les valeurs CSV matchent directement
    case 'access_point_peppol':
    case 'automatisation_encaissements':
    case 'automatisation_ereporting_pmt':
    case 'raccordement_annuaire_prod':
    case 'gestion_statuts':
    case 'extraction_non_structures':
      return v;

    default:
      // Retourner la valeur telle quelle pour toute colonne non listée explicitement
      return v;
  }
}

// ---------------------------------------------------------------------------
// Lecture du CSV (séparateur ';', encodage latin-1 probable)
// ---------------------------------------------------------------------------

async function parseCsv(filePath) {
  const updates = {}; // { pa_slug: { dbCol: value } }

  const stream = createReadStream(filePath, { encoding: 'latin1' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let isHeader = true;
  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    if (!line.trim()) continue;

    const parts = line.split(';');
    if (parts.length < 4) continue;

    const pa_slug        = parts[0].trim();
    const csvCol         = parts[1].trim();
    const nouvelleValeur = parts.slice(3).join(';').trim(); // au cas où il y a des ; dans la valeur

    if (!pa_slug || !csvCol) continue;

    // Colonnes à ignorer explicitement
    if (SKIP_COLUMNS.has(csvCol)) continue;

    // Remapping du nom de colonne
    const dbCol = COLUMN_MAP[csvCol] ?? csvCol;

    // Conversion de valeur
    const converted = convertValue(dbCol, nouvelleValeur);
    if (converted === undefined) continue; // valeur invalide, on saute

    if (!updates[pa_slug]) updates[pa_slug] = {};
    updates[pa_slug][dbCol] = converted;
  }

  return updates;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Connexion Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises.');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  console.log(`📂 Lecture du CSV : ${CSV_PATH}`);
  const updates = await parseCsv(CSV_PATH);

  const slugs = Object.keys(updates);
  console.log(`\n📊 ${slugs.length} PA à mettre à jour`);

  let successCount = 0;
  let errorCount   = 0;

  for (const pa_slug of slugs) {
    const fields = updates[pa_slug];
    const fieldNames = Object.keys(fields);

    // Ajout de la date de mise à jour
    fields.derniere_mise_a_jour = RUN_DATE;

    console.log(`\n→ ${pa_slug} (${fieldNames.length} champs)`);

    // UPDATE pa
    const { error: updateError } = await supabase
      .from('pa')
      .update(fields)
      .eq('pa_slug', pa_slug);

    if (updateError) {
      console.error(`  ❌ UPDATE échoué : ${updateError.message}`);
      errorCount++;
      continue;
    }

    // INSERT pa_sources
    const { error: sourceError } = await supabase
      .from('pa_sources')
      .insert({
        pa_slug,
        url:            `file:///analyse_pdp_${RUN_DATE}.csv`,
        source_type:    'autre',
        titre:          `Analyse PDP — ${RUN_DATE}`,
        extrait:        `Mise à jour issue de l'analyse PDP du ${RUN_DATE}. Champs couverts : ${fieldNames.join(', ')}.`,
        champs_couverts: fieldNames,
        writer_mode:    'manuel',
        actor:          'analyse_pdp',
        run_id:         RUN_ID,
        source_system:  'csv_import',
        collecte_at:    new Date().toISOString(),
      });

    if (sourceError) {
      console.warn(`  ⚠ INSERT pa_sources échoué : ${sourceError.message}`);
    }

    successCount++;
    console.log(`  ✅ OK`);
  }

  console.log(`\n═══════════════════════════════════`);
  console.log(`✅ Succès  : ${successCount} PA`);
  console.log(`❌ Erreurs : ${errorCount} PA`);
  console.log(`\nColonnes ignorées (non présentes dans la table pa) :`);
  console.log([...SKIP_COLUMNS].filter(c => c.trim()).join(', '));
  console.log('\nColonnes remappées :');
  Object.entries(COLUMN_MAP).forEach(([k, v]) => console.log(`  ${k} → ${v}`));
}

main().catch(err => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});
