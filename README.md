# Client Brief Generator — V1

Outil B2B SaaS de collecte de besoins clients via questionnaire structuré, avec génération automatique d'un PDF draft.

## Architecture

Architecture modulaire inspirée micro-services : chaque service est isolé, testable, et remplaçable indépendamment.

```
/
├── lib/
│   ├── types.ts                  # Interfaces TypeScript partagées (source de vérité)
│   └── questions.config.ts       # Définitions des questions (configurable, pas hardcodé)
│
├── services/
│   ├── questionnaire/
│   │   └── index.ts              # Logique métier du questionnaire (validation, navigation)
│   ├── pdf/
│   │   └── index.ts              # Génération PDF (@react-pdf/renderer)
│   └── storage/
│       └── index.ts              # Abstraction stockage (localStorage MVP → Supabase v2)
│
├── app/
│   ├── layout.tsx                # Shell global Next.js
│   ├── page.tsx                  # Landing / point d'entrée
│   ├── questionnaire/
│   │   └── page.tsx              # Interface questionnaire
│   └── api/
│       ├── responses/
│       │   └── route.ts          # POST /api/responses — sauvegarde réponses
│       └── pdf/
│           └── route.ts          # POST /api/pdf — génération PDF
│
└── components/
    ├── QuestionForm.tsx           # Orchestrateur du formulaire
    └── QuestionField.tsx         # Rendu d'un champ selon son type
```

## Principes de conception

- **Pas de duplication de la source de vérité** : `lib/types.ts` est la seule définition des types.
- **Services découplés** : le service `pdf` ne connaît pas le service `storage`. Ils communiquent via des types partagés.
- **Configuration > customisation** : les questions sont définies dans `lib/questions.config.ts`, pas dans les composants.
- **Upgrade path clair** :
  - Storage : `localStorage` (MVP) → `Supabase` (V2, swap dans `/services/storage/index.ts` uniquement)
  - Auth : aucune (MVP) → NextAuth (V2)
  - PDF : génération côté client (MVP) → queue serveur avec webhook (V2)

## Stack

| Couche | Outil | Justification |
|--------|-------|---------------|
| Framework | Next.js 14 (App Router) | SSR + API routes + Vercel natif |
| Langage | TypeScript strict | Traçabilité, refactoring safe |
| Style | Tailwind CSS | Vitesse, pas de CSS custom à maintenir |
| PDF | @react-pdf/renderer | JSX → PDF, composable, pas de dépendance serveur |
| Validation | Zod | Schémas partagés front/back |
| Storage MVP | localStorage + API route | Zéro infrastructure pour valider le flow |

## Variables d'environnement

```env
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000

# V2 — Supabase (pas requis en V1)
# SUPABASE_URL=
# SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_KEY=
```

## Démarrage rapide

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Chemin critique V1

1. Utilisateur ouvre `/questionnaire`
2. `QuestionForm` charge la config depuis `lib/questions.config.ts`
3. Réponses soumises via `POST /api/responses` → stockées via `services/storage`
4. Bouton "Générer PDF" → `POST /api/pdf` → téléchargement PDF draft
5. ✅ Valeur livrée : premier document structuré client en < 5 minutes

## Roadmap

| Version | Scope |
|---------|-------|
| V1 | Questionnaire + collecte + PDF draft (ce repo) |
| V2 | Auth + multi-tenant + Supabase + lien partageable |
| V3 | Dashboard admin + historique + templates PDF personnalisables |
