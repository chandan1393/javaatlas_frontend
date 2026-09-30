import { Component, computed, input, OnInit, signal } from '@angular/core';

type Mode = 'race' | 'sync' | 'atomic' | 'deadlock' | 'ordering';
type OpKind = 'read' | 'add' | 'write' | 'lock' | 'unlock' | 'get' | 'cas' | 'work';

interface Op {
  kind: OpKind;
  /** Index of the code line to highlight. */
  line: number;
  lock?: string;
}

interface Th {
  name: string;
  ops: Op[];
  pc: number;
  tmp: number | null;
  prev: number | null;
  state: 'RUNNABLE' | 'BLOCKED' | 'TERMINATED';
  waitingFor: string | null;
  retries: number;
  done: number;
}

interface World {
  count: number;
  owners: Record<string, string | null>;
  threads: [Th, Th];
  log: { kind: string; text: string }[];
  deadlock: boolean;
}

const INCREMENTS = 3;

const CODE: Record<Mode, string[]> = {
  race: ['tmp = count;    // 1. read', 'tmp = tmp + 1;  // 2. add', 'count = tmp;    // 3. write'],
  sync: ['synchronized (lock) {', '    tmp = count;', '    tmp = tmp + 1;', '    count = tmp;', '}'],
  atomic: ['int prev = count.get();', 'if (!count.compareAndSet(prev, prev + 1)) retry;'],
  deadlock: ['synchronized (first) {', '    synchronized (second) {', '        transfer();', '    }', '}'],
  ordering: ['synchronized (a) {', '    synchronized (b) {', '        transfer();', '    }', '}'],
};

function counterOps(mode: Mode): Op[] {
  const one: Op[] =
    mode === 'race'
      ? [{ kind: 'read', line: 0 }, { kind: 'add', line: 1 }, { kind: 'write', line: 2 }]
      : mode === 'sync'
        ? [{ kind: 'lock', line: 0, lock: 'lock' }, { kind: 'read', line: 1 }, { kind: 'add', line: 2 }, { kind: 'write', line: 3 }, { kind: 'unlock', line: 4, lock: 'lock' }]
        : [{ kind: 'get', line: 0 }, { kind: 'cas', line: 1 }];
  return Array.from({ length: INCREMENTS }, () => one.map((o) => ({ ...o }))).flat();
}

function lockOps(first: string, second: string): Op[] {
  return [
    { kind: 'lock', line: 0, lock: first },
    { kind: 'lock', line: 1, lock: second },
    { kind: 'work', line: 2 },
    { kind: 'unlock', line: 3, lock: second },
    { kind: 'unlock', line: 4, lock: first },
  ];
}

function newWorld(mode: Mode): World {
  const counter = mode === 'race' || mode === 'sync' || mode === 'atomic';
  const t = (name: string, ops: Op[]): Th => ({ name, ops, pc: 0, tmp: null, prev: null, state: 'RUNNABLE', waitingFor: null, retries: 0, done: 0 });
  const threads: [Th, Th] = counter
    ? [t('Thread 1', counterOps(mode)), t('Thread 2', counterOps(mode))]
    : [t('Thread 1', lockOps('A', 'B')), t('Thread 2', mode === 'deadlock' ? lockOps('B', 'A') : lockOps('A', 'B'))];
  return { count: 0, owners: counter ? { lock: null } : { A: null, B: null }, threads, log: [], deadlock: false };
}

function clone(w: World): World {
  return {
    count: w.count,
    owners: { ...w.owners },
    threads: [{ ...w.threads[0] }, { ...w.threads[1] }],
    log: [...w.log],
    deadlock: w.deadlock,
  };
}

