UPDATE pa SET
  access_point_peppol = 'oui',
  automatisation_encaissements = 'via_api_bancaire',
  automatisation_ereporting_pmt = 'via_api_bancaire',
  automatisation_validation = TRUE,
  cas_usage_couverture = '10_20',
  cas_usage_tiers = 'certains',
  clients_production_flux2 = 'non',
  clients_production_flux3 = FALSE,
  configuration_initiale = 'libre_acces',
  gestion_statuts = 'tous_14',
  marque_blanche = NULL,
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'abby';

UPDATE pa SET
  access_point_peppol = 'oui',
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = FALSE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = FALSE,
  clients_references_text = 'Mars, Japanese Tobacco International, Cohu',
  configuration_initiale = 'setup_obligatoire',
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'statuts_seulement',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'accenture';

UPDATE pa SET
  automatisation_validation = FALSE,
  cas_usage_couverture = '30_36',
  cas_usage_tiers = 'certains',
  clients_production_flux2 = 'non',
  clients_production_flux3 = FALSE,
  configuration_initiale = 'setup_obligatoire',
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  raccordement_annuaire_prod = 'prochainement',
  workflow_validation = 'statuts_seulement',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'ademico-software';

UPDATE pa SET
  access_point_peppol = 'oui',
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = TRUE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = FALSE,
  configuration_initiale = 'setup_obligatoire',
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  nb_employes_range = '50-200',
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'agena3000';

UPDATE pa SET
  access_point_peppol = 'oui',
  automatisation_ereporting_pmt = 'via_api_bancaire',
  automatisation_validation = TRUE,
  cas_usage_couverture = '30_36',
  cas_usage_tiers = 'certains',
  clients_production_flux2 = 'non',
  clients_production_flux3 = FALSE,
  clients_references_text = 'Thermador, Mousline, Moustache bikes',
  configuration_initiale = 'setup_obligatoire',
  marque_blanche = NULL,
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'prochainement',
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'agicap';

UPDATE pa SET
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_encaissements = 'via_api_bancaire',
  automatisation_ereporting_pmt = 'via_api_bancaire',
  automatisation_validation = TRUE,
  cas_usage_couverture = '30_36',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = TRUE,
  clients_references_text = '"Groupe V33, Groupe Guillin Emballage, CCAS des Energies Gazières et Electriques"""',
  configuration_initiale = 'setup_obligatoire',
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'arteva';

UPDATE pa SET
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = TRUE,
  cas_usage_couverture = '30_36',
  cas_usage_tiers = 'certains',
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = TRUE,
  configuration_initiale = 'setup_obligatoire',
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'atgp';

UPDATE pa SET
  access_point_peppol = 'oui',
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = TRUE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'oui',
  clients_production_flux3 = TRUE,
  clients_references_text = 'Acer, Converse, Netflix',
  configuration_initiale = 'libre_acces',
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'statuts_seulement',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'avalara';

UPDATE pa SET
  access_point_peppol = 'oui',
  automatisation_encaissements = 'via_api_bancaire',
  automatisation_ereporting_pmt = 'via_api_bancaire',
  automatisation_validation = FALSE,
  cas_usage_couverture = '30_36',
  cas_usage_tiers = 'certains',
  clients_production_flux2 = 'non',
  clients_production_flux3 = FALSE,
  configuration_initiale = 'libre_acces',
  marque_blanche = TRUE,
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'prochainement',
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'axonaut';

UPDATE pa SET
  access_point_peppol = 'oui',
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = TRUE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  chorus_pro = TRUE,
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = TRUE,
  configuration_initiale = 'setup_obligatoire',
  extraction_non_structures = 'ocr_ia',
  frais_setup = TRUE,
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  nb_employes_range = '1000-5000',
  notes_de_frais_cu = 'tous',
  portail_fournisseur = TRUE,
  raccordement_annuaire_prod = 'oui',
  traduction_edi = TRUE,
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'axway';

UPDATE pa SET
  marque_blanche = NULL,
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'azopio';

UPDATE pa SET
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = TRUE,
  cas_usage_couverture = '30_36',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'oui',
  clients_production_flux3 = FALSE,
  clients_references_text = 'Eurovia Vinci, Charles River Laboratories, Darwin',
  configuration_initiale = 'libre_acces',
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  nb_employes_range = 'oct-50',
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'b2brouter';

