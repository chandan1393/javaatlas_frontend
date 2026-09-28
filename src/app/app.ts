import { afterNextRender, Component, computed, DOCUMENT, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AccountService } from './core/account.service';
import { ContentService } from './core/content.service';
import { ProgressService } from './core/progress.service';
import { TutorService } from './core/tutor.service';
import { UiService } from './core/ui.service';
import { AccountMenuComponent } from './shared/account-menu.component';
import { DialogComponent } from './shared/dialog.component';
import { SearchDialogComponent } from './shared/search-dialog.component';
import { ToastComponent } from './shared/toast.component';
import { SETTINGS } from './app.settings';
import { AdsService } from './core/ads.service';
import { AiAssistantComponent } from './shared/ai-assistant.component';
import { AiService } from './core/ai.service';
import { LogoComponent } from './shared/logo.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SearchDialogComponent, DialogComponent, ToastComponent, AccountMenuComponent, AiAssistantComponent, LogoComponent],
  templateUrl: './app.html',
  host: { '(document:keydown)': 'onKey($event)', '(window:scroll)': 'onScroll()' },
})
export class App {
  protected readonly content = inject(ContentService);
  protected readonly progress = inject(ProgressService);
  protected readonly ui = inject(UiService);
  private readonly account = inject(AccountService);
  private readonly tutor = inject(TutorService);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  protected readonly jdkOptions = [...this.content.pickable].reverse();
  protected readonly isMac = signal(false);
  protected readonly scrolled = signal(false);
  /** Admin screens use their own layout (no public header, footer or AI button). */
  protected readonly adminPage = signal(/^\/admin(\/|$)/.test(inject(DOCUMENT).location?.pathname ?? ''));
  private readonly ads = inject(AdsService);
  private readonly ai = inject(AiService);
  protected readonly year = new Date().getFullYear();
  protected readonly brand = SETTINGS.brand;
  /** Reading progress (0-1) on lesson and lecture pages, otherwise null. */
  protected readonly readPct = signal<number | null>(null);
  private readingPage = false;
  private readonly systemDark = signal(false);
  protected readonly dark = computed(() => (this.progress.theme() ?? (this.systemDark() ? 'dark' : 'light')) === 'dark');

  constructor() {
    // Browser-only start-up, after hydration so the prerendered HTML matches the first render.
    afterNextRender(() => {
      this.progress.load();
      void this.account.init();
      void this.tutor.init();
      void this.ai.check();
      const mq = matchMedia('(prefers-color-scheme: dark)');
      this.systemDark.set(mq.matches);
      mq.addEventListener('change', (e) => this.systemDark.set(e.matches));
      this.isMac.set(/Mac|iPhone|iPad/.test(navigator.userAgent));
    });

    effect(() => {
      const theme = this.progress.theme();
      if (!this.progress.loaded()) return;
      const root = this.document.documentElement;
      if (theme) root.setAttribute('data-theme', theme);
      else root.removeAttribute('data-theme');
    });

    let first = true;
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        this.ui.searchOpen.set(false);
        this.readingPage = /^\/(learn\/|courses\/[^/]+\/learn)/.test((e as NavigationEnd).urlAfterRedirects);
        this.adminPage.set(/^\/admin(\/|$|\?)/.test((e as NavigationEnd).urlAfterRedirects));
        this.onScroll();
        if (first) {
          first = false;
          return;
        }
        this.document.getElementById('view')?.focus({ preventScroll: true });
      });
  }

  protected onScroll(): void {
    const win = this.document.defaultView;
    if (!win) return;
    const y = win.scrollY;
    this.scrolled.set(y > 8);
    if (!this.readingPage) {
      this.readPct.set(null);
      return;
    }
    const max = this.document.documentElement.scrollHeight - win.innerHeight;
    this.readPct.set(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
  }

  protected toggleTheme(): void {
    this.progress.theme.set(this.dark() ? 'light' : 'dark');
  }

  protected onJdkChange(value: string): void {
    this.progress.setJdk(Number(value));
  }

  protected onKey(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null;
    const typing = !!target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.ui.searchOpen.update((open) => !open);
      return;
    }
    if (e.key === '/' && !typing && !this.ui.searchOpen() && !this.ui.dialog()) {
      e.preventDefault();
      this.ui.searchOpen.set(true);
      return;
    }
    if (e.key === 'Escape') {
      if (this.ui.searchOpen()) {
        this.ui.searchOpen.set(false);
        return;
      }
      const d = this.ui.dialog();
      if (d && !(d.kind === 'info' && d.waiting)) this.ui.closeDialog();
    }
  }
}
