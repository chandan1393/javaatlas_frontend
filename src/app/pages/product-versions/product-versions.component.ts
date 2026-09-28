import { afterNextRender, Component, computed, DOCUMENT, effect, inject, input, signal, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PRODUCTS, ProductVersion } from '../../data/products';
import { absUrl, ORGANIZATION, SeoService } from '../../core/seo.service';
import { AdSlotComponent } from '../../shared/ad-slot.component';
import { VersionTabsComponent } from '../../shared/version-tabs.component';

type Kind = 'n' | 'i' | 'b' | 'd' | 'r';
const KIND_NAMES: Record<Kind, string> = { n: 'New', i: 'Improved', b: 'Breaking', d: 'Deprecated', r: 'Removed' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface ParsedFeature {
  kind: Kind;
  label: string;
  text: string;
  star: boolean;
}

export function parseFeature(s: string): ParsedFeature {
  const kind = s[0] as Kind;
  let text = s.slice(2);
  const star = text.endsWith('|h');
  if (star) text = text.slice(0, -2);
  return { kind, label: KIND_NAMES[kind] ?? 'New', text, star };
}

/** 'YYYY-MM-DD' → '13 Nov 2025', 'YYYY-MM' → 'Nov 2025', 'YYYY' → '2025'. */
export function productDate(d: string): string {
  const [y, m, day] = d.split('-');
  if (!m) return y;
  return `${day ? Number(day) + ' ' : ''}${MONTHS[Number(m) - 1]} ${y}`;
}

/** Version history for one ecosystem product: /versions/spring-boot and friends. */
@Component({
  selector: 'app-product-versions',
  imports: [RouterLink, VersionTabsComponent, AdSlotComponent],
  templateUrl: './product-versions.component.html',
})
export class ProductVersionsComponent {
  /** Route parameter :product */
  readonly product = input<string>();

  private readonly seo = inject(SeoService);
  private readonly document = inject(DOCUMENT);
  protected readonly products = PRODUCTS;
  protected readonly productDate = productDate;
  protected readonly p = computed(() => PRODUCTS.find((x) => x.id === this.product()) ?? PRODUCTS[0]);
  protected readonly released = computed(() => this.p().versions.filter((v) => v.status !== 'planned'));
  protected readonly latest = computed(() => this.p().versions.find((v) => v.status === 'latest') ?? this.released()[0]);
  protected readonly others = computed(() => PRODUCTS.filter((x) => x !== this.p()));

  protected readonly query = signal('');
  protected readonly kind = signal<'all' | Kind>('all');
  protected readonly filters: { key: 'all' | Kind; label: string }[] = [
    { key: 'all', label: 'All changes' },
    { key: 'n', label: 'New' },
    { key: 'i', label: 'Improved' },
    { key: 'b', label: 'Breaking' },
    { key: 'r', label: 'Removed' },
  ];

  protected readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const k = this.kind();
    const filtering = !!q || k !== 'all';
    return this.p()
      .versions.map((v) => ({
        v,
        features: v.f.map(parseFeature).filter((f) => (k === 'all' || f.kind === k || (k === 'r' && f.kind === 'd')) && (!q || f.text.toLowerCase().includes(q) || v.v.startsWith(q))),
      }))
      .filter((r) => !filtering || r.features.length);
  });

  // Upgrade planner
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly plan = computed(() => {
    const list = this.released();
    const toIdx = list.findIndex((v) => v.v === this.to());
    const fromIdx = list.findIndex((v) => v.v === this.from());
    if (toIdx < 0 || fromIdx < 0 || toIdx >= fromIdx) return null;
    const between = list.slice(toIdx, fromIdx); // newest first, excluding "from"
    const groups = between
      .slice()
      .reverse()
      .map((v) => ({ v, features: v.f.map(parseFeature) }))
      .filter((g) => g.features.length);
    const all = groups.flatMap((g) => g.features);
    const javaFrom = list[fromIdx].java;
    const javaTo = list[toIdx].java;
    return {
      groups,
      steps: between.length,
      breaking: all.filter((f) => f.kind === 'b' || f.kind === 'r').length,
      added: all.filter((f) => f.kind === 'n').length,
      javaChange: javaFrom && javaTo && javaFrom !== javaTo ? `Java ${javaFrom} → ${javaTo}` : '',
      eeChange: list[fromIdx].ee && list[toIdx].ee && list[fromIdx].ee !== list[toIdx].ee ? `${list[fromIdx].ee} → ${list[toIdx].ee}` : '',
    };
  });

  constructor() {
    effect(() => {
      const p = this.p();
      untracked(() => {
        const list = p.versions.filter((v) => v.status !== 'planned');
        // Default range: reach back far enough to show a meaningful set of changes.
        let fromIdx = 1;
        let count = list[0]?.f.length ?? 0;
        while (fromIdx < list.length - 1 && count < 10) {
          count += list[fromIdx].f.length;
          fromIdx++;
        }
        this.to.set(list[0]?.v ?? '');
        this.from.set(list[Math.min(fromIdx, list.length - 1)]?.v ?? '');
        this.query.set('');
        this.kind.set('all');
        const latest = p.versions.find((v) => v.status === 'latest');
        const path = `/versions/${p.id}`;
        this.seo.set({
          title: `${p.name} versions: every release and what it added`,
          description: `All ${p.name} releases from ${list[list.length - 1]?.v} to ${latest?.v}: release dates, required Java version, new features, breaking changes and an upgrade planner.`,
          path,
          type: 'article',
          jsonLd: [
            {
              '@context': 'https://schema.org',
              '@type': 'TechArticle',
              headline: `${p.name} version history`,
              about: { '@type': 'SoftwareApplication', name: p.name, softwareVersion: latest?.v, applicationCategory: 'DeveloperApplication' },
              author: ORGANIZATION,
              publisher: ORGANIZATION,
              isAccessibleForFree: true,
              ...(absUrl(path) ? { url: absUrl(path) } : {}),
            },
            this.seo.breadcrumbs([
              ['Home', '/'],
              ['Versions', '/versions'],
              [p.name, path],
            ]),
          ],
        });
      });
    });

    // A search result links here with #v-<version>: scroll to it once rendered.
    const route = inject(ActivatedRoute);
    route.fragment.pipe(takeUntilDestroyed()).subscribe((f) => {
      if (f) setTimeout(() => this.document.getElementById(f)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    });
    afterNextRender(() => {
      const f = route.snapshot.fragment;
      if (f) this.document.getElementById(f)?.scrollIntoView({ block: 'start' });
    });
  }

  protected statusLabel(v: ProductVersion): string {
    return { latest: 'Latest', supported: 'Supported', ended: 'Support ended', planned: 'Planned', past: '' }[v.status];
  }
}
