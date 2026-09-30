import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService, errorText } from '../../core/api.service';
import { priceText } from '../../core/markup';

interface CourseTemplate {
  slug: string;
  title: string;
  subtitle: string;
  level: string;
  priceInr: number;
  sections: number;
  lectures: number;
  minutes: number;
  freePreviews: number;
  outcomes: string[];
  existingCourseId: number | null;
}

/** Ready-made course outlines (backend CourseCatalog) that the owner can add as drafts, record and publish. */
@Component({
  selector: 'app-admin-templates',
  imports: [RouterLink],
  template: `
    <header class="adm-head">
      <h1>Course templates</h1>
      <p class="muted">
        Ready-made, text-based paid courses with a full syllabus and an outline for every lecture, including
        interactive labs. Adding one creates an <strong>unpublished draft</strong>: write the lessons, then publish.
      </p>
    </header>

    <section class="panel tpl-guide" aria-labelledby="tpl-guide-h">
      <h2 id="tpl-guide-h">Before you publish a course</h2>
      <ol>
        <li>Expand each lecture's outline into the full lesson text in the course editor (start with the free previews).</li>
        <li>Add interactive labs where they help: put a line such as <code>::lab threads:race</code> in the lecture text.
          Labs: hashmap, threads, memory, threadpool, stream and array (see the README for every preset).</li>
        <li>Put the finished project code on GitHub and link it in the first lecture.</li>
        <li>Check the price, the "who it's for" text and the outcomes.</li>
        <li>Read the free previews as a visitor would; they decide most purchases.</li>
        <li>Publish. Learners can get a refund within the refund window if the course isn't right for them.</li>
      </ol>
    </section>

    @if (error()) {
      <p class="err" role="alert">{{ error() }}</p>
    }
    @if (!templates()) {
      <p class="muted">Loading…</p>
    }

    <div class="tpl-grid">
      @for (t of templates() ?? []; track t.slug) {
        <article class="panel tpl">
          <div class="tpl-top">
            <span class="tag">{{ t.level }}</span>
            <strong class="tpl-price">{{ priceText(t.priceInr) }}</strong>
          </div>
          <h2>{{ t.title }}</h2>
          <p class="muted">{{ t.subtitle }}</p>
          <p class="tpl-meta">{{ t.sections }} sections · {{ t.lectures }} lectures · {{ hours(t.minutes) }} · {{ t.freePreviews }} free previews</p>
          <ul class="tpl-outcomes">
            @for (o of t.outcomes.slice(0, 4); track o) {
              <li>{{ o }}</li>
            }
          </ul>
          <div class="tpl-actions">
            @if (t.existingCourseId) {
              <span class="tag avail">Added</span>
              <a class="btn btn-ghost btn-sm" [routerLink]="['/admin/courses', t.existingCourseId]">Open in the editor</a>
            } @else {
              <button type="button" class="btn btn-primary btn-sm" (click)="add(t)" [disabled]="busy() === t.slug">
                {{ busy() === t.slug ? 'Adding…' : 'Add as draft' }}
              </button>
            }
          </div>
        </article>
      }
    </div>
  `,
})
export class AdminTemplatesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly templates = signal<CourseTemplate[] | null>(null);
  protected readonly error = signal('');
  protected readonly busy = signal('');
  protected readonly priceText = priceText;

  async ngOnInit(): Promise<void> {
    try {
      this.templates.set(await this.api.get<CourseTemplate[]>('/api/admin/course-templates'));
    } catch (e) {
      this.error.set(errorText(e));
      this.templates.set([]);
    }
  }

  protected hours(minutes: number): string {
    const h = Math.round((minutes / 60) * 10) / 10;
    return `${h} hours`;
  }

  protected async add(t: CourseTemplate): Promise<void> {
    this.busy.set(t.slug);
    this.error.set('');
    try {
      const added = await this.api.post<{ id: number; slug: string }>(`/api/admin/course-templates/${t.slug}`);
      void this.router.navigate(['/admin/courses', added.id]);
    } catch (e) {
      this.error.set(errorText(e));
      this.busy.set('');
    }
  }
}