/** Runs one micro-step of thread i. Returns false if the thread couldn't do anything. */
function step(w: World, i: 0 | 1, mode: Mode, quiet = false): boolean {
  const th = w.threads[i];
  if (th.state === 'TERMINATED' || w.deadlock) return false;
  const op = th.ops[th.pc];
  const say = (kind: string, text: string) => {
    if (!quiet) w.log.push({ kind, text: `${th.name}: ${text}` });
  };
  switch (op.kind) {
    case 'read':
      th.tmp = w.count;
      say('step', `reads count → its own copy tmp = ${th.tmp}`);
      break;
    case 'add':
      th.tmp = (th.tmp ?? 0) + 1;
      say('step', `adds 1 to its copy → tmp = ${th.tmp} (count in memory is still ${w.count})`);
      break;
    case 'write': {
      const lost = th.tmp !== null && th.tmp <= w.count;
      w.count = th.tmp ?? 0;
      if (mode === 'race') th.done++;          // with synchronized, the increment counts once the lock is released
      say(lost ? 'miss' : 'hit', lost ? `writes ${w.count}, overwriting the other thread's update: an update is LOST` : `writes count = ${w.count}`);
      break;
    }
    case 'lock': {
      const owner = w.owners[op.lock!];
      if (owner && owner !== th.name) {
        if (th.state !== 'BLOCKED') say('warn', `tries to lock ${op.lock}, but ${owner} holds it → BLOCKED`);
        th.state = 'BLOCKED';
        th.waitingFor = op.lock!;
        detectDeadlock(w, quiet);
        return false;
      }
      w.owners[op.lock!] = th.name;
      th.state = 'RUNNABLE';
      th.waitingFor = null;
      say('step', `locks ${op.lock}`);
      break;
    }
    case 'unlock':
      w.owners[op.lock!] = null;
      say('step', `releases ${op.lock}`);
      if (mode === 'sync') th.done++;
      for (const other of w.threads) {
        if (other.state === 'BLOCKED' && other.waitingFor === op.lock) {
          other.state = 'RUNNABLE';
          if (!quiet) w.log.push({ kind: 'info', text: `${other.name} can now try again to lock ${op.lock}` });
        }
      }
      break;
    case 'get':
      th.prev = w.count;
      say('step', `reads prev = ${th.prev}`);
      break;
    case 'cas':
      if (w.count === th.prev) {
        w.count = (th.prev ?? 0) + 1;
        th.done++;
        say('hit', `compareAndSet(${th.prev}, ${w.count}) succeeds: count was still ${th.prev}, so it becomes ${w.count} in one atomic step`);
      } else {
        th.retries++;
        say('warn', `compareAndSet(${th.prev}, ${(th.prev ?? 0) + 1}) FAILS: count is now ${w.count} (the other thread changed it). Nothing is lost: retry`);
        th.pc--;           // back to get(): read the fresh value and try again
        return true;
      }
      break;
    case 'work':
      say('step', `holds ${Object.entries(w.owners).filter(([, o]) => o === th.name).map(([k]) => k).join(' and ')} and does the transfer`);
      th.done++;
      break;
  }
  th.pc++;
  if (th.pc >= th.ops.length) {
    th.state = 'TERMINATED';
    if (!quiet) w.log.push({ kind: 'info', text: `${th.name} has finished.` });
  }
  return true;
}

function detectDeadlock(w: World, quiet: boolean): void {
  const [a, b] = w.threads;
  if (a.state === 'BLOCKED' && b.state === 'BLOCKED' && w.owners[a.waitingFor!] === b.name && w.owners[b.waitingFor!] === a.name) {
    w.deadlock = true;
    if (!quiet) {
      w.log.push({ kind: 'miss', text: `DEADLOCK: ${a.name} holds ${b.waitingFor} and waits for ${a.waitingFor}; ${b.name} holds ${a.waitingFor} and waits for ${b.waitingFor}. Neither can ever continue.` });
    }
  }
}

function finished(w: World): boolean {
  return w.deadlock || w.threads.every((t) => t.state === 'TERMINATED');
}

/** A random schedule until the end (or a deadlock). */
function runRandom(w: World, mode: Mode, quiet: boolean): void {
  let guard = 0;
  while (!finished(w) && guard++ < 500) {
    const choices = ([0, 1] as const).filter((i) => w.threads[i].state !== 'TERMINATED');
    const i = choices[Math.floor(Math.random() * choices.length)];
    if (!step(w, i, mode, quiet)) {
      const other = (1 - i) as 0 | 1;
      if (w.threads[other].state !== 'TERMINATED') step(w, other, mode, quiet);
    }
  }
}

