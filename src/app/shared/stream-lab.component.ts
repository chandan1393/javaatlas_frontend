import { Component, computed, inject, input, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type V = string | number;
interface Stage {
  kind: 'filter' | 'map' | 'limit' | 'sorted';
  label: string;
  fn?: (v: V) => V | boolean;
  n?: number;
}
interface Terminal {
  kind: 'toList' | 'findFirst' | 'anyMatch' | 'none';
  label: string;
  fn?: (v: V) => boolean;
}
interface Pipeline {
  id: string;
  label: string;
  intro: string;
  source: V[];
  stages: Stage[];
  terminal: Terminal;
}
/** One thing that happened: element row, stage column (stages.length = terminal), what, the value shown. */
interface Ev {
  row: number;
  col: number;
  kind: 'pass' | 'drop' | 'wait' | 'take' | 'stop' | 'info';
  value: string;
  note: string;
}

const q = (v: V) => (typeof v === 'string' ? `"${v}"` : String(v));

const PIPELINES: Pipeline[] = [
  {
    id: 'lazy',
    label: 'filter → map → limit',
    intro: 'Streams process one element at a time, all the way down, and stop as soon as limit(2) is satisfied.',
    source: ['anna', 'bob', 'carl', 'dave', 'eve'],
    stages: [
      { kind: 'filter', label: 'filter(s -> s.length() > 3)', fn: (v) => String(v).length > 3 },
      { kind: 'map', label: 'map(String::toUpperCase)', fn: (v) => String(v).toUpperCase() },
      { kind: 'limit', label: 'limit(2)', n: 2 },
    ],
    terminal: { kind: 'toList', label: 'toList()' },
  },
  {
    id: 'sorted',
    label: 'sorted() is a barrier',
    intro: 'sorted() can’t emit anything until it has seen every element. After that, findFirst() takes only one.',
    source: [5, 2, 8, 1, 6],
    stages: [
      { kind: 'filter', label: 'filter(n -> n % 2 == 0)', fn: (v) => Number(v) % 2 === 0 },
      { kind: 'sorted', label: 'sorted()' },
      { kind: 'map', label: 'map(n -> n * 10)', fn: (v) => Number(v) * 10 },
    ],
    terminal: { kind: 'findFirst', label: 'findFirst()' },
  },
  {
    id: 'anymatch',
    label: 'anyMatch short-circuits',
    intro: 'anyMatch stops at the first element that matches. The rest of the source is never read.',
    source: [3, 1, 4, 1, 5, 9, 2, 6],
    stages: [{ kind: 'map', label: 'map(n -> n * n)', fn: (v) => Number(v) * Number(v) }],
    terminal: { kind: 'anyMatch', label: 'anyMatch(n -> n > 20)', fn: (v) => Number(v) > 20 },
  },
  {
    id: 'no-terminal',
    label: 'No terminal operation',
    intro: 'Without a terminal operation, a stream is just a recipe: nothing is read, filtered or mapped.',
    source: ['anna', 'bob', 'carl'],
    stages: [
      { kind: 'filter', label: 'filter(s -> { System.out.println(s); return true; })', fn: () => true },
      { kind: 'map', label: 'map(String::toUpperCase)', fn: (v) => String(v).toUpperCase() },
    ],
    terminal: { kind: 'none', label: '(no terminal operation)' },
  },
];

/** Simulates Java's stream evaluation and records every event. */
function evaluate(p: Pipeline): { events: Ev[]; result: string; untouched: number[] } {
  const events: Ev[] = [];
  const T = p.stages.length;
  if (p.terminal.kind === 'none') {
    events.push({ row: -1, col: -1, kind: 'info', value: '', note: 'The pipeline is built, but there is no terminal operation, so nothing runs. Not one element is read. Add toList(), forEach(...) or count() and it would start.' });
    return { events, result: 'Nothing happens', untouched: p.source.map((_, i) => i) };
  }
  const limits = new Map<number, number>();
  const buffers = new Map<number, { v: V; row: number }[]>();
  const collected: V[] = [];
  let stopped = false;
  let answer: string | null = null;
  const touched = new Set<number>();

  const push = (v: V, from: number, row: number): void => {
    for (let s = from; s < T && !stopped; s++) {
      const st = p.stages[s];
      if (st.kind === 'filter') {
        if (!st.fn!(v)) {
          events.push({ row, col: s, kind: 'drop', value: '✗', note: `${q(v)} fails ${st.label}: dropped. It never reaches the later stages.` });
          return;
        }
        events.push({ row, col: s, kind: 'pass', value: q(v), note: `${q(v)} passes ${st.label}.` });
      } else if (st.kind === 'map') {
        const out = st.fn!(v) as V;
        events.push({ row, col: s, kind: 'pass', value: q(out), note: `${st.label} turns ${q(v)} into ${q(out)}.` });
        v = out;
      } else if (st.kind === 'limit') {
        const seen = (limits.get(s) ?? 0) + 1;
        limits.set(s, seen);
        events.push({ row, col: s, kind: 'pass', value: `${q(v)} (${seen}/${st.n})`, note: `${st.label} lets ${q(v)} through: ${seen} of ${st.n}.` });
        if (seen >= st.n!) {
          collect(v, row);
          stopped = true;
          events.push({ row, col: s, kind: 'stop', value: '', note: `${st.label} has its ${st.n} elements, so the stream stops pulling from the source. Short-circuit!` });
          return;
        }
      } else if (st.kind === 'sorted') {
        const buf = buffers.get(s) ?? [];
        buf.push({ v, row });
        buffers.set(s, buf);
        events.push({ row, col: s, kind: 'wait', value: `⏸ ${q(v)}`, note: `${q(v)} waits inside sorted(): it can’t know the order until it has seen every element.` });
        return;
      }
    }
    if (!stopped) collect(v, row);
  };

  const collect = (v: V, row: number): void => {
    const t = p.terminal;
    if (t.kind === 'toList') {
      collected.push(v);
      events.push({ row, col: T, kind: 'take', value: '✓', note: `${q(v)} is added to the result list.` });
    } else if (t.kind === 'findFirst') {
      answer = `Optional[${v}]`;
      events.push({ row, col: T, kind: 'take', value: '✓ first', note: `findFirst() gets ${q(v)} and stops the whole stream.` });
      stopped = true;
    } else if (t.kind === 'anyMatch') {
      if (t.fn!(v)) {
        answer = 'true';
        events.push({ row, col: T, kind: 'take', value: '✓ match', note: `${q(v)} matches, so anyMatch returns true immediately. No more elements are read.` });
        stopped = true;
      } else {
        events.push({ row, col: T, kind: 'drop', value: '✗', note: `${q(v)} doesn’t match; anyMatch asks for the next element.` });
      }
    }
  };

  p.source.forEach((v, row) => {
    if (stopped) return;
    touched.add(row);
    events.push({ row, col: -1, kind: 'pass', value: q(v), note: `The stream reads ${q(v)} from the source.` });
    push(v, 0, row);
  });
  // Stateful barriers flush once the source is exhausted.
  for (const [s, buf] of [...buffers.entries()].sort((a, b) => a[0] - b[0])) {
    if (stopped) break;
    const sorted = [...buf].sort((a, b) => (a.v < b.v ? -1 : a.v > b.v ? 1 : 0));
    events.push({ row: -1, col: s, kind: 'info', value: '', note: `The source is exhausted, so sorted() finally has everything. It emits ${sorted.map((x) => q(x.v)).join(', ')} in order, one at a time.` });
    for (const item of sorted) {
      if (stopped) break;
      events.push({ row: item.row, col: s, kind: 'pass', value: `${q(item.v)} ▶`, note: `sorted() emits ${q(item.v)}.` });
      push(item.v, s + 1, item.row);
    }
  }
  const t = p.terminal;
  const result = t.kind === 'toList' ? `[${collected.map(q).join(', ')}]` : answer ?? (t.kind === 'anyMatch' ? 'false' : 'Optional.empty');
  const untouched = p.source.map((_, i) => i).filter((i) => !touched.has(i));
  if (untouched.length) {
    events.push({ row: -1, col: -1, kind: 'info', value: '', note: `${untouched.map((i) => q(p.source[i])).join(' and ')} ${untouched.length === 1 ? 'was' : 'were'} never read from the source at all. That's laziness plus short-circuiting.` });
  }
  return { events, result, untouched };
}

/** Watch elements flow through a stream pipeline one at a time. */
@Component({
  selector: 'app-stream-lab',
  template: `
    <section class="hml sl" aria-labelledby="sl-h">
      <header class="hml-head">
        <div>
          <h2 id="sl-h">Stream lab</h2>
          <p class="muted">{{ pipeline().intro }}</p>
        </div>
        <div class="hml-presets" role="group" aria-label="Pipelines">
          @for (p of pipelines; track p.id) {
            <button type="button" class="chip" [attr.aria-pressed]="pipeline().id === p.id" (click)="load(p.id)">{{ p.label }}</button>
          }
        </div>
      </header>

      <pre class="sl-code"><span [class.cur]="curCol() === -1">Stream.of({{ sourceText() }})</span>
@for (s of pipeline().stages; track $index) {    <span [class.cur]="curCol() === $index">.{{ s.label }}</span>
}<span [class.cur]="curCol() === pipeline().stages.length">    {{ pipeline().terminal.kind === 'none' ? '' : '.' }}{{ pipeline().terminal.label }}{{ pipeline().terminal.kind === 'none' ? '' : ';' }}</span></pre>

      <div class="table-wrap">
        <table class="sl-grid">
          <thead>
            <tr>
              <th scope="col">source</th>
              @for (s of pipeline().stages; track $index) {
                <th scope="col">{{ s.label }}</th>
              }
              <th scope="col">{{ pipeline().terminal.label }}</th>
            </tr>
          </thead>
          <tbody>
            @for (v of pipeline().source; track $index; let r = $index) {
              <tr [class.untouched]="done() && run().untouched.includes(r)">
                @for (c of cols(); track c) {
                  <td [class]="cellClass(r, c)">{{ cell(r, c) }}</td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>

      <p class="ml-note" aria-live="polite">{{ note() }}</p>
      @if (done()) {
        <p class="tl-result">Result: <code>{{ run().result }}</code></p>
      }

      <div class="hml-controls ml-bar">
        <button type="button" class="btn btn-ghost btn-sm" (click)="go(index() - 1)" [disabled]="index() < 0">← Back</button>
        <button type="button" class="btn btn-primary btn-sm" (click)="go(index() + 1)" [disabled]="done()">Next →</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="toggle()">{{ playing() ? 'Pause' : 'Play' }}</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="go(run().events.length - 1)">Show all</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="go(-1)">Restart</button>
        <span class="muted">Event {{ index() + 1 }} of {{ run().events.length }}</span>
      </div>
    </section>
  `,
})
export class StreamLabComponent implements OnInit, OnDestroy {
  readonly preset = input<string>('lazy');
  protected readonly pipelines = PIPELINES;
  protected readonly pipeline = signal<Pipeline>(PIPELINES[0]);
  protected readonly index = signal(-1);
  protected readonly playing = signal(false);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly run = computed(() => evaluate(this.pipeline()));
  protected readonly cols = computed(() => Array.from({ length: this.pipeline().stages.length + 2 }, (_, i) => i - 1));
  protected readonly done = computed(() => this.index() >= this.run().events.length - 1);
  protected readonly current = computed(() => (this.index() < 0 ? null : this.run().events[this.index()]));
  protected readonly curCol = computed(() => this.current()?.col ?? -2);
  protected readonly note = computed(() => this.current()?.note ?? 'Press Next to see what the stream does first.');
  protected readonly sourceText = computed(() => this.pipeline().source.map(q).join(', '));
  /** Latest value per cell, up to the current event. */
  private readonly cells = computed(() => {
    const map = new Map<string, Ev>();
    this.run().events.slice(0, this.index() + 1).forEach((e) => {
      if (e.row >= 0 && e.kind !== 'stop') map.set(`${e.row}:${e.col}`, e);
    });
    return map;
  });

  ngOnInit(): void {
    this.load(PIPELINES.some((p) => p.id === this.preset()) ? this.preset() : 'lazy');
  }

  ngOnDestroy(): void {
    this.stop();
  }

  protected load(id: string): void {
    this.stop();
    this.pipeline.set(PIPELINES.find((p) => p.id === id) ?? PIPELINES[0]);
    this.index.set(-1);
  }

  protected cell(r: number, c: number): string {
    return this.cells().get(`${r}:${c}`)?.value ?? '';
  }

  protected cellClass(r: number, c: number): string {
    const e = this.cells().get(`${r}:${c}`);
    const cur = this.current();
    const now = cur && cur.row === r && cur.col === c ? ' now' : '';
    return (e ? 'ev-' + e.kind : '') + now;
  }

  protected go(i: number): void {
    this.index.set(Math.max(-1, Math.min(i, this.run().events.length - 1)));
    if (i < 0) this.stop();
  }

  protected toggle(): void {
    if (this.playing()) {
      this.stop();
      return;
    }
    if (!this.browser) return;
    if (this.done()) this.index.set(-1);
    this.playing.set(true);
    this.timer = setInterval(() => {
      if (this.done()) {
        this.stop();
        return;
      }
      this.index.update((i) => i + 1);
    }, 1100);
  }

  private stop(): void {
    this.playing.set(false);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
