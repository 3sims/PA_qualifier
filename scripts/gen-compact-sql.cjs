/**
 * Génère des lots SQL compacts pour les PA non encore traitées (à partir de l'index 20).
 * Usage : node scripts/gen-compact-sql.cjs <start_index> <end_index>
 */
const fs = require('fs');
const path = require('path');

const startIdx = parseInt(process.argv[2] || '20', 10);
const endIdx   = parseInt(process.argv[3] || '40', 10);

const SKIP = new Set(['auth_double_facteur','signature_electronique','support_ereporting_b2c','transformation_data_ereporting']);
const COLUMN_MAP = {
  clients_production_flux_2: 'clients_production_flux2',
  clients_production_flux_3: 'clients_production_flux3',
  autofacturation_cu_19b:    'autofacturation_cu19b',
  clients_references:        'clients_references_text',
};
const BOOL_COLS = new Set(['automatisation_validation','chorus_pro','clients_production_flux3','demo_possible','frais_setup','marque_blanche','multi_devises','multi_entites','portail_fournisseur','traduction_edi','utilise_ia']);
const TEXT_COLS = new Set(['annuaire_consultation_mode','annuaire_maj_autonome','nb_employes_range','clients_references_text']);
const ENUM_MAPS = {
  cas_usage_couverture: {'10_20':'10_20','20_30':'20_30','30_36':'30_36','36':'tous_36_plus','tous_36_plus':'tous_36_plus','0_10':'0_10'},
  cas_usage_tiers: {'oui_tous':'tous','tous':'tous','certains':'certains','non':'non'},
  workflow_validation: {'complet':'complet','basique':'statuts_seulement','statuts_seulement':'statuts_seulement','non':'non'},
  autofacturation_cu19b: {'oui_vendeur_acheteur':'vendeur_et_acheteur','vendeur_et_acheteur':'vendeur_et_acheteur','oui_vendeur_seul':'vendeur_seulement','vendeur_seulement':'vendeur_seulement','non':'non'},
  configuration_initiale: {'libre_acces':'libre_acces','systematique':'setup_obligatoire','setup_obligatoire':'setup_obligatoire'},
  notes_de_frais_cu: {'tous':'tous','oui_tous':'tous','certains':'certains','non':'non'},
  gestion_statuts: {'tous_14':'tous_14','partiel_10_13':'partiel_10_13','partiel_5_9':'partiel_5_9','obligatoires_4':'obligatoires_4','statuts_obligatoires':'obligatoires_4'},
};

function convertValue(dbCol, v) {
  v = (v || '').trim();
  if (v === '') return null;
  if (TEXT_COLS.has(dbCol)) return v.substring(0, 300);
  if (BOOL_COLS.has(dbCol)) {
    const u = v.toUpperCase();
    if (u === 'TRUE' || u === 'OUI' || u === '1') return true;
    if (u === 'FALSE' || u === 'NON' || u === '0') return false;
    if (dbCol === 'marque_blanche') { const l = v.toLowerCase(); if (l.includes('marque') || l.includes('blanc')) return true; }
    if (dbCol === 'clients_production_flux3') { const l = v.toLowerCase(); if (l.startsWith('oui')) return true; if (l.startsWith('non')) return false; }
    return undefined;
  }
  if (ENUM_MAPS[dbCol]) { return ENUM_MAPS[dbCol][v.toLowerCase()]; }
  if (dbCol === 'clients_production_flux2') {
    const l = v.toLowerCase();
    if (l.startsWith('oui') && !l.includes('test')) return 'oui';
    if (l.includes('test') || l.includes('quelques') || l.includes('transit')) return 'tests_seulement';
    if (l.startsWith('non')) return 'non';
    return undefined;
  }
  return v;
}

function sqlLit(val) {
  if (val === null) return 'NULL';
  if (val === true) return 'TRUE';
  if (val === false) return 'FALSE';
  // Sanitize: keep only latin chars + accented chars, remove control chars
  const s = String(val)
    .replace(/[^\x20-\x7E\u00C0-\u024F\u2019\u2013\u2014]/g, ' ')
    .replace(/'/g, "''")
    .trim();
  return "'" + s + "'";
}

const content = fs.readFileSync('c:/Users/lcattoire/Downloads/pa_rows_updates_only.csv (2026-05-04).csv', 'latin1');
const lines   = content.split('\n');
const updates = {};

for (let i = 1; i < lines.length; i++) {
  const parts   = lines[i].split(';');
  if (parts.length < 4) continue;
  const pa_slug = parts[0].trim();
  const csvCol  = parts[1].trim();
  const newVal  = parts.slice(3).join(';').trim();
  if (!pa_slug || !csvCol) continue;
  if (!/^[a-z][a-z0-9-]*$/.test(pa_slug)) continue;
  if (SKIP.has(csvCol)) continue;
  const dbCol = COLUMN_MAP[csvCol] || csvCol;
  const val   = convertValue(dbCol, newVal);
  if (val === undefined) continue;
  if (!updates[pa_slug]) updates[pa_slug] = {};
  updates[pa_slug][dbCol] = val;
}

const slugs = Object.keys(updates).sort();
const batch  = slugs.slice(startIdx, endIdx);

const sqlLines = [];
for (const slug of batch) {
  const fields = updates[slug];
  const sets = Object.entries(fields)
    .map(([k, v]) => `${k}=${sqlLit(v)}`)
    .concat(["derniere_mise_a_jour='2026-05-04'"])
    .join(',');
  sqlLines.push(`UPDATE pa SET ${sets} WHERE pa_slug='${slug}';`);
}

for (const slug of batch) {
  const fields = Object.keys(updates[slug]);
  const arr = '{' + fields.join(',') + '}';
  sqlLines.push(`INSERT INTO pa_sources(pa_slug,url,source_type,titre,extrait,champs_couverts,writer_mode,actor,run_id,source_system)VALUES('${slug}','file:///analyse_pdp_2026-05-04.csv','autre','Analyse PDP 2026-05-04','Import analyse PDP','${arr}','manuel','analyse_pdp','analyse_pdp_20260504','csv_import');`);
}

const sql = sqlLines.join('\n');
const outFile = path.join('scripts', `_compact_${startIdx}_${endIdx}.sql`);
fs.writeFileSync(outFile, sql, 'utf8');
console.log(`Écrit ${outFile} (${sql.length} chars, ${batch.length} PA)`);
console.log('Slugs:', batch.join(', '));
