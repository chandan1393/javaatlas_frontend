import { Component, computed, DestroyRef, DOCUMENT, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ContentService } from '../../core/content.service';
import { fmtDate } from '../../core/markup';
import { Feature, FeatType, TYPE_NAMES, VersionEntry } from '../../core/models';
import { ProgressService } from '../../core/progress.service';
import { UiService } from '../../core/ui.service';
import { ORGANIZATION, SeoService, absUrl } from '../../core/seo.service';
import { AdSlotComponent } from '../../shared/ad-slot.component';
import { VersionTabsComponent } from '../../shared/version-tabs.component';
import { CodeBlockComponent } from '../../shared/code-block.component';

type TypeFilter = 'all' | FeatType;

@Component({
  selector: 'app-versions',
  imports: [CodeBlockComponent, AdSlotComponent, VersionTabsComponent],
  templateUrl: './versions.component.html',
})
export class VersionsComponent {
  protected readonly content = inject(ContentService);
  protected readonly progress = inject(ProgressService);
  private readonly ui = inject(UiService);
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly fmtDate = fmtDate;
  protected readonly typeNames = TYPE_NAMES;
  protected readonly typeKeys = Object.keys(TYPE_NAMES) as FeatType[];
  protected readonly typeFilters: { key: TypeFilter; name: string }[] = [
    { key: 'all', name: 'All' },
    { key: 'l', name: 'Language' },
    { key: 'a', name: 'APIs' },
    { key: 'j', name: 'JVM and GC' },
    { key: 't', name: 'Tools' },
    { key: 's', name: 'Security' },
    { key: 'x', name: 'Removed' },
  ];
  protected readonly options = [...this.content.pickable].reverse();
  protected readonly latestYear = this.content.released[this.content.released.length - 1].date.slice(0, 4);
  protected readonly ecoNewestFirst = [...this.content.eco].reverse();

  protected readonly tab = signal<'java' | 'eco'>('java');
  protected readonly query = signal('');
  protected readonly type = signal<TypeFilter>('all');
  protected readonly previews = signal(false);
  protected readonly hitId = computed(() => this.ui.pendingHit()?.id ?? null);

  // Upgrade planner: "from" follows My JDK until the learner picks something.
  private readonly fromPick = signal<number | null>(null);
  private readonly toPick = signal<number | null>(null);
  protected readonly from = computed(() => this.fromPick() ?? this.progress.jdk());
  protected readonly to = computed(
    () => this.toPick() ?? (this.progress.jdk() < this.content.latestLts ? this.content.latestLts : this.content.latest),
  );

  protected readonly plan = computed(() => {
    const a = this.from();
    const b = this.to();
    if (b <= a) return null;
    const all = this.content.featuresBetween(a, b);
    const finished = all.filter((f) => f.status === 'final' && f.type !== 'x');
    return {
      releases: this.content.released.filter((v) => v.n > a && v.n <= b).length,
      lts: this.content.lts.filter((n) => n > a && n <= b),
      finishedCount: finished.length,
      groups: (['l', 'a', 'j', 't', 's'] as FeatType[])
        .map((t) => ({ type: t, name: TYPE_NAMES[t], items: finished.filter((f) => f.type === t) }))
        .filter((g) => g.items.length),
      removed: all.filter((f) => f.type === 'x'),
    };
  });

  protected readonly timeline = computed(() => {
    const q = this.query().trim().toLowerCase();
    const type = this.type();
    const previews = this.previews();
    const filtering = !!q || type !== 'all';
    const visible = (f: Feature) => {
      if (!previews && f.status !== 'final') return false;
      if (type !== 'all' && f.type !== type) return false;
      if (q) {
        const hay = (f.text + ' ' + TYPE_NAMES[f.type] + ' ' + f.tag).toLowerCase();
        if (!q.split(/\s+/).every((t) => hay.includes(t))) return false;
      }
      return true;
    };
    const rows: { v: VersionEntry; feats: Feature[]; note: string }[] = [];
    for (const v of [...this.content.versions].reverse()) {
      const all = this.content.features(v);
      const feats = all.filter(visible);
      if (!feats.length) {
        if (filtering) continue;
        const pre = all.filter((f) => f.status !== 'final').length;
        rows.push({ v, feats, note: `No finished features in this release; it only previewed or incubated ${pre} features. Turn on “Include previews and incubators” to see them.` });
        continue;
      }
      rows.push({ v, feats, note: '' });
    }
    const featureCount = rows.reduce((n, r) => n + r.feats.length, 0);
    return { rows, filtering, featureCount };
  });

  protected readonly countText = computed(() => {
    const t = this.timeline();
    if (!t.filtering) return `${this.content.released.length} releases since 1996, newest first.`;
    return `${t.featureCount} matching feature${t.featureCount === 1 ? '' : 's'} in ${t.rows.length} version${t.rows.length === 1 ? '' : 's'}.`;
  });

  constructor() {
    const seo = inject(SeoService);
    seo.set({
      title: `Every Java version and what it added (Java 1.0 to ${this.content.latest})`,
      description: `All Java releases from JDK 1.0 to Java ${this.content.latest}: release dates, LTS versions, new features, removals, and an upgrade planner showing what you gain between any two versions.`,
      path: '/versions',
      type: 'article',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: 'Every Java version and what it added',
          about: { '@type': 'Thing', name: 'Java version history' },
          author: ORGANIZATION,
          publisher: ORGANIZATION,
          isAccessibleForFree: true,
          ...(absUrl('/versions') ? { url: absUrl('/versions') } : {}),
        },
        seo.breadcrumbs([['Home', '/'], ['Java versions', '/versions']]),
      ],
    });
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.ui.pendingHit.set(null));
    // A search result was chosen: make sure it's visible, then scroll to it.
    inject(ActivatedRoute)
      .fragment.pipe(takeUntilDestroyed())
      .subscribe((fragment) => {
        const hit = this.ui.pendingHit();
        if (hit) {
          this.tab.set(hit.eco ? 'eco' : 'java');
          this.query.set('');
          this.type.set('all');
          if (!hit.final && !hit.eco) this.previews.set(true);
        }
        if (fragment && this.browser) {
          setTimeout(() => this.document.getElementById(fragment)?.scrollIntoView({ block: hit ? 'center' : 'start' }), 60);
        }
      });
  }

  protected setFrom(value: string): void {
    this.fromPick.set(Number(value));
  }

  protected setTo(value: string): void {
    this.toPick.set(Number(value));
  }

  protected tags(v: VersionEntry): { text: string; cls: string }[] {
    const jdk = this.progress.jdk();
    const tags: { text: string; cls: string }[] = [];
    if (v.lts) tags.push({ text: 'LTS', cls: 'lts' });
    if (v.planned) tags.push({ text: 'Targeted, may change', cls: 'newer' });
    else if (v.n === jdk) tags.push({ text: 'Your JDK', cls: 'yours' });
    else if (v.n < jdk) tags.push({ text: 'Available to you', cls: 'avail' });
    else tags.push({ text: 'Newer than your JDK', cls: 'newer' });
    return tags;
  }
}
