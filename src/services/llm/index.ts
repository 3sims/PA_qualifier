/**
 * services/llm/index.ts
 *
 * Abstraction LLM — supporte OpenAI et Anthropic.
 * SERVEUR UNIQUEMENT — ne jamais importer depuis 'use client'.
 *
 * FAILURE MODES :
 *   - LLM_API_KEY absent → throw LLMConfigError
 *   - Réponse non-JSON → throw LLMParseError
 *   - Timeout 30s → throw LLMTimeoutError
 *   - Erreur API → throw LLMAPIError
 */

export class LLMConfigError extends Error { constructor(msg: string) { super(msg); this.name = 'LLMConfigError'; } }
export class LLMParseError extends Error { constructor(msg: string) { super(msg); this.name = 'LLMParseError'; } }
export class LLMAPIError extends Error { constructor(msg: string) { super(msg); this.name = 'LLMAPIError'; } }

interface LLMCallOptions {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  /** Timeout en ms — défaut 30 000 ms */
  timeout?: number;
}

/**
 * Appel LLM générique — retourne le texte brut de la réponse.
 * @throws LLMConfigError si LLM_API_KEY absent
 * @throws LLMAPIError si l'API retourne une erreur
 */
export async function callLLM(options: LLMCallOptions): Promise<string> {
  const provider = process.env.LLM_PROVIDER ?? 'openai';
  const apiKey   = process.env.LLM_API_KEY;
  const model    = process.env.LLM_MODEL ?? 'gpt-4o';
  const maxTok   = options.maxTokens ?? parseInt(process.env.LLM_MAX_TOKENS ?? '4000', 10);
  const temp     = options.temperature ?? parseFloat(process.env.LLM_TEMPERATURE ?? '0.2');

  if (!apiKey) {
    throw new LLMConfigError(
      'LLM_API_KEY non configuré. Ajoutez LLM_API_KEY dans .env.local pour activer les fonctionnalités LLM.'
    );
  }

  const timeoutMs = options.timeout ?? 30_000;

  if (provider === 'anthropic') {
    return callAnthropic({ apiKey, model, maxTok, temp, timeoutMs, ...options });
  }
  // Default: openai-compatible
  return callOpenAI({ apiKey, model, maxTok, temp, timeoutMs, ...options });
}

// ---------------------------------------------------------------------------
// OpenAI-compatible (OpenAI, Mistral, OpenRouter, etc.)
// ---------------------------------------------------------------------------

async function callOpenAI(opts: {
  apiKey: string;
  model: string;
  maxTok: number;
  temp: number;
  timeoutMs: number;
  system: string;
  user: string;
}): Promise<string> {
  const baseUrl = process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1';

  const body = JSON.stringify({
    model:       opts.model,
    max_tokens:  opts.maxTok,
    temperature: opts.temp,
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user',   content: opts.user },
    ],
  });

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), opts.timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${opts.apiKey}`,
      },
      body,
      signal: ctrl.signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new LLMAPIError('LLM timeout (30s)');
    }
    throw new LLMAPIError(`LLM fetch error: ${String(err)}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new LLMAPIError(`LLM API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? '';
}

// ---------------------------------------------------------------------------
// Anthropic
// ---------------------------------------------------------------------------

async function callAnthropic(opts: {
  apiKey: string;
  model: string;
  maxTok: number;
  temp: number;
  timeoutMs: number;
  system: string;
  user: string;
}): Promise<string> {
  const body = JSON.stringify({
    model:       opts.model,
    max_tokens:  opts.maxTok,
    temperature: opts.temp,
    system:      opts.system,
    messages: [{ role: 'user', content: opts.user }],
  });

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), opts.timeoutMs);

  let res: Response;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         opts.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body,
      signal: ctrl.signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new LLMAPIError('LLM timeout (30s)');
    }
    throw new LLMAPIError(`LLM fetch error: ${String(err)}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new LLMAPIError(`LLM API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content.find((c) => c.type === 'text')?.text ?? '';
}

// ---------------------------------------------------------------------------
// JSON extraction helper
// ---------------------------------------------------------------------------

/**
 * Extrait un objet JSON de la réponse LLM (gère les blocs ```json...```).
 */
export function extractJSON<T>(text: string): T {
  // Tenter d'abord de parser directement
  try {
    return JSON.parse(text) as T;
  } catch {
    // Chercher un bloc JSON dans la réponse
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim()) as T;
      } catch {
        // fall through
      }
    }
    // Chercher le premier '{' / '[' et le dernier '}' / ']'
    const start = text.indexOf('{') !== -1 ? text.indexOf('{') : text.indexOf('[');
    const end   = text.lastIndexOf('}') !== -1 ? text.lastIndexOf('}') : text.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as T;
      } catch {
        // fall through
      }
    }
    throw new LLMParseError(`Impossible d'extraire du JSON valide de la réponse LLM: ${text.slice(0, 200)}`);
  }
}
