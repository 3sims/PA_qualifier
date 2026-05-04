/**
 * Génère les UPDATE SQL pour les 4 nouvelles colonnes :
 *   auth_double_facteur, signature_electronique,
 *   support_ereporting_b2c, transformation_data_ereporting
 */
const fs = require('fs');
const path = require('path');

const CSV_PATH = 'c:\\Users\\lcattoire\\Downloads\\pa_rows_updates_only.csv (2026-05-04).csv';

// Mapping texte CSV → valeur enum support_ereporting_b2c_t
const SUPPORT_B2C_MAP = {
  "La Plateforme Agr\u00e9\u00e9e n\u2019agr\u00e8ge et ne consolide pas les donn\u00e9es elle-m\u00eame": 'pas_agrege',
  "La Plateforme Agr??e n?agr?ge et ne consolide pas les donn?es elle-m?me": 'pas_agrege',
  "Seul le ticket Z de caisse sera utilisable pour g\u00e9n\u00e9rer le e-reporting, mais pas les factures B2C unitaires": 'ticket_z_seulement',
  "Seul le ticket Z de caisse sera utilisable pour g?n?rer le e-reporting, mais pas les factures B2C unitaires": 'ticket_z_seulement',
  "Seules les factures B2C unitaires seront utilisables pour g\u00e9n\u00e9rer le e-reporting, mais pas le ticket Z de caisse": 'factures_b2c_seulement',
  "Seules les factures B2C unitaires seront utilisables pour g?n?rer le e-reporting, mais pas le ticket Z de caisse": 'factures_b2c_seulement',
  "Toutes les source de donn\u00e9es (ticket Z de caisse, factures B2C unitaires) seront utilisables pour g\u00e9n\u00e9rer le e-reporting": 'toutes_sources',
  "Toutes les source de donn?es (ticket Z de caisse, factures B2C unitaires) seront utilisables pour g?n?rer le e-reporting": 'toutes_sources',
};

// Mapping texte CSV → valeur enum transformation_data_ereporting_t
const TRANSFO_MAP = {
  "Donn\u00e9es consolid\u00e9es de e-reportingaccept\u00e9es dans de multiples formats": 'multiples_formats',
  "Donn?es consolid?es de e-reportingaccept?es dans de multiples formats": 'multiples_formats',
  "Donn\u00e9es consolid\u00e9es de e-reportingaccept\u00e9es uniquement dans le format XML attendu par l\u2019Etat": 'xml_seulement',
  "Donn?es consolid?es de e-reportingaccept?es uniquement dans le format XML attendu par l?Etat": 'xml_seulement',
  // valeur combinée → les_deux
  "Donn\u00e9es consolid\u00e9es de e-reportingaccept\u00e9es dans de multiples formats. Donn\u00e9es consolid\u00e9es de e-reportingaccept\u00e9es uniquement dans le format XML attendu par l\u2019Etat": 'les_deux',
  "Donn?es consolid?es de e-reportingaccept?es dans de multiples formats. Donn?es consolid?es de e-reportingaccept?es uniquement dans le format XML attendu par l?Etat": 'les_deux',
};

