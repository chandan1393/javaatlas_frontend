import { inject, Injectable, signal } from '@angular/core';
import { AccountService } from './account.service';
import { ApiService, isApiError } from './api.service';

export interface AdminMe {
  name: string;
  email: string;
  role: string;
  totpEnabled: boolean;
  /** Whether this session passed the second factor. */
  mfa: boolean;
  require2fa: boolean;
}

/** Admin sign-in (/admin/login), two-factor setup and the admin session. */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly api = inject(ApiService);
  private readonly account = inject(AccountService);

  readonly me = signal<AdminMe | null>(null);
  readonly checked = signal(false);
  private loading: Promise<AdminMe | null> | null = null;

  /** Loads the current admin session (once, unless forced). */
  load(force = false): Promise<AdminMe | null> {
    if (this.checked() && !force) return Promise.resolve(this.me());
    if (!this.loading || force) {
      this.loading = this.api
        .get<AdminMe>('/api/admin-auth/me')
        .then((me) => this.set(me))
        .catch(() => this.set(null))
        .finally(() => this.checked.set(true));
    }
    return this.loading;
  }

  /** Throws ApiError with code 'totp_required' when a 6-digit code is needed. */
  async login(email: string, password: string, code?: string): Promise<AdminMe> {
    const me = await this.api.post<AdminMe>('/api/admin-auth/login', { email, password, code: code ?? '' });
    this.checked.set(true);
    return this.set(me)!;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post<void>('/api/admin-auth/logout', {});
    } finally {
      this.set(null);
      this.account.me.set(null);
    }
  }

  startTotp(): Promise<{ secret: string; uri: string }> {
    return this.api.post('/api/admin/security/totp/setup', {});
  }

  async enableTotp(code: string): Promise<AdminMe> {
    return this.set(await this.api.post<AdminMe>('/api/admin/security/totp/enable', { code }))!;
  }

  changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.api.post<void>('/api/admin/security/password', { currentPassword, newPassword });
  }

  logoutEverywhere(): Promise<void> {
    return this.api.post<void>('/api/admin/security/logout-everywhere', {});
  }

  /** True when the admin must finish two-factor setup before using the rest of the admin area. */
  needs2fa(): boolean {
    const me = this.me();
    return !!me && me.require2fa && !me.mfa;
  }

  static isTotpRequired(e: unknown): boolean {
    return isApiError(e) && e.code === 'totp_required';
  }

  private set(me: AdminMe | null): AdminMe | null {
    this.me.set(me);
    if (me) this.account.me.set({ name: me.name, email: me.email, role: me.role === 'ADMIN' ? 'ADMIN' : 'USER' });
    return me;
  }
}
