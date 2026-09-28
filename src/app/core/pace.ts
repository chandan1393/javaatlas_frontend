import { LearningPath } from '../data/paths';
import { Lesson } from './models';
import { localDay } from './progress.service';

/** Estimated study minutes for a lesson: reading plus trying the code and the quiz (at least 15). */
export function studyMinutes(readingMinutes: number): number {
  return Math.max(15, Math.round(readingMinutes * 3));
}

export interface Goal {
  minutesPerDay: number;
  daysPerWeek: number;
  pathId: string | null;
  targetDate: string | null;
}

export interface PaceInput {
  lessons: Lesson[];
  minutes: (l: Lesson) => number;
  path: LearningPath | undefined;
  done: Record<string, number>;
  days: Record<string, number>;
  goal: Goal;
  today?: Date;
}

export interface Scenario {
  minutesPerDay: number;
  finish: Date;
}

export interface Pace {
  targetLabel: string;
  total: number;
  doneCount: number;
  remaining: number;
  remainingMinutes: number;
  /** How the learner compares with our per-lesson estimate (1 = as estimated), once there's enough data. */
  personalFactor: number | null;
  recentMinutesPerWeek: number;
  activeDaysPerWeek: number;
  lessonsPerWeek: number;
  paceFinish: Date | null;
  goalFinish: Date | null;
  neededMinutesPerDay: number | null;
  status: 'ahead' | 'behind' | 'on-track' | null;
  streak: number;
  thisWeekMinutes: number;
  totalMinutes: number;
  weeks: { start: Date; minutes: number }[];
  scenarios: Scenario[];
  complete: boolean;
}

const DAY = 86_400_000;

export function computePace(i: PaceInput): Pace {
  const today = startOfDay(i.today ?? new Date());
  const target = i.path ? i.lessons.filter((l) => i.path!.lessons.includes(l.id)) : i.lessons;
  const done = target.filter((l) => i.done[l.id] !== undefined);
  const left = target.filter((l) => i.done[l.id] === undefined);

  const secondsOn = (d: Date) => i.days[localDay(d)] ?? 0;
  const lastDays = (n: number) => Array.from({ length: n }, (_, k) => new Date(today.getTime() - k * DAY));

  // Recent pace: last 28 days.
  const recent = lastDays(28);
  const recentSeconds = recent.reduce((s, d) => s + secondsOn(d), 0);
  const activeDays = recent.filter((d) => secondsOn(d) >= 120).length;
  const recentMinutesPerWeek = Math.round(recentSeconds / 60 / 4);
  const activeDaysPerWeek = Math.round((activeDays / 4) * 10) / 10;
  const since = today.getTime() - 27 * DAY;
  const lessonsPerWeek = Math.round((Object.values(i.done).filter((t) => t >= since).length / 4) * 10) / 10;

  // Personal factor: actual study time vs estimate, once enough lessons are done with time recorded.
  const totalSeconds = Object.values(i.days).reduce((a, b) => a + b, 0);
  const allDone = i.lessons.filter((l) => i.done[l.id] !== undefined);
  const estDone = allDone.reduce((s, l) => s + studyMinutes(i.minutes(l)), 0);
  let personalFactor: number | null = null;
  if (allDone.length >= 5 && totalSeconds >= 3600 && estDone > 0) {
    personalFactor = clamp(totalSeconds / 60 / estDone, 0.5, 3);
  }
  const factor = personalFactor ?? 1;
  const remainingMinutes = Math.round(left.reduce((s, l) => s + studyMinutes(i.minutes(l)), 0) * factor);

  const finishAt = (minutesPerWeek: number) => (minutesPerWeek > 0 ? new Date(today.getTime() + Math.ceil((remainingMinutes / minutesPerWeek) * 7) * DAY) : null);
  const paceFinish = recentMinutesPerWeek >= 15 && left.length ? finishAt(recentMinutesPerWeek) : null;
  const goalPerWeek = i.goal.minutesPerDay * i.goal.daysPerWeek;
  const goalFinish = left.length ? finishAt(goalPerWeek) : null;

  let neededMinutesPerDay: number | null = null;
  let status: Pace['status'] = null;
  if (i.goal.targetDate && left.length) {
    const target = startOfDay(new Date(i.goal.targetDate + 'T00:00:00'));
    const studyDays = Math.max(1, Math.floor(((target.getTime() - today.getTime()) / DAY) * (i.goal.daysPerWeek / 7)));
    neededMinutesPerDay = Math.ceil(remainingMinutes / studyDays);
    const expected = paceFinish ?? goalFinish;
    if (expected) {
      const diff = (expected.getTime() - target.getTime()) / DAY;
      status = diff <= -7 ? 'ahead' : diff <= 3 ? 'on-track' : 'behind';
    }
  }

  // Streak: consecutive days (ending today, or yesterday if today hasn't started) with study or a finished lesson.
  const completedDays = new Set(Object.values(i.done).map((t) => localDay(new Date(t))));
  const activeOn = (d: Date) => secondsOn(d) >= 120 || completedDays.has(localDay(d));
  let streak = 0;
  let cursor = activeOn(today) ? today : new Date(today.getTime() - DAY);
  while (activeOn(cursor)) {
    streak++;
    cursor = new Date(cursor.getTime() - DAY);
  }

  const monday = startOfWeek(today);
  const weeks = Array.from({ length: 12 }, (_, k) => {
    const start = new Date(monday.getTime() - (11 - k) * 7 * DAY);
    let seconds = 0;
    for (let d = 0; d < 7; d++) seconds += secondsOn(new Date(start.getTime() + d * DAY));
    return { start, minutes: Math.round(seconds / 60) };
  });

  const scenarios = [15, 30, 45, 60, 90].map((m) => ({ minutesPerDay: m, finish: finishAt(m * i.goal.daysPerWeek)! })).filter((s) => !!s.finish);

  return {
    targetLabel: i.path ? i.path.title : 'All lessons',
    total: target.length,
    doneCount: done.length,
    remaining: left.length,
    remainingMinutes,
    personalFactor,
    recentMinutesPerWeek,
    activeDaysPerWeek,
    lessonsPerWeek,
    paceFinish,
    goalFinish,
    neededMinutesPerDay,
    status,
    streak,
    thisWeekMinutes: weeks[weeks.length - 1].minutes,
    totalMinutes: Math.round(totalSeconds / 60),
    weeks,
    scenarios,
    complete: target.length > 0 && left.length === 0,
  };
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7; // Monday = 0
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