function parseCsv(content) {
  const lines = content.split(/\r?\n/);
  const headers = lines[0].split(';');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = lines[i].split(';');
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = (cols[idx] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

// Lire CSV (Latin-1)
const raw = fs.readFileSync(CSV_PATH);
// Essayer UTF-8 d'abord, puis Latin-1
let content;
try {
  content = raw.toString('utf8');
} catch (e) {
  content = raw.toString('latin1');
}

const rows = parseCsv(content);

const TARGET_COLUMNS = new Set([
  'auth_double_facteur',
  'signature_electronique',
  'support_ereporting_b2c',
  'transformation_data_ereporting',
]);

// Grouper par pa_slug
const bySlug = {};
for (const row of rows) {
  const slug = row['pa_slug'] || '';
  if (!/^[a-z][a-z0-9-]*$/.test(slug)) continue;
  const col = row['colonne'];
  if (!TARGET_COLUMNS.has(col)) continue;
  if (!bySlug[slug]) bySlug[slug] = {};
  bySlug[slug][col] = row['nouvelle_valeur'];
}

function convertValue(col, rawVal) {
  if (rawVal === '' || rawVal === null || rawVal === undefined) return null;

  if (col === 'auth_double_facteur') {
    const v = rawVal.toString().trim().toUpperCase();
    if (v === 'TRUE' || v === 'OUI' || v === '1') return true;
    if (v === 'FALSE' || v === 'NON' || v === '0') return false;
    return null;
  }
  if (col === 'signature_electronique') {
    const v = rawVal.toString().trim().toUpperCase();
    if (v === 'OUI' || v === 'TRUE' || v === '1') return true;
    if (v === 'NON' || v === 'FALSE' || v === '0') return false;
    return null;
  }
  if (col === 'support_ereporting_b2c') {
    const key = rawVal.toString().trim();
    if (SUPPORT_B2C_MAP[key]) return SUPPORT_B2C_MAP[key];
    // fuzzy: chercher par inclusion de mots-clés
    if (key.includes('consolide') || key.includes('consolid')) return 'pas_agrege';
    if (key.includes('ticket Z') || key.includes('ticket z') || key.toLowerCase().includes('ticket z')) return 'ticket_z_seulement';
    if (key.includes('B2C unitaires') && !key.includes('ticket')) return 'factures_b2c_seulement';
    if (key.toLowerCase().includes('toutes')) return 'toutes_sources';
    console.warn(`[support_ereporting_b2c] valeur non mappée: "${key}"`);
    return null;
  }
  if (col === 'transformation_data_ereporting') {
    const key = rawVal.toString().trim();
    if (TRANSFO_MAP[key]) return TRANSFO_MAP[key];
    // fuzzy
    const hasMulti = key.toLowerCase().includes('multiples');
    const hasXml = key.toLowerCase().includes('xml');
    if (hasMulti && hasXml) return 'les_deux';
    if (hasMulti) return 'multiples_formats';
    if (hasXml) return 'xml_seulement';
    console.warn(`[transformation_data_ereporting] valeur non mappée: "${key}"`);
    return null;
  }
  return null;
}

function sqlLit(val) {
  if (val === null || val === undefined) return 'NULL';
  if (val === true) return 'TRUE';
  if (val === false) return 'FALSE';
  const s = String(val)
    .replace(/[^\x20-\x7E\u00C0-\u024F\u2019\u2013\u2014]/g, ' ')
    .replace(/'/g, "''")
    .trim();
  return "'" + s + "'";
}

const slugs = Object.keys(bySlug).sort();
const lines = [];
const insertLines = [];

for (const slug of slugs) {
  const fields = bySlug[slug];
  const setClauses = [];

  for (const col of TARGET_COLUMNS) {
    if (!(col in fields)) continue;
    const converted = convertValue(col, fields[col]);
    setClauses.setClauses = setClauses;
    setClauses.push(`${col}=${sqlLit(converted)}`);
  }

  if (setClauses.length === 0) continue;

  lines.push(`UPDATE pa SET ${setClauses.join(',')} WHERE pa_slug='${slug}';`);

  const champs = Object.keys(fields).filter(c => TARGET_COLUMNS.has(c));
  insertLines.push(
    `INSERT INTO pa_sources(pa_slug,url,source_type,titre,extrait,champs_couverts,writer_mode,actor,run_id,source_system)` +
    `VALUES('${slug}','file:///analyse_pdp_2026-05-04.csv','autre','Analyse PDP 2026-05-04','Import nouvelles colonnes',` +
    `'{${champs.join(',')}}','manuel','analyse_pdp','analyse_pdp_20260504_cols','csv_import');`
  );
}

const output = [...lines, ...insertLines].join('\n');
const outPath = path.join(__dirname, '_new_columns.sql');
fs.writeFileSync(outPath, output, 'utf8');
console.log(`✅ ${lines.length} UPDATE + ${insertLines.length} INSERT générés → ${outPath}`);
console.log('Aperçu (5 premières lignes):');
lines.slice(0, 5).forEach(l => console.log(' ', l));
