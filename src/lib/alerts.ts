/**
 * lib/alerts.ts
 *
 * Moteur des 7 Pièges — alertes contextuelles basées sur les réponses wizard.
 * Stateless, pur. Aucun import React, aucun side effect.
 */

import type { DiscoveryAnswers, ContextualAlert, LeadTimeEstimate } from './types';

// ---------------------------------------------------------------------------
// DÉFINITIONS DES 7 PIÈGES
// ---------------------------------------------------------------------------

interface PiegeDefinition {
  piege_id: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  title: string;
  message: string;
  regle: string;
  severity: 'warning' | 'critical' | 'info';
  step: 0 | 1 | 2 | 3 | 4 | 5 | 'results';
  trigger: (
    answers: Partial<DiscoveryAnswers>,
    leadTime?: LeadTimeEstimate
  ) => boolean;
  buildSituationConcrete?: (
    answers: Partial<DiscoveryAnswers>,
    leadTime?: LeadTimeEstimate
  ) => string | undefined;
}

function getWeeksUntilDeadline(deadline: string | undefined): number | null {
  if (!deadline) return null;
  const map: Record<string, number> = {
    '<3mois':   12,
    '3-6mois':  26,
    '6-12mois': 52,
    '>12mois':  104,
  };
  return map[deadline] ?? null;
}

export const PIEGES_DEFINITIONS: PiegeDefinition[] = [
  {
    piege_id: 1,
    title: "PA 'par défaut ERP' sans vérification du périmètre connecteur",
    message:
      "Le connecteur ERP natif de la PA couvre souvent uniquement les flux émis. Les flux reçus et les avoirs nécessitent souvent une configuration additionnelle ou un développement.",
    regle:
      "Exiger la documentation technique du connecteur : périmètre exact (émis + reçus + avoirs), version certifiée, références récentes.",
    severity: 'warning',
    step: 2,
    trigger: (a) => a.erp_tier === 'tier1' && !!a.erp_main,
    buildSituationConcrete: (a) =>
      a.erp_main
        ? `Vous utilisez ${a.erp_main.toUpperCase()} (Tier 1). Vérifiez que le connecteur couvre bien émission + réception + avoirs.`
        : undefined,
  },
  {
    piege_id: 2,
    title: "Complexité d'intégration sous-estimée vs richesse fonctionnelle",
    message:
      "Un ERP niche ou développé en interne nécessite une intégration API ou sur-mesure (16-32 semaines). Le budget et le planning doivent en tenir compte dès le cadrage.",
    regle:
      "Obtenir 3 références récentes avec des profils similaires (même ERP, même volume) et un devis de mise en œuvre détaillé.",
    severity: 'critical',
    step: 2,
    trigger: (a) => a.erp_tier === 'custom' || a.erp_tier === 'niche',
    buildSituationConcrete: (a) =>
      a.erp_tier === 'custom'
        ? "Votre ERP est développé en interne — aucune PA n'aura de connecteur natif. L'intégration sera sur-mesure (API)."
        : a.erp_main
          ? `Votre ERP est niche (${a.erp_main}). Les connecteurs natifs sont rares — prévoir une intégration API.`
          : undefined,
  },
  {
    piege_id: 3,
    title: 'Données de benchmark PA non datées (> 12 mois)',
    message:
      "Les capacités déclarées par les PA sur leurs sites évoluent rapidement. Des données de plus de 12 mois sont considérées comme indicatives et doivent être revalidées.",
    regle:
      "Toujours vérifier la date de dernière mise à jour des données PA. Exiger une réponse écrite et datée à chaque question de couverture dans le RFI.",
    severity: 'info',
    step: 'results',
    trigger: () => true, // Toujours actif sur les résultats
    buildSituationConcrete: () =>
      "Certaines données PA dans cette matrice datent de plus de 12 mois et sont marquées 'indicatives'. Revalidez-les via RFI avant contractualisation.",
  },
  {
    piege_id: 4,
    title: "Confusion immatriculé DGFiP ≠ opérationnel en production",
    message:
      "Une PA peut être immatriculée DGFiP mais pas encore déployée avec des clients en production. L'immatriculation ne garantit pas la maturité produit.",
    regle:
      "Exiger des références de clients en production depuis ≥ 6 mois avec un profil similaire. Vérifier la date de premier go-live opérationnel.",
    severity: 'critical',
    step: 3,
    trigger: (a) => {
      const weeks = getWeeksUntilDeadline(a.deadline);
      return weeks !== null && weeks < 20;
    },
    buildSituationConcrete: (a) => {
      const weeks = getWeeksUntilDeadline(a.deadline);
      return weeks !== null
        ? `Votre deadline est dans ${weeks} semaines. Avec ce délai, vous ne pouvez pas vous permettre d'être le 'premier client' d'une PA nouvellement immatriculée.`
        : undefined;
    },
  },
  {
    piege_id: 5,
    title: 'Souveraineté des données — hébergement hors UE non détecté',
    message:
      "Certaines PA hébergent leurs données hors UE (AWS US, Azure US…) via des sous-traitants non déclarés explicitement. Vérifier les contrats de sous-traitance.",
    regle:
      "Exiger l'annexe contractuelle listant tous les sous-traitants avec localisation des datacenters primaire et secondaire.",
    severity: 'critical',
    step: 4,
    trigger: (a) => a.data_hosting === 'FRANCE',
    buildSituationConcrete: () =>
      "Vous exigez un hébergement en France. Vérifiez que vos PA shortlistées hébergent bien TOUTES leurs données (y compris logs, backups) en France.",
  },
  {
    piege_id: 6,
    title: 'Lead time réel sous-estimé (signature ≠ go-live opérationnel)',
    message:
      "Le délai contractuellement annoncé correspond à la mise en service 'baseline'. Les tests d'intégration ERP, la recette et la formation peuvent ajouter 4-8 semaines.",
    regle:
      "Intégrer dans le planning : +4 semaines tests d'intégration, +2 semaines recette utilisateur, +2 semaines formation. Le go-live réel = signature + lead time + 4 à 8 semaines.",
    severity: 'critical',
    step: 'results',
    trigger: (a, lt) => {
      if (!lt) return false;
      const weeks = getWeeksUntilDeadline(a.deadline);
      if (weeks === null) return false;
      return weeks < lt.min_weeks + 8;
    },
    buildSituationConcrete: (a, lt) => {
      if (!lt) return undefined;
      const weeks = getWeeksUntilDeadline(a.deadline);
      if (weeks === null) return undefined;
      return `Deadline dans ${weeks} semaines. Lead time minimum estimé : ${lt.min_weeks} sem. + 8 sem. de recette/formation = ${lt.min_weeks + 8} sem. requises. Marge : ${weeks - lt.min_weeks - 8} sem.`;
    },
  },
  {
    piege_id: 7,
    title: 'Opérationnels métier non impliqués dans le choix de la PA',
    message:
      "Le choix de PA est souvent piloté par l'IT ou la Finance. Sans implication des équipes métier (comptabilité, achats, ADV), les besoins fonctionnels réels sont sous-estimés.",
    regle:
      "Impliquer au minimum : responsable comptabilité fournisseurs, responsable ADV/facturation, et DSI dans les démonstrations et la rédaction du RFP.",
    severity: 'warning',
    step: 1,
    trigger: (a) => a.internal_resources === 'none',
    buildSituationConcrete: () =>
      "Aucune ressource interne IT déclarée. Le projet sera externalisé — assurez-vous que les référents métier (comptabilité, achats) sont disponibles pour les recettes.",
  },
];

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Retourne les alertes actives pour un profil donné.
 * Enrichit chaque piège avec une situation_concrete contextualisée.
 */