UPDATE pa SET
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = TRUE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = TRUE,
  clients_references_text = 'Mercedes-Benz, Danone, Engie',
  configuration_initiale = 'setup_obligatoire',
  gestion_statuts = 'tous_14',
  marque_blanche = NULL,
  nb_employes_range = '1000-5000',
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'basware';

UPDATE pa SET
  annuaire_consultation_mode = 'les_deux',
  annuaire_maj_autonome = 'autonome',
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_encaissements = 'via_api_bancaire',
  automatisation_ereporting_pmt = 'via_api_bancaire',
  automatisation_validation = TRUE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = FALSE,
  clients_references_text = 'Stripe, CWT, O&M Halyard',
  configuration_initiale = 'libre_acces',
  gestion_statuts = 'obligatoires_4',
  marque_blanche = TRUE,
  nb_employes_range = '50-200',
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'billit';

UPDATE pa SET
  marque_blanche = NULL,
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'cbs-corporate';

UPDATE pa SET
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = FALSE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'oui',
  clients_production_flux3 = FALSE,
  clients_references_text = 'Orange, Stellantis, Eiffage',
  configuration_initiale = 'libre_acces',
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'statuts_seulement',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'cecurity';

UPDATE pa SET
  access_point_peppol = 'oui',
  autofacturation_cu19b = 'vendeur_et_acheteur',
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'oui',
  clients_production_flux3 = TRUE,
  clients_references_text = 'France Télévisions, Sodexo, Hutchinson',
  configuration_initiale = 'setup_obligatoire',
  marque_blanche = TRUE,
  nb_employes_range = '5000+',
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'oui',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'cegedim';

UPDATE pa SET
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_encaissements = 'via_api_bancaire',
  automatisation_ereporting_pmt = 'via_api_bancaire',
  automatisation_validation = TRUE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = FALSE,
  clients_references_text = 'Information non partagée',
  configuration_initiale = 'libre_acces',
  gestion_statuts = 'tous_14',
  marque_blanche = NULL,
  nb_employes_range = '1000-5000',
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'cegid';

UPDATE pa SET
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_encaissements = 'via_api_bancaire',
  automatisation_ereporting_pmt = 'via_api_bancaire',
  automatisation_validation = TRUE,
  cas_usage_couverture = '20_30',
  cas_usage_tiers = 'certains',
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = FALSE,
  clients_references_text = 'Information non partagée',
  configuration_initiale = 'libre_acces',
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'chaintrust';

