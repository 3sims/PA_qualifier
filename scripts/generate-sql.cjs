/**
 * Génère les fichiers SQL de mise à jour depuis le CSV analyse PDP.
 * Usage : node scripts/generate-sql.cjs
 */
const fs = require('fs');
const path = require('path');

const SKIP = new Set([
  'auth_double_facteur',
  'signature_electronique',
  'support_ereporting_b2c',
  'transformation_data_ereporting',
]);

const COLUMN_MAP = {
  clients_production_flux_2: 'clients_production_flux2',
  clients_production_flux_3: 'clients_production_flux3',
  autofacturation_cu_19b:    'autofacturation_cu19b',
  clients_references:        'clients_references_text',
};

const BOOL_COLS = new Set([
  'automatisation_validation', 'chorus_pro', 'clients_production_flux3',
  'demo_possible', 'frais_setup', 'marque_blanche', 'multi_devises',
  'multi_entites', 'portail_fournisseur', 'traduction_edi', 'utilise_ia',
]);

const TEXT_COLS = new Set([
  'annuaire_consultation_mode', 'annuaire_maj_autonome',
  'nb_employes_range', 'clients_references_text',
]);

const ENUM_MAPS = {
  cas_usage_couverture: {
    '10_20': '10_20', '20_30': '20_30', '30_36': '30_36',
    '36': 'tous_36_plus', 'tous_36_plus': 'tous_36_plus', '0_10': '0_10',
  },
  cas_usage_tiers: {
    'oui_tous': 'tous', 'tous': 'tous', 'certains': 'certains', 'non': 'non',
  },
  workflow_validation: {
    'complet': 'complet', 'basique': 'statuts_seulement',
    'statuts_seulement': 'statuts_seulement', 'non': 'non',
  },
  autofacturation_cu19b: {
    'oui_vendeur_acheteur': 'vendeur_et_acheteur',
    'vendeur_et_acheteur': 'vendeur_et_acheteur',
    'oui_vendeur_seul': 'vendeur_seulement',
    'vendeur_seulement': 'vendeur_seulement',
    'non': 'non',
  },
  configuration_initiale: {
    'libre_acces': 'libre_acces',
    'systematique': 'setup_obligatoire',
    'setup_obligatoire': 'setup_obligatoire',
  },
  notes_de_frais_cu: { 'tous': 'tous', 'oui_tous': 'tous', 'certains': 'certains', 'non': 'non' },
  gestion_statuts: {
    'tous_14': 'tous_14',
    'partiel_10_13': 'partiel_10_13',
    'partiel_5_9': 'partiel_5_9',
    'obligatoires_4': 'obligatoires_4',
    'statuts_obligatoires': 'obligatoires_4',
  },
};

function convertValue(dbCol, v) {
  v = (v || '').trim();
  if (v === '') return null;
  if (TEXT_COLS.has(dbCol)) return v;
  if (BOOL_COLS.has(dbCol)) {
    const u = v.toUpperCase();
    if (u === 'TRUE' || u === 'OUI' || u === '1') return true;
    if (u === 'FALSE' || u === 'NON' || u === '0') return false;
    if (dbCol === 'marque_blanche') {
      const l = v.toLowerCase();
      if (l.includes('marque') || l.includes('blanc')) return true;
    }
    if (dbCol === 'clients_production_flux3') {
      const l = v.toLowerCase();
      if (l.startsWith('oui')) return true;
      if (l.startsWith('non')) return false;
    }
    return undefined;
  }
  if (ENUM_MAPS[dbCol]) {
    const r = ENUM_MAPS[dbCol][v.toLowerCase()];
    if (r === undefined) {
      console.error(`SKIP enum inconnu  ${dbCol}: "${v}"`);
    }
    return r;
  }
  if (dbCol === 'clients_production_flux2') {
    const l = v.toLowerCase();
    if (l.startsWith('oui') && !l.includes('test')) return 'oui';
    if (l.includes('test') || l.includes('quelques') || l.includes('transit')) return 'tests_seulement';
    if (l.startsWith('non')) return 'non';
    return undefined;
  }
  return v;
}

function sqlLiteral(val) {
  if (val === null) return 'NULL';
  if (val === true)  return 'TRUE';
  if (val === false) return 'FALSE';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

// Lecture du CSV
const csvPath = path.resolve('c:/Users/lcattoire/Downloads/pa_rows_updates_only.csv (2026-05-04).csv');
const content = fs.readFileSync(csvPath, 'latin1');
const lines   = content.split('\n');

const updates = {};
for (let i = 1; i < lines.length; i++) {
  const parts   = lines[i].split(';');
  if (parts.length < 4) continue;
  const pa_slug = parts[0].trim();
  const csvCol  = parts[1].trim();
  const newVal  = parts.slice(3).join(';').trim();
  if (!pa_slug || !csvCol) continue;
  // Filtrer les pa_slug invalides (lignes corrompues dans le CSV)
  if (!/^[a-z][a-z0-9-]*$/.test(pa_slug)) continue;
  if (SKIP.has(csvCol)) continue;
  const dbCol   = COLUMN_MAP[csvCol] || csvCol;
  const val     = convertValue(dbCol, newVal);
  if (val === undefined) continue;
  if (!updates[pa_slug]) updates[pa_slug] = {};
  updates[pa_slug][dbCol] = val;
}

const slugs = Object.keys(updates).sort();
console.log(`PA à mettre à jour : ${slugs.length}`);

// Génération des UPDATE statements
const updateStatements = [];
for (const pa_slug of slugs) {
  const fields = updates[pa_slug];
  const sets = Object.entries(fields)
    .map(([k, v]) => `${k} = ${sqlLiteral(v)}`)
    .concat(["derniere_mise_a_jour = '2026-05-04'"])
    .join(',\n  ');
  updateStatements.push(
    `UPDATE pa SET\n  ${sets}\nWHERE pa_slug = '${pa_slug}';`
  );
}

// Génération des INSERT pa_sources
const sourceStatements = [];
for (const pa_slug of slugs) {
  const fields     = Object.keys(updates[pa_slug]);
  const champsList = sqlLiteral('{' + fields.join(',') + '}');
  sourceStatements.push(
    `INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)\n` +
    `VALUES (\n` +
    `  '${pa_slug}',\n` +
    `  'file:///analyse_pdp_2026-05-04.csv',\n` +
    `  'autre',\n` +
    `  'Analyse PDP — 2026-05-04',\n` +
    `  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : ${fields.join(', ').replace(/'/g, "''")}',\n` +
    `  ${champsList},\n` +
    `  'manuel',\n` +
    `  'analyse_pdp',\n` +
    `  'analyse_pdp_20260504',\n` +
    `  'csv_import'\n` +
    `);`
  );
}

// Écriture des fichiers SQL par lots de 20
const BATCH_SIZE = 20;
const outDir = path.resolve('scripts');
let batchCount = 0;

for (let i = 0; i < updateStatements.length; i += BATCH_SIZE) {
  const batchUpdates  = updateStatements.slice(i, i + BATCH_SIZE);
  const batchSources  = sourceStatements.slice(i, i + BATCH_SIZE);
  const sql = batchUpdates.join('\n\n') + '\n\n' + batchSources.join('\n\n');
  const filename = path.join(outDir, `_batch_${String(batchCount).padStart(2, '0')}.sql`);
  fs.writeFileSync(filename, sql, 'utf8');
  console.log(`Écrit : ${filename} (${batchUpdates.length} PA)`);
  batchCount++;
}

console.log(`\nTotal : ${batchCount} fichiers SQL générés.`);
