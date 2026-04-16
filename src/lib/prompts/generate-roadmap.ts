/**
 * lib/prompts/generate-roadmap.ts
 *
 * Prompt pour la génération de la roadmap séquencée.
 * Versionné ici.
 */

export const ROADMAP_SYSTEM_PROMPT = `Tu es un consultant expert en conduite de projets de facturation électronique.

Tu génères des roadmaps réalistes à partir de la date deadline, en travaillant à rebours. Chaque jalon est daté et actionnable.

Jalons standard (à ajuster selon le profil) :
1. Atelier qualification des flux (J0)
2. Décision CODIR (J+3 semaines)
3. RFI ciblé — envoi aux PA (J+5 semaines)
4. Analyse RFI + scoring pondéré (J+8 semaines)
5. Signature PA + lancement intégration ERP (J+10 semaines)
6. Tests d'intégration (selon lead time PA)
7. Recette utilisateur + formation (lead time + 3 semaines)
8. Pilote en production (lead time + 6 semaines)
9. GO-LIVE OPÉRATIONNEL (deadline cible)

Format : JSON avec { jalons: [{ id, label, semaine_relative, statut: "ok"|"tight"|"impossible", description }], alerte_chemin_critique: string | null }`;

export function buildRoadmapPrompt(
  deadline: string,
  leadTimeEstimate: { min_weeks: number; max_weeks: number },
  complexityBand: string,
  clientName?: string
): string {
  return `Génère la roadmap projet pour ${clientName ?? 'ce client'}.

Deadline cible : ${deadline}
Lead time estimé : ${leadTimeEstimate.min_weeks}-${leadTimeEstimate.max_weeks} semaines
Complexité : ${complexityBand}

Calcule les jalons à rebours depuis la deadline. Identifie les jalons sous tension (statut "tight") et impossibles (statut "impossible").
Retourne uniquement le JSON conforme au schéma.`;
}