UPDATE pa SET
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = TRUE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = TRUE,
  clients_references_text = 'Metro Digital, AGFA, Mutti, La Redoute',
  configuration_initiale = 'setup_obligatoire',
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  nb_employes_range = '5000+',
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'comarch';

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'abby',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, automatisation_encaissements, automatisation_ereporting_pmt, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, configuration_initiale, gestion_statuts, marque_blanche, raccordement_annuaire_prod, workflow_validation',
  '{access_point_peppol,automatisation_encaissements,automatisation_ereporting_pmt,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,configuration_initiale,gestion_statuts,marque_blanche,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'accenture',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, gestion_statuts, marque_blanche, notes_de_frais_cu, raccordement_annuaire_prod, workflow_validation',
  '{access_point_peppol,autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,gestion_statuts,marque_blanche,notes_de_frais_cu,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'ademico-software',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, configuration_initiale, gestion_statuts, marque_blanche, raccordement_annuaire_prod, workflow_validation',
  '{automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,configuration_initiale,gestion_statuts,marque_blanche,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'agena3000',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, configuration_initiale, gestion_statuts, marque_blanche, nb_employes_range, notes_de_frais_cu, raccordement_annuaire_prod, workflow_validation',
  '{access_point_peppol,autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,configuration_initiale,gestion_statuts,marque_blanche,nb_employes_range,notes_de_frais_cu,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'agicap',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, automatisation_ereporting_pmt, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, marque_blanche, notes_de_frais_cu, raccordement_annuaire_prod, workflow_validation',
  '{access_point_peppol,automatisation_ereporting_pmt,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,marque_blanche,notes_de_frais_cu,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'arteva',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : autofacturation_cu19b, automatisation_encaissements, automatisation_ereporting_pmt, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, gestion_statuts, marque_blanche, notes_de_frais_cu, raccordement_annuaire_prod, workflow_validation',
  '{autofacturation_cu19b,automatisation_encaissements,automatisation_ereporting_pmt,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,gestion_statuts,marque_blanche,notes_de_frais_cu,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'atgp',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, configuration_initiale, gestion_statuts, marque_blanche, notes_de_frais_cu, raccordement_annuaire_prod, workflow_validation',
  '{autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,configuration_initiale,gestion_statuts,marque_blanche,notes_de_frais_cu,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'avalara',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, gestion_statuts, marque_blanche, notes_de_frais_cu, raccordement_annuaire_prod, workflow_validation',
  '{access_point_peppol,autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,gestion_statuts,marque_blanche,notes_de_frais_cu,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'axonaut',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, automatisation_encaissements, automatisation_ereporting_pmt, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, configuration_initiale, marque_blanche, notes_de_frais_cu, raccordement_annuaire_prod, workflow_validation',
  '{access_point_peppol,automatisation_encaissements,automatisation_ereporting_pmt,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,configuration_initiale,marque_blanche,notes_de_frais_cu,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'axway',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, chorus_pro, clients_production_flux2, clients_production_flux3, configuration_initiale, extraction_non_structures, frais_setup, gestion_statuts, marque_blanche, nb_employes_range, notes_de_frais_cu, portail_fournisseur, raccordement_annuaire_prod, traduction_edi, workflow_validation',
  '{access_point_peppol,autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,chorus_pro,clients_production_flux2,clients_production_flux3,configuration_initiale,extraction_non_structures,frais_setup,gestion_statuts,marque_blanche,nb_employes_range,notes_de_frais_cu,portail_fournisseur,raccordement_annuaire_prod,traduction_edi,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'azopio',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : marque_blanche',
  '{marque_blanche}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'b2brouter',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, gestion_statuts, marque_blanche, nb_employes_range, raccordement_annuaire_prod, workflow_validation',
  '{autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,gestion_statuts,marque_blanche,nb_employes_range,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'basware',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, gestion_statuts, marque_blanche, nb_employes_range, notes_de_frais_cu, raccordement_annuaire_prod, workflow_validation',
  '{autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,gestion_statuts,marque_blanche,nb_employes_range,notes_de_frais_cu,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'billit',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : annuaire_consultation_mode, annuaire_maj_autonome, autofacturation_cu19b, automatisation_encaissements, automatisation_ereporting_pmt, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, gestion_statuts, marque_blanche, nb_employes_range, notes_de_frais_cu, raccordement_annuaire_prod, workflow_validation',
  '{annuaire_consultation_mode,annuaire_maj_autonome,autofacturation_cu19b,automatisation_encaissements,automatisation_ereporting_pmt,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,gestion_statuts,marque_blanche,nb_employes_range,notes_de_frais_cu,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'cbs-corporate',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : marque_blanche',
  '{marque_blanche}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'cecurity',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, gestion_statuts, marque_blanche, notes_de_frais_cu, raccordement_annuaire_prod, workflow_validation',
  '{autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,gestion_statuts,marque_blanche,notes_de_frais_cu,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'cegedim',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, autofacturation_cu19b, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, marque_blanche, nb_employes_range, notes_de_frais_cu, raccordement_annuaire_prod',
  '{access_point_peppol,autofacturation_cu19b,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,marque_blanche,nb_employes_range,notes_de_frais_cu,raccordement_annuaire_prod}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'cegid',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : autofacturation_cu19b, automatisation_encaissements, automatisation_ereporting_pmt, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, gestion_statuts, marque_blanche, nb_employes_range, notes_de_frais_cu, raccordement_annuaire_prod, workflow_validation',
  '{autofacturation_cu19b,automatisation_encaissements,automatisation_ereporting_pmt,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,gestion_statuts,marque_blanche,nb_employes_range,notes_de_frais_cu,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'chaintrust',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : autofacturation_cu19b, automatisation_encaissements, automatisation_ereporting_pmt, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, gestion_statuts, marque_blanche, notes_de_frais_cu, raccordement_annuaire_prod, workflow_validation',
  '{autofacturation_cu19b,automatisation_encaissements,automatisation_ereporting_pmt,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,gestion_statuts,marque_blanche,notes_de_frais_cu,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'comarch',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, gestion_statuts, marque_blanche, nb_employes_range, notes_de_frais_cu, raccordement_annuaire_prod, workflow_validation',
  '{autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,gestion_statuts,marque_blanche,nb_employes_range,notes_de_frais_cu,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);