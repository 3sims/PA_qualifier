/**
 * lib/pa-repository.ts
 *
 * Couche d'abstraction pour l'accès aux profils PA.
 * V1 : lecture depuis le fichier JSON local (pa-seed-v1.json)
 * V2 : Supabase (activé en ajoutant NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env.local)
 *
 * Aucune route API ne doit importer pa-seed-v1.json directement.
 * Toutes les routes utilisent : import { paRepository } from '@/lib/pa-repository'
 */

import type { PAProfile } from './types';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface PASearchFilters {
  status?: PAProfile['status'];
  data_hosting?: PAProfile['data_hosting'];
  erp_id?: string;
  name_in?: string[];
}

export interface PARepository {
  findAll(): Promise<PAProfile[]>;
  findById(id: string): Promise<PAProfile | null>;
  findByNames(names: string[]): Promise<PAProfile[]>;
  searchByProfile(filters: PASearchFilters): Promise<PAProfile[]>;
}

// ---------------------------------------------------------------------------
// V1 — JSON file implementation (current)
// ---------------------------------------------------------------------------

class JsonPARepository implements PARepository {
  private data: PAProfile[];

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require('../data/pa-seed-v1.json') as { pa_profiles: PAProfile[] };
    this.data = raw.pa_profiles;
  }

  async findAll(): Promise<PAProfile[]> {
    return this.data;
  }

  async findById(id: string): Promise<PAProfile | null> {
    return this.data.find((pa) => pa.id === id) ?? null;
  }

  async findByNames(names: string[]): Promise<PAProfile[]> {
    const lower = names.map((n) => n.toLowerCase());
    return this.data.filter((pa) => lower.includes(pa.name.toLowerCase()));
  }

  async searchByProfile(filters: PASearchFilters): Promise<PAProfile[]> {
    return this.data.filter((pa) => {
      if (filters.status && pa.status !== filters.status) return false;
      if (filters.data_hosting && pa.data_hosting !== filters.data_hosting) return false;
      if (filters.erp_id) {
        const hasErp = pa.erp_integrations?.some((e) => e.erp_id === filters.erp_id);
        if (!hasErp) return false;
      }
      if (filters.name_in) {
        const lower = filters.name_in.map((n) => n.toLowerCase());
        if (!lower.includes(pa.name.toLowerCase())) return false;
      }
      return true;
    });
  }
}

// ---------------------------------------------------------------------------
// V2 — Supabase stub (activée quand les variables d'env sont présentes)
// Pour activer : npm install @supabase/supabase-js, puis décommenter l'implémentation
// et remplacer ce stub.
// ---------------------------------------------------------------------------

class SupabasePARepository implements PARepository {
  private async notReady(): Promise<never> {
    throw new Error(
      '[pa-repository] Supabase V2 non activé.\n' +
      'Pour activer : npm install @supabase/supabase-js\n' +
      'puis implémenter SupabasePARepository dans lib/pa-repository.ts'
    );
  }

  async findAll()                                    { return this.notReady(); }
  async findById(_id: string)                        { return this.notReady(); }
  async findByNames(_names: string[])                { return this.notReady(); }
  async searchByProfile(_f: PASearchFilters)         { return this.notReady(); }
}

// ---------------------------------------------------------------------------
// Factory — bascule automatique V1 ↔ V2 selon les variables d'environnement
// ---------------------------------------------------------------------------

function createPARepository(): PARepository {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return new SupabasePARepository();
  }
  return new JsonPARepository();
}

/**
 * Singleton utilisé dans toutes les routes API.
 * Remplace tout import direct de pa-seed-v1.json.
 *
 * Usage :
 *   import { paRepository } from '@/lib/pa-repository';
 *   const allPAs = await paRepository.findAll();
 */
export const paRepository: PARepository = createPARepository();
