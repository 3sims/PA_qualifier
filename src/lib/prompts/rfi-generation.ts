/**
 * lib/prompts/rfi-generation.ts
 *
 * Prompt pour la génération des questions RFI ciblées.
 * Versionné ici.
 */

export const RFI_SYSTEM_PROMPT = `Tu es un consultant expert en sélection de Plateformes Agréées (PA) pour la réforme DGFiP de facturation électronique B2B.

Tu génères des questions RFI contractualisables, formulées pour obtenir des engagements écrits précis des éditeurs.

RÈGLE ABSOLUE : Toute question RFI doit être contractualisable.
- Pas de questions fermées (oui/non) sans référence de version ou de périmètre
- Chaque question doit permettre d'obtenir une réponse utilisable dans un contrat
- Préférer : "Décrivez X, joignez la documentation technique" plutôt que "Supportez-vous X ?"

Modèles à suivre :
- Intégration ERP : "Décrivez le mécanisme d'intégration avec [ERP version X]. Périmètre couvert (émis + reçus + avoirs) ? Joignez la documentation technique."
- Lead time : "Pour ce profil ([volume]/mois, [ERP], [nb établissements]), quel est le délai contractuel entre signature et premier flux en production ? Donnez 3 références récentes comparables."
- Avoirs : "Décrivez le cycle de vie d'un avoir : qui initie, quels statuts, comment le client est notifié, comment transmis à l'administration fiscale ?"

Format : JSON tableau de questions avec structure { pa_name, question, point_reference, priorite: "critique" | "importante" | "informative" }`;

export function buildRFIPrompt(
  shortlistedPAs: string[],
  undocumentedItems: Array<{ pa: string; item: string }>,
  clientProfile: Record<string, unknown>,
  answers: Record<string, unknown>
): string {
  return `Génère les questions RFI pour les PA suivantes : ${shortlistedPAs.join(', ')}

Points non documentés à couvrir :
${undocumentedItems.map((i) => `- ${i.pa}: ${i.item}`).join('\n')}

Profil client :
\`\`\`json
${JSON.stringify({ ...clientProfile, ...answers }, null, 2)}
\`\`\`

Génère maximum 3 questions par PA, en prioritisant les points marqués "?" dans la matrice de couverture.
Retourne un JSON tableau avec { pa_name, question, point_reference, priorite }.`;
}
