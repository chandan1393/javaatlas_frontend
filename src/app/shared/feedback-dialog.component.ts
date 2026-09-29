import { Component, DOCUMENT, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UiService } from '../core/ui.service';
import { FeedbackFormComponent } from './feedback-form.component';

/** The feedback dialog (opened from the side tab, the footer or the account menu), plus the side tab itself. */
@Component({
  selector: 'app-feedback-dialog',
  imports: [FeedbackFormComponent],
  host: { '(document:keydown.escape)': 'close()' },
  template: `
    @if (!hidden()) {
      <button type="button" class="fb-tab" (click)="ui.feedback.set('any')" aria-haspopup="dialog">Feedback</button>
    }
    @if (ui.feedback(); as t) {
      <div class="modal" (click)="onBackdrop($event)">
        <div class="sheet fb-sheet" role="dialog" aria-modal="true" aria-labelledby="fbTitle" #sheet tabindex="-1">
          <button type="button" class="x" (click)="close()" aria-label="Close">×</button>
          <h2 id="fbTitle">Help us improve JavaAtlas</h2>
          <p class="for">Ideas, problems, mistakes in a lesson or kind words: every message is read by the person who builds this site.</p>
          <app-feedback-form [initialType]="t" [lessonId]="lessonId()" />
        </div>
      </div>
    }
  `,
})
export class FeedbackDialogComponent {
  protected readonly ui = inject(UiService);
  private readonly document = inject(DOCUMENT);
  private readonly sheet = viewChild<ElementRef<HTMLElement>>('sheet');
  private readonly url = signal('');
  protected readonly lessonId = computed(() => {
    this.ui.feedback();
    return /^\/learn\/([a-z0-9-]+)/.exec(this.document.location?.pathname ?? '')?.[1] ?? null;
  });

  constructor() {
    inject(Router)
      .events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe((e) => {
        this.url.set(e.urlAfterRedirects);
        this.ui.feedback.set(null);
      });
    effect(() => {
      if (this.ui.feedback()) untracked(() => setTimeout(() => this.sheet()?.nativeElement.focus()));
    });
  }

  /** The side tab is hidden in the admin area and on the feedback page itself. */
  protected hidden(): boolean {
    return /^\/(admin|feedback)/.test(this.url() || this.document.location?.pathname || '');
  }

  protected close(): void {
    this.ui.feedback.set(null);
  }

  protected onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.close();
  }
}
