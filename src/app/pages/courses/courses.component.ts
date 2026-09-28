import { Component, effect, inject, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/account.service';
import { hoursText, priceText } from '../../core/markup';
import { absUrl, ORGANIZATION, SeoService } from '../../core/seo.service';

const GLYPHS: Record<string, string> = { Beginner: '{ }', Intermediate: '@Get', Advanced: 'SQL' };

@Component({
  selector: 'app-courses',
  imports: [RouterLink],
  templateUrl: './courses.component.html',
})
export class CoursesComponent {
  protected readonly account = inject(AccountService);
  protected readonly priceText = priceText;
  protected readonly hoursText = hoursText;

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const courses = this.account.courses();
      untracked(() =>
        seo.set({
          title: 'Java, Spring Boot and JPA courses',
          description: 'Project-based Java courses: Spring Boot REST APIs, JPA performance and interview preparation. Free previews, pay once with UPI, cards or net banking.',
          path: '/courses',
          jsonLd: [
            {
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              itemListElement: courses.map((c, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: {
                  '@type': 'Course',
                  name: c.title,
                  description: c.subtitle,
                  provider: ORGANIZATION,
                  ...(absUrl('/courses/' + c.slug) ? { url: absUrl('/courses/' + c.slug) } : {}),
                },
              })),
            },
          ],
        }),
      );
    });
  }

  protected glyph(level: string): string {
    return GLYPHS[level] ?? '{ }';
  }
}
