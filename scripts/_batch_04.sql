UPDATE pa SET
  access_point_peppol = 'prochainement',
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = TRUE,
  cas_usage_couverture = '30_36',
  cas_usage_tiers = 'certains',
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = FALSE,
  configuration_initiale = 'setup_obligatoire',
  frais_setup = TRUE,
  gestion_statuts = 'tous_14',
  marque_blanche = NULL,
  nb_employes_range = '200-500',
  notes_de_frais_cu = 'tous',
  portail_fournisseur = TRUE,
  raccordement_annuaire_prod = 'prochainement',
  traduction_edi = FALSE,
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'spendesk';

UPDATE pa SET
  autofacturation_cu19b = 'vendeur_seulement',
  automatisation_validation = FALSE,
  cas_usage_couverture = '10_20',
  cas_usage_tiers = 'certains',
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = TRUE,
  configuration_initiale = 'setup_obligatoire',
  frais_setup = TRUE,
  gestion_statuts = 'tous_14',
  marque_blanche = NULL,
  nb_employes_range = '2000+',
  portail_fournisseur = TRUE,
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'statuts_seulement',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'sps-commerce';

UPDATE pa SET
  access_point_peppol = 'prochainement',
  annuaire_consultation_mode = 'les_deux',
  annuaire_maj_autonome = 'autonome',
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = TRUE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'non',
  clients_production_flux3 = TRUE,
  configuration_initiale = 'setup_obligatoire',
  demo_possible = FALSE,
  extraction_non_structures = 'ocr_ia',
  frais_setup = TRUE,
  gestion_statuts = 'tous_14',
  marque_blanche = NULL,
  notes_de_frais_cu = 'tous',
  portail_fournisseur = FALSE,
  raccordement_annuaire_prod = 'prochainement',
  utilise_ia = FALSE,
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'srci';

UPDATE pa SET
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = FALSE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  chorus_pro = FALSE,
  clients_production_flux2 = 'non',
  clients_production_flux3 = FALSE,
  configuration_initiale = 'libre_acces',
  frais_setup = FALSE,
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  notes_de_frais_cu = 'tous',
  portail_fournisseur = TRUE,
  raccordement_annuaire_prod = 'oui',
  traduction_edi = FALSE,
  workflow_validation = 'statuts_seulement',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'super-pdp';

UPDATE pa SET
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = TRUE,
  cas_usage_couverture = '30_36',
  cas_usage_tiers = 'certains',
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = FALSE,
  clients_references_text = 'Axens, Urbanis, Campus Condorcet',
  configuration_initiale = 'setup_obligatoire',
  extraction_non_structures = 'ocr_ia',
  frais_setup = TRUE,
  gestion_statuts = 'tous_14',
  nb_employes_range = '50-200',
  portail_fournisseur = TRUE,
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'symtrax';

UPDATE pa SET
  access_point_peppol = 'oui',
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = TRUE,
  cas_usage_couverture = '30_36',
  cas_usage_tiers = 'tous',
  chorus_pro = TRUE,
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = TRUE,
  clients_references_text = 'Veolia Eau, Monnaie de Paris, Foncia-Emeria',
  configuration_initiale = 'setup_obligatoire',
  extraction_non_structures = 'ocr_ia',
  frais_setup = TRUE,
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  nb_employes_range = '50-200',
  portail_fournisseur = TRUE,
  raccordement_annuaire_prod = 'oui',
  traduction_edi = TRUE,
  workflow_validation = 'statuts_seulement',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'tenor';

UPDATE pa SET
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = FALSE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'non',
  clients_production_flux3 = FALSE,
  clients_references_text = 'Amplifon, Carrefour, Ducati',
  configuration_initiale = 'setup_obligatoire',
  extraction_non_structures = 'ocr_ia',
  frais_setup = TRUE,
  gestion_statuts = 'tous_14',
  nb_employes_range = '500-1000',
  notes_de_frais_cu = 'tous',
  portail_fournisseur = TRUE,
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'statuts_seulement',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'tesisquare';

UPDATE pa SET
  access_point_peppol = 'oui',
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = TRUE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = TRUE,
  clients_references_text = 'BPCE, Enedis, Idex',
  configuration_initiale = 'setup_obligatoire',
  frais_setup = TRUE,
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  notes_de_frais_cu = 'tous',
  portail_fournisseur = TRUE,
  raccordement_annuaire_prod = 'oui',
  traduction_edi = TRUE,
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'tessi';

