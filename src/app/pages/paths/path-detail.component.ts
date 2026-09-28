import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/content.service';
import { hoursText } from '../../core/markup';
import { LEVEL_NAMES } from '../../core/models';
import { ProgressService } from '../../core/progress.service';
import { absUrl, ORGANIZATION, SeoService } from '../../core/seo.service';
import { AdSlotComponent } from '../../shared/ad-slot.component';

@Component({
  selector: 'app-path-detail',
  imports: [RouterLink, AdSlotComponent],
  templateUrl: './path-detail.component.html',
})
export class PathDetailComponent {
  /** Route parameter :id */
  readonly id = input<string>();

  protected readonly content = inject(ContentService);
  protected readonly progress = inject(ProgressService);
  private readonly seo = inject(SeoService);

  protected readonly path = computed(() => this.content.path(this.id()) ?? this.content.paths[0]);
  protected readonly steps = computed(() => {
    const done = this.progress.done();
    const jdk = this.progress.jdk();
    return this.content.pathLessons(this.path()).map((l, i) => ({
      l,
      no: i + 1,
      done: !!done[l.id],
      level: LEVEL_NAMES[l.lvl],
      stage: this.content.stageOf(l).title,
      minutes: this.content.minutes(l),
      need: l.min && l.min > jdk ? l.min : 0,
    }));
  });
  protected readonly doneCount = computed(() => this.steps().filter((s) => s.done).length);
  protected readonly next = computed(() => this.steps().find((s) => !s.done) ?? this.steps()[0]);
  protected readonly time = computed(() => hoursText(this.steps().reduce((sum, s) => sum + s.minutes, 0)));
  protected readonly others = computed(() => this.content.paths.filter((p) => p !== this.path()));

  constructor() {
    effect(() => {
      const p = this.path();
      untracked(() => {
        const path = `/paths/${p.id}`;
        const minutes = this.content.pathLessons(p).reduce((sum, l) => sum + this.content.minutes(l), 0);
        this.seo.set({
          title: `${p.title}: free Java learning path`,
          description: `${p.blurb} ${p.lessons.length} free lessons in order. ${p.outcome}`,
          path,
          jsonLd: [
            {
              '@context': 'https://schema.org',
              '@type': 'Course',
              name: p.title,
              description: `${p.blurb} ${p.outcome}`,
              provider: ORGANIZATION,
              educationalLevel: p.level,
              isAccessibleForFree: true,
              inLanguage: 'en',
              offers: { '@type': 'Offer', price: 0, priceCurrency: 'INR', category: 'Free' },
              hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: `PT${minutes}M` },
              ...(absUrl(path) ? { url: absUrl(path) } : {}),
            },
            this.seo.breadcrumbs([['Home', '/'], ['Learning paths', '/paths'], [p.title, path]]),
          ],
        });
      });
    });
  }
}
