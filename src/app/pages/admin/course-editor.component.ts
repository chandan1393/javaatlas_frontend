import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../core/account.service';
import { errorText } from '../../core/api.service';
import { CourseApiService } from '../../core/course-api.service';
import { slugify } from '../../core/markup';
import { AdminCourse, AdminLecture, AdminSection } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { SeoService } from '../../core/seo.service';
import { HasUnsavedChanges } from '../../core/admin.guard';
import { MdEditorComponent } from '../../shared/md-editor.component';
import { LectureVideoComponent } from '../../shared/lecture-video.component';

const blankCourse = (): AdminCourse => ({
  id: null,
  slug: '',
  title: '',
  subtitle: '',
  description: '',
  outcomes: [],
  level: 'Beginner',
  priceInr: 0,
  published: false,
  sortOrder: 10,
  sections: [{ id: null, title: 'Getting started', lectures: [blankLecture()] }],
  enrollments: 0,
});

function blankLecture(): AdminLecture {
  return { id: null, title: '', durationMin: 10, freePreview: false, videoUrl: null, content: '' };
}

/** Create or edit a course: details, sections and lectures. Saved all at once. */
@Component({
  selector: 'app-course-editor',
  imports: [FormsModule, RouterLink, MdEditorComponent, LectureVideoComponent],
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
  templateUrl: './course-editor.component.html',
})
export class CourseEditorComponent implements HasUnsavedChanges {
  /** Route parameter :id (absent for /admin/courses/new) */
  readonly id = input<string>();

  protected readonly account = inject(AccountService);
  private readonly api = inject(CourseApiService);
  private readonly ui = inject(UiService);
  private readonly router = inject(Router);

  protected draft: AdminCourse | null = null;
  protected outcomesText = '';
  protected slugTouched = false;
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  private snapshot = '';

  constructor() {
    inject(SeoService).set({ title: 'Edit course', description: 'Your JavaAtlas account.', path: '/admin', noindex: true });
    effect(() => {
      const id = this.id();
      const admin = this.account.isAdmin();
      if (!admin) return;
      untracked(() => void this.load(id));
    });
  }

  hasUnsavedChanges(): boolean {
    return !!this.draft && !this.saving() && this.serialize() !== this.snapshot;
  }

  protected onBeforeUnload(e: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) e.preventDefault();
  }

  protected stats(): { lectures: number; minutes: number; previews: number; videos: number } {
    const all = this.draft?.sections.flatMap((s) => s.lectures) ?? [];
    return {
      lectures: all.length,
      minutes: all.reduce((n, l) => n + (Number(l.durationMin) || 0), 0),
      previews: all.filter((l) => l.freePreview).length,
      videos: all.filter((l) => !!l.videoUrl).length,
    };
  }

  /** Same patterns the lecture player accepts. */
  protected videoOk(url: string | null): boolean {
    const u = (url ?? '').trim();
    return (
      /^https:\/\//.test(u) &&
      (/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{11}/.test(u) ||
        /vimeo\.com\/(?:video\/)?\d+/.test(u) ||
        /^https:\/\/iframe\.mediadelivery\.net\/(?:embed|play)\/\d+\/[\w-]+/.test(u) ||
        /\.(mp4|webm)(\?.*)?$/i.test(u))
    );
  }

  private serialize(): string {
    return JSON.stringify(this.draft) + '\u0000' + this.outcomesText;
  }

  protected titleChanged(): void {
    if (this.draft && !this.draft.id && !this.slugTouched) this.draft.slug = slugify(this.draft.title);
  }

  protected addSection(): void {
    this.draft?.sections.push({ id: null, title: '', lectures: [blankLecture()] });
  }

  protected addLecture(section: AdminSection): void {
    section.lectures.push(blankLecture());
  }

  protected move<T>(list: T[], index: number, by: number): void {
    const target = index + by;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
  }

  protected remove<T>(list: T[], index: number, what: string): void {
    if (confirm(`Remove this ${what}? This takes effect when you save.`)) list.splice(index, 1);
  }

  protected async save(): Promise<void> {
    const d = this.draft;
    if (!d || this.saving()) return;
    this.error.set('');
    this.saving.set(true);
    const payload: AdminCourse = {
      ...d,
      slug: d.slug.trim(),
      outcomes: this.outcomesText.split('\n').map((s) => s.trim()).filter(Boolean),
      sections: d.sections.map((s) => ({
        ...s,
        lectures: s.lectures.map((l) => ({ ...l, videoUrl: l.videoUrl?.trim() ? l.videoUrl.trim() : null })),
      })),
    };
    try {
      const saved = await this.api.saveCourse(payload);
      this.setDraft(saved);
      this.ui.toast('Course saved');
      void this.account.refreshCatalog().catch(() => undefined);
      if (!d.id) void this.router.navigate(['/admin/courses', saved.id], { replaceUrl: true });
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.saving.set(false);
    }
  }

  protected async deleteCourse(): Promise<void> {
    const d = this.draft;
    if (!d?.id || !confirm(`Delete “${d.title}” permanently?`)) return;
    try {
      await this.api.deleteCourse(d.id);
      this.snapshot = this.serialize();
      this.ui.toast('Course deleted');
      void this.account.refreshCatalog().catch(() => undefined);
      void this.router.navigateByUrl('/admin');
    } catch (e) {
      this.error.set(errorText(e));
    }
  }

  private async load(id: string | undefined): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.setDraft(id && id !== 'new' ? await this.api.adminCourse(Number(id)) : blankCourse());
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.loading.set(false);
    }
  }

  private setDraft(c: AdminCourse): void {
    this.draft = structuredClone(c);
    this.outcomesText = c.outcomes.join('\n');
    this.slugTouched = !!c.id;
    this.snapshot = this.serialize();
  }
}
