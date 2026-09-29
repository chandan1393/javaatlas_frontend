import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SETTINGS } from '../app.settings';
import { AccountService } from './account.service';

type EventType = 'pageview' | 'search' | 'lesson_complete' | 'checkout_start' | 'signup_start';

/**
 * Sends anonymous usage events to this site's own backend for the owner's analytics.
 * No cookies are sent; nothing identifies the visitor. Skips admin pages, admins themselves,
 * and browsers with Do Not Track or Global Privacy Control turned on.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);
  private readonly account = inject(AccountService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly base = SETTINGS.apiBase.replace(/\/+$/, '');
  private firstView = true;
  private lastPath = '';
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private lastSearch = '';

  constructor() {
    if (!this.browser) return;
    inject(Router)
      .events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.pageview(e.urlAfterRedirects));
  }

  /** Records a search once the visitor stops typing, with how many results it found. */
  search(query: string, results: number, source: 'site' | 'topics'): void {
    clearTimeout(this.searchTimer);
    const q = query.trim().toLowerCase();
    if (q.length < 2) return;
    this.searchTimer = setTimeout(() => {
      if (q === this.lastSearch) return;
      this.lastSearch = q;
      this.send({ type: 'search', query: q.slice(0, 120), results, source, path: this.location().pathname });
    }, 1200);
  }

  event(type: EventType, path: string): void {
    this.send({ type, path });
  }

  private pageview(url: string): void {
    const path = url.split(/[?#]/)[0];
    if (path === this.lastPath) return;
    this.lastPath = path;
    const body: Record<string, unknown> = { type: 'pageview', path, width: this.document.defaultView?.innerWidth };
    if (this.firstView) {
      this.firstView = false;
      const ref = this.referrer();
      if (ref) body['ref'] = ref;
      const params = new URLSearchParams(this.location().search);
      const source = params.get('utm_source') ?? params.get('ref');
      const campaign = params.get('utm_campaign');
      if (source) body['source'] = source.slice(0, 60);
      if (campaign) body['campaign'] = campaign.slice(0, 80);
    }
    this.send(body);
  }

  private send(body: Record<string, unknown>, attempt = 0): void {
    if (!this.browser || this.optedOut()) return;
    // Wait (briefly) until we know whether this is the admin, whose visits aren't counted.
    if (!this.account.checked() && attempt < 20) {
      setTimeout(() => this.send(body, attempt + 1), 150);
      return;
    }
    const path = String(body['path'] ?? '');
    if (path.startsWith('/admin') || this.account.me()?.role === 'ADMIN') return;
    try {
      void fetch(`${this.base}/api/analytics/collect`, {
        method: 'POST',
        credentials: 'omit',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => undefined);
    } catch {
      /* analytics must never affect the page */
    }
  }

  private referrer(): string | null {
    try {
      const r = this.document.referrer ? new URL(this.document.referrer).hostname : '';
      return r && r !== this.location().hostname ? r.replace(/^www\./, '').slice(0, 120) : null;
    } catch {
      return null;
    }
  }

  private optedOut(): boolean {
    const nav = this.document.defaultView?.navigator as (Navigator & { globalPrivacyControl?: boolean }) | undefined;
    return nav?.doNotTrack === '1' || nav?.globalPrivacyControl === true;
  }

  private location(): Location {
    return this.document.location;
  }
}
