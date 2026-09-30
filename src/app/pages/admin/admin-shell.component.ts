import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminAuthService } from '../../core/admin-auth.service';
import { LogoComponent } from '../../shared/logo.component';

const ICONS = {
  dash: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z',
  chart: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z',
  content: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z',
  add: 'M12 5v14M5 12h14',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.4-8 9-4.6-.6-8-4.5-8-9V6z',
  site: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3',
  templates: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
};

/** Layout for every admin page: sidebar navigation and the signed-in admin. */
@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent],
  template: `
    <div class="adm">
      <aside class="adm-side" aria-label="Admin">
        <a routerLink="/admin" class="adm-brand"><app-logo [size]="32" tone="light" /><span class="adm-badge">Admin</span></a>
        <nav class="adm-nav">
          @for (item of nav; track item.link) {
            <a [routerLink]="item.link" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: item.exact }" [class.disabled]="auth.needs2fa() && item.link !== '/admin/security'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="item.icon" /></svg>
              {{ item.label }}
              @if (item.link === '/admin/feedback' && newFeedback()) {
                <span class="adm-badge-n" [attr.aria-label]="newFeedback() + ' new'">{{ newFeedback() }}</span>
              }
            </a>
          }
          <a routerLink="/" class="adm-site">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="icons.site" /></svg>
            View site
          </a>
        </nav>
        @if (auth.me(); as me) {
          <div class="adm-user">
            <span class="avatar">{{ me.email[0].toUpperCase() }}</span>
            <div>
              <strong>{{ me.email }}</strong>
              <small>{{ me.mfa ? 'Two-factor verified' : 'Two-factor not verified' }}</small>
            </div>
            <button type="button" class="btn btn-sm adm-out" (click)="signOut()">Sign out</button>
          </div>
        }
      </aside>
      <main class="adm-main" id="admin-main">
        @if (auth.me(); as me) {
          @if (!me.totpEnabled) {
            <div class="adm-warn" role="status">
              <strong>Protect your admin account.</strong> Turn on two-factor sign-in so a stolen password alone can’t get in.
              <a routerLink="/admin/security">Set it up</a>
            </div>
          }
        }
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminShellComponent {
  protected readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  protected readonly newFeedback = signal(0);

  constructor() {
    const refresh = () =>
      this.api.get<{ newCount: number }>('/api/admin/feedback/summary').then((s) => this.newFeedback.set(s.newCount)).catch(() => undefined);
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd && !this.auth.needs2fa()) void refresh();
    });
  }
  protected readonly icons = ICONS;
  protected readonly nav = [
    { link: '/admin', label: 'Dashboard', icon: ICONS.dash, exact: true },
    { link: '/admin/analytics', label: 'Analytics', icon: ICONS.chart, exact: false },
    { link: '/admin/feedback', label: 'Feedback', icon: ICONS.inbox, exact: false },
    { link: '/admin/content', label: 'Content', icon: ICONS.content, exact: false },
    { link: '/admin/courses/new', label: 'New course', icon: ICONS.add, exact: true },
    { link: '/admin/templates', label: 'Course templates', icon: ICONS.templates, exact: false },
    { link: '/admin/security', label: 'Security', icon: ICONS.shield, exact: false },
  ];

  protected async signOut(): Promise<void> {
    await this.auth.logout();
    void this.router.navigateByUrl('/admin/login');
  }
}
