import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AiError, AiService, AiTurn } from '../core/ai.service';
import { aiToHtml } from '../core/markup';

/** Floating "Ask AI" mentor, available on every public page that doesn't already have a tutor. */
@Component({
  selector: 'app-ai-assistant',
  imports: [RouterLink],
  host: { '(document:keydown.escape)': 'open.set(false)' },
  template: `
    @if (visible()) {
      @if (open()) {
        <section class="assist" role="dialog" aria-label="AI mentor" aria-modal="false">
          <header class="assist-head">
            <span class="assist-orb" aria-hidden="true"></span>
            <div>
              <strong>AI mentor</strong>
              <small>Ask anything about Java, Spring or this page</small>
            </div>
            <button type="button" class="icon-btn" aria-label="Close" (click)="open.set(false)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </header>
          <div class="assist-thread" #thread aria-live="polite">
            @if (!items().length && live() === null) {
              <p class="assist-hello">Hi! I can explain concepts, compare versions, or help you pick what to learn next.</p>
              <div class="chips">
                @for (s of suggestions(); track s) {
                  <button type="button" class="chip" (click)="send(s)">{{ s }}</button>
                }
              </div>
            }
            @for (m of items(); track $index) {
              @if (m.role === 'assistant') {
                <div class="msg a" [innerHTML]="m.html"></div>
              } @else {
                <div class="msg u">{{ m.text }}</div>
              }
            }
            @if (live() !== null) {
              <div class="msg a">
                @if (live()) {
                  <div [innerHTML]="liveHtml()"></div>
                } @else {
                  <span class="typing"><i></i><i></i><i></i></span>
                }
              </div>
            }
            @if (error()) {
              <p class="msg note">{{ error() }}</p>
            }
          </div>
          <div class="ask">
            <textarea rows="2" placeholder="Ask a question…" aria-label="Your question" [value]="draft()" (input)="draft.set($any($event.target).value)" (keydown.enter)="onEnter($event)"></textarea>
            @if (busy()) {
              <button type="button" class="btn btn-ghost btn-sm" (click)="stop()">Stop</button>
            } @else {
              <button type="button" class="btn btn-primary btn-sm" [disabled]="!draft().trim()" (click)="send(draft())">Send</button>
            }
          </div>
          <p class="assist-foot"><a routerLink="/ai" (click)="open.set(false)">Open the AI Lab</a> for code review, quizzes and mock interviews.</p>
        </section>
      }
      <button type="button" class="assist-fab" [class.on]="open()" [attr.aria-expanded]="open()" aria-label="Ask the AI mentor" (click)="toggle()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3l1.8 4.9L19 9.7l-4.9 1.8L12 17l-1.8-5.5L5 9.7l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
        </svg>
        <span>Ask AI</span>
      </button>
    }
  `,
})
export class AiAssistantComponent {
  private readonly ai = inject(AiService);
  private readonly router = inject(Router);
  private readonly url = toSignal(this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)), { initialValue: null });

  protected readonly open = signal(false);
  protected readonly busy = signal(false);
  protected readonly draft = signal('');
  protected readonly error = signal('');
  protected readonly live = signal<string | null>(null);
  protected readonly liveHtml = computed(() => aiToHtml(this.live() ?? ''));
  private readonly turns = signal<AiTurn[]>([]);
  protected readonly items = computed(() => this.turns().map((m) => ({ role: m.role, text: m.content, html: m.role === 'assistant' ? aiToHtml(m.content) : '' })));
  private readonly threadEl = viewChild<ElementRef<HTMLElement>>('thread');
  private abort: AbortController | null = null;

  private readonly path = computed(() => (this.url()?.urlAfterRedirects ?? this.router.url).split(/[?#]/)[0]);
  /** Hidden where a tutor already exists (lessons, AI Lab) and on private screens. */
  protected readonly visible = computed(() => this.ai.enabled() === true && !/^\/(learn|ai|admin|courses\/[^/]+\/learn)/.test(this.path()));
  protected readonly suggestions = computed(() => {
    const p = this.path();
    if (p.startsWith('/versions')) return ['What changed in Spring Boot 4?', 'Should I upgrade from Java 17 to 25?', 'Which Hibernate version does Spring Boot 3.5 use?'];
    if (p.startsWith('/interview')) return ['Quiz me on HashMap internals', 'How do I answer "tell me about yourself" as a Java dev?', 'Explain volatile vs synchronized'];
    if (p.startsWith('/courses')) return ['Which course should I take first?', 'Is JPA worth learning in 2026?', 'How long does it take to learn Spring Boot?'];
    return ['Where should a Java beginner start?', 'Explain JDK vs JRE vs JVM simply', 'What should I learn after Core Java?'];
  });

  constructor() {
    effect(() => {
      this.items();
      this.live();
      const el = this.threadEl()?.nativeElement;
      if (el) setTimeout(() => (el.scrollTop = el.scrollHeight));
    });
  }

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  protected stop(): void {
    this.abort?.abort();
  }

  protected onEnter(e: Event): void {
    const k = e as KeyboardEvent;
    if (k.shiftKey) return;
    k.preventDefault();
    void this.send(this.draft());
  }

  protected async send(text: string): Promise<void> {
    const q = text.trim();
    if (!q || this.busy()) return;
    this.draft.set('');
    this.error.set('');
    const history = [...this.turns(), { role: 'user' as const, content: q }].slice(-12);
    this.turns.set(history);
    this.busy.set(true);
    this.live.set('');
    const ctl = new AbortController();
    this.abort = ctl;
    try {
      const pageTitle = (typeof document !== 'undefined' ? document.title : '').split('|')[0].trim();
      const res = await this.ai.stream('tutor', history, { lesson: pageTitle }, (t) => this.live.set(t), ctl.signal);
      this.turns.update((t) => [...t, { role: 'assistant', content: res.text }]);
    } catch (e) {
      const err = e instanceof AiError ? e : new AiError('Something went wrong. Please try again.', 'unknown');
      if (err.code === 'cancelled' && err.partial) this.turns.update((t) => [...t, { role: 'assistant', content: err.partial }]);
      else {
        this.turns.update((t) => t.slice(0, -1));
        if (err.code !== 'cancelled') this.error.set(err.message);
      }
    } finally {
      this.live.set(null);
      this.busy.set(false);
      this.abort = null;
    }
  }
}
