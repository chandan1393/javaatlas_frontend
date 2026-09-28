import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/content.service';
import { hoursText } from '../../core/markup';
import { ProgressService } from '../../core/progress.service';
import { absUrl, SeoService } from '../../core/seo.service';
import { AdSlotComponent } from '../../shared/ad-slot.component';

@Component({
  selector: 'app-paths',
  imports: [RouterLink, AdSlotComponent],
  templateUrl: './paths.component.html',
})
export class PathsComponent {
  protected readonly content = inject(ContentService);
  protected readonly progress = inject(ProgressService);

  protected readonly cards = computed(() => {
    const done = this.progress.done();
    return this.content.paths.map((p) => {
      const lessons = this.content.pathLessons(p);
      const count = lessons.filter((l) => done[l.id]).length;
      return {
        p,
        lessons,
        done: count,
        pct: Math.round((count / lessons.length) * 100),
        time: hoursText(lessons.reduce((sum, l) => sum + this.content.minutes(l), 0)),
        next: lessons.find((l) => !done[l.id]) ?? lessons[0],
      };
    });
  });

  constructor() {
    const seo = inject(SeoService);
    seo.set({
      title: 'Java learning paths for every level',
      description: 'Step-by-step Java learning paths: Java from zero, job-ready backend developer, interview preparation, upgrading from Java 8, and microservices. Free.',
      path: '/paths',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Java learning paths',
          itemListElement: this.content.paths.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: p.title,
            ...(absUrl(`/paths/${p.id}`) ? { url: absUrl(`/paths/${p.id}`) } : {}),
          })),
        },
        seo.breadcrumbs([['Home', '/'], ['Learning paths', '/paths']]),
      ],
    });
  }
}
