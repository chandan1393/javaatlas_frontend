import { Component, computed, inject, input, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Policy = 'abort' | 'callerRuns' | 'discard' | 'discardOldest';
interface Task {
  id: number;
  total: number;
  left: number;
}
interface Worker {
  n: number;
  task: Task | null;
  idle: number;
}
interface Config {
  core: number;
  max: number;
  /** Queue capacity; Infinity = unbounded LinkedBlockingQueue; 0 = SynchronousQueue (direct hand-off). */
  queue: number;
  policy: Policy;
  keepAlive: number;
}

const PRESETS: { id: string; label: string; code: string; cfg: Config; intro: string }[] = [
  {
    id: 'bounded',
    label: 'Bounded pool',
    code: 'new ThreadPoolExecutor(2, 4, 3, SECONDS, new ArrayBlockingQueue<>(3), new AbortPolicy())',
    cfg: { core: 2, max: 4, queue: 3, policy: 'abort', keepAlive: 3 },
    intro: 'Submit tasks one by one: the 1st and 2nd start core threads, the next 3 wait in the queue, then extra threads start, then tasks are rejected.',
  },
  {
    id: 'fixed',
    label: 'newFixedThreadPool(2)',
    code: 'Executors.newFixedThreadPool(2)   // core = max = 2, unbounded LinkedBlockingQueue',
    cfg: { core: 2, max: 2, queue: Infinity, policy: 'abort', keepAlive: 3 },
    intro: 'Two threads and an unbounded queue: the pool never grows and never rejects, so under load the queue can grow without limit.',
  },
  {
    id: 'cached',
    label: 'newCachedThreadPool()',
    code: 'Executors.newCachedThreadPool()   // core 0, max unlimited, SynchronousQueue, 60 s keep-alive',
    cfg: { core: 0, max: 8, queue: 0, policy: 'abort', keepAlive: 3 },
    intro: 'No queue at all: each task goes to an idle thread or a brand-new one. Great for bursts of short tasks, dangerous under heavy load.',
  },
];

const POLICY_NAMES: Record<Policy, string> = {
  abort: 'AbortPolicy',
  callerRuns: 'CallerRunsPolicy',
  discard: 'DiscardPolicy',
  discardOldest: 'DiscardOldestPolicy',
};

/** Submit tasks to a ThreadPoolExecutor and watch threads, the queue and rejections, following the real rules. */
@Component({
  selector: 'app-threadpool-lab',
  template: `
    <section class="hml tp" aria-labelledby="tp-h">
      <header class="hml-head">
        <div>
          <h2 id="tp-h">Thread pool lab</h2>
          <p class="muted">{{ intro() }}</p>
        </div>
        <div class="hml-presets" role="group" aria-label="Pools">
          @for (p of presets; track p.id) {
            <button type="button" class="chip" [attr.aria-pressed]="preset$() === p.id" (click)="load(p.id)">{{ p.label }}</button>
          }
        </div>
      </header>

      <code class="tp-code">{{ codeLine() }}</code>

      <div class="hml-settings tp-settings">
        <label>core <select class="field" [value]="cfg().core" (change)="set('core', +$any($event.target).value)">
          @for (n of [0, 1, 2, 3, 4]; track n) { <option [value]="n" [selected]="n === cfg().core">{{ n }}</option> }
        </select></label>
        <label>max <select class="field" [value]="cfg().max" (change)="set('max', +$any($event.target).value)">
          @for (n of [1, 2, 3, 4, 6, 8]; track n) { <option [value]="n" [selected]="n === cfg().max">{{ n }}</option> }
        </select></label>
        <label>queue <select class="field" [value]="queueValue()" (change)="setQueue($any($event.target).value)">
          <option value="0" [selected]="queueValue() === '0'">0 (hand-off)</option>
          @for (n of [1, 2, 3, 5]; track n) { <option [value]="n" [selected]="queueValue() === '' + n">{{ n }}</option> }
          <option value="inf" [selected]="queueValue() === 'inf'">unbounded</option>
        </select></label>
        <label>when full <select class="field" [value]="cfg().policy" (change)="set('policy', $any($event.target).value)">
          @for (p of policies; track p) { <option [value]="p" [selected]="p === cfg().policy">{{ policyName(p) }}</option> }
        </select></label>
      </div>

      <div class="hml-controls">
        <button type="button" class="btn btn-primary btn-sm" (click)="submit(1)" [disabled]="!!caller()">Submit a task</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="submit(5)" [disabled]="!!caller()">Submit 5</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="tick()">Time passes (1 tick)</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="toggleAuto()">{{ auto() ? 'Stop the clock' : 'Run the clock' }}</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="reset()">Reset</button>
      </div>

      <dl class="hml-stats">
        <div><dt>threads</dt><dd>{{ workers().length }}/{{ cfg().max }}</dd></div>
        <div><dt>busy</dt><dd>{{ busy() }}</dd></div>
        <div><dt>queued</dt><dd>{{ queue().length }}</dd></div>
        <div><dt>completed</dt><dd>{{ completed() }}</dd></div>
        <div><dt>rejected</dt><dd>{{ rejected() }}</dd></div>
      </dl>

      <div class="tp-area">
        <div class="tp-col">
          <span class="ml-label">Worker threads</span>
          @for (w of workers(); track w.n) {
            <div class="tp-worker" [class.busy]="w.task" [class.extra]="w.n > cfg().core && workers().length > cfg().core">
              <span>pool-1-thread-{{ w.n }}</span>
              @if (w.task; as t) {
                <b>task #{{ t.id }}</b>
                <span class="tp-bar"><i [style.width.%]="((t.total - t.left) / t.total) * 100"></i></span>
              } @else {
                <em>idle{{ workers().length > cfg().core ? ' (' + w.idle + '/' + cfg().keepAlive + ' ticks)' : '' }}</em>
              }
            </div>
          } @empty {
            <p class="muted">No threads yet: they're created on demand.</p>
          }
          <div class="tp-worker caller" [class.busy]="caller()">
            <span>main (the caller)</span>
            @if (caller(); as t) {
              <b>running task #{{ t.id }} itself</b>
              <span class="tp-bar"><i [style.width.%]="((t.total - t.left) / t.total) * 100"></i></span>
            } @else {
              <em>free to submit</em>
            }
          </div>
        </div>
        <div class="tp-col">
          <span class="ml-label">Work queue {{ cfg().queue === Infinity ? '(unbounded)' : cfg().queue === 0 ? '(no storage: direct hand-off)' : '(capacity ' + cfg().queue + ')' }}</span>
          <div class="tp-queue">
            @for (t of queue(); track t.id) {
              <span class="tp-task">#{{ t.id }}</span>
            }
            @for (s of emptySlots(); track $index) {
              <span class="tp-slot"></span>
            }
            @if (cfg().queue === 0) {
              <span class="muted">Tasks can only be handed straight to an idle thread.</span>
            }
          </div>
          @if (dropped().length) {
            <span class="ml-label">Rejected or discarded</span>
            <div class="tp-queue">
              @for (t of dropped(); track t) {
                <span class="tp-task bad">#{{ t }}</span>
              }
            </div>
          }
        </div>
      </div>

      <ol class="hml-steps" aria-live="polite">
        @for (s of log().slice(-7); track $index) {
          <li [class]="'st-' + s.kind"><span [innerHTML]="s.html"></span></li>
        } @empty {
          <li class="st-info">Press <strong>Submit a task</strong> and watch where it goes.</li>
        }
      </ol>
    </section>
  `,
})
export class ThreadpoolLabComponent implements OnInit, OnDestroy {
  readonly preset = input<string>('bounded');
  protected readonly presets = PRESETS;
  protected readonly policies: Policy[] = ['abort', 'callerRuns', 'discard', 'discardOldest'];
  protected readonly Infinity = Infinity;

  protected readonly preset$ = signal('bounded');
  protected readonly cfg = signal<Config>(PRESETS[0].cfg);
  protected readonly workers = signal<Worker[]>([]);
  protected readonly queue = signal<Task[]>([]);
  protected readonly caller = signal<Task | null>(null);
  protected readonly completed = signal(0);
  protected readonly rejected = signal(0);
  protected readonly dropped = signal<number[]>([]);
  protected readonly log = signal<{ kind: string; html: string }[]>([]);
  protected readonly auto = signal(false);

  private nextTask = 1;
  private nextWorker = 1;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly busy = computed(() => this.workers().filter((w) => w.task).length);
  protected readonly intro = computed(() => PRESETS.find((p) => p.id === this.preset$())?.intro ?? 'A custom configuration: try submitting tasks.');
  protected readonly codeLine = computed(() => {
    const c = this.cfg();
    const p = PRESETS.find((x) => x.id === this.preset$());
    if (p && JSON.stringify(p.cfg) === JSON.stringify(c)) return p.code;
    const q = c.queue === Infinity ? 'new LinkedBlockingQueue<>()' : c.queue === 0 ? 'new SynchronousQueue<>()' : `new ArrayBlockingQueue<>(${c.queue})`;
    return `new ThreadPoolExecutor(${c.core}, ${c.max}, ${c.keepAlive}, SECONDS, ${q}, new ${POLICY_NAMES[c.policy]}())`;
  });
  protected readonly queueValue = computed(() => (this.cfg().queue === Infinity ? 'inf' : String(this.cfg().queue)));
  protected readonly emptySlots = computed(() => {
    const cap = this.cfg().queue;
    return cap === Infinity || cap === 0 ? [] : Array.from({ length: Math.max(0, cap - this.queue().length) });
  });

  ngOnInit(): void {
    this.load(PRESETS.some((p) => p.id === this.preset()) ? this.preset() : 'bounded');
  }

  ngOnDestroy(): void {
    this.stopAuto();
  }

  protected policyName(p: Policy): string {
    return POLICY_NAMES[p];
  }

  protected load(id: string): void {
    const p = PRESETS.find((x) => x.id === id) ?? PRESETS[0];
    this.preset$.set(p.id);
    this.cfg.set({ ...p.cfg });
    this.reset();
  }

  protected set<K extends keyof Config>(key: K, value: Config[K]): void {
    const c = { ...this.cfg(), [key]: value };
    if (c.max < c.core) c.max = Math.max(c.core, 1);
    if (c.max < 1) c.max = 1;
    this.preset$.set('custom');
    this.cfg.set(c);
    this.reset();
  }

  protected setQueue(v: string): void {
    this.set('queue', v === 'inf' ? Infinity : +v);
  }

  protected reset(): void {
    this.stopAuto();
    this.workers.set([]);
    this.queue.set([]);
    this.caller.set(null);
    this.completed.set(0);
    this.rejected.set(0);
    this.dropped.set([]);
    this.log.set([]);
    this.nextTask = 1;
    this.nextWorker = 1;
  }

  protected submit(n: number): void {
    for (let i = 0; i < n && !this.caller(); i++) this.execute();
  }

  /** ThreadPoolExecutor.execute(), step by step. */
  private execute(): void {
    const c = this.cfg();
    const total = 2 + Math.floor(Math.random() * 3);
    const task: Task = { id: this.nextTask++, total, left: total };
    const workers = [...this.workers()];
    const say = (kind: string, html: string) => this.log.update((l) => [...l, { kind, html }]);

    // 1. Fewer than corePoolSize threads: always start a new thread, even if others are idle.
    if (workers.length < c.core) {
      workers.push({ n: this.nextWorker++, task, idle: 0 });
      this.workers.set(workers);
      say('step', `Task #${task.id}: ${workers.length - 1} of ${c.core} core threads exist, so a <strong>new core thread</strong> starts with it (even if another is idle).`);
      return;
    }
    // 2. Try the queue. A SynchronousQueue (capacity 0) only accepts if an idle thread is waiting.
    const idle = workers.find((w) => !w.task);
    if (c.queue === 0 && idle) {
      idle.task = task;
      idle.idle = 0;
      this.workers.set(workers);
      say('step', `Task #${task.id}: handed directly to idle <strong>thread-${idle.n}</strong> (SynchronousQueue hand-off).`);
      return;
    }
    if (c.queue > 0 && this.queue().length < c.queue) {
      this.queue.update((q) => [...q, task]);
      say('step', `Task #${task.id}: all core threads exist, so it's <strong>queued</strong> (${this.queue().length}${c.queue === Infinity ? '' : '/' + c.queue}).`);
      if (workers.length === 0) {
        workers.push({ n: this.nextWorker++, task: null, idle: 0 });
        this.workers.set(workers);
        say('info', 'No threads were running, so the pool starts one to process the queue.');
      }
      this.dispatch();
      return;
    }
    // 3. Queue full: add a thread up to maximumPoolSize.
    if (workers.length < c.max) {
      workers.push({ n: this.nextWorker++, task, idle: 0 });
      this.workers.set(workers);
      say('warn', `Task #${task.id}: the queue is ${c.queue === 0 ? 'a hand-off with no idle thread' : 'full'}, so an <strong>extra thread</strong> starts (${workers.length}/${c.max}).`);
      return;
    }
    // 4. Saturated: rejection policy.
    this.rejected.update((n) => n + 1);
    switch (c.policy) {
      case 'abort':
        this.dropped.update((d) => [...d, task.id]);
        say('miss', `Task #${task.id}: queue full and ${c.max}/${c.max} threads busy. AbortPolicy throws <strong>RejectedExecutionException</strong>.`);
        break;
      case 'discard':
        this.dropped.update((d) => [...d, task.id]);
        say('miss', `Task #${task.id}: saturated. DiscardPolicy <strong>silently drops</strong> it. No error, no trace.`);
        break;
      case 'discardOldest': {
        const q = [...this.queue()];
        const oldest = q.shift();
        if (oldest && c.queue > 0) {
          q.push(task);
          this.queue.set(q);
          this.dropped.update((d) => [...d, oldest.id]);
          say('miss', `Task #${task.id}: saturated. DiscardOldestPolicy <strong>drops the oldest queued task #${oldest.id}</strong> and queues #${task.id}.`);
        } else {
          this.dropped.update((d) => [...d, task.id]);
          say('miss', `Task #${task.id}: saturated and nothing is queued to discard, so it's dropped.`);
        }
        break;
      }
      case 'callerRuns':
        this.caller.set(task);
        say('warn', `Task #${task.id}: saturated. CallerRunsPolicy makes <strong>main run it itself</strong>, so main can't submit anything until it finishes: natural back-pressure.`);
        break;
    }
  }

  /** Idle threads take tasks from the head of the queue. */
  private dispatch(): void {
    const workers = [...this.workers()];
    const q = [...this.queue()];
    for (const w of workers) {
      if (!w.task && q.length) {
        w.task = q.shift()!;
        w.idle = 0;
        this.log.update((l) => [...l, { kind: 'info', html: `thread-${w.n} takes task #${w.task!.id} from the queue.` }]);
      }
    }
    this.workers.set(workers);
    this.queue.set(q);
  }

  protected tick(): void {
    const c = this.cfg();
    let workers = this.workers().map((w) => ({ ...w, task: w.task ? { ...w.task } : null }));
    const say = (kind: string, html: string) => this.log.update((l) => [...l, { kind, html }]);
    for (const w of workers) {
      if (w.task) {
        w.task.left--;
        if (w.task.left <= 0) {
          say('hit', `thread-${w.n} finished task #${w.task.id}.`);
          w.task = null;
          w.idle = 0;
          this.completed.update((n) => n + 1);
        }
      } else {
        w.idle++;
      }
    }
    const callerTask = this.caller();
    if (callerTask) {
      const t = { ...callerTask, left: callerTask.left - 1 };
      if (t.left <= 0) {
        this.caller.set(null);
        this.completed.update((n) => n + 1);
        say('hit', `main finished task #${t.id} and can submit again.`);
      } else {
        this.caller.set(t);
      }
    }
    this.workers.set(workers);
    this.dispatch();
    // Threads above corePoolSize that stayed idle for keepAliveTime end.
    workers = [...this.workers()];
    for (const w of [...workers].reverse()) {
      if (workers.length > c.core && !w.task && w.idle >= c.keepAlive) {
        workers = workers.filter((x) => x !== w);
        say('info', `thread-${w.n} was idle for the keep-alive time and there are more than ${c.core} core thread${c.core === 1 ? '' : 's'}, so it <strong>ends</strong>.`);
      }
    }
    this.workers.set(workers);
  }

  protected toggleAuto(): void {
    if (this.auto()) {
      this.stopAuto();
      return;
    }
    if (!this.browser) return;
    this.auto.set(true);
    this.timer = setInterval(() => this.tick(), 1000);
  }

  private stopAuto(): void {
    this.auto.set(false);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
