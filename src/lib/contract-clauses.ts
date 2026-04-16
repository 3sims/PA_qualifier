/**
 * lib/contract-clauses.ts
 *
 * Clauses contractuelles non négociables pour tout contrat PA.
 * Stateless, pur. Aucun import React.
 */

export interface ContractClause {
  id: string;
  label: string;
  text: string;
  justification: string;
  priority: 'critical' | 'important';
}

export const MANDATORY_CONTRACT_CLAUSES: ContractClause[] = [
  {
    id: 'exit_clause',
    label: 'Clause de sortie',
    text: 'Résiliation anticipée sans pénalité disproportionnée (préavis ≤ 3 mois, pénalité ≤ 1 mois de facturation)',
    justification: 'Protection en cas de non-renouvellement d\'immatriculation DGFiP ou de défaillance de la PA',
    priority: 'critical',
  },
  {
    id: 'data_portability',
    label: 'Portabilité des données',
    text: 'Export intégral de l\'historique de facturation en format standard (UBL, Factur-X, CSV) sous 30 jours calendaires après résiliation',
    justification: 'Obligation légale de conservation des justificatifs fiscaux et protection en cas de migration',
    priority: 'critical',
  },
  {
    id: 'sla_availability',
    label: 'SLA disponibilité',
    text: 'Disponibilité garantie ≥ 99,5% sur les heures ouvrées avec pénalités contractuelles définies par paliers',
    justification: 'Obligation de conformité fiscale en temps réel — une indisponibilité peut entraîner des manquements déclaratifs',
    priority: 'critical',
  },
  {
    id: 'archiving_duration',
    label: 'Durée d\'archivage',
    text: 'Conservation garantie des données pendant minimum 10 ans avec accès garanti pendant toute la durée et 5 ans après résiliation',
    justification: 'Prescription fiscale française (6 ans) + marge de sécurité; obligation réglementaire DGFiP',
    priority: 'critical',
  },
  {
    id: 'pa_renewal',
    label: 'Renouvellement immatriculation PA',
    text: 'Clause de contingence en cas de non-renouvellement de l\'immatriculation DGFiP : plan de continuité, migration assistée, remboursement au prorata',
    justification: 'L\'immatriculation PA est renouvelable tous les 3 ans — risque de non-conformité si la PA perd son statut',
    priority: 'critical',
  },
  {
    id: 'subprocessors',
    label: 'Sous-traitance et hébergement',
    text: 'Liste des sous-traitants et hébergeurs avec localisation des datacenters annexée au contrat, notification obligatoire de tout changement sous 30 jours',
    justification: 'Exigences RGPD et DGFiP sur la localisation des données fiscales',
    priority: 'important',
  },
  {
    id: 'support_sla',
    label: 'SLA Support',
    text: 'Délais de résolution contractuels : P1 (critique, production bloquée) < 4h, P2 (dégradé) < 24h, P3 (mineur) < 5 jours ouvrés',
    justification: 'Une panne sur le flux de facturation peut bloquer les encaissements et le rapprochement comptable',
    priority: 'important',
  },
  {
    id: 'audit_right',
    label: 'Droit d\'audit',
    text: 'Droit d\'audit annuel du client sur les conditions de traitement et hébergement des données, possibilité de questionnaire de sécurité ad hoc',
    justification: 'Exigences des Commissaires aux Comptes et politiques de cybersécurité des grands groupes',
    priority: 'important',
  },
] as const;

/**
 * Retourne les clauses filtrées selon leur priorité.
 */
export function getCriticalClauses(): ContractClause[] {
  return MANDATORY_CONTRACT_CLAUSES.filter((c) => c.priority === 'critical');
}

export function getAllClauses(): ContractClause[] {
  return [...MANDATORY_CONTRACT_CLAUSES];
}
