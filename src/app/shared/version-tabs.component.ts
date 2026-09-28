import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../core/content.service';
import { PRODUCTS } from '../data/products';

/** Switcher between the Java, Spring, Spring Boot, Spring Data JPA, JPA and Hibernate version pages. */
@Component({
  selector: 'app-version-tabs',
  imports: [RouterLink],
  template: `
    <nav class="vhub" aria-label="Version histories">
      <a routerLink="/versions" [attr.aria-current]="active() === 'java' ? 'page' : null" style="--c1: #ff6b1a; --c2: #e11d48">
        <span class="vhub-dot" aria-hidden="true"></span>Java <b>{{ javaLatest }}</b>
      </a>
      @for (p of products; track p.id) {
        <a [routerLink]="['/versions', p.id]" [attr.aria-current]="active() === p.id ? 'page' : null" [style.--c1]="p.c1" [style.--c2]="p.c2">
          <span class="vhub-dot" aria-hidden="true"></span>{{ p.short }} <b>{{ latest(p.id) }}</b>
        </a>
      }
      <a routerLink="/versions/compatibility" [attr.aria-current]="active() === 'compat' ? 'page' : null" style="--c1: #3355ff; --c2: #7c4dff">
        <span class="vhub-dot" aria-hidden="true"></span>Compatibility
      </a>
    </nav>
  `,
})
export class VersionTabsComponent {
  readonly active = input.required<string>();
  protected readonly products = PRODUCTS;
  protected readonly javaLatest = inject(ContentService).latest;

  protected latest(id: string): string {
    return PRODUCTS.find((p) => p.id === id)?.versions.find((v) => v.status === 'latest')?.v ?? '';
  }
}
