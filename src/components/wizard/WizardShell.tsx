'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  DiscoveryAnswers,
  Mission,
  ShortlistEntry,
  ComplexityBand,
  ClientProfile,
  ClientSpecificRisk,
  ViewMode,
  PASource,
  PAInContext,
  CustomUseCase,
} from '@/lib/types';
import { UseCasesSelector } from './UseCasesSelector';
import { QUESTIONNAIRE_CONFIG, ERP_TOP30 } from '@/lib/questions.config';
import { validateStep, calculateProgress, canAnalyze } from '@/services/questionnaire';
import { deadlineToWeeks } from '@/lib/scoring';
import {
  calculateLeadTime,
  volumeToMonthlyApprox,
  entitiesToSiretCount,
} from '@/lib/lead-time';
import { getAlertsForStep, getResultsAlerts } from '@/lib/alerts';
import { StepIndicator } from './StepIndicator';
import { AlertBanner } from './AlertBanner';
import { Step1Contexte } from './steps/Step1Contexte';
import { Step2Architecture } from './steps/Step2Architecture';
import { Step3Flux } from './steps/Step3Flux';
import { Step4Contraintes } from './steps/Step4Contraintes';
import { Step5Priorites } from './steps/Step5Priorites';
import { ComplexityScore } from '../results/ComplexityScore';
import { ShortlistCard } from '../results/ShortlistCard';
import { CoverageMatrix } from '../results/CoverageMatrix';
import { ViewModeToggle } from '../results/ViewModeToggle';
import { ProjectTimeline } from '../results/ProjectTimeline';
import { RiskMatrix } from '../results/RiskMatrix';
import { DraftLivrablePanel } from '../livrables/DraftLivrablePanel';
import { ClientProfileCard } from '../onboarding/ClientProfileCard';

const LS_KEY = 'pa_mission_current_v2';
const SS_VIEW_MODE = 'pa_view_mode';
const AUTOSAVE_INTERVAL_MS = 30_000;
const ENRICH_DEBOUNCE_MS = 800;

interface LocalState {
  mission: Mission | null;
  clientName: string;
  clientSector: string;
  currentStep: number;
  lastSavedAt: string | null;
  clientPAShortlist: string[];
  contextSupplement: string;
}

interface AnalyzeResult {
  complexity_score: number;
  complexity_band: ComplexityBand;
  lead_time_min: number;
  lead_time_max: number;
  lead_time_scenario?: 'native' | 'api' | 'custom';
  shortlist: ShortlistEntry[];
  eliminated_client_pas?: Array<{ name: string; reason: string }>;
}

interface Jalon {
  id: string;
  label: string;
  semaine_relative: number;
  statut: 'ok' | 'tight' | 'impossible';
  description: string;
}

interface Roadmap {
  jalons: Jalon[];
  alerte_chemin_critique: string | null;
}

