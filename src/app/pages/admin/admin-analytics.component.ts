import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SETTINGS } from '../../app.settings';
import { ApiService, errorText } from '../../core/api.service';
import { ContentService } from '../../core/content.service';
import { PRODUCTS } from '../../data/products';
import { SeoService } from '../../core/seo.service';

interface Kpis {
  visitors: number;
  pageviews: number;
  searches: number;
  signups: number;
  orders: number;
  revenuePaise: number;
  aiQuestions: number;
  lessonCompletions: number;
  studyMinutes: number;
  activeLearners: number;
}
interface Count {
  key: string;
  count: number;
  visitors: number;
}
interface Report {
  days: number;
  timezone: string;
  current: Kpis;
  previous: Kpis;
  activeNow: number;
  activePages: Count[];
  daily: { day: string; visitors: number; pageviews: number; searches: number; signups: number; orders: number; revenuePaise: number }[];
  pages: Count[];
  referrers: Count[];
  campaigns: Count[];
  devices: Count[];
  countries: Count[];
  searches: { query: string; count: number; results: number | null }[];
  noResults: { query: string; count: number; results: number | null }[];
  funnel: { step: string; count: number }[];
  hours: Count[];
  aiTools: Count[];
  completions: Count[];
  courses: { slug: string; title: string; views: number; orders: number; revenuePaise: number }[];
}

const STATIC: Record<string, string> = {
  '/': 'Home',
  '/learn': 'Learn',
  '/topics': 'All topics',
  '/paths': 'Learning paths',
  '/versions': 'Java versions',
  '/versions/compatibility': 'Compatibility matrix',
  '/interview': 'Interview questions',
  '/courses': 'Courses',
  '/ai': 'AI Lab',
  '/my/learning': 'My learning',
  '/my/courses': 'My courses',
  '/my/orders': 'Orders',
  '/about': 'About',
  '/contact': 'Contact',
  '/privacy': 'Privacy',
  '/terms': 'Terms',
  '/refunds': 'Refunds',
};
const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const NUM = new Intl.NumberFormat('en-IN');

/** The owner's analytics: visitors, searches, sign-ups, revenue and learning, from the site's own database. */
@Component({
  selector: 'app-admin-analytics',
  imports: [RouterLink],
  templateUrl: './admin-analytics.component.html',
})
export class AdminAnalyticsComponent {
  private readonly api = inject(ApiService);
  private readonly content = inject(ContentService);
  protected readonly ranges = [
    { days: 1, label: 'Today' },
    { days: 7, label: '7 days' },
    { days: 30, label: '30 days' },
    { days: 90, label: '90 days' },
  ];
  protected readonly days = signal(30);
  protected readonly report = signal<Report | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly num = (n: number) => NUM.format(n);
  protected readonly Math = Math;
  protected readonly inr = (paise: number) => INR.format(paise / 100);

  protected readonly kpis = computed(() => {
    const r = this.report();
    if (!r) return [];
    const c = r.current;
    const p = r.previous;
    const conv = (k: Kpis) => (k.visitors ? (k.signups / k.visitors) * 100 : 0);
    return [
      { label: 'Visitors', value: this.num(c.visitors), cur: c.visitors, prev: p.visitors, hint: 'Unique per day' },
      { label: 'Page views', value: this.num(c.pageviews), cur: c.pageviews, prev: p.pageviews, hint: c.visitors ? (c.pageviews / c.visitors).toFixed(1) + ' per visitor' : '' },
      { label: 'Searches', value: this.num(c.searches), cur: c.searches, prev: p.searches, hint: 'On the site' },
      { label: 'Sign-ups', value: this.num(c.signups), cur: c.signups, prev: p.signups, hint: conv(c).toFixed(1) + '% of visitors' },
      { label: 'Paid orders', value: this.num(c.orders), cur: c.orders, prev: p.orders, hint: '' },
      { label: 'Revenue', value: this.inr(c.revenuePaise), cur: c.revenuePaise, prev: p.revenuePaise, hint: c.orders ? this.inr(c.revenuePaise / c.orders) + ' per order' : '' },
      { label: 'Lessons completed', value: this.num(c.lessonCompletions), cur: c.lessonCompletions, prev: p.lessonCompletions, hint: '' },
      { label: 'AI questions', value: this.num(c.aiQuestions), cur: c.aiQuestions, prev: p.aiQuestions, hint: '' },
      { label: 'Study time', value: Math.round(c.studyMinutes / 60) + ' h', cur: c.studyMinutes, prev: p.studyMinutes, hint: c.activeLearners + ' signed-in learners' },
    ].map((k) => ({ ...k, change: change(k.cur, k.prev) }));
  });

