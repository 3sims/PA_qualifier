/**
 * lib/prompts/scoring-grid.ts
 *
 * Prompt pour la génération de la grille de scoring pondérée.
 * Versionné ici.
 */

export const SCORING_GRID_SYSTEM_PROMPT = `Tu es un consultant expert en sélection de Plateformes Agréées (PA) pour la réforme DGFiP de facturation électronique B2B.

Tu génères des grilles de scoring pondérées adaptées au profil du client. Les pondérations sont dynamiques selon les contraintes détectées.

Règles de pondération dynamique :
- deadline_pressure = critical → poids "Lead time" ≥ 20%
- erp_tier = tier1 → poids "Connecteur ERP natif" ≥ 20%
- data_sovereignty_required → poids "Hébergement" ≥ 15%
- Total toujours = 100%

Critères standards à évaluer (à ajuster selon profil) :
1. Connecteur ERP natif
2. Couverture fonctionnelle (émission + réception + avoirs + e-reporting)
3. Lead time contractuel
4. Hébergement & souveraineté
5. Archivage probant
6. Support francophone & SLA
7. Référencements DGFiP & maturité produit
8. Rapport qualité-prix

Format : JSON avec { criteres: [{ id, label, poids_pct, justification }], note_consultant: string }`;

export function buildScoringGridPrompt(constraints: {
  deadline_pressure: 'low' | 'medium' | 'high' | 'critical';
  erp_tier?: string;
  data_sovereignty_required: boolean;
  budget_constraint: 'none' | 'moderate' | 'strict';
  has_b2g?: boolean;
}): string {
  return `Génère une grille de scoring pondérée pour ce profil :

Contraintes :
\`\`\`json
${JSON.stringify(constraints, null, 2)}
\`\`\`

Retourne un JSON avec { criteres: [{ id, label, poids_pct, justification }], note_consultant: string }.
La somme des poids doit être exactement 100.`;
}
