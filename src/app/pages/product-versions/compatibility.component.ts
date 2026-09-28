import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { COMPAT } from '../../data/products';
import { absUrl, SeoService } from '../../core/seo.service';
import { VersionTabsComponent } from '../../shared/version-tabs.component';

/** Which Spring Framework, Java, Hibernate, JPA and Spring Data versions each Spring Boot version uses. */
@Component({
  selector: 'app-compatibility',
  imports: [RouterLink, VersionTabsComponent],
  template: `
    <div class="wrap">
      <app-version-tabs active="compat" />
      <header class="prod-head" style="--c1: #3355ff; --c2: #7c4dff">
        <span class="prod-mark" aria-hidden="true">≡</span>
        <div>
          <p class="eyebrow">Compatibility matrix</p>
          <h1>Which versions work together?</h1>
          <p class="lede">
            Spring Boot pins tested versions of the whole stack. Pick your Spring Boot version to see the Spring Framework, minimum Java, platform, Hibernate, JPA
            and Spring Data versions it manages for you.
          </p>
        </div>
      </header>

      <div class="advice">
        <div>
          <h2>Starting a new project?</h2>
          <p>Use Spring Boot {{ rows[0].boot }} on a long-term support Java release (Java 25, or 21). You get Spring Framework {{ rows[0].framework }}, Hibernate {{ rows[0].hibernate }} and Jakarta Persistence {{ rows[0].jpa }} without choosing versions yourself.</p>
        </div>
        <div>
          <h2>On Spring Boot 2.x?</h2>
          <p>Upgrade to 2.7 first, then to 3.x: that jump moves you to Java 17 and from javax.* to jakarta.* packages. From 3.5, moving to 4.x is smaller. The <a routerLink="/versions/spring-boot">Spring Boot upgrade planner</a> lists every change.</p>
        </div>
      </div>

      <div class="table-wrap compat">
        <table class="tbl">
          <caption class="sr">Spring Boot compatibility matrix</caption>
          <thead>
            <tr>
              <th scope="col">Spring Boot</th>
              <th scope="col">Spring Framework</th>
              <th scope="col">Minimum Java</th>
              <th scope="col">Platform</th>
              <th scope="col">Hibernate</th>
              <th scope="col">JPA</th>
              <th scope="col">Spring Data</th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows; track r.boot; let first = $first) {
              <tr [class.hl]="first" [class.gen]="isGenStart(r.boot)">
                <th scope="row"><a routerLink="/versions/spring-boot" [fragment]="'v-' + r.boot">{{ r.boot }}</a></th>
                <td><a routerLink="/versions/spring" [fragment]="'v-' + r.framework">{{ r.framework }}</a></td>
                <td>Java {{ r.java }}</td>
                <td>{{ r.ee }}</td>
                <td>{{ r.hibernate }}</td>
                <td><a routerLink="/versions/jpa" [fragment]="'v-' + r.jpa">{{ r.jpa }}</a></td>
                <td>{{ r.data }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <p class="small-note muted">
        These are the versions each Spring Boot line manages; patch releases can move to a newer minor (shown with →). Check your build’s dependency tree
        (mvn dependency:tree) for the exact patch versions.
      </p>
    </div>
  `,
})
export class CompatibilityComponent {
  protected readonly rows = COMPAT;

  constructor() {
    const seo = inject(SeoService);
    seo.set({
      title: 'Spring Boot compatibility matrix: Java, Spring, Hibernate and JPA versions',
      description:
        'Which Spring Framework, minimum Java, Jakarta EE, Hibernate, JPA and Spring Data versions each Spring Boot version uses, from 1.5 to ' + COMPAT[0].boot + '.',
      path: '/versions/compatibility',
      type: 'article',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: 'Spring Boot compatibility matrix',
          isAccessibleForFree: true,
          ...(absUrl('/versions/compatibility') ? { url: absUrl('/versions/compatibility') } : {}),
        },
        seo.breadcrumbs([
          ['Home', '/'],
          ['Versions', '/versions'],
          ['Compatibility', '/versions/compatibility'],
        ]),
      ],
    });
  }

  protected isGenStart(boot: string): boolean {
    return boot.endsWith('.0');
  }
}