  /** Traffic chart: visitors (area) and page views (line), scaled to a 100×40 viewBox. */
  protected readonly traffic = computed(() => {
    const d = this.report()?.daily ?? [];
    const max = Math.max(1, ...d.map((x) => x.pageviews));
    const step = d.length > 1 ? 100 / (d.length - 1) : 100;
    const y = (v: number) => 38 - (v / max) * 34;
    const pts = (key: 'visitors' | 'pageviews') => d.map((x, i) => `${(i * step).toFixed(2)},${y(x[key]).toFixed(2)}`);
    const v = pts('visitors');
    return {
      area: d.length ? `M0,38 L${v.join(' L')} L100,38 Z` : '',
      visitors: v.join(' '),
      pageviews: pts('pageviews').join(' '),
      max,
      labels: d.length ? [d[0].day, d[Math.floor(d.length / 2)].day, d[d.length - 1].day].map(short) : [],
      dots: d.map((x, i) => ({ x: i * step, y: y(x.visitors), title: `${short(x.day)}: ${x.visitors} visitors, ${x.pageviews} page views` })),
    };
  });

  protected readonly business = computed(() => {
    const d = this.report()?.daily ?? [];
    const maxS = Math.max(1, ...d.map((x) => x.signups));
    const maxR = Math.max(1, ...d.map((x) => x.revenuePaise));
    const w = 100 / Math.max(1, d.length);
    return d.map((x, i) => ({
      x: i * w,
      w: Math.max(0.6, w - 0.8),
      s: (x.signups / maxS) * 36,
      r: (x.revenuePaise / maxR) * 36,
      title: `${short(x.day)}: ${x.signups} sign-ups, ${x.orders} orders, ${this.inr(x.revenuePaise)}`,
    }));
  });

  protected readonly funnel = computed(() => {
    const f = this.report()?.funnel ?? [];
    const top = Math.max(1, f[0]?.count ?? 1);
    return f.map((s, i) => ({ ...s, pct: (s.count / top) * 100, fromPrev: i > 0 && f[i - 1].count && s.count <= f[i - 1].count ? Math.round((s.count / f[i - 1].count) * 100) : null }));
  });

  protected readonly hours = computed(() => {
    const h = this.report()?.hours ?? [];
    const max = Math.max(1, ...h.map((x) => x.count));
    const peak = h.reduce((a, b) => (b.count > a.count ? b : a), h[0] ?? { key: '0', count: 0, visitors: 0 });
    return { bars: h.map((x) => ({ hour: +x.key, pct: (x.count / max) * 100, count: x.count })), peak: +peak.key };
  });

  protected readonly deviceTotal = computed(() => (this.report()?.devices ?? []).reduce((n, d) => n + d.visitors, 0) || 1);
  protected readonly empty = computed(() => {
    const r = this.report();
    return !!r && r.current.pageviews === 0 && r.previous.pageviews === 0;
  });

  constructor() {
    inject(SeoService).set({ title: 'Analytics', description: 'Admin.', path: '/admin/analytics', noindex: true });
    void this.load();
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') void this.load(true);
    }, 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected setRange(days: number): void {
    this.days.set(days);
    void this.load();
  }

  protected async load(quiet = false): Promise<void> {
    if (!quiet) this.loading.set(true);
    try {
      this.report.set(await this.api.get<Report>(`/api/admin/analytics?days=${this.days()}`));
      this.error.set('');
    } catch (e) {
      if (!quiet) this.error.set(errorText(e));
    } finally {
      this.loading.set(false);
    }
  }

  protected async exportCsv(): Promise<void> {
    try {
      const res = await fetch(`${SETTINGS.apiBase.replace(/\/+$/, '')}/api/admin/analytics/export?days=${this.days()}`, { credentials: 'include' });
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `javaatlas-analytics-${this.days()}-days.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      this.error.set('Couldn’t download the CSV. Please try again.');
    }
  }

  /** Human title for a page path. */
  protected title(path: string): string {
    if (STATIC[path]) return STATIC[path];
    let m = path.match(/^\/learn\/([a-z0-9-]+)/);
    if (m) return this.content.lesson(m[1])?.t ?? path;
    m = path.match(/^\/paths\/([a-z0-9-]+)/);
    if (m) return this.content.path(m[1])?.title ?? path;
    m = path.match(/^\/versions\/([a-z0-9-]+)/);
    if (m) return (PRODUCTS.find((p) => p.id === m![1])?.name ?? m[1]) + ' versions';
    m = path.match(/^\/courses\/([a-z0-9-]+)(\/learn)?/);
    if (m) return (m[2] ? 'Lecture: ' : 'Course: ') + m[1].replace(/-/g, ' ');
    return path;
  }

  protected bar(n: number, list: Count[], key: 'count' | 'visitors' = 'count'): number {
    const max = Math.max(1, ...list.map((x) => x[key]));
    return (n / max) * 100;
  }

  protected tool(k: string): string {
    return ({ tutor: 'Lesson tutor and assistant', explain: 'Explain code', review: 'Review code', error: 'Fix an error', modernize: 'Modernize', interview: 'Mock interview', quiz: 'Quiz', plan: 'Study plan' } as Record<string, string>)[k] ?? k;
  }

  protected hourLabel(h: number): string {
    return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'am' : 'pm'}`;
  }
}

function change(cur: number, prev: number): { text: string; dir: 'up' | 'down' | 'flat' | 'new' } {
  if (!prev) return cur ? { text: 'new', dir: 'new' } : { text: '–', dir: 'flat' };
  const pct = Math.round(((cur - prev) / prev) * 100);
  return { text: `${pct > 0 ? '+' : ''}${pct}%`, dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' };
}

function short(day: string): string {
  return new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