UPDATE pa SET
  access_point_peppol = 'oui',
  annuaire_consultation_mode = 'interface_web',
  annuaire_maj_autonome = 'autonome',
  autofacturation_cu19b = 'vendeur_seulement',
  automatisation_encaissements = 'via_api_bancaire',
  automatisation_ereporting_pmt = 'via_api_bancaire',
  automatisation_validation = TRUE,
  cas_usage_couverture = '30_36',
  cas_usage_tiers = 'certains',
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = FALSE,
  clients_references_text = 'Numbr, Expert Entreprendre, Cerfrance',
  configuration_initiale = 'libre_acces',
  gestion_statuts = 'tous_14',
  marque_blanche = NULL,
  nb_employes_range = '200-500',
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'oui',
  traduction_edi = FALSE,
  workflow_validation = 'statuts_seulement',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'tiime-pdp';

UPDATE pa SET
  access_point_peppol = 'oui',
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = FALSE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  chorus_pro = FALSE,
  clients_production_flux2 = 'non',
  clients_production_flux3 = FALSE,
  clients_references_text = 'Lyondell-Basel, BMW, Accenture',
  configuration_initiale = 'setup_obligatoire',
  frais_setup = TRUE,
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  notes_de_frais_cu = 'tous',
  portail_fournisseur = FALSE,
  raccordement_annuaire_prod = 'prochainement',
  traduction_edi = TRUE,
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'tinexta-infocert';

UPDATE pa SET
  annuaire_consultation_mode = 'interface_web',
  annuaire_maj_autonome = 'autonome',
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = TRUE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'oui',
  clients_production_flux3 = TRUE,
  clients_references_text = 'Air France, Disneyland Paris, Le Bon Marché',
  configuration_initiale = 'setup_obligatoire',
  demo_possible = TRUE,
  frais_setup = TRUE,
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  nb_employes_range = '50-200',
  notes_de_frais_cu = 'tous',
  portail_fournisseur = TRUE,
  raccordement_annuaire_prod = 'oui',
  utilise_ia = TRUE,
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'tradeshift-babelway';

UPDATE pa SET
  nb_employes_range = '51-100',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'transalis';

UPDATE pa SET
  access_point_peppol = 'prochainement',
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_encaissements = 'via_api_bancaire',
  automatisation_ereporting_pmt = 'via_api_bancaire',
  automatisation_validation = TRUE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  chorus_pro = TRUE,
  clients_production_flux2 = 'non',
  clients_production_flux3 = FALSE,
  clients_references_text = 'Veepee, Chantiers de lAtlantique, BPIfrance',
  configuration_initiale = 'setup_obligatoire',
  extraction_non_structures = 'ocr_ia',
  frais_setup = TRUE,
  gestion_statuts = 'tous_14',
  nb_employes_range = '50-200',
  notes_de_frais_cu = 'tous',
  portail_fournisseur = TRUE,
  raccordement_annuaire_prod = 'oui',
  traduction_edi = TRUE,
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'treso2';

UPDATE pa SET
  nb_employes_range = '~700',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'tungsten-automation';

UPDATE pa SET
  automatisation_validation = TRUE,
  cas_usage_couverture = 'tous_36_plus',
  cas_usage_tiers = 'tous',
  clients_production_flux2 = 'oui',
  clients_production_flux3 = TRUE,
  clients_references_text = 'Forvia, Lustucru, Baud Industries',
  configuration_initiale = 'setup_obligatoire',
  marque_blanche = TRUE,
  notes_de_frais_cu = 'tous',
  raccordement_annuaire_prod = 'oui',
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'tx2-concept';

UPDATE pa SET
  access_point_peppol = 'oui',
  autofacturation_cu19b = 'vendeur_et_acheteur',
  automatisation_validation = TRUE,
  cas_usage_couverture = '20_30',
  cas_usage_tiers = 'certains',
  chorus_pro = TRUE,
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = TRUE,
  clients_references_text = 'Yves Rocher, Canon, KPMG',
  configuration_initiale = 'setup_obligatoire',
  extraction_non_structures = 'ocr_ia',
  frais_setup = TRUE,
  gestion_statuts = 'tous_14',
  marque_blanche = TRUE,
  nb_employes_range = '200-500',
  notes_de_frais_cu = 'tous',
  portail_fournisseur = TRUE,
  raccordement_annuaire_prod = 'oui',
  traduction_edi = FALSE,
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'ventya';

UPDATE pa SET
  multi_devises = TRUE,
  multi_entites = TRUE,
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'veryswing';

UPDATE pa SET
  nb_employes_range = '50-200',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'voxel';

