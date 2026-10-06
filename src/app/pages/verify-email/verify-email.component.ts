import { Component, inject, input, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/account.service';
import { errorText, isApiError } from '../../core/api.service';
import { SeoService } from '../../core/seo.service';

/** Opened from the confirmation email: /verify-email?token=... Confirms the address and signs the learner in. */
@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  template: `
    <div class="wrap">
      <div class="auth-page">
        <div class="auth-card">
          @switch (state()) {
            @case ('working') {
              <div class="auth-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/></svg>
              </div>
              <h1>Confirming your email…</h1>
              <p>One moment.</p>
            }
            @case ('done') {
              <div class="auth-icon ok" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
              </div>
              <h1>Email confirmed</h1>
              <p>Welcome to JavaAtlas{{ account.me() ? ', ' + firstName() : '' }}! Your account is active and you’re logged in.</p>
              @if (resume(); as r) {
                <a class="btn btn-primary w100" [routerLink]="r.target">{{ r.label }}</a>
                <a class="btn btn-ghost w100 gap-top" routerLink="/learn">Browse lessons</a>
              } @else {
                <a class="btn btn-primary w100" routerLink="/learn">Start learning</a>
                <a class="btn btn-ghost w100 gap-top" routerLink="/courses">Browse courses</a>
              }
            }
            @case ('admin') {
              <h1>Email confirmed</h1>
              <p>This is the admin account. Sign in on the admin page with your password and authenticator code.</p>
              <a class="btn btn-primary w100" routerLink="/admin/login">Go to admin sign in</a>
            }
            @default {
              <div class="auth-icon bad" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>
              </div>
              <h1>{{ token() ? 'This link has expired' : 'This link is incomplete' }}</h1>
              <p>{{ error() || 'Confirmation links work for 24 hours and only once. Enter your email to get a new one.' }}</p>
              @if (resent()) {
                <div class="sent-box" role="status">If <strong>{{ email() }}</strong> has an account that isn’t confirmed yet, a new link is on its way.</div>
              } @else {
                <label class="fld">Email
                  <input type="email" autocomplete="email" inputmode="email" maxlength="254" [value]="email()" (input)="email.set($any($event.target).value)" (keydown.enter)="resend()" />
                </label>
                <p class="err" role="alert">{{ resendError() }}</p>
                <button type="button" class="btn btn-primary w100" (click)="resend()" [disabled]="sending()">{{ sending() ? 'Sending…' : 'Send a new link' }}</button>
              }
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit {
  /** Query parameter ?token= */
  readonly token = input<string>();

  protected readonly account = inject(AccountService);
  protected readonly state = signal<'working' | 'done' | 'admin' | 'failed'>('working');
  protected readonly error = signal('');
  protected readonly email = signal('');
  protected readonly sending = signal(false);
  protected readonly resent = signal(false);
  protected readonly resendError = signal('');
  /** Where the learner was when they signed up (saved by the sign-up dialog), if within the last day. */
  protected readonly resume = signal<{ target: string; label: string } | null>(null);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    inject(SeoService).set({ title: 'Confirm your email', description: 'Your JavaAtlas account.', path: '/verify-email', noindex: true });
  }

  async ngOnInit(): Promise<void> {
    if (!this.browser) return;
    const token = this.token();
    if (!token) {
      this.state.set('failed');
      return;
    }
    try {
      await this.account.verifyEmail(token);
      this.state.set(this.account.me()?.role === 'ADMIN' ? 'admin' : 'done');
      this.resume.set(this.takeResume());
    } catch (e) {
      this.state.set('failed');
      if (!(isApiError(e) && e.code === 'invalid_token')) this.error.set(errorText(e));
    }
  }

  private takeResume(): { target: string; label: string } | null {
    try {
      const raw = localStorage.getItem('javaatlas:after-verify');
      localStorage.removeItem('javaatlas:after-verify');
      if (!raw) return null;
      const r = JSON.parse(raw) as { target?: string; label?: string; at?: number };
      const fresh = typeof r.at === 'number' && Date.now() - r.at < 24 * 3600 * 1000;
      return fresh && typeof r.target === 'string' && r.target.startsWith('/') && !r.target.startsWith('//')
        ? { target: r.target, label: r.label ?? 'Continue where you left off' }
        : null;
    } catch {
      return null;
    }
  }

  protected firstName(): string {
    return this.account.me()?.name.split(' ')[0] ?? '';
  }

  protected async resend(): Promise<void> {
    const email = this.email().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.resendError.set('Enter the email address you signed up with.');
      return;
    }
    this.resendError.set('');
    this.sending.set(true);
    try {
      await this.account.resendVerification(email);
      this.resent.set(true);
    } catch (e) {
      this.resendError.set(errorText(e));
    } finally {
      this.sending.set(false);
    }
  }
}
