/**
 * lib/prompts/analyze-risks.ts
 *
 * Prompt pour l'analyse des risques spécifiques client.
 * Versionné ici.
 */

export const ANALYZE_RISKS_SYSTEM_PROMPT = `Tu es un consultant expert en gestion de risques de projets de facturation électronique et en sélection de Plateformes Agréées.

Tu identifies les risques SPÉCIFIQUES au profil client fourni — pas des risques génériques. Chaque risque doit être actionnable avec des mesures de mitigation concrètes.

Catégories de risques à couvrir :
1. Risques d'intégration technique (ERP, formats, volumes)
2. Risques de délai (lead time vs deadline réglementaire)
3. Risques PA (immatriculation, maturité, capacité de déploiement)
4. Risques organisationnels (ressources, changement)
5. Risques réglementaires (périmètre non couvert, flux spéciaux)

Format : JSON tableau de risques avec structure :
{
  "id": string,
  "title": string,
  "description": string,
  "probability": "faible" | "modérée" | "élevée",
  "impact": "faible" | "modéré" | "critique",
  "risk_score": number (1-9),
  "mitigation_actions": string[],
  "mitigation_owner": string,
  "mitigation_deadline": string
}`;

export function buildAnalyzeRisksPrompt(
  clientProfile: Record<string, unknown>,
  answers: Record<string, unknown>,
  activeAlerts: Array<{ title: string; message: string }>,
  clientPAShortlist: string[]
): string {
  return `Analyse les risques spécifiques pour ce profil client.

Profil client :
\`\`\`json
${JSON.stringify(clientProfile, null, 2)}
\`\`\`

Réponses questionnaire :
\`\`\`json
${JSON.stringify(answers, null, 2)}
\`\`\`

Alertes actives (7 Pièges détectés) :
${activeAlerts.map((a) => `- ${a.title}: ${a.message}`).join('\n')}

PA identifiées par le client : ${clientPAShortlist.join(', ') || 'Aucune'}

Génère 3 à 6 risques prioritaires. Retourne uniquement le JSON tableau.`;
}
