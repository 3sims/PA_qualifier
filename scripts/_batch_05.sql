UPDATE pa SET
  annuaire_consultation_mode = 'interface_web',
  annuaire_maj_autonome = 'autonome',
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = TRUE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = FALSE,
  clients_references_text = 'Mondial Relay, Big (Fernand) Groupe, Aubade',
  configuration_initiale = 'setup_obligatoire',
  gestion_statuts = 'tous_14',
  marque_blanche = NULL,
  nb_employes_range = '200-500',
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'yooz-pdp';

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'yooz-pdp',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : annuaire_consultation_mode, annuaire_maj_autonome, autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, gestion_statuts, marque_blanche, nb_employes_range, notes_de_frais_cu, raccordement_annuaire_prod, workflow_validation',
  '{annuaire_consultation_mode,annuaire_maj_autonome,autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,gestion_statuts,marque_blanche,nb_employes_range,notes_de_frais_cu,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);