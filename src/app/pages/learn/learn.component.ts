import { Component, DOCUMENT, DestroyRef, ElementRef, PLATFORM_ID, afterNextRender, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContentService } from '../../core/content.service';
import { md, plain } from '../../core/markup';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ORGANIZATION, SeoService, absUrl } from '../../core/seo.service';
import { LearningService } from '../../core/learning.service';
import { LessonFeedbackComponent } from '../../shared/lesson-feedback.component';
import { HashmapLabComponent } from '../../shared/hashmap-lab.component';
import { AdSlotComponent } from '../../shared/ad-slot.component';
import { StageIconComponent } from '../../shared/stage-icon.component';
import { DEFAULT_STAGE_STYLE, STAGE_STYLE } from '../../data/stage-style';
import { DEPTHS, Lesson, LEVEL_NAMES, SHOW } from '../../core/models';
import { ProgressService } from '../../core/progress.service';
import { UiService } from '../../core/ui.service';
import { CodeBlockComponent } from '../../shared/code-block.component';
import { TutorPanelComponent } from './tutor-panel.component';

@Component({
  selector: 'app-learn',
  imports: [RouterLink, CodeBlockComponent, TutorPanelComponent, AdSlotComponent, StageIconComponent, LessonFeedbackComponent, HashmapLabComponent],
  templateUrl: './learn.component.html',
  host: { '(document:keydown.escape)': 'closeDrawer()' },
})
export class LearnComponent {
  /** Route parameter :id (bound by withComponentInputBinding). */
  readonly id = input<string>();

  protected readonly content = inject(ContentService);
  protected readonly progress = inject(ProgressService);
  private readonly ui = inject(UiService);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  protected readonly learning = inject(LearningService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly depths = DEPTHS;
  protected readonly total = this.content.lessons.length;
  protected readonly lesson = computed(() => this.content.lesson(this.id()) ?? this.content.lessons[0]);
  protected readonly stage = computed(() => this.content.stageOf(this.lesson()));
  protected readonly stageNo = computed(() => this.content.stageNo(this.stage()));
  protected readonly stageStyle = computed(() => STAGE_STYLE[this.stage().id] ?? DEFAULT_STAGE_STYLE);
  protected readonly position = computed(() => this.stage().lessons.indexOf(this.lesson()) + 1);
  protected readonly prev = computed(() => this.content.lessons[this.content.indexOf(this.lesson()) - 1]);
  protected readonly next = computed(() => this.content.lessons[this.content.indexOf(this.lesson()) + 1]);
  protected readonly show = computed(() => SHOW[this.progress.depth()]);
  protected readonly depthHint = computed(() => DEPTHS.find((d) => d.key === this.progress.depth())?.hint ?? '');
  protected readonly levelName = computed(() => LEVEL_NAMES[this.lesson().lvl]);
  protected readonly runs = computed(() => !this.lesson().min || (this.lesson().min ?? 0) <= this.progress.jdk());
  protected readonly bodyHtml = computed(() => md(this.lesson().body));
  protected readonly proHtml = computed(() => md(this.lesson().pro));
  protected readonly minutes = computed(() => this.content.minutes(this.lesson()));
  protected readonly prereqs = computed(() => this.content.prereqs(this.lesson()));
  protected readonly leadsTo = computed(() => this.content.leadsTo(this.lesson()));
  protected readonly paths = computed(() => this.content.pathsWith(this.lesson()));
  protected readonly isDone = computed(() => !!this.progress.done()[this.lesson().id]);
  protected readonly doneInStage = computed(() => this.stage().lessons.filter((l) => this.progress.done()[l.id]).length);
  protected readonly overallPct = computed(() => Math.round((this.progress.doneCount() / this.total) * 100));

  protected readonly sidebar = computed(() => {
    const done = this.progress.done();
    const jdk = this.progress.jdk();
    const current = this.stage();
    return this.content.stages.map((stage, i) => {
      const count = stage.lessons.filter((l) => done[l.id]).length;
      return {
        stage,
        no: i + 1,
        done: count,
        pct: Math.round((count / stage.lessons.length) * 100),
        current: stage === current,
        items: stage.lessons.map((l) => ({ lesson: l, done: !!done[l.id], need: l.min && l.min > jdk ? l.min : 0 })),
      };
    });
  });

  protected readonly answered = signal<number | null>(null);
  protected readonly drawerOpen = signal(false);
  private readonly side = viewChild<ElementRef<HTMLElement>>('side');

  constructor() {
    // Scroll to a subtopic when the URL has #sub-... (search results and table-of-contents links).
    inject(ActivatedRoute).fragment.pipe(takeUntilDestroyed()).subscribe((f) => {
      if (f?.startsWith('sub-')) setTimeout(() => this.document.getElementById(f)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    });
    // Count active study time while this page is open (browser only).
    afterNextRender(() => {
      const stop = this.learning.startStudyTimer();
      this.destroyRef.onDestroy(stop);
    });
    // New lesson: reset the quiz, update the page title and description.
    effect(() => {
      const l = this.lesson();
      untracked(() => {
        this.answered.set(null);
        this.drawerOpen.set(false);
        this.setSeo(l);
        if (this.browser) setTimeout(() => this.revealCurrentInSidebar());
      });
    });

    // Remember the last lesson once saved progress is loaded.
    effect(() => {
      const l = this.lesson();
      if (this.progress.loaded() && this.id()) this.progress.last.set(l.id);
    });

    // /learn with no (or an unknown) lesson: continue where the learner left off.
    effect(() => {
      if (!this.browser || !this.progress.loaded()) return;
      const id = this.id();
      if (id && this.content.lesson(id)) return;
      const target = this.content.lesson(this.progress.last()) ?? this.content.lessons[0];
      untracked(() => void this.router.navigate(['/learn', target.id], { replaceUrl: true }));
    });
  }

  private setSeo(l: Lesson): void {
    const stage = this.content.stageOf(l);
    const path = `/learn/${l.id}`;
    const description = `${l.eli5 ?? plain(l.body)} ${LEVEL_NAMES[l.lvl]} Java lesson with examples, interview questions and a quiz.`;
    this.seo.set({
      title: `${l.t}: Java tutorial`,
      description,
      path,
      type: 'article',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: l.t,
          description: (l.eli5 ?? plain(l.body)).slice(0, 300),
          articleSection: stage.title,
          proficiencyLevel: l.lvl === 'B' ? 'Beginner' : 'Expert',
          educationalLevel: LEVEL_NAMES[l.lvl],
          inLanguage: 'en',
          isAccessibleForFree: true,
          timeRequired: `PT${this.content.minutes(l)}M`,
          about: { '@type': 'Thing', name: 'Java programming language' },
          author: ORGANIZATION,
          publisher: ORGANIZATION,
          ...(absUrl(path) ? { url: absUrl(path), mainEntityOfPage: absUrl(path) } : {}),
          ...(absUrl('/og-image.png') ? { image: absUrl('/og-image.png') } : {}),
        },
        this.seo.breadcrumbs([
          ['Home', '/'],
          ['Java topics', '/topics'],
          [stage.title, `/learn/${stage.lessons[0].id}`],
          [l.t, path],
        ]),
        ...(l.iq?.length ? [this.seo.faq(l.iq)] : []),
      ],
    });
  }

