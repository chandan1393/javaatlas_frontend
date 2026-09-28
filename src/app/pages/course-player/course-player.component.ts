import { Component, DOCUMENT, DestroyRef, PLATFORM_ID, afterNextRender, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../core/account.service';
import { errorText, isApiError } from '../../core/api.service';
import { CheckoutService } from '../../core/checkout.service';
import { CourseApiService } from '../../core/course-api.service';
import { priceText, richText } from '../../core/markup';
import { CourseDetail, LectureView } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { VideoComponent } from '../../shared/video.component';
import { SeoService } from '../../core/seo.service';
import { LearningService } from '../../core/learning.service';

/** Watch/read a course lecture by lecture, with progress. */
@Component({
  selector: 'app-course-player',
  imports: [RouterLink, VideoComponent],
  templateUrl: './course-player.component.html',
  host: { '(document:keydown.escape)': 'closeDrawer()' },
})
export class CoursePlayerComponent {
  /** Route parameters :slug and optional :lectureId */
  readonly slug = input.required<string>();
  readonly lectureId = input<string>();

  protected readonly account = inject(AccountService);
  private readonly api = inject(CourseApiService);
  private readonly checkout = inject(CheckoutService);
  private readonly ui = inject(UiService);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly learningSvc = inject(LearningService);
  private readonly destroyRefStudy = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly course = signal<CourseDetail | null>(null);
  protected readonly courseError = signal('');
  protected readonly lecture = signal<LectureView | null>(null);
  protected readonly lectureState = signal<'loading' | 'ready' | 'locked' | 'error'>('loading');
  protected readonly lectureError = signal('');
  protected readonly completed = signal<ReadonlySet<number>>(new Set());
  protected readonly saving = signal(false);
  protected readonly drawerOpen = signal(false);
  protected readonly priceText = priceText;

  protected readonly enrolled = computed(() => !!this.course()?.enrolled || this.account.enrolled().has(this.slug()));
  protected readonly flat = computed(() => this.course()?.sections.flatMap((s) => s.lectures) ?? []);
  protected readonly currentId = computed(() => Number(this.lectureId() ?? 0));
  protected readonly current = computed(() => this.flat().find((l) => l.id === this.currentId()) ?? null);
  protected readonly prev = computed(() => this.flat()[this.flat().findIndex((l) => l.id === this.currentId()) - 1] ?? null);
  protected readonly next = computed(() => {
    const i = this.flat().findIndex((l) => l.id === this.currentId());
    return i >= 0 ? (this.flat()[i + 1] ?? null) : null;
  });
  protected readonly contentHtml = computed(() => richText(this.lecture()?.content ?? ''));
  protected readonly doneCount = computed(() => this.flat().filter((l) => this.completed().has(l.id)).length);
  protected readonly pct = computed(() => (this.flat().length ? Math.round((this.doneCount() / this.flat().length) * 100) : 0));

  constructor() {
    afterNextRender(() => this.destroyRefStudy.onDestroy(this.learningSvc.startStudyTimer()));
    // Course outline: load on open, and again after logging in/out.
    effect(() => {
      const slug = this.slug();
      this.account.me();
      if (!this.browser) return;
      untracked(() => void this.loadCourse(slug));
    });

    // Lecture: load when the URL changes or access changes (e.g. just enrolled).
    effect(() => {
      const slug = this.slug();
      const id = this.lectureId();
      const course = this.course();
      this.enrolled();
      if (!this.browser || !course) return;
      untracked(() => {
        this.drawerOpen.set(false);
        if (!id) this.openStartingLecture(course);
        else void this.loadLecture(slug, Number(id));
      });
    });
  }

  protected enroll(): void {
    const c = this.course();
    if (c) this.checkout.enroll(c);
  }

  protected isLocked(id: number, freePreview: boolean): boolean {
    return !this.enrolled() && !freePreview && id !== this.currentId();
  }

  protected async toggleComplete(): Promise<void> {
    const lec = this.lecture();
    if (!lec || this.saving()) return;
    const done = !this.completed().has(lec.id);
    this.saving.set(true);
    try {
      await this.api.setProgress(lec.id, done);
      this.completed.update((s) => {
        const n = new Set(s);
        if (done) n.add(lec.id);
        else n.delete(lec.id);
        return n;
      });
      if (done && this.doneCount() === this.flat().length) this.ui.toast('Course complete. Well done!');
    } catch (e) {
      this.ui.toast(errorText(e));
    } finally {
      this.saving.set(false);
    }
  }

  protected openDrawer(): void {
    this.drawerOpen.set(true);
  }

  protected closeDrawer(): void {
    if (!this.drawerOpen()) return;
    this.drawerOpen.set(false);
    this.document.querySelector<HTMLElement>('.side-toggle')?.focus();
  }

  private async loadCourse(slug: string): Promise<void> {
    try {
      const c = await this.api.detail(slug);
      this.course.set(c);
      this.completed.set(new Set(c.completedLectureIds));
      this.courseError.set('');
    } catch (e) {
      this.courseError.set(errorText(e));
    }
  }

  private openStartingLecture(course: CourseDetail): void {
    const all = course.sections.flatMap((s) => s.lectures);
    const done = new Set(course.completedLectureIds);
    const target = this.enrolled()
      ? (all.find((l) => !done.has(l.id)) ?? all[0])
      : (all.find((l) => l.freePreview) ?? all[0]);
    if (target) void this.router.navigate(['/courses', course.slug, 'learn', target.id], { replaceUrl: true });
  }

  private async loadLecture(slug: string, id: number): Promise<void> {
    if (this.lecture()?.id !== id) this.lectureState.set('loading');
    try {
      const lec = await this.api.lecture(slug, id);
      this.lecture.set(lec);
      this.lectureState.set('ready');
      this.seo.set({ title: `${lec.title} | ${this.course()?.title ?? 'Course'}`, description: lec.title, path: `/courses/${slug}`, noindex: true });
      this.document.defaultView?.scrollTo(0, 0);
    } catch (e) {
      this.lecture.set(null);
      if (isApiError(e) && e.status === 403) this.lectureState.set('locked');
      else {
        this.lectureError.set(errorText(e));
        this.lectureState.set('error');
      }
    }
  }
}
