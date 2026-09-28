import { Component, computed, effect, inject, input, PLATFORM_ID, signal, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/account.service';
import { errorText } from '../../core/api.service';
import { CheckoutService } from '../../core/checkout.service';
import { CourseApiService } from '../../core/course-api.service';
import { hoursText, priceText, richText } from '../../core/markup';
import { VideoComponent } from '../../shared/video.component';
import { CourseDetail } from '../../core/models';
import { absUrl, ORGANIZATION, SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-course-detail',
  imports: [RouterLink, VideoComponent],
  templateUrl: './course-detail.component.html',
})
export class CourseDetailComponent {
  /** Route parameter :slug */
  readonly slug = input.required<string>();

  protected readonly account = inject(AccountService);
  private readonly api = inject(CourseApiService);
  private readonly checkout = inject(CheckoutService);
  private readonly seo = inject(SeoService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly course = signal<CourseDetail | null>(null);
  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly error = signal('');
  protected readonly priceText = priceText;
  protected readonly hoursText = hoursText;

  protected readonly enrolled = computed(() => !!this.course()?.enrolled || this.account.enrolled().has(this.slug()));
  protected readonly descriptionHtml = computed(() => richText(this.course()?.description ?? ''));
  protected readonly done = computed(() => new Set(this.course()?.completedLectureIds ?? []));
  protected readonly previewCount = computed(() => this.course()?.sections.flatMap((s) => s.lectures).filter((l) => l.freePreview).length ?? 0);
  protected readonly firstPreview = computed(() => this.course()?.sections.flatMap((s) => s.lectures).find((l) => l.freePreview) ?? null);

  constructor() {
    // Load (and reload after logging in or out, so "enrolled" is right).
    effect(() => {
      const slug = this.slug();
      this.account.me();
      if (!this.browser) return;
      untracked(() => void this.load(slug));
    });
  }

  protected enroll(): void {
    const c = this.course();
    if (c) this.checkout.enroll(c);
  }

  private async load(slug: string): Promise<void> {
    if (!this.course() || this.course()?.slug !== slug) this.state.set('loading');
    try {
      const c = await this.api.detail(slug);
      this.course.set(c);
      this.state.set('ready');
      const lectures = c.sections.flatMap((sec) => sec.lectures);
      const minutes = lectures.reduce((sum, l) => sum + (l.durationMin ?? 0), 0);
      this.seo.set({
        title: c.title,
        description: `${c.subtitle}. ${c.description}`,
        path: `/courses/${c.slug}`,
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: c.title,
            description: c.description || c.subtitle,
            provider: ORGANIZATION,
            educationalLevel: c.level,
            inLanguage: 'en',
            offers: { '@type': 'Offer', price: c.priceInr, priceCurrency: 'INR', category: c.priceInr ? 'Paid' : 'Free' },
            hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: `PT${minutes}M` },
            ...(absUrl('/courses/' + c.slug) ? { url: absUrl('/courses/' + c.slug) } : {}),
          },
          this.seo.breadcrumbs([['Home', '/'], ['Courses', '/courses'], [c.title, `/courses/${c.slug}`]]),
        ],
      });
    } catch (e) {
      this.error.set(errorText(e));
      this.state.set('error');
    }
  }
}
