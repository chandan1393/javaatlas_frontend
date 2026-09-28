import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorText } from '../../core/api.service';
import { CourseApiService } from '../../core/course-api.service';
import { priceText, words } from '../../core/markup';
import { AdminCourse } from '../../core/models';
import { SeoService } from '../../core/seo.service';

/** Every course, section and lecture at a glance, with preview and edit links (including paid content). */
@Component({
  selector: 'app-admin-content',
  imports: [RouterLink],
  template: `
    <header class="adm-head row-between">
      <div>
        <h1>Content</h1>
        <p class="muted">All courses and their lectures, including paid ones. Open any lecture to see exactly what learners see.</p>
      </div>
      <a class="btn btn-primary" routerLink="/admin/courses/new">New course</a>
    </header>
    @if (error()) {
      <p class="err">{{ error() }}</p>
    }
    <div class="adm-filter">
      <input class="field" type="search" placeholder="Search lectures…" [value]="q()" (input)="q.set($any($event.target).value)" />
      <span class="muted">{{ totals().lectures }} lectures, {{ totals().minutes }} min, {{ totals().words }} words in {{ courses()?.length ?? 0 }} courses</span>
    </div>
    @if (!courses()) {
      <p class="muted">Loading…</p>
    }
    @for (c of view(); track c.course.id) {
      <section class="panel cov">
        <div class="cov-head">
          <div>
            <h2>{{ c.course.title }}</h2>
            <p class="muted">
              /courses/{{ c.course.slug }} · {{ priceText(c.course.priceInr) }} · {{ c.course.level }} · {{ c.lectures }} lectures ·
              {{ c.course.enrollments }} students
            </p>
          </div>
          <div class="cov-actions">
            <span class="tag" [class.avail]="c.course.published">{{ c.course.published ? 'Published' : 'Draft' }}</span>
            <a class="btn btn-ghost btn-sm" [routerLink]="['/courses', c.course.slug]" target="_blank">Course page</a>
            <a class="btn btn-primary btn-sm" [routerLink]="['/admin/courses', c.course.id]">Edit</a>
          </div>
        </div>
        @for (s of c.sections; track $index) {
          <h3 class="cov-sec">{{ s.title }}</h3>
          <ul class="cov-list">
            @for (l of s.lectures; track l.id ?? $index) {
              <li>
                <span class="cov-kind" [class.video]="!!l.videoUrl">{{ l.videoUrl ? 'Video' : 'Text' }}</span>
                <span class="cov-title">{{ l.title }}</span>
                @if (l.freePreview) {
                  <span class="tag avail">Free preview</span>
                }
                <span class="muted cov-meta">{{ l.durationMin }} min · {{ wordsOf(l.content) }} words</span>
                @if (l.id) {
                  <a [routerLink]="['/courses', c.course.slug, 'learn', l.id]" target="_blank">Preview</a>
                }
              </li>
            }
          </ul>
        }
      </section>
    }
  `,
})
export class AdminContentComponent {
  private readonly api = inject(CourseApiService);
  protected readonly priceText = priceText;
  protected readonly courses = signal<AdminCourse[] | null>(null);
  protected readonly error = signal('');
  protected readonly q = signal('');

  protected readonly view = computed(() => {
    const q = this.q().trim().toLowerCase();
    return (this.courses() ?? []).map((course) => {
      const sections = course.sections
        .map((s) => ({ title: s.title, lectures: s.lectures.filter((l) => !q || l.title.toLowerCase().includes(q) || course.title.toLowerCase().includes(q)) }))
        .filter((s) => s.lectures.length);
      return { course, sections, lectures: course.sections.reduce((n, s) => n + s.lectures.length, 0) };
    }).filter((c) => c.sections.length || !q);
  });
  protected readonly totals = computed(() => {
    const all = (this.courses() ?? []).flatMap((c) => c.sections.flatMap((s) => s.lectures));
    return { lectures: all.length, minutes: all.reduce((n, l) => n + l.durationMin, 0), words: all.reduce((n, l) => n + words(l.content ?? ''), 0) };
  });

  constructor() {
    inject(SeoService).set({ title: 'Content', description: 'Admin.', path: '/admin/content', noindex: true });
    void this.api.adminCourses().then((c) => this.courses.set(c)).catch((e) => this.error.set(errorText(e)));
  }

  protected wordsOf(t: string | null): number {
    return words(t ?? '');
  }
}
