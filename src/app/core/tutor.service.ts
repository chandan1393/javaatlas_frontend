import { DOCUMENT } from '@angular/core';
import { inject, Injectable, signal } from '@angular/core';
import { ApiService, isApiError } from './api.service';
import { plain } from './markup';
import { DEPTHS, Lang, Lesson } from './models';
import { ContentService } from './content.service';
import { ProgressService } from './progress.service';
import { UiService } from './ui.service';
import { AiError, AiService } from './ai.service';

export interface TutorMessage {
  role: 'user' | 'assistant' | 'note';
  content: string;
  /** Shorter text shown in the chat instead of the full prompt (used by "Explain"). */
  show?: string;
}

type Turn = { role: 'user' | 'assistant'; content: string };
type AskResult = { text: string; truncated?: boolean };
type SampleFn = (turns: Turn[], opts: { signal: AbortSignal; cache: boolean; onText: (p: { text: string }) => void }) => Promise<AskResult>;

const ERRORS: Record<string, string> = {
  rate_limited: 'Too many questions at once. Wait a minute, then ask again.',
  queue_overflow: 'Too many questions at once. Wait a minute, then ask again.',
  prompt_too_large: 'That question is too long. Shorten it and ask again.',
  refused: 'Claude couldn’t answer that. Try rephrasing your question about this lesson.',
};
const TURN_OFF = new Set(['not_granted', 'sampling_disabled', 'capability_disabled', 'capability_removed', 'not_declared', 'session_expired', 'ai_disabled']);

/**
 * "Ask about this lesson". On your own site it streams answers from the backend (/api/ai/chat), which holds the API key.
 * When the page is opened inside Claude it can use the viewer's Claude instead.
 */
@Injectable({ providedIn: 'root' })
export class TutorService {
  private readonly api = inject(ApiService);
  private readonly progress = inject(ProgressService);
  private readonly content = inject(ContentService);
  private readonly ui = inject(UiService);
  private readonly document = inject(DOCUMENT);
  private readonly ai = inject(AiService);

  readonly mode = signal<'server' | 'claude' | null>(null);
  readonly busy = signal(false);
  readonly threads = signal<Record<string, TutorMessage[]>>({});
  /** Text streaming in for the current answer (Claude mode), '' while waiting. */
  readonly live = signal<{ lessonId: string; text: string } | null>(null);
  private sample: SampleFn | null = null;
  private abort: AbortController | null = null;
  private started = false;

  /** Browser only: called once after the first render. */
  async init(): Promise<void> {
    if (this.started) return;
    this.started = true;
    const claude = (this.document.defaultView as unknown as { claude?: { use?: (name: string) => Promise<SampleFn | null> } })?.claude;
    if (claude && typeof claude.use === 'function') {
      try {
        this.sample = await claude.use('sample');
        if (this.sample) {
          this.mode.set('claude');
          return;
        }
      } catch {
        this.sample = null;
      }
    }
    await this.ai.check();
    if (this.ai.enabled()) this.mode.set('server');
  }

  stop(): void {
    this.abort?.abort();
  }

  explain(lesson: Lesson, src: string, lang: Lang): void {
    const depth = DEPTHS.find((d) => d.key === this.progress.depth())?.name.toLowerCase() ?? 'developer';
    const prompt = `Explain this code line by line for a ${depth}-level learner. Point out anything that needs a specific Java version.\n\n\`\`\`${lang}\n${src}\n\`\`\``;
    void this.ask(lesson, prompt, 'Explain this code example line by line.');
  }