/** Two threads sharing data, one step at a time: race conditions, synchronized, atomics and deadlock. */
@Component({
  selector: 'app-threads-lab',
  template: `
    <section class="hml tl" aria-labelledby="tl-h">
      <header class="hml-head">
        <div>
          <h2 id="tl-h">Threads lab</h2>
          <p class="muted">You are the scheduler. Choose which thread runs next and watch what happens to shared data.</p>
        </div>
        <div class="hml-presets" role="group" aria-label="Scenarios">
          @for (p of presets; track p.id) {
            <button type="button" class="chip" [attr.aria-pressed]="mode() === p.id" (click)="load(p.id)">{{ p.label }}</button>
          }
        </div>
      </header>

      <p class="tl-goal">{{ goal() }}</p>

      <div class="tl-grid">
        @for (t of world().threads; track t.name; let ti = $index) {
          <div class="tl-thread" [class.blocked]="t.state === 'BLOCKED'" [class.done]="t.state === 'TERMINATED'">
            <div class="tl-thead">
              <strong>{{ t.name }}</strong>
              <span class="tl-state" [attr.data-s]="t.state">{{ t.state }}</span>
            </div>
            <pre class="tl-code">@for (line of code(ti); track $index) {<span [class.cur]="t.state !== 'TERMINATED' && t.ops[t.pc]?.line === $index">{{ line }}</span>
}</pre>
            <div class="tl-local">
              @if (counterMode()) {
                <span>{{ mode() === 'atomic' ? 'prev' : 'tmp' }} = <b>{{ (mode() === 'atomic' ? t.prev : t.tmp) ?? '–' }}</b></span>
                <span>done {{ t.done }}/{{ increments }}</span>
                @if (mode() === 'atomic') {
                  <span>retries {{ t.retries }}</span>
                }
              } @else {
                <span>holds <b>{{ holds(t.name) || 'nothing' }}</b></span>
                @if (t.waitingFor) {
                  <span>waits for <b>{{ t.waitingFor }}</b></span>
                }
              }
            </div>
            <button type="button" class="btn btn-primary btn-sm" (click)="stepThread(ti)" [disabled]="t.state === 'TERMINATED' || world().deadlock">Run {{ t.name }} one step</button>
          </div>
          @if (ti === 0) {
            <div class="tl-shared">
              <span class="tl-label">Shared memory</span>
              @if (counterMode()) {
                <div class="tl-count"><small>count</small><b>{{ world().count }}</b></div>
                @if (mode() === 'sync') {
                  <div class="tl-lock" [class.held]="world().owners['lock']">lock: {{ world().owners['lock'] || 'free' }}</div>
                }
              } @else {
                @for (k of lockNames(); track k) {
                  <div class="tl-lock" [class.held]="world().owners[k]">lock {{ k }}: {{ world().owners[k] || 'free' }}</div>
                }
              }
            </div>
          }
        }
      </div>

      @if (result(); as r) {
        <p class="tl-result" [class.bad]="r.bad">{{ r.text }}</p>
      }

      <div class="hml-controls tl-bar">
        <button type="button" class="btn btn-ghost btn-sm" (click)="randomStep()" [disabled]="isDone()">Random step</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="runToEnd()" [disabled]="isDone()">Run to the end</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="load(mode())">Reset</button>
        <button type="button" class="btn btn-brand btn-sm" (click)="runMany()">Run it 1,000 times</button>
      </div>

      @if (stats(); as s) {
        <div class="tl-stats" aria-live="polite">
          <strong>{{ s.title }}</strong>
          @for (b of s.bars; track b.label) {
            <div class="tl-bar-row"><span>{{ b.label }}</span><i [style.width.%]="b.pct" [class.ok]="b.ok"></i><em>{{ b.pct.toFixed(1) }}%</em></div>
          }
          @if (s.note) {
            <p class="muted">{{ s.note }}</p>
          }
        </div>
      }

      <ol class="hml-steps" aria-live="polite">
        @for (s of world().log.slice(-8); track $index) {
          <li [class]="'st-' + s.kind">{{ s.text }}</li>
        } @empty {
          <li class="st-info">Press a thread's button to run its next step. Try running both threads' "read" before either "write".</li>
        }
      </ol>
    </section>
  `,
})
export class ThreadsLabComponent implements OnInit {
  readonly preset = input<string>('race');
  protected readonly increments = INCREMENTS;
  protected readonly presets: { id: Mode; label: string }[] = [
    { id: 'race', label: 'count++ race' },
    { id: 'sync', label: 'synchronized' },
    { id: 'atomic', label: 'AtomicInteger' },
    { id: 'deadlock', label: 'Deadlock' },
    { id: 'ordering', label: 'Lock ordering fix' },
  ];
  protected readonly mode = signal<Mode>('race');
  protected readonly world = signal<World>(newWorld('race'));
  protected readonly stats = signal<{ title: string; bars: { label: string; pct: number; ok: boolean }[]; note?: string } | null>(null);

