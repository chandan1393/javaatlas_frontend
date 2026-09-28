import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/content.service';
import { ProgressService } from '../../core/progress.service';
import { UiService } from '../../core/ui.service';
import { SeoService } from '../../core/seo.service';
import { AdSlotComponent } from '../../shared/ad-slot.component';

@Component({
  selector: 'app-interview',
  imports: [RouterLink, AdSlotComponent],
  templateUrl: './interview.component.html',
})
export class InterviewComponent {
  protected readonly content = inject(ContentService);
  protected readonly progress = inject(ProgressService);
  private readonly ui = inject(UiService);

  protected readonly stageFilter = signal<string>('all');
  protected readonly showAll = signal(false);
  private readonly opened = signal<ReadonlySet<string>>(new Set());
  private readonly order = signal<string[] | null>(null);

  protected readonly cards = computed(() => {
    const filter = this.stageFilter();
    const known = this.progress.known();
    const opened = this.opened();
    const showAll = this.showAll();
    let list = this.content.questions.filter((q) => filter === 'all' || this.content.stageOf(q.lesson).id === filter);
    const order = this.order();
    if (order) {
      const pos = new Map(order.map((id, i) => [id, i]));
      list = [...list].sort((a, b) => (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0));
    }
    return list.map((q) => ({ q, known: !!known[q.id], open: showAll || opened.has(q.id) }));
  });
  protected readonly knownCount = computed(() => this.cards().filter((c) => c.known).length);

  protected toggle(id: string, isOpen: boolean): void {
    if (isOpen && this.showAll()) {
      // Hiding one card while "show all" is on: switch to per-card mode with the others still open.
      this.opened.set(new Set(this.content.questions.map((q) => q.id).filter((x) => x !== id)));
      this.showAll.set(false);
      return;
    }
    this.opened.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected toggleAll(): void {
    this.showAll.update((v) => !v);
    if (!this.showAll()) this.opened.set(new Set());
  }

  protected shuffle(): void {
    const ids = this.content.questions.map((q) => q.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    this.order.set(ids);
    this.ui.toast('Cards shuffled');
  }

  constructor() {
    const seo = inject(SeoService);
    const qs = this.content.questions;
    seo.set({
      title: `${qs.length} Java interview questions and answers`,
      description: `${qs.length} Java interview questions with clear answers: core Java, collections, HashMap, concurrency, JVM, JPA, Spring Boot and microservices. Practise as flashcards, free.`,
      path: '/interview',
      jsonLd: [seo.faq(qs.slice(0, 50).map((q) => [q.q, q.a] as [string, string])), seo.breadcrumbs([['Home', '/'], ['Interview questions', '/interview']])],
    });
  }
}
