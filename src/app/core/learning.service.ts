import { computed, DOCUMENT, effect, inject, Injectable, PLATFORM_ID, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SETTINGS } from '../app.settings';
import { AccountService } from './account.service';
import { ApiService } from './api.service';
import { ContentService } from './content.service';
import { computePace, Goal } from './pace';
import { localDay, ProgressService } from './progress.service';
import { AnalyticsService } from './analytics.service';

interface LearningData {
  completed: { lessonId: string; completedAt: string | null }[];
  days: { day: string; seconds: number }[];
  goal: { minutesPerDay: number; daysPerWeek: number; pathId: string | null; targetDate: string | null };
}

const GOAL_KEY = 'javaatlas:goal';
const IDLE_MS = 90_000;
const TICK_MS = 5_000;
const FLUSH_SECONDS = 60;

/**
 * Keeps free-lesson progress in the learner's account when they're signed in: merges progress made in this
 * browser on sign-in, saves every completed lesson, and records active study time for pace estimates.
 * Signed-out learners keep everything in this browser, exactly as before.
 */
@Injectable({ providedIn: 'root' })
export class LearningService {
  private readonly api = inject(ApiService);
  private readonly account = inject(AccountService);
  private readonly progress = inject(ProgressService);
  private readonly content = inject(ContentService);
  private readonly document = inject(DOCUMENT);
  private readonly analytics = inject(AnalyticsService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly base = SETTINGS.apiBase.replace(/\/+$/, '');

  readonly signedIn = computed(() => !!this.account.me());
  /** Email of the account whose progress is loaded (null until synced). */
  readonly syncedFor = signal<string | null>(null);
  readonly syncing = signal(false);
  readonly goal = signal<Goal>({ minutesPerDay: 30, daysPerWeek: 5, pathId: null, targetDate: null });

  readonly pace = computed(() =>
    computePace({
      lessons: this.content.lessons,
      minutes: (l) => this.content.minutes(l),
      path: this.content.path(this.goal().pathId),
      done: this.doneMap(),
      days: this.progress.days(),
      goal: this.goal(),
    }),
  );

  /** Pace for a different goal (used by the planner preview). */
  paceFor(goal: Goal) {
    return computePace({
      lessons: this.content.lessons,
      minutes: (l) => this.content.minutes(l),
      path: this.content.path(goal.pathId),
      done: this.doneMap(),
      days: this.progress.days(),
      goal,
    });
  }

  private pendingSeconds = 0;
  private lastInteraction = 0;
  private timer: ReturnType<typeof setInterval> | undefined;
  private tracking = 0;

  constructor() {
    if (!this.browser) return;
    try {
      const g = JSON.parse(localStorage.getItem(GOAL_KEY) ?? 'null');
      if (g && typeof g.minutesPerDay === 'number') this.goal.set({ ...this.goal(), ...g });
    } catch {
      /* ignore */
    }
    // Sign-in → merge this browser's progress with the account (once per account).
    effect(() => {
      const me = this.account.me();
      const loaded = this.progress.loaded();
      untracked(() => {
        if (!me) {
          this.syncedFor.set(null);
          return;
        }
        if (loaded && this.syncedFor() !== me.email && me.role !== 'ADMIN') void this.sync(me.email);
      });
    });
    const mark = () => (this.lastInteraction = Date.now());
    for (const ev of ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove']) {
      this.document.addEventListener(ev, mark, { passive: true, capture: true });
    }
    this.document.addEventListener('visibilitychange', () => {
      if (this.document.visibilityState === 'hidden') this.flush(true);
    });
    this.document.defaultView?.addEventListener('pagehide', () => this.flush(true));
  }

  /** Marks a free lesson complete or not, locally and (when signed in) in the account. */
  toggleDone(lessonId: string): boolean {
    const now = this.progress.toggleDone(lessonId);
    if (now) this.analytics.event('lesson_complete', `/learn/${lessonId}`);
    if (this.syncedFor()) {
      const url = `/api/me/learning/lessons/${encodeURIComponent(lessonId)}`;
      void (now ? this.api.put<void>(url, {}) : this.api.delete<void>(url)).catch(() => undefined);
    }
    return now;
  }

  async saveGoal(goal: Goal): Promise<void> {
    this.goal.set(goal);
    try {
      localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
    } catch {
      /* ignore */
    }
    if (this.syncedFor()) await this.api.put('/api/me/learning/goal', goal);
  }

  /** Call when a lesson or lecture opens; returns a function to call when it closes. */
  startStudyTimer(): () => void {
    if (!this.browser) return () => undefined;
    this.tracking++;
    this.lastInteraction = Date.now();
    this.timer ??= setInterval(() => this.tick(), TICK_MS);
    return () => {
      this.tracking = Math.max(0, this.tracking - 1);
      if (!this.tracking) {
        clearInterval(this.timer);
        this.timer = undefined;
        this.flush(true);
      }
    };
  }

  private tick(): void {
    const active = this.document.visibilityState === 'visible' && Date.now() - this.lastInteraction < IDLE_MS;
    if (!active) return;
    this.pendingSeconds += TICK_MS / 1000;
    this.progress.addStudySeconds(TICK_MS / 1000);
    if (this.pendingSeconds >= FLUSH_SECONDS) this.flush(false);
  }

  /** Sends collected study time to the account (keepalive, so it survives closing the tab). */
  private flush(leaving: boolean): void {
    const seconds = Math.min(300, Math.round(this.pendingSeconds));
    if (seconds < (leaving ? 5 : FLUSH_SECONDS) || !this.syncedFor()) {
      if (!this.syncedFor()) this.pendingSeconds = 0; // signed out: already saved in this browser
      return;
    }
    this.pendingSeconds = 0;
    try {
      void fetch(`${this.base}/api/me/learning/time`, {
        method: 'POST',
        credentials: 'include',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: localDay(), seconds }),
      }).catch(() => undefined);
    } catch {
      /* ignore */
    }
  }

  private async sync(email: string): Promise<void> {
    if (this.syncing()) return;
    this.syncing.set(true);
    try {
      const doneAt = this.doneMap();
      const days = this.progress.days();
      const data = await this.api.post<LearningData>('/api/me/learning/sync', {
        completed: Object.entries(doneAt).map(([lessonId, t]) => ({ lessonId, completedAt: t > 0 ? new Date(t).toISOString() : null })),
        days: Object.entries(days)
          .filter(([, s]) => s > 0)
          .slice(-365)
          .map(([day, seconds]) => ({ day, seconds: Math.round(seconds) })),
      });
      const mergedDone: Record<string, number> = { ...doneAt };
      for (const c of data.completed) {
        const t = c.completedAt ? Date.parse(c.completedAt) : Date.now();
        mergedDone[c.lessonId] = Math.min(mergedDone[c.lessonId] ?? t, t);
      }
      const mergedDays: Record<string, number> = { ...days };
      for (const d of data.days) mergedDays[d.day] = Math.max(mergedDays[d.day] ?? 0, d.seconds);
      this.progress.applyMerged(mergedDone, mergedDays);
      if (data.goal) this.goal.set({ ...data.goal });
      this.syncedFor.set(email);
    } catch {
      /* offline or signed out meanwhile: keep local progress */
    } finally {
      this.syncing.set(false);
    }
  }

  /** Completed lessons with a completion time (0 when unknown, for progress saved before dates were recorded). */
  private doneMap(): Record<string, number> {
    const at = this.progress.doneAt();
    const out: Record<string, number> = {};
    for (const id of Object.keys(this.progress.done())) out[id] = at[id] ?? 0;
    return out;
  }
}
