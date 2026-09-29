import { Component, DOCUMENT, effect, inject, input, PLATFORM_ID, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { errorText } from '../core/api.service';
import { FeedbackService } from '../core/feedback.service';
import { UiService } from '../core/ui.service';

const KEY = 'javaatlas:lesson-feedback';
const REASONS = [
  { id: 'unclear', label: 'Hard to understand' },
  { id: 'mistake', label: 'Something is wrong' },
  { id: 'code', label: 'Code doesn’t work' },
  { id: 'too_short', label: 'Not enough detail' },
  { id: 'too_long', label: 'Too long' },
  { id: 'outdated', label: 'Out of date' },
  { id: 'other', label: 'Something else' },
];

/** "Was this lesson helpful?" at the end of every lesson. Remembers the answer per lesson in this browser. */
@Component({
  selector: 'app-lesson-feedback',
  template: `
    <section class="lfb" aria-labelledby="lfb-h">
      @switch (state()) {
        @case ('ask') {
          <p id="lfb-h"><strong>Was this lesson helpful?</strong></p>
          <div class="lfb-btns">
            <button type="button" class="btn btn-ghost" (click)="answer(true)">👍 Yes</button>
            <button type="button" class="btn btn-ghost" (click)="answer(false)">👎 No</button>
          </div>
        }
        @case ('details') {
          <p id="lfb-h"><strong>{{ helpful() ? 'Great! What did you like most?' : 'Sorry about that. What went wrong?' }}</strong></p>
          @if (!helpful()) {
            <div class="lfb-reasons" role="group" aria-label="Reasons">
              @for (r of reasons; track r.id) {
                <button type="button" class="chip" [attr.aria-pressed]="picked().includes(r.id)" (click)="toggle(r.id)">{{ r.label }}</button>
              }
            </div>
          }
          <textarea rows="3" maxlength="2000" [placeholder]="helpful() ? 'Optional: anything we should keep doing?' : 'Optional: tell us more, for example which part or which line of code'" [value]="comment()" (input)="comment.set($any($event.target).value)"></textarea>
          <p class="err" role="alert">{{ error() }}</p>
          <div class="lfb-btns">
            <button type="button" class="btn btn-primary btn-sm" [disabled]="busy()" (click)="send()">{{ busy() ? 'Sending…' : 'Send' }}</button>
            <button type="button" class="btn btn-ghost btn-sm" [disabled]="busy()" (click)="send(true)">Skip</button>
          </div>
        }
        @case ('done') {
          <p id="lfb-h" class="lfb-thanks">✓ Thanks for your feedback on this lesson. <button type="button" class="linkish" (click)="ui.feedback.set('any')">Have a bigger idea?</button></p>
        }
      }
    </section>
  `,
})
export class LessonFeedbackComponent {
  readonly lessonId = input.required<string>();
  private readonly api = inject(FeedbackService);
  protected readonly ui = inject(UiService);
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly reasons = REASONS;
  protected readonly state = signal<'ask' | 'details' | 'done'>('ask');
  protected readonly helpful = signal(true);
  protected readonly picked = signal<string[]>([]);
  protected readonly comment = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  constructor() {
    effect(() => {
      const id = this.lessonId();
      untracked(() => {
        this.state.set(this.answered().includes(id) ? 'done' : 'ask');
        this.picked.set([]);
        this.comment.set('');
        this.error.set('');
      });
    });
  }

  protected answer(helpful: boolean): void {
    this.helpful.set(helpful);
    this.state.set('details');
  }

  protected toggle(id: string): void {
    this.picked.update((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  /** skip = send just the yes/no answer. */
  protected async send(skip = false): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.send({
        type: 'lesson',
        lessonId: this.lessonId(),
        helpful: this.helpful(),
        reasons: skip ? [] : this.picked(),
        message: skip ? undefined : this.comment().trim() || undefined,
        page: this.document.location.pathname,
      });
      this.remember();
      this.state.set('done');
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  private answered(): string[] {
    if (!this.browser) return [];
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  private remember(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify([...new Set([...this.answered(), this.lessonId()])].slice(-500)));
    } catch {
      /* ignore */
    }
  }
}
