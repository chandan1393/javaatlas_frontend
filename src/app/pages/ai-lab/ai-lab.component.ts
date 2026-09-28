import { afterNextRender, Component, computed, effect, ElementRef, inject, input, signal, untracked, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AiChatMode, AiError, AiService, AiTurn } from '../../core/ai.service';
import { ContentService } from '../../core/content.service';
import { aiToHtml } from '../../core/markup';
import { LEVEL_NAMES, Lesson } from '../../core/models';
import { absUrl, SeoService } from '../../core/seo.service';
import { UiService } from '../../core/ui.service';

type ToolId = 'explain' | 'review' | 'error' | 'modernize' | 'quiz' | 'interview' | 'plan';

interface Tool {
  id: ToolId;
  name: string;
  desc: string;
  icon: string;
  c1: string;
  c2: string;
}

const TOOLS: Tool[] = [
  { id: 'explain', name: 'Explain code', desc: 'Paste Java code and get a clear walk-through.', icon: 'M8 6 2 12l6 6M16 6l6 6-6 6', c1: '#3355FF', c2: '#22D3EE' },
  { id: 'review', name: 'Review my code', desc: 'Bugs, security, speed and style, plus a fixed version.', icon: 'M9 12l2 2 4-4M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z', c1: '#10B981', c2: '#0F766E' },
  { id: 'error', name: 'Fix an error', desc: 'Paste a stack trace or compiler error and find the cause.', icon: 'M12 9v4M12 17h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z', c1: '#F43F5E', c2: '#F97316' },
  { id: 'modernize', name: 'Modernize', desc: 'Rewrite old Java with records, switch, var and more.', icon: 'M12 3l1.8 4.9L19 9.7l-4.9 1.8L12 17l-1.8-5.5L5 9.7l5.2-1.8z', c1: '#F59E0B', c2: '#FF6B1A' },
  { id: 'quiz', name: 'Quiz me', desc: 'Fresh practice questions on any topic.', icon: 'M9.1 9a3 3 0 1 1 5.8 1c-.5 1.5-2.9 2-2.9 3.5M12 17h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', c1: '#8B5CF6', c2: '#EC4899' },
  { id: 'interview', name: 'Mock interview', desc: 'Answer real interview questions and get scored.', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', c1: '#0EA5E9', c2: '#6366F1' },
  { id: 'plan', name: 'Study plan', desc: 'A week-by-week plan built from JavaAtlas lessons.', icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', c1: '#84CC16', c2: '#15803D' },
];

const EXAMPLES: Record<string, { label: string; text: string }[]> = {
  explain: [
    {
      label: 'Stream grouping',
      text: `Map<String, Long> countByCity = customers.stream()\n    .filter(c -> c.isActive())\n    .collect(Collectors.groupingBy(Customer::city, Collectors.counting()));`,
    },
    {
      label: 'Spring REST controller',
      text: `@RestController\n@RequestMapping("/api/orders")\nclass OrderController {\n    private final OrderService service;\n    OrderController(OrderService service) { this.service = service; }\n\n    @GetMapping("/{id}")\n    ResponseEntity<OrderDto> get(@PathVariable long id) {\n        return service.find(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());\n    }\n}`,
    },
  ],
  review: [
    {
      label: 'Buggy user lookup',
      text: `public User findUser(String email) {\n    Connection con = DriverManager.getConnection(URL, USER, PASS);\n    Statement st = con.createStatement();\n    ResultSet rs = st.executeQuery("select * from users where email = '" + email + "'");\n    if (rs.next()) {\n        return new User(rs.getString("name"), rs.getString("email"));\n    }\n    return null;\n}`,
    },
  ],
  error: [
    {
      label: 'LazyInitializationException',
      text: `org.hibernate.LazyInitializationException: failed to lazily initialize a collection of role: com.shop.Order.items: could not initialize proxy - no Session\n    at org.hibernate.collection.spi.AbstractPersistentCollection.throwLazyInitializationException(AbstractPersistentCollection.java:634)\n    at com.shop.web.OrderController.items(OrderController.java:41)`,
    },
    {
      label: 'ConcurrentModificationException',
      text: `for (String name : names) {\n    if (name.isBlank()) {\n        names.remove(name);\n    }\n}\n\nException in thread "main" java.util.ConcurrentModificationException\n    at java.base/java.util.ArrayList$Itr.checkForComodification(ArrayList.java:1095)`,
    },
  ],
  modernize: [
    {
      label: 'Java 7 style class',
      text: `public class Point {\n    private final int x;\n    private final int y;\n    public Point(int x, int y) { this.x = x; this.y = y; }\n    public int getX() { return x; }\n    public int getY() { return y; }\n    @Override public boolean equals(Object o) {\n        if (!(o instanceof Point)) return false;\n        Point p = (Point) o;\n        return x == p.x && y == p.y;\n    }\n    @Override public int hashCode() { return 31 * x + y; }\n}\n\nString describe(Object shape) {\n    if (shape instanceof Circle) {\n        Circle c = (Circle) shape;\n        return "Circle " + c.getRadius();\n    } else if (shape instanceof Square) {\n        Square s = (Square) shape;\n        return "Square " + s.getSide();\n    }\n    return "Unknown";\n}`,
    },
  ],
};

interface QuizQ {
  q: string;
  code?: string;
  options: string[];
  answer: number;
  why: string;
}

interface Plan {
  summary: string;
  weeks: { title: string; focus: string; lessons: string[]; practice: string }[];
}

@Component({
  selector: 'app-ai-lab',
  imports: [RouterLink],
  templateUrl: './ai-lab.component.html',
})
export class AiLabComponent {
  /** Query parameter ?tool= */
  readonly toolParam = input<string>(undefined, { alias: 'tool' });

  protected readonly ai = inject(AiService);
  protected readonly content = inject(ContentService);
  private readonly ui = inject(UiService);
  protected readonly tools = TOOLS;
  protected readonly tool = signal<ToolId>('explain');
  protected readonly current = computed(() => TOOLS.find((t) => t.id === this.tool())!);
  protected readonly examples = computed(() => EXAMPLES[this.tool()] ?? []);
  protected readonly javaTargets = ['8', '11', '17', '21', '25'];
  protected readonly levels = ['Beginner', 'Intermediate', 'Advanced'];

  // Code tools
  protected readonly code = signal('');
  protected readonly target = signal('25');
  protected readonly level = signal('Intermediate');
  protected readonly output = signal('');
  protected readonly outputHtml = computed(() => aiToHtml(this.output()));
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly truncated = signal(false);
  private abort: AbortController | null = null;

  // Quiz
  protected readonly topic = signal('');
  protected readonly quizCount = signal('5');
  protected readonly quiz = signal<QuizQ[] | null>(null);
  protected readonly picks = signal<Record<number, number>>({});
  protected readonly score = computed(() => {
    const q = this.quiz() ?? [];
    const p = this.picks();
    return { answered: Object.keys(p).length, right: q.filter((x, i) => p[i] === x.answer).length, total: q.length };
  });
  protected readonly topicSuggestions = computed(() => [...this.content.stages.map((s) => s.title), ...this.content.lessons.map((l) => l.t)]);

  // Interview
  protected readonly interviewTopics = ['Core Java', 'Collections and HashMap', 'Concurrency', 'JVM and memory', 'JPA and Hibernate', 'Spring Boot', 'Microservices', 'System design'];
  protected readonly ivTopic = signal('Core Java');
  protected readonly ivLevel = signal('Mid-level');
  protected readonly thread = signal<AiTurn[]>([]);
  protected readonly live = signal<string | null>(null);
  protected readonly draft = signal('');
  protected readonly liveHtml = computed(() => aiToHtml(this.live() ?? ''));
  protected readonly threadView = computed(() =>
    this.thread()
      .slice(1)
      .map((m) => ({ role: m.role, html: m.role === 'assistant' ? aiToHtml(m.content) : '', text: m.content })),
  );
  private readonly threadEl = viewChild<ElementRef<HTMLElement>>('thread');

  // Study plan
  protected readonly goals = [
    'Get my first Java developer job',
    'Build and deploy Spring Boot REST APIs',
    'Prepare for Java interviews',
    'Upgrade my skills from Java 8 to modern Java',
    'Design and run microservices',
  ];
  protected readonly goal = signal(this.goals[0]);
  protected readonly hours = signal('5');
  protected readonly weeks = signal('4');
  protected readonly plan = signal<Plan | null>(null);
  protected readonly planWeeks = computed(() =>
    (this.plan()?.weeks ?? []).map((w) => ({
      ...w,
      items: w.lessons.map((id) => this.content.lesson(id)).filter((l): l is Lesson => !!l),
    })),
  );

  constructor() {
    const seo = inject(SeoService);
    seo.set({
      title: 'AI Java tutor: explain, review and fix Java code free',
      description:
        'Free AI tools for Java learners: explain code, review it for bugs, fix errors and stack traces, modernize to Java 25, generate quizzes, practise mock interviews and get a study plan.',
      path: '/ai',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'JavaAtlas AI Lab',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: 0, priceCurrency: 'INR' },
          ...(absUrl('/ai') ? { url: absUrl('/ai') } : {}),
        },
        seo.breadcrumbs([
          ['Home', '/'],
          ['AI Lab', '/ai'],
        ]),
      ],
    });
    afterNextRender(() => void this.ai.check());
    effect(() => {
      const t = this.toolParam();
      if (t && TOOLS.some((x) => x.id === t)) untracked(() => this.pick(t as ToolId));
    });
    effect(() => {
      this.threadView();
      this.live();
      const el = this.threadEl()?.nativeElement;
      if (el) setTimeout(() => (el.scrollTop = el.scrollHeight));
    });
  }

  protected pick(id: ToolId): void {
    if (this.busy()) this.stop();
    this.tool.set(id);
    this.error.set('');
    this.output.set('');
    this.truncated.set(false);
  }

  protected useExample(text: string): void {
    this.code.set(text);
  }

  protected stop(): void {
    this.abort?.abort();
  }

  /** Explain, review, error and modernize. */
  protected async run(): Promise<void> {
    const text = this.code().trim();
    if (!text || this.busy()) return;
    const mode = this.tool() as AiChatMode;
    const content = mode === 'error' ? text : '```java\n' + text + '\n```';
    await this.streamInto(mode, [{ role: 'user', content }], { target: this.target(), level: this.level().toLowerCase() }, (t) => this.output.set(t));
  }

  protected async copyOutput(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.output());
      this.ui.toast('Copied');
    } catch {
      this.ui.toast('Couldn’t copy. Select the text instead.');
    }
  }

  protected async makeQuiz(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.quiz.set(null);
    this.picks.set({});
    try {
      const res = await this.ai.generate<{ questions: QuizQ[] }>('quiz', {
        topic: this.topic().trim() || 'core Java',
        level: this.level().toLowerCase(),
        count: this.quizCount(),
        target: this.target(),
      });
      const valid = (res.questions ?? []).filter((q) => q.q && Array.isArray(q.options) && q.options.length >= 2 && q.answer >= 0 && q.answer < q.options.length);
      if (!valid.length) throw new AiError('No questions came back. Please try again.', 'bad_json');
      this.quiz.set(valid);
    } catch (e) {
      this.error.set(e instanceof AiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }

  protected answer(i: number, option: number): void {
    if (this.picks()[i] !== undefined) return;
    this.picks.update((p) => ({ ...p, [i]: option }));
  }

  protected async startInterview(): Promise<void> {
    const first: AiTurn = { role: 'user', content: `I'm ready. Please start the ${this.ivLevel()} interview on ${this.ivTopic()}.` };
    this.thread.set([first]);
    await this.interviewTurn();
  }

  protected async sendAnswer(): Promise<void> {
    const text = this.draft().trim();
    if (!text || this.busy()) return;
    this.draft.set('');
    this.thread.update((t) => [...t, { role: 'user', content: text }]);
    await this.interviewTurn();
  }

  protected async finishInterview(): Promise<void> {
    if (this.busy()) return;
    this.thread.update((t) => [...t, { role: 'user', content: 'Please finish the interview now and give me my final summary.' }]);
    await this.interviewTurn();
  }

  protected resetInterview(): void {
    this.stop();
    this.thread.set([]);
    this.live.set(null);
  }

  protected async makePlan(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.plan.set(null);
    const catalog = this.content.lessons.map((l) => `${l.id}: ${l.t} (${LEVEL_NAMES[l.lvl]})`).join('\n');
    try {
      const res = await this.ai.generate<Plan>('plan', {
        goal: this.goal(),
        level: this.level().toLowerCase(),
        hours: this.hours(),
        weeks: this.weeks(),
        catalog,
      });
      if (!res.weeks?.length) throw new AiError('No plan came back. Please try again.', 'bad_json');
      this.plan.set(res);
    } catch (e) {
      this.error.set(e instanceof AiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }

  private async interviewTurn(): Promise<void> {
    this.live.set('');
    await this.streamInto('interview', this.thread(), { topic: this.ivTopic(), level: this.ivLevel().toLowerCase() }, (t) => this.live.set(t), (final) =>
      this.thread.update((t) => [...t, { role: 'assistant', content: final }]),
    );
    this.live.set(null);
  }

  private async streamInto(
    mode: AiChatMode,
    messages: AiTurn[],
    context: Record<string, string>,
    onText: (t: string) => void,
    onDone?: (t: string) => void,
  ): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    this.truncated.set(false);
    onText('');
    const ctl = new AbortController();
    this.abort = ctl;
    try {
      const res = await this.ai.stream(mode, messages, context, onText, ctl.signal);
      this.truncated.set(res.truncated);
      onDone?.(res.text);
    } catch (e) {
      const err = e instanceof AiError ? e : new AiError('Something went wrong. Please try again.', 'unknown');
      if (err.code === 'cancelled') {
        if (err.partial) onDone?.(err.partial);
      } else {
        this.error.set(err.message);
        if (mode === 'interview') this.thread.update((t) => (t.length && t[t.length - 1].role === 'user' && t.length > 1 ? t.slice(0, -1) : t));
      }
    } finally {
      this.busy.set(false);
      this.abort = null;
    }
  }
}
