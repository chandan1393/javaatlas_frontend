import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/account.service';
import { errorText, isApiError } from '../../core/api.service';
import { UiService } from '../../core/ui.service';
import { PasswordStrengthComponent } from '../../shared/password-strength.component';
import { SeoService } from '../../core/seo.service';

/** Opened from the emailed link: /reset-password?token=... */
@Component({
  selector: 'app-reset-password',
  imports: [RouterLink, PasswordStrengthComponent],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
  /** Query parameter ?token= */
  readonly token = input<string>();

  protected readonly account = inject(AccountService);
  protected readonly ui = inject(UiService);
  protected readonly password = signal('');
  protected readonly confirm = signal('');
  protected readonly show = signal(false);
  protected readonly error = signal('');
  protected readonly saving = signal(false);
  protected readonly state = signal<'form' | 'done' | 'expired' | 'admin'>('form');

  protected async submit(): Promise<void> {
    const token = this.token();
    if (!token || this.saving()) return;
    if (this.password().length < 8) return this.error.set('Passwords need at least 8 characters.');
    if (this.password() !== this.confirm()) return this.error.set('The two passwords don’t match.');
    this.error.set('');
    this.saving.set(true);
    try {
      const who = await this.account.resetPassword(token, this.password());
      this.state.set(who === 'admin' ? 'admin' : 'done');
    } catch (e) {
      if (isApiError(e) && e.code === 'invalid_token') this.state.set('expired');
      else this.error.set(errorText(e));
    } finally {
      this.saving.set(false);
    }
  }

  protected requestNewLink(): void {
    this.ui.auth(null, 'forgot');
  }

  constructor() {
    inject(SeoService).set({ title: 'Choose a new password', description: 'Your JavaAtlas account.', path: '/reset-password', noindex: true });
  }
}
