import { Component, DOCUMENT, computed, inject, input, output, signal } from '@angular/core';
import { AccountService } from '../core/account.service';
import { errorText } from '../core/api.service';
import { FeedbackService } from '../core/feedback.service';
import { FeedbackType } from '../core/ui.service';

const TYPES: { id: FeedbackType; label: string; hint: string }[] = [
  { id: 'idea', label: '💡 Idea', hint: 'What should we add or improve?' },
  { id: 'bug', label: '🐞 Something’s broken', hint: 'What happened, and what did you expect? Which page and device?' },
  { id: 'content', label: '📘 Mistake in a lesson', hint: 'Which lesson, and what’s wrong or unclear?' },
  { id: 'praise', label: '❤️ Praise', hint: 'What do you like? It helps us know what to keep.' },
  { id: 'other', label: '💬 Other', hint: 'Tell us anything.' },
];

/** The feedback form, used in the feedback dialog and on the /feedback page. */
@Component({
  selector: 'app-feedback-form',
  template: `
    @if (sent()) {
      <div class="fb-done" role="status">
        <span class="fb-done-ico" aria-hidden="true">✓</span>
        <h3>Thank you!</h3>
        <p>We read every message{{ email().trim() ? ', and we’ll reply to ' + email().trim() + ' if we need to.' : '.' }}</p>
        <button type="button" class="btn btn-ghost" (click)="reset()">Send more feedback</button>
      </div>
    } @else {
      <form class="fb-form" (submit)="$event.preventDefault(); submit()" novalidate>
        <fieldset class="fb-types">
          <legend>What’s it about?</legend>
          @for (t of types; track t.id) {
            <button type="button" class="chip" [attr.aria-pressed]="type() === t.id" (click)="type.set(t.id)">{{ t.label }}</button>
          }
        </fieldset>

        <div class="fb-rating" role="radiogroup" aria-label="How would you rate JavaAtlas?">
          <span>How would you rate JavaAtlas? <small class="muted">(optional)</small></span>
          <span class="stars">
            @for (n of [1, 2, 3, 4, 5]; track n) {
              <button type="button" role="radio" [attr.aria-checked]="rating() === n" [attr.aria-label]="n + ' out of 5'" [class.on]="(hover() || rating() || 0) >= n"
                (mouseenter)="hover.set(n)" (mouseleave)="hover.set(0)" (click)="rating.set(rating() === n ? null : n)">★</button>
            }
          </span>
        </div>

        <label class="fld">Your feedback
          <textarea rows="5" maxlength="2000" [placeholder]="hint()" [value]="message()" (input)="message.set($any($event.target).value)"></textarea>
          <small class="fb-count" [class.warn]="message().length > 1800">{{ message().length }} / 2000</small>
        </label>

        <div class="fb-row">
          <label class="fld">Name <small class="muted">(optional)</small>
            <input autocomplete="name" maxlength="80" [value]="name()" (input)="name.set($any($event.target).value)" />
          </label>
          <label class="fld">Email <small class="muted">(optional, if you’d like a reply)</small>
            <input type="email" autocomplete="email" maxlength="254" [value]="email()" (input)="email.set($any($event.target).value)" />
          </label>
        </div>
        <!-- Leave this empty. It's hidden from people and catches spam bots. -->
        <label class="fb-hp" aria-hidden="true">Website <input tabindex="-1" autocomplete="off" [value]="website()" (input)="website.set($any($event.target).value)" /></label>

        <p class="err" role="alert">{{ error() }}</p>
        <div class="fb-actions">
          <button type="submit" class="btn btn-brand" [disabled]="busy()">{{ busy() ? 'Sending…' : 'Send feedback' }}</button>
          <small class="muted">We’ll include the page you’re on{{ lessonId() ? ' and this lesson' : '' }}. Please don’t share passwords or payment details.</small>
        </div>
      </form>
    }
  `,
})
export class FeedbackFormComponent {
  readonly initialType = input<FeedbackType | 'any'>('any');
  readonly lessonId = input<string | null>(null);
  readonly sentChange = output<boolean>();

  private readonly api = inject(FeedbackService);
  private readonly account = inject(AccountService);
  private readonly document = inject(DOCUMENT);
  protected readonly types = TYPES;
  protected readonly type = signal<FeedbackType>('idea');
  protected readonly rating = signal<number | null>(null);
  protected readonly hover = signal(0);
  protected readonly message = signal('');
  protected readonly name = signal(this.account.me()?.name ?? '');
  protected readonly email = signal(this.account.me()?.email ?? '');
  protected readonly website = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly sent = signal(false);
  protected readonly hint = computed(() => TYPES.find((t) => t.id === this.type())!.hint);
  private openedAt = Date.now();

  ngOnInit(): void {
    const t = this.initialType();
    if (t !== 'any') this.type.set(t);
  }

  protected async submit(): Promise<void> {
    const text = this.message().trim();
    if (text.length < 5) return this.error.set('Please write a few words so we understand.');
    const email = this.email().trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this.error.set('That email doesn’t look right.');
    this.error.set('');
    this.busy.set(true);
    try {
      await this.api.send({
        type: this.type(),
        rating: this.rating(),
        message: text,
        name: this.name().trim() || undefined,
        email: email || undefined,
        page: this.document.location.pathname,
        lessonId: this.lessonId() ?? undefined,
        website: this.website(),
        elapsedMs: Date.now() - this.openedAt,
      });
      this.sent.set(true);
      this.sentChange.emit(true);
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected reset(): void {
    this.message.set('');
    this.rating.set(null);
    this.sent.set(false);
    this.openedAt = Date.now();
    this.sentChange.emit(false);
  }
}