  async ask(lesson: Lesson, text: string, show?: string): Promise<void> {
    const mode = this.mode();
    const content = text.trim();
    if (!mode || this.busy() || !content) return;
    const id = lesson.id;
    this.push(id, { role: 'user', content, show });
    this.busy.set(true);
    this.live.set({ lessonId: id, text: '' });
    const ctl = new AbortController();
    this.abort = ctl;
    try {
      const turns = this.buildTurns(lesson, this.threads()[id] ?? []);
      const onText = (t: string) => this.live.set({ lessonId: id, text: t });
      const res: AskResult =
        mode === 'claude' && this.sample
          ? await this.sample(turns, { signal: ctl.signal, cache: false, onText: ({ text: t }) => onText(t) })
          : await this.ai.stream('tutor', turns, { lesson: lesson.t, level: this.progress.depth() }, onText, ctl.signal);
      this.push(id, { role: 'assistant', content: res?.text ?? '' });
      if (res?.truncated) this.push(id, { role: 'note', content: 'The answer was cut short. Ask for the rest.' });
    } catch (e) {
      const err = (e instanceof AiError ? { code: e.code, text: e.partial, message: e.message, server: true } : e) as {
        code?: string;
        text?: string;
        status?: number;
        message?: string;
        server?: boolean;
      };
      const code =
        err.code ?? (err.status === 429 ? 'rate_limited' : err.status === 413 ? 'prompt_too_large' : err.status === 503 ? 'ai_disabled' : 'upstream_error');
      if (code === 'cancelled') {
        if (err.text) this.push(id, { role: 'assistant', content: err.text });
        else {
          this.popUser(id);
          this.push(id, { role: 'note', content: 'Stopped.' });
        }
      } else if (TURN_OFF.has(code)) {
        this.popUser(id);
        this.mode.set(null);
        this.ui.toast(code === 'not_granted' ? 'AI answers are off because permission was declined.' : 'AI answers aren’t available here right now.');
      } else {
        this.popUser(id);
        const serverMessage = (isApiError(e) && e.server) || e instanceof AiError ? err.message : null;
        this.push(id, { role: 'note', content: serverMessage ?? ERRORS[code] ?? 'The answer didn’t load. Ask again in a moment.' });
      }
    } finally {
      this.busy.set(false);
      this.live.set(null);
      this.abort = null;
    }
  }

  private push(id: string, m: TutorMessage): void {
    this.threads.update((t) => ({ ...t, [id]: [...(t[id] ?? []), m] }));
  }

  /** Removes the last question, so the conversation always alternates user/assistant. */
  private popUser(id: string): void {
    this.threads.update((t) => {
      const list = [...(t[id] ?? [])];
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].role === 'user') {
          list.splice(i, 1);
          break;
        }
      }
      return { ...t, [id]: list };
    });
  }

  private buildTurns(lesson: Lesson, thread: TutorMessage[]): Turn[] {
    const stage = this.content.stageOf(lesson);
    const depth = DEPTHS.find((d) => d.key === this.progress.depth()) ?? DEPTHS[1];
    const jdk = this.progress.jdk();
    const context =
      'You are a patient Java tutor on JavaAtlas, a free Java learning website.\n' +
      `The learner is reading the lesson "${lesson.t}" in the stage "${stage.title}".\n` +
      `Their chosen depth is ${depth.name}: ${depth.hint} They use Java ${jdk}.\n\n` +
      'Lesson text:\n' + plain(lesson.body).slice(0, 2000) + '\n\nLesson example code:\n' + lesson.code.slice(0, 1500) + '\n\n' +
      'How to answer:\n' +
      '- Answer only what was asked, in simple, clear English. Many readers are not native English speakers.\n' +
      '- Keep it under 220 words unless the learner asks for more.\n' +
      '- Use short paragraphs or "- " bullets. Put code in ```java fences and keep examples small.\n' +
      `- If a feature needs a newer Java than ${jdk}, name the version and show the alternative that works on Java ${jdk}.\n` +
      '- If the question is not about Java or programming, gently steer back to the lesson.';
    const turns: Turn[] = thread
      .filter((m): m is TutorMessage & { role: 'user' | 'assistant' } => m.role !== 'note')
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));
    while (turns.length && turns[0].role !== 'user') turns.shift();
    if (turns.length) turns[0] = { role: 'user', content: context + '\n\nLearner question:\n' + turns[0].content };
    return turns;
  }
}
