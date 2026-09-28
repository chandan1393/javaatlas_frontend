import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ContentService } from './content.service';
import { Depth } from './models';

const KEY = 'javaatlas:v1';
type Flags = Record<string, 1>;

/**
 * Learner state kept in this browser only (no account needed):
 * completed lessons, known flashcards, chosen JDK, depth, last lesson and theme.
 * Loaded after the first render so prerendered HTML and the browser agree during hydration.
 */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly content = inject(ContentService);

  readonly done = signal<Flags>({});
  readonly known = signal<Flags>({});
  readonly jdk = signal<number>(this.content.latestLts);
  readonly depth = signal<Depth>('developer');
  readonly last = signal<string | null>(null);
  readonly theme = signal<'light' | 'dark' | null>(null);
  readonly loaded = signal(false);
  /** When each lesson was completed (epoch ms), for pace estimates. */
  readonly doneAt = signal<Record<string, number>>({});
  /** Active study seconds per local date (YYYY-MM-DD). */
  readonly days = signal<Record<string, number>>({});

  readonly doneCount = computed(() => Object.keys(this.done()).length);

  constructor() {
    effect(() => {
      const snapshot = {
        done: this.done(),
        known: this.known(),
        jdk: this.jdk(),
        depth: this.depth(),
        last: this.last(),
        theme: this.theme(),
        doneAt: this.doneAt(),
        days: this.days(),
      };
      if (!this.browser || !this.loaded()) return;
      try {
        localStorage.setItem(KEY, JSON.stringify(snapshot));
      } catch {
        /* storage full or blocked: progress just isn't saved */
      }
    });
  }

  load(): void {
    if (!this.browser || this.loaded()) return;
    try {
      const raw = localStorage.getItem(KEY);
      const o = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
      if (o && typeof o === 'object') {
        if (o['done'] && typeof o['done'] === 'object') this.done.set(o['done'] as Flags);
        if (o['known'] && typeof o['known'] === 'object') this.known.set(o['known'] as Flags);
        if (typeof o['jdk'] === 'number' && this.content.pickable.includes(o['jdk'])) this.jdk.set(o['jdk']);
        if (o['depth'] === 'beginner' || o['depth'] === 'developer' || o['depth'] === 'interview') this.depth.set(o['depth']);
        if (typeof o['last'] === 'string') this.last.set(o['last']);
        if (o['theme'] === 'light' || o['theme'] === 'dark') this.theme.set(o['theme']);
        if (o['doneAt'] && typeof o['doneAt'] === 'object') this.doneAt.set(o['doneAt'] as Record<string, number>);
        if (o['days'] && typeof o['days'] === 'object') this.days.set(o['days'] as Record<string, number>);
      }
    } catch {
      /* unreadable storage: start fresh */
    }
    this.loaded.set(true);
  }

  setJdk(n: number): void {
    if (this.content.pickable.includes(n)) this.jdk.set(n);
  }

  /** Returns true if the lesson is now complete. */
  toggleDone(id: string): boolean {
    this.done.update((d) => toggle(d, id));
    const now = !!this.done()[id];
    this.doneAt.update((m) => {
      const next = { ...m };
      if (now) next[id] = Date.now();
      else delete next[id];
      return next;
    });
    return now;
  }

  addStudySeconds(seconds: number, day = localDay()): void {
    this.days.update((d) => {
      const next = { ...d, [day]: Math.min(16 * 3600, (d[day] ?? 0) + seconds) };
      // Keep about a year of history.
      const keys = Object.keys(next).sort();
      for (const k of keys.slice(0, Math.max(0, keys.length - 400))) delete next[k];
      return next;
    });
  }

  /** Replaces progress with a merged copy (after syncing with the account). */
  applyMerged(done: Record<string, number>, days: Record<string, number>): void {
    const flags: Flags = {};
    for (const id of Object.keys(done)) flags[id] = 1;
    this.done.set(flags);
    this.doneAt.set(done);
    this.days.set(days);
  }

  toggleKnown(id: string): void {
    this.known.update((k) => toggle(k, id));
  }
}

function toggle(flags: Flags, id: string): Flags {
  const next = { ...flags };
  if (next[id]) delete next[id];
  else next[id] = 1;
  return next;
}

/** Today's date in the learner's own time zone, as YYYY-MM-DD. */
export function localDay(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
