import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SETTINGS } from '../../app.settings';
import { ApiService, errorText } from '../../core/api.service';
import { ContentService } from '../../core/content.service';
import { SeoService } from '../../core/seo.service';
import { UiService } from '../../core/ui.service';

interface Item {
  id: number;
  createdAt: string;
  type: string;
  rating: number | null;
  helpful: boolean | null;
  reasons: string | null;
  message: string | null;
  name: string | null;
  email: string | null;
  page: string | null;
  lessonId: string | null;
  device: string | null;
  status: string;
  adminNote: string | null;
}
interface Inbox {
  items: Item[];
  total: number;
  counts: Record<string, number | undefined>;
}
interface Summary {
  newCount: number;
  byType: Record<string, number | undefined>;
  avgRating: number | null;
  ratings: number;
  lessons: { lessonId: string; helpful: number; notHelpful: number; reasons: Record<string, number> }[];
}

const TYPE_LABEL: Record<string, string | undefined> = { idea: 'Idea', bug: 'Bug', content: 'Lesson mistake', praise: 'Praise', other: 'Other', lesson: 'Lesson rating' };
const REASON_LABEL: Record<string, string> = {
  unclear: 'Hard to understand',
  mistake: 'Something wrong',
  code: 'Code doesn’t work',
  too_short: 'Not enough detail',
  too_long: 'Too long',
  outdated: 'Out of date',
  other: 'Other',
};
const STATUS_LABEL: Record<string, string> = { NEW: 'New', IN_PROGRESS: 'In progress', RESOLVED: 'Resolved', ARCHIVED: 'Archived', ALL: 'All' };

/** The owner's feedback inbox. */
@Component({
  selector: 'app-admin-feedback',
  imports: [RouterLink],
  templateUrl: './admin-feedback.component.html',
})
export class AdminFeedbackComponent {
  private readonly api = inject(ApiService);
  private readonly content = inject(ContentService);
  private readonly ui = inject(UiService);
  protected readonly typeLabel = TYPE_LABEL;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly statuses = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED', 'ALL'];
  protected readonly status = signal('NEW');
  protected readonly type = signal('');
  protected readonly q = signal('');
  protected readonly page = signal(0);
  protected readonly inbox = signal<Inbox | null>(null);
  protected readonly summary = signal<Summary | null>(null);
  protected readonly open = signal<number | null>(null);
  protected readonly notes = signal<Record<number, string | undefined>>({});
  protected readonly error = signal('');
  protected readonly pages = computed(() => Math.max(1, Math.ceil((this.inbox()?.total ?? 0) / 30)));
  protected readonly lessonRows = computed(() =>
    (this.summary()?.lessons ?? []).map((l) => {
      const total = l.helpful + l.notHelpful;
      const top = Object.entries(l.reasons).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([r, n]) => `${REASON_LABEL[r] ?? r} (${n})`);
      return { ...l, title: this.content.lesson(l.lessonId)?.t ?? l.lessonId, total, pct: total ? Math.round((l.helpful / total) * 100) : 0, top };
    }),
  );
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(SeoService).set({ title: 'Feedback', description: 'Admin.', path: '/admin/feedback', noindex: true });
    void this.load();
    void this.loadSummary();
  }

  protected setStatus(s: string): void {
    this.status.set(s);
    this.page.set(0);
    void this.load();
  }

  protected setType(t: string): void {
    this.type.set(t);
    this.page.set(0);
    void this.load();
  }

  protected search(v: string): void {
    this.q.set(v);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.page.set(0);
      void this.load();
    }, 300);
  }

  protected go(p: number): void {
    this.page.set(p);
    void this.load();
  }

  protected async load(): Promise<void> {
    try {
      const params = new URLSearchParams({ status: this.status(), type: this.type(), q: this.q(), page: String(this.page()) });
      this.inbox.set(await this.api.get<Inbox>(`/api/admin/feedback?${params}`));
      this.error.set('');
    } catch (e) {
      this.error.set(errorText(e));
    }
  }

  protected async loadSummary(): Promise<void> {
    try {
      this.summary.set(await this.api.get<Summary>('/api/admin/feedback/summary'));
    } catch {
      /* the list still works */
    }
  }

  protected toggle(item: Item): void {
    this.open.set(this.open() === item.id ? null : item.id);
    this.notes.update((n) => ({ ...n, [item.id]: n[item.id] ?? item.adminNote ?? '' }));
    if (item.status === 'NEW' && this.open() === item.id) void this.update(item, 'IN_PROGRESS', undefined, true);
  }

  protected async update(item: Item, status?: string, note?: string, quiet = false): Promise<void> {
    try {
      await this.api.put<void>(`/api/admin/feedback/${item.id}`, { status: status ?? null, adminNote: note ?? null });
      if (status) item.status = status;
      if (note !== undefined) item.adminNote = note;
      if (!quiet) this.ui.toast(status ? `Marked as ${STATUS_LABEL[status].toLowerCase()}` : 'Note saved');
      void this.loadSummary();
      if (status && this.status() !== 'ALL' && status !== this.status() && !quiet) void this.load();
      else this.inbox.update((i) => (i ? { ...i } : i));
    } catch (e) {
      this.ui.toast(errorText(e));
    }
  }

  protected async remove(item: Item): Promise<void> {
    if (!confirm('Delete this feedback permanently?')) return;
    try {
      await this.api.delete<void>(`/api/admin/feedback/${item.id}`);
      this.ui.toast('Feedback deleted');
      void this.load();
      void this.loadSummary();
    } catch (e) {
      this.ui.toast(errorText(e));
    }
  }

  protected setNote(id: number, v: string): void {
    this.notes.update((n) => ({ ...n, [id]: v }));
  }

  protected reply(item: Item): string {
    const subject = encodeURIComponent('Re: your JavaAtlas feedback');
    const quote = (item.message ?? '').split('\n').map((l) => '> ' + l).join('\n');
    const body = encodeURIComponent(`Hi ${item.name?.split(' ')[0] ?? 'there'},\n\nThanks for your feedback:\n\n${quote}\n\n`);
    return `mailto:${item.email}?subject=${subject}&body=${body}`;
  }

  protected reasons(r: string | null): string[] {
    return (r ?? '').split(',').filter(Boolean).map((x) => REASON_LABEL[x] ?? x);
  }

  protected lessonTitle(id: string | null): string {
    return id ? (this.content.lesson(id)?.t ?? id) : '';
  }

  protected when(ts: string): string {
    return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }

  protected async exportCsv(): Promise<void> {
    try {
      const res = await fetch(`${SETTINGS.apiBase.replace(/\/+$/, '')}/api/admin/feedback/export`, { credentials: 'include' });
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = 'javaatlas-feedback.csv';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      this.ui.toast('Couldn’t download the CSV. Please try again.');
    }
  }
}
