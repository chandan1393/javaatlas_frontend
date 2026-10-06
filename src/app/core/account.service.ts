import { computed, inject, Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { FALLBACK_COURSES } from './courses';
import { CourseSummary, Me } from './models';

interface Catalog {
  checkout: boolean;
  courses: CourseSummary[];
}

/** Backend connection, course catalog, signed-in learner and the courses they own. */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly api = inject(ApiService);

  /** true once we know whether a backend answered */
  readonly checked = signal(false);
  readonly online = signal(false);
  /** Razorpay is configured (paid checkout possible). Free courses work without it. */
  readonly checkoutOpen = signal(false);
  readonly me = signal<Me | null>(null);
  readonly isAdmin = computed(() => this.me()?.role === 'ADMIN');
  /** Slugs of courses the learner owns. */
  readonly enrolled = signal<ReadonlySet<string>>(new Set());
  private readonly catalog = signal<CourseSummary[] | null>(null);
  readonly courses = computed(() => this.catalog() ?? FALLBACK_COURSES);
  private started = false;

  /** Browser only: called once after the first render. */
  async init(): Promise<void> {
    if (this.started) return;
    this.started = true;
    try {
      await this.refreshCatalog();
      this.online.set(true);
    } catch {
      this.online.set(false);
    }
    if (this.online()) {
      try {
        this.me.set(await this.api.get<Me>('/api/auth/me'));
      } catch {
        this.me.set(null);
      }
      await this.loadEnrollments();
    }
    this.checked.set(true);
  }

  async refreshCatalog(): Promise<void> {
    const c = await this.api.get<Catalog>('/api/courses');
    if (!c || !Array.isArray(c.courses)) throw new Error('No backend');
    this.checkoutOpen.set(!!c.checkout);
    this.catalog.set(c.courses);
  }

  /** Creates an unverified account. Returns the address the confirmation link was sent to (no session yet). */
  async signup(name: string, email: string, password: string): Promise<string> {
    const res = await this.api.post<{ status: string; email: string }>('/api/auth/signup', { name, email, password });
    return res.email;
  }

  /** Opening the emailed link: confirms the address and signs the learner in. */
  async verifyEmail(token: string): Promise<void> {
    this.me.set(await this.api.post<Me>('/api/auth/verify-email', { token }));
    await this.loadEnrollments();
  }

  /** Sends a new confirmation link (the server never says whether the account exists). */
  async resendVerification(email: string): Promise<void> {
    await this.api.post<void>('/api/auth/verify-email/resend', { email });
  }

  async login(email: string, password: string): Promise<void> {
    this.me.set(await this.api.post<Me>('/api/auth/login', { email, password }));
    await this.loadEnrollments();
  }

  async logout(): Promise<void> {
    try {
      await this.api.post<void>('/api/auth/logout');
    } catch {
      /* signed out locally either way */
    }
    this.me.set(null);
    this.enrolled.set(new Set());
  }

  /** Emails a reset link. Succeeds whether or not the email has an account. */
  requestPasswordReset(email: string): Promise<void> {
    return this.api.post<void>('/api/auth/forgot', { email });
  }

  /** Sets a new password from an emailed link, and signs the learner in. */
  /** Returns 'admin' for admin accounts, which then sign in at /admin/login (they need their second factor). */
  async resetPassword(token: string, newPassword: string): Promise<'user' | 'admin'> {
    const me = await this.api.post<Me>('/api/auth/reset', { token, newPassword });
    if (me.role === 'ADMIN') return 'admin';
    this.me.set(me);
    await this.loadEnrollments();
    return 'user';
  }

  changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.api.post<void>('/api/auth/password', { currentPassword, newPassword });
  }

  markEnrolled(slug: string): void {
    this.enrolled.update((s) => new Set(s).add(slug));
  }

  forgetSession(): void {
    this.me.set(null);
    this.enrolled.set(new Set());
  }

  private async loadEnrollments(): Promise<void> {
    if (!this.me()) {
      this.enrolled.set(new Set());
      return;
    }
    try {
      const r = await this.api.get<{ courseIds: string[] }>('/api/me/enrollments');
      this.enrolled.set(new Set(r?.courseIds ?? []));
    } catch {
      this.enrolled.set(new Set());
    }
  }
}
