import { Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../core/admin-auth.service';
import { errorText } from '../../core/api.service';
import { SeoService } from '../../core/seo.service';
import { LogoComponent } from '../../shared/logo.component';

/** /admin/login: password first, then the authenticator code when two-factor sign-in is on. */
@Component({
  selector: 'app-admin-login',
  imports: [RouterLink, LogoComponent],
  template: `
    <div class="adm-login">
      <aside class="adm-login-art" aria-hidden="true">
        <div class="aurora"><i></i><i></i><i></i></div>
        <app-logo [size]="44" tone="light" />
        <div class="adm-login-copy">
          <h2>Run your academy from one place.</h2>
          <p>Create courses, write lessons, check orders and keep your site secure.</p>
          <ul>
            <li>Two-factor sign-in with an authenticator app</li>
            <li>Admin sessions expire automatically</li>
            <li>Every sign-in and change is logged</li>
          </ul>
        </div>
      </aside>
      <main class="adm-login-form">
        <div class="adm-login-card">
          <a routerLink="/" class="adm-back">← Back to the site</a>
          <h1>{{ step() === 'code' ? 'Enter your code' : 'Admin sign in' }}</h1>
          <p class="muted">
            {{ step() === 'code' ? 'Open your authenticator app and type the 6-digit code for JavaAtlas Admin.' : 'Only the site owner can sign in here.' }}
          </p>
          @if (step() === 'password') {
            <label class="fld">Email
              <input #emailEl type="email" autocomplete="username" [value]="email()" (input)="email.set($any($event.target).value)" (keydown.enter)="submit()" />
            </label>
            <label class="fld">Password
              <span class="pw-wrap">
                <input [type]="show() ? 'text' : 'password'" autocomplete="current-password" [value]="password()" (input)="password.set($any($event.target).value)" (keydown.enter)="submit()" />
                <button type="button" class="pw-show" (click)="show.set(!show())">{{ show() ? 'Hide' : 'Show' }}</button>
              </span>
            </label>
          } @else {
            <label class="fld">Authentication code
              <input #codeEl class="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="123 456" [value]="code()" (input)="onCode($any($event.target).value)" (keydown.enter)="submit()" />
            </label>
          }
          <p class="err" role="alert">{{ error() }}</p>
          <button type="button" class="btn btn-primary w100 btn-lg" [disabled]="busy()" (click)="submit()">
            {{ busy() ? 'Checking…' : step() === 'code' ? 'Verify and sign in' : 'Continue' }}
          </button>
          @if (step() === 'code') {
            <button type="button" class="linkish adm-alt" (click)="backToPassword()">Use a different account</button>
          }
          <p class="adm-foot muted">Lost your authenticator? Set ADMIN_PASSWORD_RESET=true with a new ADMIN_PASSWORD on the server and restart (see README).</p>
        </div>
      </main>
    </div>
  `,
})
export class AdminLoginComponent {
  /** Query parameter ?next= */
  readonly next = input<string>();

  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  protected readonly step = signal<'password' | 'code'>('password');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly code = signal('');
  protected readonly show = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  private readonly codeEl = viewChild<ElementRef<HTMLInputElement>>('codeEl');

  constructor() {
    inject(SeoService).set({ title: 'Admin sign in', description: 'Admin sign in.', path: '/admin/login', noindex: true });
  }

  protected onCode(v: string): void {
    this.code.set(v.replace(/[^\d ]/g, ''));
    if (v.replace(/\D/g, '').length === 6) void this.submit();
  }

  protected backToPassword(): void {
    this.step.set('password');
    this.code.set('');
    this.error.set('');
  }

  protected async submit(): Promise<void> {
    if (this.busy()) return;
    if (!this.email().trim() || !this.password()) return this.error.set('Enter your email and password.');
    if (this.step() === 'code' && this.code().replace(/\D/g, '').length !== 6) return this.error.set('Enter the 6-digit code.');
    this.error.set('');
    this.busy.set(true);
    try {
      const me = await this.auth.login(this.email().trim(), this.password(), this.step() === 'code' ? this.code() : undefined);
      this.password.set('');
      const target = me.require2fa && !me.mfa ? '/admin/security?setup=1' : this.safeNext();
      void this.router.navigateByUrl(target);
    } catch (e) {
      if (AdminAuthService.isTotpRequired(e)) {
        this.step.set('code');
        setTimeout(() => this.codeEl()?.nativeElement.focus());
      } else {
        this.error.set(errorText(e));
        if (this.step() === 'code') this.code.set('');
      }
    } finally {
      this.busy.set(false);
    }
  }

  /** Only allow redirects back into the admin area. */
  private safeNext(): string {
    const n = this.next();
    return n && /^\/admin(\/|$)/.test(n) && !n.startsWith('//') ? n : '/admin';
  }
}
