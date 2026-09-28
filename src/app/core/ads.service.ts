import { computed, DOCUMENT, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AdSlotName, SETTINGS } from '../app.settings';
import { AccountService } from './account.service';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Pages where ads may appear: free content only. */
const AD_PAGES = /^\/(learn\/|versions|interview|topics|paths)/;

/** Google AdSense: loads the script once, only where ads are allowed. */
@Injectable({ providedIn: 'root' })
export class AdsService {
  private readonly document = inject(DOCUMENT);
  private readonly account = inject(AccountService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly url = signal('/');
  private loaded = false;

  readonly client = SETTINGS.ads.adsenseClient;

  /** True when ads may show on the current page for the current visitor. */
  readonly allowed = computed(() => {
    if (!this.browser || !this.client) return false;
    if (!AD_PAGES.test(this.url())) return false;
    if (SETTINGS.ads.hideForCustomers && this.account.enrolled().size > 0) return false;
    return true;
  });

  constructor() {
    const router = inject(Router);
    this.url.set(router.url);
    router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.url.set(e.urlAfterRedirects.split(/[?#]/)[0]);
      if (SETTINGS.ads.autoAds && this.allowed()) this.load();
    });
  }

  slotId(name: AdSlotName): string {
    return SETTINGS.ads.slots[name];
  }

  /** Adds the AdSense script to the page (once). */
  load(): void {
    if (this.loaded || !this.browser || !this.client) return;
    this.loaded = true;
    const s = this.document.createElement('script');
    s.async = true;
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(this.client)}`;
    s.crossOrigin = 'anonymous';
    this.document.head.appendChild(s);
  }

  /** Asks AdSense to fill one newly rendered ad unit. */
  fill(): void {
    this.load();
    const w = this.document.defaultView;
    if (!w) return;
    try {
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      // An ad blocker or a duplicate push; the page works without ads.
    }
  }
}