UPDATE pa SET
  access_point_peppol = 'prochainement',
  autofacturation_cu19b = 'vendeur_seulement',
  automatisation_encaissements = 'via_api_bancaire',
  automatisation_validation = TRUE,
  cas_usage_couverture = '20_30',
  cas_usage_tiers = 'tous',
  chorus_pro = FALSE,
  clients_production_flux2 = 'tests_seulement',
  clients_production_flux3 = FALSE,
  configuration_initiale = 'setup_obligatoire',
  extraction_non_structures = 'ocr_ia',
  frais_setup = TRUE,
  gestion_statuts = 'obligatoires_4',
  marque_blanche = TRUE,
  portail_fournisseur = TRUE,
  raccordement_annuaire_prod = 'oui',
  traduction_edi = TRUE,
  workflow_validation = 'complet',
  derniere_mise_a_jour = '2026-05-04'
WHERE pa_slug = 'weproc';

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
  'spendesk',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, configuration_initiale, frais_setup, gestion_statuts, marque_blanche, nb_employes_range, notes_de_frais_cu, portail_fournisseur, raccordement_annuaire_prod, traduction_edi, workflow_validation',
  '{access_point_peppol,autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,configuration_initiale,frais_setup,gestion_statuts,marque_blanche,nb_employes_range,notes_de_frais_cu,portail_fournisseur,raccordement_annuaire_prod,traduction_edi,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'sps-commerce',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, configuration_initiale, frais_setup, gestion_statuts, marque_blanche, nb_employes_range, portail_fournisseur, raccordement_annuaire_prod, workflow_validation',
  '{autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,configuration_initiale,frais_setup,gestion_statuts,marque_blanche,nb_employes_range,portail_fournisseur,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'srci',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, annuaire_consultation_mode, annuaire_maj_autonome, autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, configuration_initiale, demo_possible, extraction_non_structures, frais_setup, gestion_statuts, marque_blanche, notes_de_frais_cu, portail_fournisseur, raccordement_annuaire_prod, utilise_ia, workflow_validation',
  '{access_point_peppol,annuaire_consultation_mode,annuaire_maj_autonome,autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,configuration_initiale,demo_possible,extraction_non_structures,frais_setup,gestion_statuts,marque_blanche,notes_de_frais_cu,portail_fournisseur,raccordement_annuaire_prod,utilise_ia,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'super-pdp',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, chorus_pro, clients_production_flux2, clients_production_flux3, configuration_initiale, frais_setup, gestion_statuts, marque_blanche, notes_de_frais_cu, portail_fournisseur, raccordement_annuaire_prod, traduction_edi, workflow_validation',
  '{autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,chorus_pro,clients_production_flux2,clients_production_flux3,configuration_initiale,frais_setup,gestion_statuts,marque_blanche,notes_de_frais_cu,portail_fournisseur,raccordement_annuaire_prod,traduction_edi,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'symtrax',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, extraction_non_structures, frais_setup, gestion_statuts, nb_employes_range, portail_fournisseur, raccordement_annuaire_prod, workflow_validation',
  '{autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,extraction_non_structures,frais_setup,gestion_statuts,nb_employes_range,portail_fournisseur,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'tenor',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, chorus_pro, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, extraction_non_structures, frais_setup, gestion_statuts, marque_blanche, nb_employes_range, portail_fournisseur, raccordement_annuaire_prod, traduction_edi, workflow_validation',
  '{access_point_peppol,autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,chorus_pro,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,extraction_non_structures,frais_setup,gestion_statuts,marque_blanche,nb_employes_range,portail_fournisseur,raccordement_annuaire_prod,traduction_edi,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'tesisquare',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, extraction_non_structures, frais_setup, gestion_statuts, nb_employes_range, notes_de_frais_cu, portail_fournisseur, raccordement_annuaire_prod, workflow_validation',
  '{autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,extraction_non_structures,frais_setup,gestion_statuts,nb_employes_range,notes_de_frais_cu,portail_fournisseur,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'tessi',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, frais_setup, gestion_statuts, marque_blanche, notes_de_frais_cu, portail_fournisseur, raccordement_annuaire_prod, traduction_edi, workflow_validation',
  '{access_point_peppol,autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,frais_setup,gestion_statuts,marque_blanche,notes_de_frais_cu,portail_fournisseur,raccordement_annuaire_prod,traduction_edi,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'tiime-pdp',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, annuaire_consultation_mode, annuaire_maj_autonome, autofacturation_cu19b, automatisation_encaissements, automatisation_ereporting_pmt, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, gestion_statuts, marque_blanche, nb_employes_range, notes_de_frais_cu, raccordement_annuaire_prod, traduction_edi, workflow_validation',
  '{access_point_peppol,annuaire_consultation_mode,annuaire_maj_autonome,autofacturation_cu19b,automatisation_encaissements,automatisation_ereporting_pmt,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,gestion_statuts,marque_blanche,nb_employes_range,notes_de_frais_cu,raccordement_annuaire_prod,traduction_edi,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'tinexta-infocert',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, chorus_pro, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, frais_setup, gestion_statuts, marque_blanche, notes_de_frais_cu, portail_fournisseur, raccordement_annuaire_prod, traduction_edi, workflow_validation',
  '{access_point_peppol,autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,chorus_pro,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,frais_setup,gestion_statuts,marque_blanche,notes_de_frais_cu,portail_fournisseur,raccordement_annuaire_prod,traduction_edi,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'tradeshift-babelway',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : annuaire_consultation_mode, annuaire_maj_autonome, autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, demo_possible, frais_setup, gestion_statuts, marque_blanche, nb_employes_range, notes_de_frais_cu, portail_fournisseur, raccordement_annuaire_prod, utilise_ia, workflow_validation',
  '{annuaire_consultation_mode,annuaire_maj_autonome,autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,demo_possible,frais_setup,gestion_statuts,marque_blanche,nb_employes_range,notes_de_frais_cu,portail_fournisseur,raccordement_annuaire_prod,utilise_ia,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'transalis',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : nb_employes_range',
  '{nb_employes_range}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'treso2',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, autofacturation_cu19b, automatisation_encaissements, automatisation_ereporting_pmt, automatisation_validation, cas_usage_couverture, cas_usage_tiers, chorus_pro, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, extraction_non_structures, frais_setup, gestion_statuts, nb_employes_range, notes_de_frais_cu, portail_fournisseur, raccordement_annuaire_prod, traduction_edi, workflow_validation',
  '{access_point_peppol,autofacturation_cu19b,automatisation_encaissements,automatisation_ereporting_pmt,automatisation_validation,cas_usage_couverture,cas_usage_tiers,chorus_pro,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,extraction_non_structures,frais_setup,gestion_statuts,nb_employes_range,notes_de_frais_cu,portail_fournisseur,raccordement_annuaire_prod,traduction_edi,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'tungsten-automation',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : nb_employes_range',
  '{nb_employes_range}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'tx2-concept',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : automatisation_validation, cas_usage_couverture, cas_usage_tiers, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, marque_blanche, notes_de_frais_cu, raccordement_annuaire_prod, workflow_validation',
  '{automatisation_validation,cas_usage_couverture,cas_usage_tiers,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,marque_blanche,notes_de_frais_cu,raccordement_annuaire_prod,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'ventya',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, autofacturation_cu19b, automatisation_validation, cas_usage_couverture, cas_usage_tiers, chorus_pro, clients_production_flux2, clients_production_flux3, clients_references_text, configuration_initiale, extraction_non_structures, frais_setup, gestion_statuts, marque_blanche, nb_employes_range, notes_de_frais_cu, portail_fournisseur, raccordement_annuaire_prod, traduction_edi, workflow_validation',
  '{access_point_peppol,autofacturation_cu19b,automatisation_validation,cas_usage_couverture,cas_usage_tiers,chorus_pro,clients_production_flux2,clients_production_flux3,clients_references_text,configuration_initiale,extraction_non_structures,frais_setup,gestion_statuts,marque_blanche,nb_employes_range,notes_de_frais_cu,portail_fournisseur,raccordement_annuaire_prod,traduction_edi,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'veryswing',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : multi_devises, multi_entites',
  '{multi_devises,multi_entites}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'voxel',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : nb_employes_range',
  '{nb_employes_range}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

