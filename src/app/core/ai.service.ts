import { inject, Injectable, signal } from '@angular/core';
import { SETTINGS } from '../app.settings';
import { ApiService } from './api.service';

export type AiChatMode = 'tutor' | 'explain' | 'review' | 'error' | 'modernize' | 'interview';
export type AiTurn = { role: 'user' | 'assistant'; content: string };
export type AiContext = Partial<Record<'lesson' | 'level' | 'target' | 'topic' | 'count' | 'goal' | 'hours' | 'weeks' | 'catalog', string>>;

export class AiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    /** Text received before the error or cancellation, if any. */
    readonly partial = '',
  ) {
    super(message);
  }
}

const MESSAGES: Record<string, string> = {
  rate_limited: 'You’ve used the AI a lot this hour. Please try again later.',
  prompt_too_large: 'That’s too much text. Shorten it and try again.',
  ai_disabled: 'AI tools aren’t available on this site right now.',
  upstream_error: 'The AI didn’t respond. Please try again.',
  network: 'Couldn’t reach the server. Check your connection and try again.',
};

/** Talks to the backend AI tools. Answers stream in as they're written. */
@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly api = inject(ApiService);
  private readonly base = SETTINGS.apiBase.replace(/\/+$/, '');

  /** null until checked; then whether the backend has AI turned on. */
  readonly enabled = signal<boolean | null>(null);
  private checking: Promise<void> | null = null;

  /** Browser only. Safe to call many times. */
  check(): Promise<void> {
    this.checking ??= this.api
      .get<{ enabled: boolean }>('/api/ai/status')
      .then((s) => this.enabled.set(s?.enabled === true))
      .catch(() => this.enabled.set(false));
    return this.checking;
  }

  /**
   * Streams an answer. onText receives the whole answer so far each time more arrives.
   * Resolves with the final text; throws AiError (code 'cancelled' when aborted).
   */
  async stream(
    mode: AiChatMode,
    messages: AiTurn[],
    context: AiContext,
    onText: (text: string) => void,
    abort?: AbortSignal,
  ): Promise<{ text: string; truncated: boolean }> {
    let text = '';
    let truncated = false;
    let res: Response;
    try {
      res = await fetch(`${this.base}/api/ai/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ mode, messages, context }),
        signal: abort,
      });
    } catch (e) {
      throw this.failure(e, text);
    }
    if (!res.ok || !res.body) {
      let code = res.status === 429 ? 'rate_limited' : res.status === 413 ? 'prompt_too_large' : res.status === 503 ? 'ai_disabled' : 'upstream_error';
      let message = MESSAGES[code];
      try {
        const problem = (await res.json()) as { code?: string; detail?: string };
        code = problem.code ?? code;
        message = problem.detail ?? MESSAGES[code] ?? message;
      } catch {
        /* not JSON */
      }
      if (code === 'ai_disabled') this.enabled.set(false);
      throw new AiError(message, code);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let cut: number;
        while ((cut = buffer.indexOf('\n\n')) >= 0) {
          const block = buffer.slice(0, cut);
          buffer = buffer.slice(cut + 2);
          const data = block
            .split('\n')
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.slice(5).trim())
            .join('');
          if (!data) continue;
          let evt: { type?: string; delta?: { type?: string; text?: string; stop_reason?: string }; error?: { message?: string } };
          try {
            evt = JSON.parse(data);
          } catch {
            continue;
          }
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta' && evt.delta.text) {
            text += evt.delta.text;
            onText(text);
          } else if (evt.type === 'message_delta' && evt.delta?.stop_reason === 'max_tokens') {
            truncated = true;
          } else if (evt.type === 'error') {
            throw new AiError(evt.error?.message || MESSAGES['upstream_error'], 'upstream_error', text);
          }
        }
      }
    } catch (e) {
      if (e instanceof AiError) throw e;
      throw this.failure(e, text);
    }
    return { text, truncated };
  }

  /** Quiz and study plan: returns parsed JSON. */
  async generate<T>(mode: 'quiz' | 'plan', context: AiContext): Promise<T> {
    let res: { text: string };
    try {
      res = await this.api.post<{ text: string }>('/api/ai/generate', { mode, context });
    } catch (e) {
      const err = e as { code?: string; message?: string; status?: number };
      const code = err.code ?? (err.status === 429 ? 'rate_limited' : 'upstream_error');
      throw new AiError(err.message || MESSAGES[code] || MESSAGES['upstream_error'], code);
    }
    const raw = (res?.text ?? '').replace(/```(?:json)?/g, '').trim();
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    try {
      return JSON.parse(raw.slice(start, end + 1)) as T;
    } catch {
      throw new AiError('The AI’s answer came back in the wrong shape. Please try again.', 'bad_json');
    }
  }

  private failure(e: unknown, partial: string): AiError {
    if ((e as { name?: string })?.name === 'AbortError') return new AiError('Stopped.', 'cancelled', partial);
    return new AiError(MESSAGES['network'], 'network', partial);
  }
}