  protected readonly counterMode = computed(() => ['race', 'sync', 'atomic'].includes(this.mode()));
  protected readonly isDone = computed(() => finished(this.world()));
  protected readonly goal = computed(() => {
    const goals: Record<Mode, string> = {
      race: `Both threads run count++ ${INCREMENTS} times, so count should end at ${INCREMENTS * 2}. But count++ is three steps: read, add, write. Can you make an update disappear?`,
      sync: 'The same code inside synchronized: only one thread can be between the braces at a time. Try to break it now.',
      atomic: 'AtomicInteger uses compare-and-set: the write only happens if count is still the value that was read. Otherwise it retries.',
      deadlock: 'Thread 1 locks A then B; Thread 2 locks B then A. Run Thread 1 once, then Thread 2 once, and see what happens.',
      ordering: 'The fix: both threads take the locks in the same order (A, then B). Try as hard as you like, it can never deadlock.',
    };
    return goals[this.mode()];
  });
  protected readonly result = computed(() => {
    const w = this.world();
    if (w.deadlock) return { bad: true, text: 'Deadlock! Both threads are BLOCKED forever. In a real application these threads would hang until the JVM is restarted.' };
    if (!finished(w)) return null;
    if (!this.counterMode()) return { bad: false, text: 'Both transfers completed. No deadlock.' };
    const expected = INCREMENTS * 2;
    const retries = w.threads[0].retries + w.threads[1].retries;
    return w.count === expected
      ? { bad: false, text: `count = ${w.count}, exactly as expected.${this.mode() === 'atomic' ? ` (${retries} compare-and-set ${retries === 1 ? 'retry' : 'retries'} along the way, but no lost updates.)` : ''}` }
      : { bad: true, text: `count = ${w.count}, but ${expected} increments ran: ${expected - w.count} ${expected - w.count === 1 ? 'update was' : 'updates were'} lost. That's a race condition.` };
  });

  ngOnInit(): void {
    const ids = this.presets.map((p) => p.id);
    this.load(ids.includes(this.preset() as Mode) ? (this.preset() as Mode) : 'race');
  }

  protected load(mode: Mode): void {
    this.mode.set(mode);
    this.world.set(newWorld(mode));
    this.stats.set(null);
  }

  protected code(i: number): string[] {
    const m = this.mode();
    if (m === 'deadlock') {
      return CODE.deadlock.map((l) => l.replace('first', i === 0 ? 'a' : 'b').replace('second', i === 0 ? 'b' : 'a'));
    }
    return CODE[m];
  }

  protected lockNames(): string[] {
    return Object.keys(this.world().owners);
  }

  protected holds(name: string): string {
    return Object.entries(this.world().owners).filter(([, o]) => o === name).map(([k]) => k).join(', ');
  }

  protected stepThread(i: number): void {
    const w = clone(this.world());
    step(w, i as 0 | 1, this.mode());
    this.world.set(w);
  }

  protected randomStep(): void {
    const w = clone(this.world());
    const choices = ([0, 1] as const).filter((i) => w.threads[i].state !== 'TERMINATED');
    const i = choices[Math.floor(Math.random() * choices.length)];
    if (!step(w, i, this.mode())) {
      const other = (1 - i) as 0 | 1;
      if (w.threads[other].state !== 'TERMINATED') step(w, other, this.mode());
    }
    this.world.set(w);
  }

  protected runToEnd(): void {
    const w = clone(this.world());
    runRandom(w, this.mode(), false);
    this.world.set(w);
  }

  protected runMany(): void {
    const mode = this.mode();
    const runs = 1000;
    if (this.counterMode()) {
      const tally = new Map<number, number>();
      let retries = 0;
      for (let r = 0; r < runs; r++) {
        const w = newWorld(mode);
        runRandom(w, mode, true);
        tally.set(w.count, (tally.get(w.count) ?? 0) + 1);
        retries += w.threads[0].retries + w.threads[1].retries;
      }
      const expected = INCREMENTS * 2;
      const bars = [...tally.entries()].sort((a, b) => b[0] - a[0]).map(([v, n]) => ({ label: `count = ${v}`, pct: (n / runs) * 100, ok: v === expected }));
      const lostRuns = runs - (tally.get(expected) ?? 0);
      this.stats.set({
        title: `1,000 runs with random scheduling (expected ${expected} every time)`,
        bars,
        note: lostRuns
          ? `${lostRuns} of 1,000 runs lost at least one update. Real threads interleave like this, which is why race conditions are so hard to catch in testing.`
          : mode === 'atomic'
            ? `Always correct. On average ${(retries / runs).toFixed(2)} compare-and-set retries per run: contention costs retries, never correctness.`
            : 'Always correct: synchronized lets only one thread read-add-write at a time.',
      });
    } else {
      let dead = 0;
      for (let r = 0; r < runs; r++) {
        const w = newWorld(mode);
        runRandom(w, mode, true);
        if (w.deadlock) dead++;
      }
      this.stats.set({
        title: '1,000 runs with random scheduling',
        bars: [
          { label: 'deadlocked', pct: (dead / runs) * 100, ok: false },
          { label: 'completed', pct: ((runs - dead) / runs) * 100, ok: true },
        ],
        note: dead
          ? 'A deadlock only needs one unlucky interleaving, so code can pass every test and still hang in production.'
          : 'Never deadlocks: with a single global lock order, a cycle of waiting threads is impossible.',
      });
    }
  }
}