INSERT INTO pa_sources (pa_slug, url, source_type, titre, extrait, champs_couverts, writer_mode, actor, run_id, source_system)
VALUES (
  'weproc',
  'file:///analyse_pdp_2026-05-04.csv',
  'autre',
  'Analyse PDP — 2026-05-04',
  'Mise à jour issue de l''analyse PDP du 2026-05-04. Champs : access_point_peppol, autofacturation_cu19b, automatisation_encaissements, automatisation_validation, cas_usage_couverture, cas_usage_tiers, chorus_pro, clients_production_flux2, clients_production_flux3, configuration_initiale, extraction_non_structures, frais_setup, gestion_statuts, marque_blanche, portail_fournisseur, raccordement_annuaire_prod, traduction_edi, workflow_validation',
  '{access_point_peppol,autofacturation_cu19b,automatisation_encaissements,automatisation_validation,cas_usage_couverture,cas_usage_tiers,chorus_pro,clients_production_flux2,clients_production_flux3,configuration_initiale,extraction_non_structures,frais_setup,gestion_statuts,marque_blanche,portail_fournisseur,raccordement_annuaire_prod,traduction_edi,workflow_validation}',
  'manuel',
  'analyse_pdp',
  'analyse_pdp_20260504',
  'csv_import'
);

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