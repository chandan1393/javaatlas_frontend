import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/account.service';
import { errorText } from '../../core/api.service';
import { ContentService } from '../../core/content.service';
import { LearningService } from '../../core/learning.service';
import { Goal } from '../../core/pace';
import { ProgressService } from '../../core/progress.service';
import { SeoService } from '../../core/seo.service';
import { UiService } from '../../core/ui.service';
import { StageIconComponent } from '../../shared/stage-icon.component';
import { BENEFITS } from '../../data/benefits';



const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const SHORT = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });

/** /my/learning: progress, study time, pace and a finish-date planner for the free curriculum. */
@Component({
  selector: 'app-my-learning',
  imports: [RouterLink, StageIconComponent],
  templateUrl: './my-learning.component.html',
})
export class MyLearningComponent {
  protected readonly account = inject(AccountService);
  protected readonly learning = inject(LearningService);
  protected readonly progress = inject(ProgressService);
  protected readonly content = inject(ContentService);
  private readonly ui = inject(UiService);

  protected readonly pace = this.learning.pace;
  protected readonly Math = Math;
  protected readonly benefits = BENEFITS;
  protected readonly firstName = computed(() => (this.account.me()?.name ?? '').trim().split(/\s+/)[0]);
  protected readonly pct = computed(() => (this.pace().total ? Math.round((this.pace().doneCount / this.pace().total) * 100) : 0));

  // Planner (a draft of the goal until saved)
  protected readonly draft = signal<Goal>({ ...this.learning.goal() });
  protected readonly draftPace = computed(() => this.learning.paceFor(this.draft()));
  protected readonly saving = signal(false);
  protected readonly dirty = computed(() => JSON.stringify(this.draft()) !== JSON.stringify(this.learning.goal()));
  protected readonly minDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  protected readonly chart = computed(() => {
    const weeks = this.pace().weeks;
    const goalWeek = this.learning.goal().minutesPerDay * this.learning.goal().daysPerWeek;
    const max = Math.max(60, goalWeek, ...weeks.map((w) => w.minutes));
    return {
      goalY: 100 - (goalWeek / max) * 100,
      bars: weeks.map((w, i) => ({ x: i * (100 / 12), h: (w.minutes / max) * 100, label: SHORT.format(w.start), minutes: w.minutes, current: i === 11 })),
    };
  });

  protected readonly stages = computed(() => {
    const done = this.progress.done();
    return this.content.stages.map((s, i) => {
      const count = s.lessons.filter((l) => done[l.id]).length;
      return { s, no: i + 1, count, pct: Math.round((count / s.lessons.length) * 100), next: s.lessons.find((l) => !done[l.id]) };
    });
  });

  protected readonly recent = computed(() => {
    const at = this.progress.doneAt();
    return Object.entries(at)
      .filter(([, t]) => t > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, t]) => ({ lesson: this.content.lesson(id), when: SHORT.format(new Date(t)) }))
      .filter((r) => !!r.lesson);
  });

  protected readonly next = computed(() => {
    const done = this.progress.done();
    const path = this.content.path(this.learning.goal().pathId);
    const list = path ? this.content.pathLessons(path) : this.content.lessons;
    return list.find((l) => !done[l.id]) ?? null;
  });

  constructor() {
    inject(SeoService).set({ title: 'My learning', description: 'Your Java learning progress and plan.', path: '/my/learning', noindex: true });
    // Keep the planner in step with the saved goal (for example after it loads from the account).
    effect(() => {
      const g = this.learning.goal();
      untracked(() => this.draft.set({ ...g }));
    });
  }

  protected targetText(): string {
    const t = this.learning.goal().targetDate;
    return t ? DATE.format(new Date(t + 'T00:00:00')) : '';
  }

  protected date(d: Date | null): string {
    return d ? DATE.format(d) : '';
  }

  protected hours(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }

  protected setDraft(patch: Partial<Goal>): void {
    this.draft.update((g) => ({ ...g, ...patch }));
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    try {
      await this.learning.saveGoal(this.draft());
      this.ui.toast('Plan saved');
    } catch (e) {
      this.ui.toast(errorText(e));
    } finally {
      this.saving.set(false);
    }
  }

  protected signUp(): void {
    this.ui.auth(null, 'signup', '/my/learning');
  }

  protected logIn(): void {
    this.ui.auth(null, 'login', '/my/learning');
  }
}