export function WizardShell() {
  const [mission, setMission]           = useState<Mission | null>(null);
  const [clientName, setClientName]     = useState('');
  const [clientSector, setClientSector] = useState('');
  const [contextSupplement, setContextSupplement] = useState('');
  const [clientPAShortlist, setClientPAShortlist] = useState<string[]>([]);
  const [paInput, setPaInput]           = useState('');
  const [currentStep, setCurrentStep]   = useState(0);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [lastSavedAt, setLastSavedAt]   = useState<string | null>(null);
  const [savedDisplay, setSavedDisplay] = useState<string>('');
  const [analyzing, setAnalyzing]       = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [result, setResult]             = useState<AnalyzeResult | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [viewMode, setViewMode]         = useState<ViewMode>('client');

  // V2 — Client profile enrichment
  const [clientProfile, setClientProfile]       = useState<ClientProfile | null>(null);
  const [profileLoading, setProfileLoading]     = useState(false);
  const [profileLLMUnavailable, setProfileLLMUnavailable] = useState(false);
  const [profileLLMMessage, setProfileLLMMessage]         = useState<string | undefined>(undefined);
  const [profileVisible, setProfileVisible]     = useState(false);

  // V2 — Livrables
  const [livrableP1, setLivrableP1]   = useState<string | null>(null);
  const [livrableP2, setLivrableP2]   = useState<string | null>(null);
  const [livrableP3, setLivrableP3]   = useState<string | null>(null);
  const [livrableP4, setLivrableP4]   = useState<string | null>(null);
  const [livrableP5, setLivrableP5]   = useState<string | null>(null);
  const [livrableP6, setLivrableP6]   = useState<string | null>(null);
  const [livrableLoading, setLivrableLoading] = useState(false);

  // V2 — Use cases
  const [useCaseIds, setUseCaseIds]           = useState<string[]>([]);
  const [customUseCases, setCustomUseCases]   = useState<CustomUseCase[]>([]);

  // V2 — Eliminated client PAs
  const [eliminatedClientPAs, setEliminatedClientPAs] = useState<Array<{ name: string; reason: string }>>([]);

  // V2 — Risks & Roadmap
  const [risks, setRisks]             = useState<ClientSpecificRisk[]>([]);
  const [risksLoading, setRisksLoading] = useState(false);
  const [roadmap, setRoadmap]         = useState<Roadmap | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const missionRef = useRef<Mission | null>(null);
  missionRef.current = mission;
  const enrichDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Restore from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const state = JSON.parse(raw) as LocalState;
        if (state.mission)    setMission(state.mission);
        if (state.clientName) setClientName(state.clientName);
        if (state.clientSector) setClientSector(state.clientSector);
        if (state.contextSupplement) setContextSupplement(state.contextSupplement);
        if (state.clientPAShortlist) setClientPAShortlist(state.clientPAShortlist);
        if (typeof state.currentStep === 'number') setCurrentStep(state.currentStep);
        if (state.lastSavedAt) setLastSavedAt(state.lastSavedAt);
      }
    } catch { /* ignore */ }

    // Restore view mode from sessionStorage
    try {
      const vm = sessionStorage.getItem(SS_VIEW_MODE) as ViewMode | null;
      if (vm === 'client' || vm === 'consultant') setViewMode(vm);
    } catch { /* ignore */ }
  }, []);

  // ---- Autosave
  const saveLocal = useCallback(() => {
    const state: LocalState = {
      mission: missionRef.current,
      clientName,
      clientSector,
      contextSupplement,
      clientPAShortlist,
      currentStep,
      lastSavedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      setLastSavedAt(state.lastSavedAt);
    } catch { /* ignore */ }
  }, [clientName, clientSector, contextSupplement, clientPAShortlist, currentStep]);

  useEffect(() => {
    const t = setInterval(saveLocal, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [saveLocal]);

  // ---- Save display
  useEffect(() => {
    if (!lastSavedAt) { setSavedDisplay(''); return; }
    const update = () => {
      const secs = Math.floor((Date.now() - new Date(lastSavedAt).getTime()) / 1000);
      if (secs < 5)  setSavedDisplay("Sauvegardé à l'instant");
      else if (secs < 60) setSavedDisplay(`Sauvegardé il y a ${secs}s`);
      else setSavedDisplay(`Sauvegardé il y a ${Math.floor(secs / 60)} min`);
    };
    update();
    const t = setInterval(update, 5000);
    return () => clearInterval(t);
  }, [lastSavedAt]);

  // ---- ViewMode persistence
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    try { sessionStorage.setItem(SS_VIEW_MODE, mode); } catch { /* ignore */ }
  };

  // ---- Enrich client (debounced)
  useEffect(() => {
    if (!clientName.trim() || clientName.trim().length < 2) return;
    if (enrichDebounceRef.current) clearTimeout(enrichDebounceRef.current);
    enrichDebounceRef.current = setTimeout(async () => {
      setProfileLoading(true);
      setProfileVisible(true);
      try {
        const res = await fetch('/api/enrich-client', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ company_name: clientName.trim(), context_supplement: contextSupplement }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            profile: ClientProfile;
            llm_unavailable?: boolean;
            message?: string;
          };
          setClientProfile(data.profile);
          setProfileLLMUnavailable(data.llm_unavailable ?? false);
          setProfileLLMMessage(data.message);
        }
      } catch { /* ignore */ }
      finally { setProfileLoading(false); }
    }, ENRICH_DEBOUNCE_MS);
    return () => {
      if (enrichDebounceRef.current) clearTimeout(enrichDebounceRef.current);
    };
  }, [clientName, contextSupplement]);

  // ---- Create mission
  const handleStartMission = async () => {
    if (!clientName.trim() || !clientSector.trim()) {
      setErrors({
        client_name:   !clientName.trim()   ? 'Requis' : '',
        client_sector: !clientSector.trim() ? 'Requis' : '',
      });
      return;
    }
    try {
      const res = await fetch('/api/missions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ client_name: clientName, client_sector: clientSector }),
      });
      if (!res.ok) { setAnalyzeError('Impossible de créer la mission.'); return; }
      const { mission: newMission } = (await res.json()) as { mission: Mission };
      setMission(newMission);
      setCurrentStep(1);
      setErrors({});
      saveLocal();
    } catch { setAnalyzeError('Erreur réseau.'); }
  };

  // ---- Update answer
  const handleAnswerChange = (questionId: keyof DiscoveryAnswers, value: unknown) => {
    if (!mission) return;
    const nextAnswers = { ...mission.answers, [questionId]: value } as Partial<DiscoveryAnswers>;
    if (questionId === 'erp_main') {
      const erp = ERP_TOP30.find((e) => e.value === value);
      if (erp) nextAnswers.erp_tier = erp.tier as DiscoveryAnswers['erp_tier'];
    }
    const updated = { ...mission, answers: nextAnswers, updated_at: new Date().toISOString() };
    setMission(updated);
    setErrors((prev) => ({ ...prev, [questionId]: '' }));
    fetch('/api/answers', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ mission_id: mission.id, question_id: questionId, answer_value: value }),
    }).catch(() => undefined);
    if (questionId === 'erp_main' && nextAnswers.erp_tier) {
      fetch('/api/answers', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mission_id: mission.id, question_id: 'erp_tier', answer_value: nextAnswers.erp_tier }),
      }).catch(() => undefined);
    }
  };

  // ---- Navigation
  const handleNext = () => {
    if (!mission) return;
    const { ok, errors: stepErrors } = validateStep(currentStep, mission.answers);
    if (!ok) { setErrors(stepErrors); return; }
    setErrors({});
    saveLocal();
    if (currentStep < 5) setCurrentStep((s) => s + 1);
  };

  const handlePrev = () => {
    setErrors({});
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  // ---- Use case handlers
  const handleUseCaseToggle = (id: string) => {
    setUseCaseIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  const handleAddCustomUseCase = (uc: CustomUseCase) => {
    setCustomUseCases((prev) => [...prev, uc]);
  };
  const handleRemoveCustomUseCase = (idx: number) => {
    setCustomUseCases((prev) => prev.filter((_, i) => i !== idx));
  };

  // ---- Generate livrable
  const handleGenerateLivrable = async (
    phase: 'p1_discovery' | 'p2_gap' | 'p3_rfi' | 'p4_scoring' | 'p5_risks' | 'p6_roadmap'
  ) => {
    if (!mission) return;
    setLivrableLoading(true);
    const activeAlerts = result
      ? getResultsAlerts(mission.answers, {
          min_weeks: result.lead_time_min,
          max_weeks: result.lead_time_max,
          scenario: 'native',
          assumption: '',
        }).map((a) => ({ title: a.title, message: a.message }))
      : [];
    try {
      const res = await fetch('/api/generate-livrable', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          phase,
          wizard_answers:    mission.answers,
          client_name:       mission.client_name,
          client_profile:    clientProfile ?? undefined,
          shortlisted_pas:   result?.shortlist.map((e) => e.pa_name) ?? [],
          eliminated_pas:    eliminatedClientPAs,
          active_alerts:     activeAlerts,
          context_supplement: contextSupplement || undefined,
          lead_time_min:     result?.lead_time_min,
          lead_time_max:     result?.lead_time_max,
          complexity_band:   result?.complexity_band,
          deadline:          mission.answers.deadline,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { content: string };
        switch (phase) {
          case 'p1_discovery': setLivrableP1(data.content); break;
          case 'p2_gap':       setLivrableP2(data.content); break;
          case 'p3_rfi':       setLivrableP3(data.content); break;
          case 'p4_scoring':   setLivrableP4(data.content); break;
          case 'p5_risks':     setLivrableP5(data.content); break;
          case 'p6_roadmap':   setLivrableP6(data.content); break;
        }
      }
    } catch { /* ignore */ }
    finally { setLivrableLoading(false); }
  };

  // ---- Fetch risks & roadmap after analyze
  const fetchPostAnalysis = async (res: AnalyzeResult, answers: Partial<DiscoveryAnswers>) => {
    const lt = calculateLeadTime(
      answers.erp_tier,
      answers.has_middleware ?? false,
      entitiesToSiretCount(answers.nb_entities),
      volumeToMonthlyApprox(answers.volume_emitted)
    );
    const activeAlerts = getResultsAlerts(answers, {
      min_weeks: res.lead_time_min,
      max_weeks: res.lead_time_max,
      scenario: 'native',
      assumption: '',
    });

    // Risks
    setRisksLoading(true);
    fetch('/api/analyze-risks', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        client_profile:     clientProfile ?? {},
        answers,
        active_alerts:      activeAlerts.map((a) => ({ title: a.title, message: a.message })),
        client_pa_shortlist: clientPAShortlist,
      }),
    })
      .then((r) => r.json())
      .then((data: { risks: ClientSpecificRisk[] }) => setRisks(data.risks ?? []))
      .catch(() => undefined)
      .finally(() => setRisksLoading(false));

    // Roadmap
    setRoadmapLoading(true);
    fetch('/api/generate-roadmap', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        deadline:        answers.deadline ?? '>12mois',
        lead_time_min:   lt.min_weeks,
        lead_time_max:   lt.max_weeks,
        complexity_band: res.complexity_band,
        client_name:     mission?.client_name,
      }),
    })
      .then((r) => r.json())
      .then((data: { roadmap: Roadmap }) => setRoadmap(data.roadmap ?? null))
      .catch(() => undefined)
      .finally(() => setRoadmapLoading(false));
  };

  // ---- Analyze
  const handleAnalyze = async () => {
    if (!mission) return;
    const { ok, errors: stepErrors } = validateStep(5, mission.answers);
    if (!ok) { setErrors(stepErrors); return; }
    if (!canAnalyze(mission.answers)) {
      setAnalyzeError("Au moins 20 questions doivent être répondues pour lancer l'analyse.");
      return;
    }
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch('/api/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          mission_id:          mission.id,
          client_pa_shortlist: clientPAShortlist,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setAnalyzeError(data.error ?? `Erreur HTTP ${res.status}`);
        return;
      }
      const data = (await res.json()) as AnalyzeResult;
      setResult(data);
      setEliminatedClientPAs(data.eliminated_client_pas ?? []);
      setCurrentStep(6);
      saveLocal();
      void fetchPostAnalysis(data, mission.answers);
    } catch { setAnalyzeError("Erreur réseau pendant l'analyse."); }
    finally { setAnalyzing(false); }
  };

  // ---- PDF
  const handleDownloadPdf = async () => {
    if (!mission) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch('/api/report', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mission_id: mission.id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setAnalyzeError(data.error ?? 'Erreur génération PDF.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pa-prediag_${mission.client_name.replace(/[^a-z0-9]/gi, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { setAnalyzeError('Erreur réseau pendant le téléchargement.'); }
    finally { setDownloadingPdf(false); }
  };

  const handleReset = () => {
    if (!confirm('Réinitialiser la mission en cours ?')) return;
    localStorage.removeItem(LS_KEY);
    setMission(null);
    setClientName('');
    setClientSector('');
    setContextSupplement('');
    setClientPAShortlist([]);
    setCurrentStep(0);
    setErrors({});
    setResult(null);
    setLastSavedAt(null);
    setClientProfile(null);
    setProfileVisible(false);
    setLivrableP1(null);
    setLivrableP2(null);
    setLivrableP3(null);
    setLivrableP4(null);
    setLivrableP5(null);
    setLivrableP6(null);
    setUseCaseIds([]);
    setCustomUseCases([]);
    setEliminatedClientPAs([]);
    setRisks([]);
    setRoadmap(null);
  };

  // ---- Add PA to shortlist
  const handleAddPA = () => {
    const name = paInput.trim();
    if (!name || clientPAShortlist.includes(name)) return;
    setClientPAShortlist((prev) => [...prev, name]);
    setPaInput('');
  };

  const handleRemovePA = (name: string) => {
    setClientPAShortlist((prev) => prev.filter((p) => p !== name));
  };

  const progress = mission ? calculateProgress(mission.answers) : null;

  // ============================================================
  // RENDER — Phase 0 (intro + enrichment)
  // ============================================================
  if (currentStep === 0 || !mission) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Nouvelle mission</h1>
        <p className="mb-6 text-sm text-slate-500">
          Renseignez les informations de base — l'enrichissement du profil client se lance automatiquement.
        </p>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          {/* Nom client */}
          <label className="block">
            <div className="mb-1 text-sm font-semibold text-slate-900">
              Nom du client <span className="text-orange-500">*</span>
            </div>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex : Acme SAS"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            {errors.client_name && <p className="mt-1 text-xs text-red-600">{errors.client_name}</p>}
          </label>

          {/* Secteur */}
          <label className="block">
            <div className="mb-1 text-sm font-semibold text-slate-900">
              Secteur <span className="text-orange-500">*</span>
            </div>
            <input
              type="text"
              value={clientSector}
              onChange={(e) => setClientSector(e.target.value)}
              placeholder="Ex : Industrie / Manufacturing"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            {errors.client_sector && <p className="mt-1 text-xs text-red-600">{errors.client_sector}</p>}
          </label>

          {/* Contexte additionnel */}
          <label className="block">
            <div className="mb-1 text-sm font-semibold text-slate-900">
              Contexte additionnel <span className="text-slate-400 font-normal">(optionnel)</span>
            </div>
            <textarea
              value={contextSupplement}
              onChange={(e) => setContextSupplement(e.target.value)}
              placeholder="Ex : benchmark réalisé de x mois, présentation fin Comex à tel date, deadline légale sept. 2026, GE industrielle multi-sites"
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
            />
          </label>

          {/* PA déjà identifiées */}
          <div>
            <div className="mb-1 text-sm font-semibold text-slate-900">
              PA déjà identifiées par le client <span className="text-slate-400 font-normal">(optionnel)</span>
            </div>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={paInput}
                onChange={(e) => setPaInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPA(); } }}
                placeholder="Ex : Esker, Yooz, Basware…"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={handleAddPA}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                + Ajouter
              </button>
            </div>
            {clientPAShortlist.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {clientPAShortlist.map((pa) => (
                  <span key={pa} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {pa}
                    <button type="button" onClick={() => handleRemovePA(pa)} className="ml-0.5 hover:text-blue-900">×</button>
                  </span>
                ))}
              </div>
            )}
            {clientPAShortlist.length > 0 && (
              <p className="mt-1.5 text-xs text-slate-500">
                Ces PA seront évaluées sur critères éliminatoires. Les PA non retenues seront documentées avec justification.
              </p>
            )}
          </div>
        </div>

        {/* Client profile card */}
        {profileVisible && (
          <ClientProfileCard
            profile={clientProfile ?? {
              legal_name: clientName, trade_name: null, siren: null, creation_date: null, capital: null,
              headquarters: null, naf_code: null, naf_label: null, convention_collective: null, num_establishments: null,
              regulatory_category: null, regulatory_category_confidence: 'unknown', emission_deadline: null, reception_deadline: null,
              sector_label: null, typical_b2b_flows: [], sector_specific_constraints: [], fields_to_confirm: [],
              enrichment_date: new Date().toISOString(), data_sources: [], confidence_score: 0,
            }}
            loading={profileLoading}
            llmUnavailable={profileLLMUnavailable}
            llmMessage={profileLLMMessage}
            onConfirm={handleStartMission}
            onSkip={handleStartMission}
            onFieldUpdate={() => undefined}
          />
        )}

        {analyzeError && (
          <p className="mt-3 rounded-md bg-red-50 p-3 text-xs text-red-800">{analyzeError}</p>
        )}

        {!profileVisible && (
          <button
            type="button"
            onClick={handleStartMission}
            className="mt-4 w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Démarrer le questionnaire →
          </button>
        )}
      </div>
    );
  }

  // ============================================================
  // RENDER — Results view (step 6)
  // ============================================================
  if (currentStep === 6 && result) {
    const deadlineWeeks = deadlineToWeeks(mission.answers.deadline);
    const lt = calculateLeadTime(
      mission.answers.erp_tier,
      mission.answers.has_middleware ?? false,
      entitiesToSiretCount(mission.answers.nb_entities),
      volumeToMonthlyApprox(mission.answers.volume_emitted)
    );
    const resultsAlerts = getResultsAlerts(mission.answers, {
      min_weeks: result.lead_time_min,
      max_weeks: result.lead_time_max,
      scenario: lt.scenario,
      assumption: lt.assumption,
    });

    return (
      <div>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">Résultats</div>
            <h1 className="text-2xl font-bold text-slate-900">{mission.client_name}</h1>
            <p className="text-sm text-slate-500">{mission.client_sector}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="rounded-lg bg-[#0A0A23] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e1e4d] disabled:opacity-50"
            >
              {downloadingPdf ? 'Génération…' : '📄 Rapport PDF'}
            </button>
          </div>
        </div>

        {analyzeError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {analyzeError}
          </div>
        )}

        {/* Alertes (mode consultant uniquement) */}
        {viewMode === 'consultant' && resultsAlerts.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Points de vigilance</h2>
            <AlertBanner alerts={resultsAlerts} />
          </div>
        )}

        <ComplexityScore
          score={result.complexity_score}
          band={result.complexity_band}
          leadTimeMin={result.lead_time_min}
          leadTimeMax={result.lead_time_max}
          deadlineWeeks={deadlineWeeks}
          scenario={result.lead_time_scenario ?? lt.scenario}
        />

        {/* Shortlist */}
        <h2 className="mb-3 mt-8 text-lg font-bold text-slate-900">Shortlist PA</h2>
        {result.shortlist.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Aucune PA éligible selon vos contraintes.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {result.shortlist.map((entry) => {
              const source: PASource | undefined =
                entry.pa_source ??
                (clientPAShortlist.some(
                  (n) => n.toLowerCase() === entry.pa_name.toLowerCase()
                )
                  ? 'both'
                  : undefined);
              return (
                <ShortlistCard key={entry.pa_id} entry={entry} paSource={source} />
              );
            })}
          </div>
        )}

        {/* Matrice */}
        {result.shortlist.length > 0 && (
          <>
            <h2 className="mb-3 mt-8 text-lg font-bold text-slate-900">Matrice comparative</h2>
            <CoverageMatrix
              shortlist={result.shortlist}
              paInContext={result.shortlist.map((entry) => ({
                id: entry.pa_id,
                name: entry.pa_name,
                pa_source: (entry.pa_source ??
                  (clientPAShortlist.some(
                    (n) => n.toLowerCase() === entry.pa_name.toLowerCase()
                  )
                    ? 'both'
                    : 'app')) as PASource,
                status: 'unknown' as const,
                data_hosting: 'FRANCE' as const,
                lead_time_weeks_min: null,
                lead_time_weeks_max: null,
                erp_integrations: [],
                coverage: {} as PAInContext['coverage'],
                last_updated: null,
              }))}
              eliminatedPAs={eliminatedClientPAs.map((p) => ({
                id: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                name: p.name,
                pa_source: 'client' as PASource,
                eliminated_reason: p.reason,
                status: 'unknown' as const,
                data_hosting: 'FRANCE' as const,
                lead_time_weeks_min: null,
                lead_time_weeks_max: null,
                erp_integrations: [],
                coverage: {} as PAInContext['coverage'],
                last_updated: null,
              }))}
              viewMode={viewMode}
            />
          </>
        )}

        {/* Roadmap */}
        {(roadmap || roadmapLoading) && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Séquençage recommandé</h2>
            {roadmapLoading && !roadmap && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-center text-sm text-slate-400 py-4">
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mr-2" />
                  Calcul de la roadmap…
                </div>
              </div>
            )}
            {roadmap && (
              <ProjectTimeline
                jalons={roadmap.jalons}
                alerte_chemin_critique={roadmap.alerte_chemin_critique}
                leadTimeMin={lt.min_weeks}
                leadTimeMax={lt.max_weeks}
                deadlineWeeks={deadlineWeeks}
              />
            )}
          </div>
        )}

        {/* Risques (mode consultant uniquement) */}
        {viewMode === 'consultant' && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Risques spécifiques</h2>
            <RiskMatrix risks={risks} loading={risksLoading} />
          </div>
        )}

        {/* Livrables */}
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Livrables</h2>
          <div className="space-y-4">
            <DraftLivrablePanel
              phase="p1_discovery"
              phaseName="Phase 1 — Discovery"
              livrableName="Cartographie des flux de facturation"
              content={livrableP1}
              onValidate={(c) => setLivrableP1(c)}
              onRegenerate={() => handleGenerateLivrable('p1_discovery')}
              loading={livrableLoading && !livrableP1}
            />
            <DraftLivrablePanel
              phase="p2_gap"
              phaseName="Phase 2 — Gap Analysis"
              livrableName="Matrice de couverture PA"
              content={livrableP2}
              onValidate={(c) => setLivrableP2(c)}
              onRegenerate={() => handleGenerateLivrable('p2_gap')}
              loading={livrableLoading && !livrableP2}
            />
            <DraftLivrablePanel
              phase="p3_rfi"
              phaseName="Phase 3 — RFI Ciblé"
              livrableName="Tableau RFI par PA (questions contractualisables)"
              content={livrableP3}
              onValidate={(c) => setLivrableP3(c)}
              onRegenerate={() => handleGenerateLivrable('p3_rfi')}
              loading={livrableLoading && !livrableP3}
            />
            <DraftLivrablePanel
              phase="p4_scoring"
              phaseName="Phase 4 — Scoring CODIR"
              livrableName="Grille de scoring pondérée + Recommandation CODIR"
              content={livrableP4}
              onValidate={(c) => setLivrableP4(c)}
              onRegenerate={() => handleGenerateLivrable('p4_scoring')}
              loading={livrableLoading && !livrableP4}
            />
            <DraftLivrablePanel
              phase="p5_risks"
              phaseName="Phase 5 — Points de vigilance"
              livrableName="7 Pièges actifs + Risques spécifiques au profil"
              content={livrableP5}
              onValidate={(c) => setLivrableP5(c)}
              onRegenerate={() => handleGenerateLivrable('p5_risks')}
              loading={livrableLoading && !livrableP5}
            />
            <DraftLivrablePanel
              phase="p6_roadmap"
              phaseName="Phase 6 — Roadmap"
              livrableName="Séquençage recommandé — De l'atelier au go-live"
              content={livrableP6}
              onValidate={(c) => setLivrableP6(c)}
              onRegenerate={() => handleGenerateLivrable('p6_roadmap')}
              loading={livrableLoading && !livrableP6}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
          <button type="button" onClick={() => setCurrentStep(5)} className="text-sm text-slate-500 hover:text-slate-700">
            ← Revenir au questionnaire
          </button>
          <button type="button" onClick={handleReset} className="text-sm text-slate-500 hover:text-red-600">
            Réinitialiser
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER — Step 6 without result (page reload after analysis)
  // ============================================================
  if (currentStep === 6) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="mb-4 text-sm text-slate-600">
          Les résultats de l'analyse ne sont plus disponibles (session expirée ou rechargement de page).
        </p>
        <button
          type="button"
          onClick={() => setCurrentStep(5)}
          className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Retour au questionnaire → relancer l'analyse
        </button>
      </div>
    );
  }

  // ============================================================
  // RENDER — Wizard steps 1–5
  // ============================================================
  const step = currentStep as 1 | 2 | 3 | 4 | 5;
  const stepConfig = QUESTIONNAIRE_CONFIG.steps.find((s) => s.id === step)!;
  const StepComponent = { 1: Step1Contexte, 2: Step2Architecture, 3: Step3Flux, 4: Step4Contraintes, 5: Step5Priorites }[step];
  const stepAlerts = mission ? getAlertsForStep(mission.answers, step) : [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Mission · {mission.client_name}</div>
          <div className="text-sm text-slate-600">
            Étape {step} / 5 — {progress?.answered}/{progress?.total} questions
          </div>
        </div>
        <div className="flex items-center gap-3">
          {savedDisplay && <span className="text-xs text-slate-400">{savedDisplay}</span>}
          <button type="button" onClick={handleReset} className="text-xs text-slate-400 hover:text-red-600">
            Réinitialiser
          </button>
        </div>
      </div>

      <StepIndicator steps={QUESTIONNAIRE_CONFIG.steps} currentStep={step} onJump={(s) => setCurrentStep(s)} />

      {/* Alertes inline (mode consultant) */}
      {stepAlerts.length > 0 && (
        <AlertBanner alerts={stepAlerts} />
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-xl font-bold text-slate-900">{stepConfig.title}</h2>
        <p className="mb-6 text-sm text-slate-500">{stepConfig.description}</p>
        <StepComponent answers={mission.answers} errors={errors} onChange={handleAnswerChange} />

        {/* Use Cases — affiché à la fin de l'étape 1 */}
        {step === 1 && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="mb-1 text-base font-bold text-slate-900">Cas d'usage</h3>
            <p className="mb-4 text-sm text-slate-500">
              Sélectionnez les flux qui s'appliquent à votre organisation.
            </p>
            <UseCasesSelector
              profile={clientProfile}
              answers={mission.answers}
              selectedIds={useCaseIds}
              customUseCases={customUseCases}
              onChange={handleUseCaseToggle}
              onAddCustom={handleAddCustomUseCase}
              onRemoveCustom={handleRemoveCustomUseCase}
            />
          </div>
        )}
      </div>

      {analyzeError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {analyzeError}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={step === 1}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          ← Précédent
        </button>
        {step < 5 ? (
          <button type="button" onClick={handleNext} className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600">
            Suivant →
          </button>
        ) : (
          <button type="button" onClick={handleAnalyze} disabled={analyzing} className="rounded-lg bg-[#0A0A23] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1e1e4d] disabled:opacity-50">
            {analyzing ? 'Analyse en cours…' : '🔍 Analyser'}
          </button>
        )}
      </div>
    </div>
  );
}
