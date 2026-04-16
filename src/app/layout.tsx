import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PA Selection Studio',
  description:
    'Aide au choix de Plateforme Agréée (PA) pour la facturation électronique B2B — Réforme DGFiP.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <a href="/" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0A0A23] text-white font-bold text-sm">
                PA
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">PA Selection Studio</div>
                <div className="text-xs text-slate-500">Pré-diagnostic facturation électronique</div>
              </div>
            </a>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
              DRAFT v1
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-4">
          <p className="text-center text-xs text-slate-400">
            Pré-diagnostic indicatif · Réforme DGFiP 2026 · V1
          </p>
        </footer>
      </body>
    </html>
  );
}
