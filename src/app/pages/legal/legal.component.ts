import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SETTINGS } from '../../app.settings';
import { LEGAL } from '../../data/legal';
import { md } from '../../core/markup';
import { SeoService } from '../../core/seo.service';

/** About, Privacy, Terms, Refunds and Contact. The page key comes from the route's data. */
@Component({
  selector: 'app-legal',
  imports: [RouterLink],
  template: `
    <div class="wrap">
      <article class="legal">
        <h1>{{ doc().title }}</h1>
        <p class="legal-intro">{{ doc().intro }}</p>
        @for (s of sections(); track s.h) {
          <section>
            <h2>{{ s.h }}</h2>
            <div class="prose" [innerHTML]="s.html"></div>
          </section>
        }
        <p class="legal-foot">
          Questions? Email <a [href]="'mailto:' + email">{{ email }}</a>.
          See also:
          @for (l of links; track l[0]; let last = $last) {
            <a [routerLink]="l[0]">{{ l[1] }}</a>{{ last ? '.' : ', ' }}
          }
        </p>
      </article>
    </div>
  `,
})
export class LegalComponent {
  /** Route data: page */
  readonly page = input<string>('about');
  protected readonly email = SETTINGS.business.email;
  protected readonly doc = computed(() => LEGAL[this.page()] ?? LEGAL['about']);
  protected readonly sections = computed(() => this.doc().sections.map((s) => ({ h: s.h, html: md(s.body) })));
  protected readonly links = [
    ['/about', 'About'],
    ['/contact', 'Contact'],
    ['/privacy', 'Privacy'],
    ['/terms', 'Terms'],
    ['/refunds', 'Refunds'],
  ];

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const d = this.doc();
      const page = this.page();
      untracked(() => seo.set({ title: d.title, description: d.description, path: `/${page}` }));
    });
  }
}
