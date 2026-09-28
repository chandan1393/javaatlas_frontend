import { afterNextRender, Component, computed, DestroyRef, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PRODUCTS, Product } from '../../data/products';
import { CountUpDirective, SpotlightDirective } from '../../shared/fx.directives';
import { TESTIMONIALS } from '../../data/testimonials';
import { BENEFITS } from '../../data/benefits';
import { StageIconComponent } from '../../shared/stage-icon.component';
import { AccountService } from '../../core/account.service';
import { ContentService } from '../../core/content.service';
import { fmtDate, highlight, hoursText, listJoin, plain, priceText, softCase } from '../../core/markup';
import { Depth, LEVEL_NAMES } from '../../core/models';
import { ProgressService } from '../../core/progress.service';
import { UiService } from '../../core/ui.service';
import { SETTINGS } from '../../app.settings';
import { absUrl, ORGANIZATION, SeoService } from '../../core/seo.service';

/** The same small program, written the way each Java version allows. */
const EVOLUTION = [
  {
    v: '7',
    n: 7,
    note: 'Java 7: loops and an anonymous class just to sort a list.',
    code: `List<Student> top = new ArrayList<>();
for (Student s : students) {
    if (s.getMarks() > 80) {
        top.add(s);
    }
}
Collections.sort(top, new Comparator<Student>() {
    public int compare(Student a, Student b) {
        return a.getName().compareTo(b.getName());
    }
});`,
  },
  {
    v: '8',
    n: 8,
    note: 'Java 8 added streams, lambdas and method references.',
    code: `List<Student> top = students.stream()
    .filter(s -> s.getMarks() > 80)
    .sorted(Comparator.comparing(Student::getName))
    .collect(Collectors.toList());`,
  },
  {
    v: '11',
    n: 11,
    note: 'Java 10 and 11 let the compiler infer local types with var.',
    code: `var top = students.stream()
    .filter(s -> s.getMarks() > 80)
    .sorted(Comparator.comparing(Student::getName))
    .collect(Collectors.toList());`,
  },
  {
    v: '17',
    n: 17,
    note: 'Java 16 and 17 brought records and Stream.toList().',
    code: `record Student(String name, int marks) {}

var top = students.stream()
    .filter(s -> s.marks() > 80)
    .sorted(Comparator.comparing(Student::name))
    .toList();`,
  },
  {
    v: '21',
    n: 21,
    note: 'Java 21 added sequenced collections, like getFirst().',
    code: `record Student(String name, int marks) {}

var top = students.stream()
    .filter(s -> s.marks() > 80)
    .sorted(Comparator.comparing(Student::name))
    .toList();
System.out.println(top.getFirst());`,
  },
  {
    v: '25',
    n: 25,
    note: 'Java 25 runs a plain void main(): no class or static needed.',
    code: `record Student(String name, int marks) {}

void main() {
    var top = students().stream()
        .filter(s -> s.marks() > 80)
        .sorted(Comparator.comparing(Student::name))
        .toList();
    IO.println(top.getFirst());
}`,
  },
];

/** Headline features preferred in the "moving to Java 25 adds..." sentence. */
const PRIORITY: Record<string, number> = {
  'Virtual threads': 1,
  Records: 2,
  'Pattern matching for switch': 3,
  'Text blocks': 4,
  'Compact source files and instance main methods': 5,
  'Sealed classes': 6,
  'Switch expressions': 7,
  'var for local variables': 8,
};

const GLYPHS: Record<string, string> = { Beginner: '{ }', Intermediate: '@Get', Advanced: 'SQL' };