  /** Comparison table cells: escaped text with [[code]] and **bold**. */
  protected readonly vsHtml = computed(() => (this.lesson().vs?.rows ?? []).map((r) => r.map(inlineHtml)));

  protected readonly subHtml = computed(() => (this.lesson().subs ?? []).map((st) => md(st.body)));

  protected readonly finishDate = computed(() => {
    const d = this.learning.pace().paceFinish;
    return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  });

  protected signUp(): void {
    this.ui.auth(null, 'signup', '/my/learning');
  }

  protected toggleDone(): void {
    const id = this.lesson().id;
    const now = this.learning.toggleDone(id);
    this.ui.toast(now ? (this.learning.signedIn() ? 'Lesson complete. Saved to your account.' : 'Lesson marked complete') : 'Lesson marked as not complete');
  }

  protected openDrawer(): void {
    this.drawerOpen.set(true);
    setTimeout(() => this.side()?.nativeElement.querySelector<HTMLElement>('a[aria-current]')?.focus());
  }

  protected closeDrawer(): void {
    if (!this.drawerOpen()) return;
    this.drawerOpen.set(false);
    this.document.querySelector<HTMLElement>('.side-toggle')?.focus();
  }

  private revealCurrentInSidebar(): void {
    const side = this.side()?.nativeElement;
    const current = side?.querySelector<HTMLElement>('a[aria-current]');
    if (side && current && side.scrollHeight > side.clientHeight) current.scrollIntoView({ block: 'nearest' });
  }
}

function inlineHtml(text: string): string {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return esc.replace(/\[\[(.+?)\]\](?!\])/g, '<code>$1</code>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
