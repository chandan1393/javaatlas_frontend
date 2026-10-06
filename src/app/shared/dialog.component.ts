import { Component, DOCUMENT, effect, ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../core/account.service';
import { errorText, isApiError } from '../core/api.service';
import { CheckoutService } from '../core/checkout.service';
import { priceText } from '../core/markup';
import { AuthMode, UiService } from '../core/ui.service';
import { PasswordStrengthComponent } from './password-strength.component';

/** Log in / sign up (from the header or at checkout), and information messages. */
@Component({
  selector: 'app-dialog',
  imports: [RouterLink, PasswordStrengthComponent],
  templateUrl: './dialog.component.html',
})
export class DialogComponent {
  protected readonly ui = inject(UiService);
  private readonly account = inject(AccountService);
  private readonly checkout = inject(CheckoutService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly error = signal('');
  protected readonly submitting = signal(false);
  private readonly adminRouter = inject(Router);
  protected readonly showPassword = signal(false);
  /** Email address a reset link was just sent to (forgot-password mode). */
  protected readonly sentTo = signal('');
  /** Email address waiting for confirmation (after sign-up, or a login before confirming). */
  protected readonly verifyFor = signal('');
  protected readonly verifyNote = signal('');
  protected readonly priceText = priceText;
  private readonly sheet = viewChild<ElementRef<HTMLElement>>('sheet');
  private returnFocus: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const state = this.ui.dialog();
      untracked(() => {
        if (state && !this.returnFocus) this.returnFocus = this.document.activeElement as HTMLElement | null;
        if (!state && this.returnFocus) {
          this.returnFocus.focus?.();
          this.returnFocus = null;
        }
        if (state?.kind === 'auth') {
          this.error.set('');
          this.password.set('');
          this.submitting.set(false);
          this.showPassword.set(false);
          this.sentTo.set('');
          this.verifyFor.set('');
          this.verifyNote.set('');
        }
      });
      if (state) setTimeout(() => this.focusFirst());
    });
  }

  protected setMode(mode: AuthMode): void {
    const state = this.ui.dialog();
    if (state?.kind === 'auth') this.ui.dialog.set({ ...state, mode });
    this.error.set('');
    this.sentTo.set('');
    setTimeout(() => this.focusFirst());
  }

  protected async sendReset(): Promise<void> {
    const email = this.email().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this.error.set('Enter the email address you signed up with.');
    this.error.set('');
    this.submitting.set(true);
    try {
      await this.account.requestPasswordReset(email);
      this.sentTo.set(email);
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.submitting.set(false);
    }
  }

  protected close(): void {
    const state = this.ui.dialog();
    if (state?.kind === 'info' && state.waiting) return;
    this.ui.closeDialog();
  }

  protected onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.close();
  }

  protected async submit(): Promise<void> {
    const state = this.ui.dialog();
    if (state?.kind !== 'auth' || this.submitting()) return;
    if (state.mode === 'forgot') return this.sendReset();
    const signup = state.mode === 'signup';
    const name = this.name().trim();
    const email = this.email().trim();
    const password = this.password();
    if (signup && !name) return this.error.set('Enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this.error.set('Enter a valid email address, like name@example.com.');
    if (password.length < 8) return this.error.set('Passwords need at least 8 characters.');
    this.error.set('');
    this.submitting.set(true);
    try {
      if (signup) {
        this.verifyFor.set(await this.account.signup(name, email, password));
        this.verifyNote.set('');
        this.rememberWhereToContinue(state.redirect, state.course?.slug, state.course?.title);
        return;                              // no session until the email is confirmed
      }
      await this.account.login(email, password);
      const course = state.course;
      if (course) {
        if (this.account.enrolled().has(course.slug)) {
          this.ui.info('You already own this course', `“${course.title}” is in My courses.`, false, {
            label: 'Go to course',
            link: ['/courses', course.slug, 'learn'],
          });
          return;
        }
        await this.checkout.start(course);
        return;
      }
      this.ui.closeDialog();
      this.ui.toast(`Welcome${signup ? '' : ' back'}, ${this.account.me()?.name.split(' ')[0] ?? ''}.`);
      if (state.redirect) void this.router.navigateByUrl(state.redirect);
    } catch (e) {
      if (isApiError(e) && e.code === 'admin_login_required') {
        this.ui.dialog.set(null);
        void this.adminRouter.navigateByUrl('/admin/login');
        return;
      }
      if (isApiError(e) && e.code === 'email_not_verified') {
        this.verifyFor.set(email);
        this.verifyNote.set('You need to confirm your email before you can log in.');
        return;
      }
      this.error.set(errorText(e));
    } finally {
      this.submitting.set(false);
    }
  }

  protected async resendVerification(): Promise<void> {
    if (this.submitting() || !this.verifyFor()) return;
    this.submitting.set(true);
    try {
      await this.account.resendVerification(this.verifyFor());
      this.verifyNote.set('A new link is on its way. Use the newest email: older links stop working once you confirm.');
    } catch (e) {
      this.verifyNote.set(errorText(e));
    } finally {
      this.submitting.set(false);
    }
  }

  /** After confirming (often in a new tab), the verify page offers to continue where the learner was. */
  private rememberWhereToContinue(redirect?: string, courseSlug?: string, courseTitle?: string): void {
    try {
      const here = this.router.url.split('#')[0];
      const target = courseSlug ? `/courses/${courseSlug}` : redirect ?? (here.startsWith('/verify-email') ? '' : here);
      if (!target || target === '/') return;
      const label = courseTitle ? `Continue to “${courseTitle}”` : 'Continue where you left off';
      localStorage.setItem('javaatlas:after-verify', JSON.stringify({ target, label, at: Date.now() }));
    } catch {
      // storage unavailable (private mode): the verify page shows its default buttons
    }
  }

  protected backToLogin(): void {
    this.verifyFor.set('');
    this.verifyNote.set('');
    this.setMode('login');
  }

  /** Keeps keyboard focus inside the dialog. */
  protected trapTab(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;
    const root = this.sheet()?.nativeElement;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>('button, input, a[href]')).filter((el) => !(el as HTMLButtonElement).disabled);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && this.document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && this.document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  private focusFirst(): void {
    const root = this.sheet()?.nativeElement;
    const target = root?.querySelector<HTMLElement>('input, .w100') ?? root;
    target?.focus();
  }
}
