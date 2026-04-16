#!/bin/bash
# =============================================================================
# init-repo.sh
# Crée l'arborescence complète du projet client-brief-generator
# Usage : chmod +x init-repo.sh && ./init-repo.sh
# =============================================================================

set -e

echo "Initialisation de l'arborescence du projet..."

# RACINE
touch README.md
touch .env.example
touch .gitignore
touch next.config.ts
touch package.json
touch tailwind.config.ts
touch tsconfig.json
touch postcss.config.js

# /src/app — Next.js App Router
mkdir -p src/app/api/missions
mkdir -p src/app/api/scoring
mkdir -p src/app/api/report
mkdir -p src/app/auth
mkdir -p src/app/dashboard
mkdir -p "src/app/missions/[id]"

touch src/app/layout.tsx
touch src/app/page.tsx
touch src/app/globals.css
touch src/app/api/missions/route.ts
touch src/app/api/scoring/route.ts
touch src/app/api/report/route.ts
touch src/app/auth/page.tsx
touch src/app/dashboard/page.tsx
touch "src/app/missions/[id]/page.tsx"

# /src/components
mkdir -p src/components/wizard
mkdir -p src/components/results
mkdir -p src/components/ui

touch src/components/wizard/QuestionForm.tsx
touch src/components/wizard/QuestionField.tsx
touch src/components/wizard/SectionNav.tsx
touch src/components/wizard/ProgressBar.tsx
touch src/components/results/Shortlist.tsx
touch src/components/results/ScoreMatrix.tsx
touch src/components/results/ScoreCard.tsx
touch src/components/ui/Button.tsx
touch src/components/ui/Card.tsx
touch src/components/ui/Badge.tsx

# /src/lib
mkdir -p src/lib

touch src/lib/supabase.ts
touch src/lib/scoring.ts
touch src/lib/gap-analysis.ts
touch src/lib/pdf-builder.ts
touch src/lib/storage.ts
touch src/lib/questionnaire.ts
touch src/lib/questions.config.ts

# /src/types
mkdir -p src/types
touch src/types/index.ts

# /supabase
mkdir -p supabase/migrations
touch supabase/migrations/001_initial_schema.sql
touch supabase/migrations/002_rls_policies.sql
touch supabase/migrations/003_audit_log.sql
touch supabase/seed.sql
touch supabase/config.toml

# /data
mkdir -p data
touch data/pa-seed-v1.json
touch data/features-catalog.json
touch data/erp-list.json

# /docs
mkdir -p docs
touch docs/data-model.md
touch docs/rbac.md
touch docs/scoring-algorithm.md
touch docs/gap-analysis.md
touch docs/pa-database-guide.md

# --- .gitignore ---
cat > .gitignore << 'EOF'
node_modules/
.next/
out/
build/
.env
.env.local
.env.*.local
.DS_Store
Thumbs.db
.vscode/settings.json
.idea/
*.log
npm-debug.log*
.vercel
EOF

# --- .env.example ---
cat > .env.example << 'EOF'
# Copier en .env.local — NE JAMAIS committer .env.local

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (V2 — pas requis en V1)
# NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Auth (V2)
# NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
# NEXTAUTH_URL=http://localhost:3000
EOF

echo ""
echo "Arborescence creee avec succes !"
echo ""
echo "Prochaines etapes :"
echo "  1. chmod +x init-repo.sh && ./init-repo.sh (si pas encore fait)"
echo "  2. Copier les 12 fichiers V1 selon MAPPING_V1_FILES.md"
echo "  3. npm install"
echo "  4. cp .env.example .env.local"
echo "  5. npm run dev"
