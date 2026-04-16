/**
 * lib/workshop-hints.ts
 *
 * Questions d'atelier pour le guide animateur — aide contextuelle par champ.
 * Stateless, pur. Aucun import React.
 */

import type { WorkshopHint } from './types';

// ---------------------------------------------------------------------------
// HINTS PAR CHAMP (keyed by question id)
// ---------------------------------------------------------------------------

export const WORKSHOP_HINTS: Partial<Record<string, WorkshopHint[]>> = {
  erp_main: [
    {
      question:
        "Quelle est la version exacte de votre ERP et son mode de déploiement (on-premise, cloud, hybride) ?",
      objectif:
        "Identifier les contraintes d'intégration (API disponibles, connecteurs certifiés, limitations cloud)",
      phase: 'diagnostic_si',
      formulation_example:
        "Nous sommes sur SAP S/4HANA en mode on-premise, version 2022. Avez-vous un connecteur certifié pour cette version ?",
    },
    {
      question:
        "Avez-vous un middleware ou une couche d'intégration existante (SAP PI/PO, BTP, MuleSoft, Talend, autre) ?",
      objectif:
        "Évaluer si un connecteur natif PA peut s'appuyer sur l'existant — peut réduire le lead time de 2 à 4 semaines",
      phase: 'diagnostic_si',
    },
    {
      question:
        "Qui gère les développements ERP en interne (équipe IT, intégrateur externe, éditeur) ?",
      objectif:
        "Identifier les ressources disponibles pour l'intégration et les éventuels contrats de maintenance à prendre en compte",
      phase: 'diagnostic_si',
    },
  ],

  erp_tier: [
    {
      question:
        "Si vous avez un ERP niche ou développé en interne, avez-vous une documentation technique de l'API de votre ERP ?",
      objectif:
        "Évaluer la faisabilité d'une intégration API et estimer le budget de développement sur-mesure",
      phase: 'diagnostic_si',
    },
  ],

  has_b2g: [
    {
      question:
        "Avez-vous des flux Chorus Pro actifs ? Combien de clients publics en volume et en montant ?",
      objectif:
        "Détecter les cas d'usage B2G non couverts par des PA standard — certaines PA n'ont pas de connecteur Chorus Pro opérationnel",
      phase: 'p1_discovery',
      formulation_example:
        "Environ 15 clients publics (collectivités), 200 factures/an sur Chorus Pro. Est-ce que votre PA gère le dépôt Chorus Pro ou faut-il le faire manuellement ?",
    },
    {
      question:
        "Utilisez-vous des flux Chorus Pro via votre ERP actuel ou via un portail manuel ?",
      objectif:
        "Évaluer si l'intégration Chorus Pro peut s'appuyer sur l'ERP ou nécessite un flux dédié",
      phase: 'p1_discovery',
    },
  ],

  has_autofactures: [
    {
      question:
        "Décrivez le cycle de vie d'une auto-facture : qui l'initie (vous ou le fournisseur), quels systèmes sont impliqués, comment le fournisseur est-il notifié ?",
      objectif:
        "L'auto-facturation est un flux complexe rarement couvert en standard — identifier si la PA a des références sur ce cas d'usage",
      phase: 'p1_discovery',
    },
  ],

  volume_emitted: [
    {
      question:
        "Y a-t-il une saisonnalité forte sur vos volumes de facturation ? Si oui, quel est le pic mensuel maximal ?",
      objectif:
        "Identifier les besoins de montée en charge — certaines PA facturent au volume et peuvent avoir des délais en période de pic",
      phase: 'p1_discovery',
    },
  ],

  exception_rate: [
    {
      question:
        "Quels sont les principaux motifs de litige ou de retour de facture ? Avoirs, refus, corrections de prix ?",
      objectif:
        "Qualifier le taux d'exception — un taux > 15% suggère des besoins fonctionnels avancés (workflow de litiges, portail client)",
      phase: 'p1_discovery',
    },
  ],

  invoice_format_out: [
    {
      question:
        "Si vous utilisez l'EDI aujourd'hui, quels messages EDIFACT émettez-vous (INVOIC, DESADV, ORDERS…) et vers quels partenaires ?",
      objectif:
        "Évaluer la complexité de la migration EDI — certaines PA ne supportent pas tous les messages EDIFACT ou toutes les versions",
      phase: 'p1_discovery',
    },
  ],

  data_hosting: [
    {
      question:
        "L'exigence d'hébergement France est-elle une contrainte réglementaire (secteur santé, défense, donnée sensible) ou une préférence ?",
      objectif:
        "Si c'est réglementaire (HDS, SecNumCloud), vérifier que l'exigence est respectée non seulement pour les données en base mais aussi pour les logs et les backups",
      phase: 'p2_gap',
      formulation_example:
        "Nous sommes soumis à la réglementation HDS — toutes les données doivent être hébergées en France, y compris les backups. Confirmez la localisation de vos datacenters de disaster recovery.",
    },
  ],

  certifications: [
    {
      question:
        "Pour l'ISO 27001, quel est le périmètre exact de la certification ? Couvre-t-il spécifiquement la solution de facturation électronique ?",
      objectif:
        "Certaines PA ont une ISO 27001 sur leur siège social mais pas sur l'infrastructure de production — vérifier le périmètre exact",
      phase: 'p2_gap',
    },
  ],

  archiving_probant: [
    {
      question:
        "Si vous avez besoin d'archivage probant, quel est votre système d'archivage actuel ? La PA doit-elle le remplacer ou s'interfacer avec l'existant ?",
      objectif:
        "Éviter la double facturation d'une solution d'archivage — certains clients ont déjà un SAE certifié et veulent juste l'alimentation automatique",
      phase: 'p2_gap',
    },
  ],

  internal_resources: [
    {
      question:
        "Qui sera le chef de projet côté client pour l'intégration PA ? Combien de jours/homme pouvez-vous mobiliser sur les 6 prochains mois ?",
      objectif:
        "Évaluer le risque de goulot d'étranglement côté client — c'est souvent la principale cause de dérapage des projets PA",
      phase: 'p2_gap',
    },
  ],

  deadline: [
    {
      question:
        "La deadline est-elle liée à la date réglementaire DGFiP (sept. 2026 pour les GE) ou à une contrainte interne (audit, fusion, ERP migration) ?",
      objectif:
        "Une deadline liée à une migration ERP parallèle double la complexité — doit être détectée dès le cadrage",
      phase: 'p0_profil',
    },
  ],

  nb_entities: [
    {
      question:
        "Pour les entités multi-sites, ont-elles des SIRETs différents ? Y a-t-il de la facturation inter-sites ?",
      objectif:
        "La facturation inter-sites est un cas d'usage spécifique qui peut nécessiter des configurations dédiées dans la PA",
      phase: 'p1_discovery',
    },
  ],
};

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Retourne les hints pour un champ donné (empty array si aucun).
 */
export function getHintsForField(fieldId: string): WorkshopHint[] {
  return WORKSHOP_HINTS[fieldId] ?? [];
}

/**
 * Retourne tous les hints d'une phase.
 */
export function getHintsForPhase(
  phase: WorkshopHint['phase']
): Array<{ fieldId: string; hint: WorkshopHint }> {
  const result: Array<{ fieldId: string; hint: WorkshopHint }> = [];
  for (const [fieldId, hints] of Object.entries(WORKSHOP_HINTS)) {
    for (const hint of hints ?? []) {
      if (hint.phase === phase) result.push({ fieldId, hint });
    }
  }
  return result;
}
