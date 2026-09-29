import { Component, computed, DOCUMENT, effect, ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ContentService } from '../core/content.service';
import { SearchHit } from '../core/models';
import { UiService } from '../core/ui.service';
import { AnalyticsService } from '../core/analytics.service';

@Component({
  selector: 'app-search-dialog',
  imports: [RouterLink],
  templateUrl: './search-dialog.component.html',
})
export class SearchDialogComponent {
  protected readonly ui = inject(UiService);
  private readonly content = inject(ContentService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  protected readonly query = signal('');
  protected readonly selected = signal(0);
  protected readonly results = computed(() => this.content.search(this.query()));
  private readonly analytics = inject(AnalyticsService);
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');
  private returnFocus: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const open = this.ui.searchOpen();
      untracked(() => {
        if (open) {
          this.returnFocus = this.document.activeElement as HTMLElement | null;
          this.query.set('');
          this.selected.set(0);
          setTimeout(() => this.input()?.nativeElement.focus());
        } else if (this.returnFocus) {
          this.returnFocus.focus?.();
          this.returnFocus = null;
        }
      });
    });
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.selected.set(0);
    this.analytics.search(value, this.results().length, 'site');
  }

  protected onKey(e: KeyboardEvent): void {
    const n = this.results().length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!n) return;
      this.selected.update((i) => (i + (e.key === 'ArrowDown' ? 1 : -1) + n) % n);
      this.document.getElementById('r' + this.selected())?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = this.results()[this.selected()];
      if (hit) {
        this.prepare(hit);
        void this.router.navigate(hit.link, { fragment: hit.fragment });
      }
    }
  }

  /** Called when a result is chosen: remembers what to highlight, then closes. */
  protected prepare(hit: SearchHit): void {
    this.ui.pendingHit.set(
      hit.feature || hit.eco ? { id: hit.fragment ?? '', final: hit.feature?.status === 'final', eco: !!hit.eco } : null,
    );
    this.returnFocus = null;
    this.ui.searchOpen.set(false);
  }

  protected onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.ui.searchOpen.set(false);
  }
}
