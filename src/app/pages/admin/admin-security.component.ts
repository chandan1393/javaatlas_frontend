import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../core/admin-auth.service';
import { errorText } from '../../core/api.service';
import { SeoService } from '../../core/seo.service';
import { UiService } from '../../core/ui.service';
import { PasswordStrengthComponent } from '../../shared/password-strength.component';
import type { toDataURL as toDataURLType } from 'qrcode/lib/browser';

/** Two-factor setup, admin password and "sign out everywhere". */
@Component({
  selector: 'app-admin-security',
  imports: [PasswordStrengthComponent],
  template: `
    <header class="adm-head">
      <h1>Security</h1>
      <p class="muted">Keep the admin account safe before you go live.</p>
    </header>

    @if (setupParam() && auth.needs2fa()) {
      <div class="adm-note" role="status">This site requires two-factor sign-in for admins. Set it up below to open the rest of the admin area.</div>
    }

    <section class="panel">
      <div class="row-between">
        <div>
          <h2>Two-factor sign-in</h2>
          <p class="muted">After your password, you’ll type a 6-digit code from an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy).</p>
        </div>
        <span class="tag" [class.avail]="auth.me()?.totpEnabled">{{ auth.me()?.totpEnabled ? 'On' : 'Off' }}</span>
      </div>
      @if (!auth.me()?.totpEnabled) {
        @if (!setup()) {
          <button type="button" class="btn btn-primary" [disabled]="busy()" (click)="start()">Set up two-factor sign-in</button>
        } @else {
          <ol class="totp-steps">
            <li>
              <strong>Scan this QR code</strong> with your authenticator app.
              <div class="qr-box">
                @if (qr()) {
                  <img [src]="qr()" width="200" height="200" alt="QR code for your authenticator app" />
                }
                <div>
                  <small class="muted">Can’t scan? Enter this key in the app:</small>
                  <code class="totp-key">{{ grouped() }}</code>
                </div>
              </div>
            </li>
            <li>
              <strong>Type the 6-digit code</strong> the app shows.
              <div class="totp-confirm">
                <input class="field otp" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="123 456" [value]="code()" (input)="code.set($any($event.target).value)" (keydown.enter)="enable()" />
                <button type="button" class="btn btn-primary" [disabled]="busy()" (click)="enable()">Turn on</button>
              </div>
            </li>
          </ol>
        }
      } @else {
        <p class="ok-msg">Two-factor sign-in is on. Keep your phone safe; if you lose it, use the recovery steps in the README.</p>
      }
      <p class="err" role="alert">{{ totpError() }}</p>
    </section>

    <section class="panel narrow-panel">
      <h2>Change admin password</h2>
      <label class="fld">Current password
        <input type="password" autocomplete="current-password" [value]="current()" (input)="current.set($any($event.target).value)" />
      </label>
      <label class="fld">New password (12+ characters)
        <input type="password" autocomplete="new-password" [value]="next()" (input)="next.set($any($event.target).value)" />
      </label>
      <app-password-strength [value]="next()" />
      <p class="err" role="alert">{{ pwError() }}</p>
      <button type="button" class="btn btn-primary" [disabled]="busy()" (click)="changePassword()">Change password</button>
    </section>

    <section class="panel narrow-panel">
      <h2>Sessions</h2>
      <p class="muted">Signed in on a computer you no longer use? Sign out of every other device. You stay signed in here.</p>
      <button type="button" class="btn btn-ghost" [disabled]="busy()" (click)="logoutEverywhere()">Sign out everywhere else</button>
    </section>
  `,
})
export class AdminSecurityComponent {
  /** ?setup=1 when sent here to finish required 2FA. */
  readonly setupParam = input<string>(undefined, { alias: 'setup' });

  protected readonly auth = inject(AdminAuthService);
  private readonly ui = inject(UiService);
  private readonly router = inject(Router);
  protected readonly setup = signal<{ secret: string; uri: string } | null>(null);
  protected readonly qr = signal('');
  protected readonly code = signal('');
  protected readonly busy = signal(false);
  protected readonly totpError = signal('');
  protected readonly current = signal('');
  protected readonly next = signal('');
  protected readonly pwError = signal('');
  protected readonly grouped = computed(() => (this.setup()?.secret ?? '').replace(/(.{4})/g, '$1 ').trim());

  constructor() {
    inject(SeoService).set({ title: 'Admin security', description: 'Admin.', path: '/admin/security', noindex: true });
  }

  protected async start(): Promise<void> {
    this.busy.set(true);
    this.totpError.set('');
    try {
      const s = await this.auth.startTotp();
      this.setup.set(s);
      try {
        // CommonJS package: its functions may sit under "default" when loaded dynamically.
        const mod = (await import('qrcode/lib/browser')) as unknown as { toDataURL?: typeof toDataURLType; default?: { toDataURL: typeof toDataURLType } };
        const toDataURL = mod.toDataURL ?? mod.default!.toDataURL;
        this.qr.set(await toDataURL(s.uri, { width: 400, margin: 1, errorCorrectionLevel: 'M' }));
      } catch {
        this.qr.set(''); // the key below still works for manual entry
      }
    } catch (e) {
      this.totpError.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async enable(): Promise<void> {
    const code = this.code().replace(/\D/g, '');
    if (code.length !== 6) return this.totpError.set('Enter the 6-digit code from the app.');
    this.busy.set(true);
    this.totpError.set('');
    try {
      await this.auth.enableTotp(code);
      this.setup.set(null);
      this.ui.toast('Two-factor sign-in is on');
      if (this.setupParam()) void this.router.navigateByUrl('/admin');
    } catch (e) {
      this.totpError.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async changePassword(): Promise<void> {
    if (this.next().length < 12) return this.pwError.set('Use at least 12 characters.');
    this.busy.set(true);
    this.pwError.set('');
    try {
      await this.auth.changePassword(this.current(), this.next());
      this.current.set('');
      this.next.set('');
      this.ui.toast('Password changed. Other devices were signed out.');
    } catch (e) {
      this.pwError.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async logoutEverywhere(): Promise<void> {
    this.busy.set(true);
    try {
      await this.auth.logoutEverywhere();
      this.ui.toast('Every other session was signed out');
    } catch (e) {
      this.ui.toast(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }
}
