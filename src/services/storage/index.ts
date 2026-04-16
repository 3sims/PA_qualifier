/**
 * services/storage/index.ts
 *
 * Abstraction de stockage.
 * V1 : localStorage côté client + Map en mémoire côté serveur (partagé process).
 * V2 : swap vers Supabase en implémentant StorageAdapter, pas de changement ailleurs.
 *
 * FAILURE MODES :
 *   - localStorage plein ou indisponible → fallback silencieux en mémoire
 *   - JSON.parse échoue → retourne null
 *   - En V1, la mémoire serveur est volatile (reset au redémarrage du process)
 */

import type { StorageAdapter, Mission } from '@/lib/types';

// ---------------------------------------------------------------------------
// IN-MEMORY ADAPTER — serveur (missions pendant la vie du process Node)
// ---------------------------------------------------------------------------

// Stocké sur globalThis pour survivre au HMR de Next dev
// et à d'éventuels module graphs séparés entre routes.
const GLOBAL_STORE_KEY = '__pa_memory_store__';
type GlobalWithStore = typeof globalThis & { [GLOBAL_STORE_KEY]?: Map<string, string> };
const globalRef = globalThis as GlobalWithStore;
const memoryStore: Map<string, string> =
  globalRef[GLOBAL_STORE_KEY] ??
  (globalRef[GLOBAL_STORE_KEY] = new Map<string, string>());

const memoryAdapter: StorageAdapter = {
  async save(key, data) {
    memoryStore.set(key, JSON.stringify(data));
  },
  async get<T>(key: string): Promise<T | null> {
    const raw = memoryStore.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async delete(key) {
    memoryStore.delete(key);
  },
  async list(prefix) {
    return Array.from(memoryStore.keys()).filter((k) => k.startsWith(prefix));
  },
};

// ---------------------------------------------------------------------------
// LOCALSTORAGE ADAPTER — client
// ---------------------------------------------------------------------------

const localStorageAdapter: StorageAdapter = {
  async save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error('[Storage] localStorage full or unavailable', err);
    }
  },
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  async delete(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* silence */
    }
  },
  async list(prefix) {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    return keys;
  },
};

function getAdapter(): StorageAdapter {
  if (typeof window === 'undefined') return memoryAdapter;
  return localStorageAdapter;
}

const PREFIX_MISSION = 'pa_mission_';

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

export const StorageService = {
  async saveMission(mission: Mission): Promise<void> {
    const adapter = getAdapter();
    await adapter.save(`${PREFIX_MISSION}${mission.id}`, mission);
  },

  async getMission(id: string): Promise<Mission | null> {
    const adapter = getAdapter();
    return adapter.get<Mission>(`${PREFIX_MISSION}${id}`);
  },

  async deleteMission(id: string): Promise<void> {
    const adapter = getAdapter();
    await adapter.delete(`${PREFIX_MISSION}${id}`);
  },

  async listMissionIds(): Promise<string[]> {
    const adapter = getAdapter();
    const keys = await adapter.list(PREFIX_MISSION);
    return keys.map((k) => k.replace(PREFIX_MISSION, ''));
  },
};

// ---------------------------------------------------------------------------
// SERVER-ONLY : accès direct au memory adapter pour les routes API
// (cohérent entre /missions, /answers, /analyze, /report — un seul process Node)
// ---------------------------------------------------------------------------

export const ServerMissionStore = {
  async save(mission: Mission): Promise<void> {
    await memoryAdapter.save(`${PREFIX_MISSION}${mission.id}`, mission);
  },
  async get(id: string): Promise<Mission | null> {
    return memoryAdapter.get<Mission>(`${PREFIX_MISSION}${id}`);
  },
  async delete(id: string): Promise<void> {
    await memoryAdapter.delete(`${PREFIX_MISSION}${id}`);
  },
};
