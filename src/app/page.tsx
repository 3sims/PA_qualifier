import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl bg-gradient-to-br from-[#0A0A23] to-[#1e1e4d] p-10 text-white shadow-sm">
        <div className="mb-2 inline-block rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-300">
          Méthodologie Niji — Réforme facturation électronique B2B
        </div>
        <h1 className="mb-4 text-4xl font-bold leading-tight">
          PA Selection Studio
          <br />
          <span className="text-orange-400">Choisissez la bonne PA en confiance.</span>
        </h1>
        <p className="mb-8 max-w-xl text-slate-300">
          Wizard 6 phases · Profil client enrichi par LLM · Shortlist multi-sources ·
          Alertes contextuelles · Livrables CODIR prêts à l&apos;emploi.
        </p>
        <Link
          href="/questionnaire"
          className="inline-block rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-orange-600 transition-colors"
        >
          Démarrer une mission →
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          {
            n: '01',
            title: 'Onboarding client',
            desc: 'Saisie du nom client · Enrichissement automatique (SIREN, NAF, obligations DGFiP) · Import shortlist benchmark client.',
          },
          {
            n: '02–05',
            title: 'Discovery & Analyse',
            desc: 'SI, flux B2B/B2G, contraintes, priorités · Score de complexité · Alertes 7 Pièges · Lead time estimé.',
          },
          {
            n: '06',
            title: 'Résultats & Livrables',
            desc: 'Shortlist comparative · Matrice couverture · Risques · Roadmap · Export PDF — vue Client et Consultant.',
          },
        ].map((item) => (
          <div key={item.n} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 text-2xl font-black text-orange-200">{item.n}</div>
            <div className="mb-1 text-base font-semibold text-slate-900">{item.title}</div>
            <p className="text-sm leading-relaxed text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
        <strong>Pré-diagnostic indicatif.</strong> Les capacités PA affichées proviennent de
        sources publiques non validées par les éditeurs. Une démarche RFI reste nécessaire avant
        contractualisation.
      </div>
    </div>
  );
}
