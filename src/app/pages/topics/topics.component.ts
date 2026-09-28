import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/content.service';
import { Level, LEVEL_NAMES } from '../../core/models';
import { ProgressService } from '../../core/progress.service';
import { absUrl, SeoService } from '../../core/seo.service';
import { AdSlotComponent } from '../../shared/ad-slot.component';
import { StageIconComponent } from '../../shared/stage-icon.component';

type LevelFilter = 'all' | Level;

@Component({
  selector: 'app-topics',
  imports: [RouterLink, AdSlotComponent, StageIconComponent],
  templateUrl: './topics.component.html',
})
export class TopicsComponent {
  protected readonly content = inject(ContentService);
  protected readonly progress = inject(ProgressService);
  protected readonly levelNames = LEVEL_NAMES;
  protected readonly level = signal<LevelFilter>('all');
  protected readonly query = signal('');
  protected readonly filters: { key: LevelFilter; label: string }[] = [
    { key: 'all', label: 'All levels' },
    { key: 'B', label: 'Beginner' },
    { key: 'I', label: 'Intermediate' },
    { key: 'A', label: 'Advanced' },
  ];

  protected readonly groups = computed(() => {
    const lvl = this.level();
    const q = this.query().trim().toLowerCase();
    return this.content.stages
      .map((stage, i) => ({
        stage,
        no: i + 1,
        items: stage.lessons.filter(
          (l) => (lvl === 'all' || l.lvl === lvl) && (!q || l.t.toLowerCase().includes(q) || (l.subs ?? []).some((st) => st.t.toLowerCase().includes(q))),
        ),
      }))
      .filter((g) => g.items.length);
  });
  protected readonly shown = computed(() => this.groups().reduce((n, g) => n + g.items.length, 0));

  constructor() {
    const seo = inject(SeoService);
    const lessons = this.content.lessons;
    seo.set({
      title: 'All Java topics: the complete Java tutorial list',
      description: `Every Java topic in one place: ${lessons.length} free lessons and ${this.content.subtopicCount} subtopics from variables and OOP to collections, streams, concurrency, JPA, Spring Boot and microservices, sorted by level.`,
      path: '/topics',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Java topics',
          numberOfItems: lessons.length,
          itemListElement: lessons.map((l, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: l.t,
            ...(absUrl(`/learn/${l.id}`) ? { url: absUrl(`/learn/${l.id}`) } : {}),
          })),
        },
        seo.breadcrumbs([['Home', '/'], ['Java topics', '/topics']]),
      ],
    });
  }
}