@Component({
  selector: 'app-home',
  imports: [RouterLink, SpotlightDirective, CountUpDirective, StageIconComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  protected readonly content = inject(ContentService);
  protected readonly progress = inject(ProgressService);
  protected readonly account = inject(AccountService);
  private readonly ui = inject(UiService);
  protected readonly total = this.content.lessons.length;
  protected readonly firstId = this.content.lessons[0].id;
  protected readonly lastLesson = computed(() => this.content.lesson(this.progress.last()));
  protected readonly priceText = priceText;
  protected readonly products = PRODUCTS;
  protected readonly versionCount = this.content.released.length + PRODUCTS.reduce((n, p) => n + p.versions.filter((v) => v.status !== 'planned').length, 0);
  protected readonly marquee = [
    'Java 25', 'Spring Boot 4.1', 'Spring Framework 7', 'Hibernate 7', 'Jakarta Persistence 3.2', 'Spring Data JPA', 'Virtual threads', 'Records',
    'Streams', 'Pattern matching', 'Spring Security', 'REST APIs', 'Kafka', 'Docker', 'Kubernetes', 'JUnit', 'Mockito', 'Maven', 'PostgreSQL', 'Microservices',
  ];
  protected readonly testimonials = TESTIMONIALS;
  protected readonly benefits = BENEFITS;
  protected readonly stack = [
    { name: 'Java 25', color: '#FF7A45' },
    { name: 'Spring Boot', color: '#10B981' },
    { name: 'Hibernate & JPA', color: '#C09B4E' },
    { name: 'PostgreSQL', color: '#3B82F6' },
    { name: 'REST APIs', color: '#8B5CF6' },
    { name: 'Docker', color: '#0EA5E9' },
    { name: 'Kafka', color: '#64748B' },
    { name: 'JUnit & Mockito', color: '#F43F5E' },
  ];
  protected readonly how = [
    {
      title: 'Pick your path',
      text: 'Choose a goal, from complete beginner to interview-ready, and get the lessons in the right order.',
      cta: 'See learning paths',
      link: '/paths',
      icon: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',
      c1: '#FF7A45',
      c2: '#FF3D7F',
    },
    {
      title: 'Learn by doing',
      text: 'Short lessons with runnable code, old-versus-new comparisons, quizzes and an AI mentor for every question.',
      cta: 'Open lesson 1',
      link: '/learn/jvm',
      icon: 'M8 6 2 12l6 6M16 6l6 6-6 6',
      c1: '#8B5CF6',
      c2: '#6C4DFF',
    },
    {
      title: 'Get job-ready',
      text: 'Practise real interview questions, take scored mock interviews, and build projects in the courses.',
      cta: 'Practise interviews',
      link: '/interview',
      icon: 'M20 7h-4V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1zM10 5h4v2h-4z',
      c1: '#10B981',
      c2: '#0EA5E9',
    },
  ];
  protected readonly faq = [
    {
      q: 'Is JavaAtlas really free?',
      a: `Yes. All ${this.total} lessons, the learning paths, the version guides and the interview questions are free, with no account needed. Paid courses are optional, project-based extras.`,
    },
    { q: 'I’ve never programmed before. Can I start here?', a: 'Yes. The “Java from zero” path starts with installing Java and writing your first program, then builds up one small step at a time.' },
    {
      q: 'Which Java version do the lessons use?',
      a: 'Lessons are written for modern Java (Java 25 is the current long-term support release), and each one shows the version its code needs. Pick your JDK at the top of the page and lessons tell you if something won’t run on it.',
    },
    {
      q: 'How does the AI mentor work?',
      a: 'It’s powered by Claude. It explains code, reviews it for bugs, decodes error messages, writes practice quizzes and runs mock interviews. It’s free with fair-use limits, and like any AI it can make mistakes.',
    },
    {
      q: 'What do the paid courses include?',
      a: 'Project-based lectures with video and written notes, free preview lectures, and access for as long as the course is offered. You pay once with UPI, cards or net banking through Razorpay.',
    },
    { q: 'Can I get a refund?', a: 'Yes, within the refund window if you haven’t completed much of the course. See the refund policy for the details.' },
    { q: 'Do you offer certificates?', a: 'Not yet. For now, the best proof of your skills is the projects you build and the interviews you pass.' },
    {
      q: 'Is my data safe?',
      a: 'Passwords are stored as secure hashes, sign-in uses protected cookies, and payments are handled by Razorpay, so we never see your card or UPI details. Without an account your lesson progress stays in your browser; with one, it’s saved to your account so it follows you to any device.',
    },
  ];
  protected readonly aiFeatures = [
    { id: 'explain', name: 'Explain code', c1: '#3355FF', c2: '#22D3EE' },
    { id: 'review', name: 'Review and fix', c1: '#10B981', c2: '#0F766E' },
    { id: 'error', name: 'Decode errors', c1: '#F43F5E', c2: '#F97316' },
    { id: 'modernize', name: 'Modernize to Java 25', c1: '#F59E0B', c2: '#FF6B1A' },
    { id: 'quiz', name: 'Quiz me', c1: '#8B5CF6', c2: '#EC4899' },
    { id: 'interview', name: 'Mock interview', c1: '#0EA5E9', c2: '#6366F1' },
  ];
  protected readonly hoursText = hoursText;
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('rulerScroll');
  private readonly trackEl = viewChild<ElementRef<HTMLElement>>('track');

  // ---- Hero: the program rewriting itself version by version ----
  protected readonly versions = EVOLUTION;
  protected readonly vIndex = signal(0);
  private readonly prevIndex = signal<number | null>(null);
  protected readonly current = computed(() => EVOLUTION[this.vIndex()]);
  protected readonly lines = computed(() => {
    const idx = this.vIndex();
    const prev = this.prevIndex();
    const before = prev === null ? null : new Set(EVOLUTION[prev].code.split('\n').map((l) => l.trim()));
    return EVOLUTION[idx].code.split('\n').map((text, i) => ({
      key: `${idx}-${i}`,
      n: i + 1,
      html: text ? highlight(text, 'java') : ' ',
      changed: !!before && !!text.trim() && !before.has(text.trim()),
    }));
  });
  protected readonly isMine = computed(() => this.progress.jdk() === this.current().n);
  private autoplay: ReturnType<typeof setInterval> | undefined;

  // ---- JDK ruler ----
  protected readonly ticks = computed(() => {
    const jdk = this.progress.jdk();
    return this.content.versions.map((v, i) => ({
      v,
      i,
      sel: v.n === jdk,
      avail: !v.planned && v.n <= jdk,
      pickable: this.content.pickable.includes(v.n),
      label: `Java ${v.v}${v.lts ? ', long-term support' : ''}${v.planned ? ', planned for ' : ', '}${fmtDate(v.date)}`,
    }));
  });

  protected readonly readout = computed(() => {
    const n = this.progress.jdk();
    const v = this.content.version(n);
    const ok = this.content.lessons.filter((l) => !l.min || l.min <= n).length;
    let rest = `, released ${v ? fmtDate(v.date) : ''}. `;
    rest += ok === this.total ? `All ${this.total} lessons run as written on it.` : `${ok} of ${this.total} lessons run as written; the others are marked with the version they need.`;
    const target = this.content.latestLts;
    if (n < target) {
      const gained = this.content.featuresBetween(n, target).filter((f) => f.status === 'final' && f.type !== 'x');
      const heads = gained
        .filter((f) => f.star)
        .sort((a, b) => (PRIORITY[a.text] ?? 50) - (PRIORITY[b.text] ?? 50) || b.star - a.star || a.version.n - b.version.n)
        .slice(0, 3)
        .map((f) => softCase(f.text.split(':')[0].replace(/\s*\(.*?\)\s*$/, '')));
      rest += ` Moving to Java ${target} adds ${gained.length} finished features, including ${listJoin(heads)}.`;
    } else if (v && !v.lts) {
      rest += ` It’s a six-month release; Java ${target} is the current long-term support version.`;
    }
    return { title: `Java ${n}${v?.lts ? ' (LTS)' : ''}`, rest };
  });

  // ---- Learning path ----
  protected readonly stages = computed(() => {
    const done = this.progress.done();
    return this.content.stages.map((stage, i) => {
      const count = stage.lessons.filter((l) => done[l.id]).length;
      return {
        stage,
        no: i + 1,
        done: count,
        pct: Math.round((count / stage.lessons.length) * 100),
        next: stage.lessons.find((l) => !done[l.id]) ?? stage.lessons[0],
        blurb: stage.blurb.split('. Examples')[0].replace(/\.?$/, '.'),
        level: LEVEL_NAMES[stage.level].toLowerCase(),
      };
    });
  });

  // ---- Feature tiles that actually work ----
  private readonly hashmap = this.content.lesson('hashmap')!;
  protected readonly depthDemo = signal<Depth>('beginner');
  protected readonly depthText = computed(() => {
    const d = this.depthDemo();
    if (d === 'beginner') return { q: '', a: this.hashmap.eli5 ?? '' };
    if (d === 'developer') {
      const lines = plain(this.hashmap.body).split('\n').map((l) => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
      return { q: '', a: lines.slice(0, 3).join(' ') };
    }
    const [q, a] = this.hashmap.iq?.[0] ?? ['', ''];
    return { q, a };
  });
  protected readonly flipped = signal(false);
  protected readonly flashcard = this.content.questions.find((q) => q.lesson.id === 'vthreads') ?? this.content.questions[0];
  protected readonly modern = signal(false);
  private readonly lambdas = this.content.lesson('lambdas')!;
  protected readonly cmpHtml = computed(() => highlight(this.modern() ? (this.lambdas.neu ?? '') : (this.lambdas.old ?? ''), 'java'));
  protected readonly planFrom = signal(8);
  protected readonly planTo = signal(25);
  protected readonly planCount = computed(() =>
    this.planTo() > this.planFrom()
      ? this.content.featuresBetween(this.planFrom(), this.planTo()).filter((f) => f.status === 'final' && f.type !== 'x').length
      : 0,
  );
  protected readonly planOptions = [...this.content.pickable];
  protected readonly ltsVersions = this.content.released.filter((v) => v.lts);
  protected readonly teaser = computed(() => this.account.courses().slice(0, 3));

  constructor() {
    const seo = inject(SeoService);
    seo.set({
      title: `Learn Java free: tutorials from basics to Spring Boot and microservices | ${SETTINGS.brand}`,
      rawTitle: true,
      description: `${SETTINGS.tagline} ${this.total} lessons for beginners to advanced developers.`,
      path: '/',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SETTINGS.brand,
          description: SETTINGS.tagline,
          inLanguage: 'en',
          ...(absUrl('/') ? { url: absUrl('/') } : {}),
        },
        { '@context': 'https://schema.org', ...ORGANIZATION },
        seo.faq(this.faq.map((f) => [f.q, f.a] as [string, string])),
      ],
    });
    afterNextRender(() => {
      this.centerRuler();
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        this.vIndex.set(EVOLUTION.length - 1);
        return;
      }
      // One orchestrated moment: walk from Java 7 to 25 once, unless the visitor takes over.
      this.autoplay = setInterval(() => {
        if (this.vIndex() >= EVOLUTION.length - 1) {
          this.stopAutoplay();
          return;
        }
        this.show(this.vIndex() + 1);
      }, 2400);
    });
    inject(DestroyRef).onDestroy(() => this.stopAutoplay());
    effect(() => {
      if (this.progress.loaded()) setTimeout(() => this.centerRuler());
    });
  }

  protected pickVersion(i: number): void {
    this.stopAutoplay();
    this.show(i);
  }

  protected useAsJdk(): void {
    const n = this.current().n;
    this.progress.setJdk(n);
    this.ui.toast(`Java ${n} is now your JDK. Lessons will show whether their code runs on it.`);
  }

  protected pick(n: number): void {
    this.progress.setJdk(n);
  }

  protected scrollTrack(dir: number): void {
    const el = this.trackEl()?.nativeElement;
    el?.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.8), behavior: 'smooth' });
  }

  protected signUp(): void {
    this.ui.auth(null, 'signup', '/my/learning');
  }

  protected latestOf(p: Product): string {
    return p.versions.find((v) => v.status === 'latest')?.v ?? '';
  }

  protected releasesOf(p: Product): number {
    return p.versions.filter((v) => v.status !== 'planned').length;
  }

  protected firstYear(p: Product): string {
    return p.versions[p.versions.length - 1].date.slice(0, 4);
  }

  protected glyph(level: string): string {
    return GLYPHS[level] ?? '{ }';
  }

  protected setPlan(which: 'from' | 'to', value: string): void {
    (which === 'from' ? this.planFrom : this.planTo).set(Number(value));
  }

  private show(i: number): void {
    this.prevIndex.set(this.vIndex());
    this.vIndex.set(i);
  }

  private stopAutoplay(): void {
    clearInterval(this.autoplay);
    this.autoplay = undefined;
  }

  /** On small screens, scrolls the version ruler so "Your JDK" is visible. */
  private centerRuler(): void {
    const sc = this.scroller()?.nativeElement;
    const sel = sc?.querySelector<HTMLElement>('.tick.sel');
    if (!sc || !sel || sc.scrollWidth <= sc.clientWidth) return;
    const a = sel.getBoundingClientRect();
    const b = sc.getBoundingClientRect();
    sc.scrollLeft += a.left - b.left - sc.clientWidth / 2 + a.width / 2;
  }
}