export function getContextualAlerts(
  answers: Partial<DiscoveryAnswers>,
  leadTimeEstimate?: LeadTimeEstimate
): ContextualAlert[] {
  return PIEGES_DEFINITIONS
    .filter((p) => p.trigger(answers, leadTimeEstimate))
    .map((p) => ({
      piege_id:           p.piege_id,
      severity:           p.severity,
      step:               p.step,
      title:              p.title,
      message:            p.message,
      regle:              p.regle,
      situation_concrete: p.buildSituationConcrete?.(answers, leadTimeEstimate),
    }));
}

/**
 * Retourne les alertes actives pour une étape wizard spécifique.
 */
export function getAlertsForStep(
  answers: Partial<DiscoveryAnswers>,
  step: 0 | 1 | 2 | 3 | 4 | 5,
  leadTimeEstimate?: LeadTimeEstimate
): ContextualAlert[] {
  return getContextualAlerts(answers, leadTimeEstimate).filter(
    (a) => a.step === step
  );
}

/**
 * Retourne les alertes de la page résultats.
 */
export function getResultsAlerts(
  answers: Partial<DiscoveryAnswers>,
  leadTimeEstimate?: LeadTimeEstimate
): ContextualAlert[] {
  return getContextualAlerts(answers, leadTimeEstimate).filter(
    (a) => a.step === 'results'
  );
}
