import { Component, computed, inject, input, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Mode = 'binary-search' | 'two-pointers' | 'sliding-window' | 'arraylist';
type ListKind = 'arraylist' | 'vector' | 'cow';
interface Frame {
  marks: Record<string, number>;
  /** Cells outside [lo, hi] are greyed out (binary search). */
  range?: [number, number];
  /** Cells inside the window are shaded (sliding window). */
  window?: [number, number];
  hit?: number[];
  note: string;
  kind: 'step' | 'hit' | 'miss';
}

const DEFAULTS: Record<Exclude<Mode, 'arraylist'>, { arr: string; param: number; label: string }> = {
  'binary-search': { arr: '3, 8, 12, 17, 23, 31, 42, 56, 64, 77, 85', param: 56, label: 'target' },
  'two-pointers': { arr: '1, 3, 4, 6, 8, 11, 14', param: 17, label: 'target sum' },
  'sliding-window': { arr: '2, 1, 5, 1, 3, 2, 9, 4, 1', param: 3, label: 'window size k' },
};

function parse(text: string): number[] {
  return text
    .split(/[\s,]+/)
    .map((x) => x.trim())
    .filter((x) => /^-?\d+$/.test(x))
    .map(Number)
    .slice(0, 16);
}

function binarySearch(a: number[], target: number): Frame[] {
  const f: Frame[] = [];
  let lo = 0;
  let hi = a.length - 1;
  let comparisons = 0;
  f.push({ marks: { lo, hi }, range: [lo, hi], note: `Search for ${target} in a sorted array of ${a.length}. Start with lo = 0 and hi = ${hi}.`, kind: 'step' });
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    comparisons++;
    if (a[mid] === target) {
      f.push({ marks: { lo, mid, hi }, range: [lo, hi], hit: [mid], note: `mid = (${lo} + ${hi}) >>> 1 = ${mid}. a[${mid}] is ${a[mid]}: found at index ${mid} after ${comparisons} comparison${comparisons === 1 ? '' : 's'} (a linear search would need ${mid + 1}).`, kind: 'hit' });
      return f;
    }
    if (a[mid] < target) {
      f.push({ marks: { lo, mid, hi }, range: [lo, hi], note: `mid = ${mid}. a[${mid}] = ${a[mid]} is smaller than ${target}, so the answer can only be to the right: lo = ${mid + 1}. Half the array is gone.`, kind: 'step' });
      lo = mid + 1;
    } else {
      f.push({ marks: { lo, mid, hi }, range: [lo, hi], note: `mid = ${mid}. a[${mid}] = ${a[mid]} is bigger than ${target}, so the answer can only be to the left: hi = ${mid - 1}. Half the array is gone.`, kind: 'step' });
      hi = mid - 1;
    }
    f.push({ marks: { lo, hi }, range: [lo, hi], note: lo <= hi ? `Now searching indexes ${lo} to ${hi}.` : `lo (${lo}) is past hi (${hi}): the range is empty.`, kind: 'step' });
  }
  f.push({ marks: { lo }, range: [lo, lo - 1], note: `${target} isn't in the array (${comparisons} comparisons to be sure). Arrays.binarySearch would return -(${lo}) - 1 = ${-lo - 1}: the insertion point, encoded as a negative number.`, kind: 'miss' });
  return f;
}

function twoPointers(a: number[], target: number): Frame[] {
  const f: Frame[] = [];
  let i = 0;
  let j = a.length - 1;
  f.push({ marks: { i, j }, note: `Find two numbers that add up to ${target}. Start with i at the smallest and j at the largest.`, kind: 'step' });
  while (i < j) {
    const sum = a[i] + a[j];
    if (sum === target) {
      f.push({ marks: { i, j }, hit: [i, j], note: `${a[i]} + ${a[j]} = ${target}. Found: indexes ${i} and ${j}, in O(n) instead of checking every pair.`, kind: 'hit' });
      return f;
    }
    if (sum < target) {
      f.push({ marks: { i, j }, note: `${a[i]} + ${a[j]} = ${sum}, too small. Moving j left would only make it smaller, so move i right.`, kind: 'step' });
      i++;
    } else {
      f.push({ marks: { i, j }, note: `${a[i]} + ${a[j]} = ${sum}, too big. Moving i right would only make it bigger, so move j left.`, kind: 'step' });
      j--;
    }
  }
  f.push({ marks: { i, j }, note: `i and j met: no pair adds up to ${target}.`, kind: 'miss' });
  return f;
}

function slidingWindow(a: number[], k: number): Frame[] {
  const f: Frame[] = [];
  if (k < 1 || k > a.length) {
    return [{ marks: {}, note: `k must be between 1 and ${a.length}.`, kind: 'miss' }];
  }
  let sum = a.slice(0, k).reduce((x, y) => x + y, 0);
  let best = sum;
  let bestStart = 0;
  f.push({ marks: { start: 0, end: k - 1 }, window: [0, k - 1], note: `Largest sum of ${k} consecutive numbers. First window: ${a.slice(0, k).join(' + ')} = ${sum}. Best so far: ${best}.`, kind: 'step' });
  for (let end = k; end < a.length; end++) {
    const start = end - k + 1;
    sum += a[end] - a[end - k];
    const better = sum > best;
    if (better) {
      best = sum;
      bestStart = start;
    }
    f.push({
      marks: { start, end },
      window: [start, end],
      note: `Slide right: add ${a[end]}, remove ${a[end - k]} → sum = ${sum}${better ? `, a new best` : ` (best is still ${best})`}. One addition and one subtraction instead of re-adding ${k} numbers.`,
      kind: 'step',
    });
  }
  f.push({ marks: { start: bestStart, end: bestStart + k - 1 }, window: [bestStart, bestStart + k - 1], hit: Array.from({ length: k }, (_, x) => bestStart + x), note: `The best window starts at index ${bestStart}: sum ${best}. Total work: O(n).`, kind: 'hit' });
  return f;
}

/** Binary search, two pointers and sliding window on your own input, plus how ArrayList grows. */
@Component({
  selector: 'app-array-lab',
  template: `
    <section class="hml al" aria-labelledby="al-h">
      <header class="hml-head">
        <div>
          <h2 id="al-h">{{ mode() === 'arraylist' ? kindName() + ' lab' : 'Array lab' }}</h2>
          <p class="muted">{{ intro() }}</p>
        </div>
        <div class="hml-presets" role="group" aria-label="Algorithms">
          @for (p of presets; track p.id) {
            <button type="button" class="chip" [attr.aria-pressed]="mode() === p.id" (click)="load(p.id)">{{ p.label }}</button>
          }
        </div>
      </header>

      @if (mode() !== 'arraylist') {
        <div class="hml-controls">
          <label>Array <input class="field al-input" [value]="arrText()" (change)="arrText.set($any($event.target).value); rerun()" spellcheck="false" /></label>
          <label>{{ paramLabel() }} <input class="field al-param" type="number" [value]="param()" (change)="param.set(+$any($event.target).value); rerun()" /></label>
          @if (sortedNote()) {
            <span class="muted">{{ sortedNote() }}</span>
          }
        </div>

        <div class="al-cells" role="img" [attr.aria-label]="'Array: ' + arr().join(', ')">
          @for (v of arr(); track $index; let i = $index) {
            <div class="al-cell" [class.out]="isOut(i)" [class.win]="inWindow(i)" [class.hit]="frame()?.hit?.includes(i)">
              <b>{{ v }}</b>
              <small>{{ i }}</small>
              <span class="al-marks">
                @for (m of marksAt(i); track m) {
                  <i [attr.data-m]="m">{{ m }}</i>
                }
              </span>
            </div>
          }
        </div>

        <p class="ml-note" [class.hitnote]="frame()?.kind === 'hit'" [class.missnote]="frame()?.kind === 'miss'" aria-live="polite">{{ frame()?.note ?? 'Press Next to start.' }}</p>

        <div class="hml-controls ml-bar">
          <button type="button" class="btn btn-ghost btn-sm" (click)="go(index() - 1)" [disabled]="index() <= 0">← Back</button>
          <button type="button" class="btn btn-primary btn-sm" (click)="go(index() + 1)" [disabled]="index() >= frames().length - 1">Next →</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="toggle()">{{ playing() ? 'Pause' : 'Play' }}</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="go(0)">Restart</button>
          <span class="muted">Step {{ index() + 1 }} of {{ frames().length }}</span>
        </div>
      } @else {
        <div class="hml-presets al-kinds" role="group" aria-label="List type">
          <button type="button" class="chip" [attr.aria-pressed]="kind() === 'arraylist'" (click)="setKind('arraylist')">ArrayList</button>
          <button type="button" class="chip" [attr.aria-pressed]="kind() === 'vector'" (click)="setKind('vector')">Vector</button>
          <button type="button" class="chip" [attr.aria-pressed]="kind() === 'cow'" (click)="setKind('cow')">CopyOnWriteArrayList</button>
        </div>
        <div class="hml-controls">
          @if (kind() === 'cow') {
            <button type="button" class="btn btn-brand btn-sm" (click)="snapshot()">Start iterating (take a snapshot)</button>
          }
          <button type="button" class="btn btn-primary btn-sm" (click)="add(false)">list.add({{ nextValue() }})</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="add(true)">list.add(0, {{ nextValue() }})</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="removeFirst()" [disabled]="!list().length">list.remove(0)</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="addMany()">add 10 more</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="resetList()">new ArrayList&lt;&gt;()</button>
        </div>
        <dl class="hml-stats">
          <div><dt>size()</dt><dd>{{ list().length }}</dd></div>
          <div><dt>capacity</dt><dd>{{ capacity() }}</dd></div>
          <div><dt>grows</dt><dd>{{ grows() }}</dd></div>
          <div><dt>elements copied</dt><dd>{{ copies() }}</dd></div>
        </dl>
        @if (snap(); as sn) {
          <p class="al-snap"><strong>An iterator is walking a snapshot:</strong> [{{ sn.join(', ') }}]. Changes made now don't affect it, and it never throws ConcurrentModificationException.</p>
        }
        @if (capacity() === 0) {
          <p class="hml-empty">{{ kind() === 'cow' ? 'new CopyOnWriteArrayList<>() starts with an empty array: it is always exactly as long as the list.' : 'new ArrayList<>() starts with an empty shared array: no space is reserved until the first add, which creates room for 10.' }}</p>
        } @else {
          <div class="al-cells al-list">
            @for (c of slots(); track $index; let i = $index) {
              <div class="al-cell" [class.empty]="c === null" [class.moved]="moved().includes(i)" [class.hit]="i === lastIndex()">
                <b>{{ c ?? '' }}</b>
                <small>{{ i }}</small>
              </div>
            }
          </div>
        }
        <ol class="hml-steps" aria-live="polite">
          @for (s of listLog().slice(-5); track $index) {
            <li [class]="'st-' + s.kind">{{ s.text }}</li>
          } @empty {
            <li class="st-info">Press list.add(...) and watch the array underneath the list.</li>
          }
        </ol>
      }
    </section>
  `,
})
export class ArrayLabComponent implements OnInit, OnDestroy {
  readonly preset = input<string>('binary-search');
  protected readonly presets: { id: Mode; label: string }[] = [
    { id: 'binary-search', label: 'Binary search' },
    { id: 'two-pointers', label: 'Two pointers' },
    { id: 'sliding-window', label: 'Sliding window' },
    { id: 'arraylist', label: 'ArrayList growth' },
  ];
  protected readonly mode = signal<Mode>('binary-search');
  protected readonly arrText = signal(DEFAULTS['binary-search'].arr);
  protected readonly param = signal(DEFAULTS['binary-search'].param);
  protected readonly index = signal(0);
  protected readonly playing = signal(false);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly paramLabel = computed(() => (this.mode() === 'arraylist' ? '' : DEFAULTS[this.mode() as Exclude<Mode, 'arraylist'>].label));
  protected readonly intro = computed(() => {
    const m = this.mode();
    if (m === 'binary-search') return 'Halve the search range on every comparison: a million sorted items need at most 20 comparisons. Edit the array or the target.';
    if (m === 'two-pointers') return 'In a sorted array, two pointers moving towards each other find a pair with a given sum in one pass.';
    if (m === 'sliding-window') return 'Slide a window of k elements across the array, updating the sum instead of recomputing it.';
    return 'An ArrayList is an array with spare room. Watch what add() really does when the room runs out, and why add(0, x) is slow.';
  });
  private readonly raw = computed(() => parse(this.arrText()));
  protected readonly arr = computed(() => (this.mode() === 'binary-search' || this.mode() === 'two-pointers' ? [...this.raw()].sort((a, b) => a - b) : this.raw()));
  protected readonly sortedNote = computed(() => {
    const r = this.raw();
    const needsSort = this.mode() === 'binary-search' || this.mode() === 'two-pointers';
    return needsSort && r.some((v, i) => i > 0 && r[i - 1] > v) ? 'This algorithm needs a sorted array, so your input was sorted first.' : '';
  });
  protected readonly frames = computed<Frame[]>(() => {
    const a = this.arr();
    if (!a.length) return [{ marks: {}, note: 'Enter some numbers, separated by commas.', kind: 'miss' }];
    switch (this.mode()) {
      case 'binary-search':
        return binarySearch(a, this.param());
      case 'two-pointers':
        return twoPointers(a, this.param());
      case 'sliding-window':
        return slidingWindow(a, this.param());
      default:
        return [];
    }
  });
  protected readonly frame = computed<Frame | undefined>(() => this.frames()[this.index()]);

  // ArrayList mode
  protected readonly list = signal<number[]>([]);
  protected readonly capacity = signal(0);
  protected readonly grows = signal(0);
  protected readonly copies = signal(0);
  protected readonly moved = signal<number[]>([]);
  protected readonly lastIndex = signal(-1);
  protected readonly listLog = signal<{ kind: string; text: string }[]>([]);
  protected readonly kind = signal<ListKind>('arraylist');
  protected readonly snap = signal<number[] | null>(null);
  protected readonly kindName = computed(() => ({ arraylist: 'ArrayList', vector: 'Vector', cow: 'CopyOnWriteArrayList' })[this.kind()]);
  /** The value the next add() inserts (5, 10, 15, ...), shown on the buttons. */
  protected readonly nextValue = signal(5);
  protected readonly slots = computed(() => Array.from({ length: this.capacity() }, (_, i) => (i < this.list().length ? this.list()[i] : null)));

  ngOnInit(): void {
    const p = this.preset();
    if (p === 'vector' || p === 'cow') {
      this.load('arraylist');
      this.setKind(p);
      return;
    }
    this.load(this.presets.some((x) => x.id === p) ? (p as Mode) : 'binary-search');
  }

  ngOnDestroy(): void {
    this.stop();
  }

  protected load(m: Mode): void {
    this.stop();
    this.mode.set(m);
    if (m !== 'arraylist') {
      this.arrText.set(DEFAULTS[m].arr);
      this.param.set(DEFAULTS[m].param);
      this.index.set(0);
    } else {
      this.resetList();
    }
  }

  protected rerun(): void {
    this.stop();
    this.index.set(0);
  }

  protected isOut(i: number): boolean {
    const r = this.frame()?.range;
    return !!r && (i < r[0] || i > r[1]);
  }

  protected inWindow(i: number): boolean {
    const w = this.frame()?.window;
    return !!w && i >= w[0] && i <= w[1];
  }

  protected marksAt(i: number): string[] {
    const marks = this.frame()?.marks ?? {};
    return Object.entries(marks).filter(([, v]) => v === i).map(([k]) => k);
  }

  protected go(i: number): void {
    this.index.set(Math.max(0, Math.min(i, this.frames().length - 1)));
  }

  protected toggle(): void {
    if (this.playing()) {
      this.stop();
      return;
    }
    if (!this.browser) return;
    if (this.index() >= this.frames().length - 1) this.index.set(0);
    this.playing.set(true);
    this.timer = setInterval(() => {
      if (this.index() >= this.frames().length - 1) {
        this.stop();
        return;
      }
      this.index.update((i) => i + 1);
    }, 1500);
  }

  private stop(): void {
    this.playing.set(false);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  // ---- ArrayList, Vector and CopyOnWriteArrayList: their real growth rules ----
  protected setKind(k: ListKind): void {
    this.kind.set(k);
    this.resetList();
  }

  protected snapshot(): void {
    this.snap.set([...this.list()]);
    this.listLog.update((l) => [...l, { kind: 'info', text: `iterator() captures the current array [${this.list().join(', ')}]. The iterator will only ever see these elements.` }]);
  }

  protected resetList(): void {
    this.snap.set(null);
    this.list.set([]);
    this.capacity.set(0);
    this.grows.set(0);
    this.copies.set(0);
    this.moved.set([]);
    this.lastIndex.set(-1);
    this.listLog.set([]);
    this.nextValue.set(5);
    if (this.kind() === 'vector') {
      this.capacity.set(10);
      this.listLog.set([{ kind: 'info', text: 'new Vector<>() allocates 10 slots straight away. Every method is synchronized, even in single-threaded code.' }]);
    }
  }

  private ensureCapacity(needed: number, log: { kind: string; text: string }[]): void {
    const cap = this.capacity();
    if (this.kind() === 'cow') {
      // Every write builds a brand-new array exactly one longer and copies everything.
      this.copies.update((c) => c + this.list().length);
      this.grows.update((g) => g + 1);
      this.capacity.set(needed);
      log.push({ kind: 'warn', text: `CopyOnWriteArrayList copies all ${this.list().length} elements into a new array of ${needed} for this one write. Reads stay lock-free and safe; writes are expensive.` });
      return;
    }
    if (needed <= cap) return;
    if (this.kind() === 'vector') {
      const grown = cap * 2;
      this.copies.update((c) => c + this.list().length);
      this.grows.update((g) => g + 1);
      log.push({ kind: 'warn', text: `The Vector is full (capacity ${cap}). It doubles to ${grown} and copies all ${this.list().length} elements (ArrayList would only grow by half).` });
      this.capacity.set(grown);
      return;
    }
    const grown = cap === 0 ? 10 : Math.max(needed, cap + (cap >> 1));
    if (cap > 0) {
      this.copies.update((c) => c + this.list().length);
      this.grows.update((g) => g + 1);
      log.push({ kind: 'warn', text: `The array is full (capacity ${cap}). ArrayList allocates a new array of ${cap} + ${cap} >> 1 = ${grown} and copies all ${this.list().length} elements into it.` });
    } else {
      log.push({ kind: 'info', text: 'First add: the empty default array is replaced by a real array with room for 10.' });
    }
    this.capacity.set(grown);
  }

  protected add(atStart: boolean): void {
    const log = [...this.listLog()];
    const value = this.nextValue();
    this.nextValue.update((v) => v + 5);
    this.ensureCapacity(this.list().length + 1, log);
    const list = [...this.list()];
    if (atStart) {
      const shifted = list.length;
      list.unshift(value);
      if (this.kind() !== 'cow') this.copies.update((c) => c + shifted);   // CopyOnWrite already copied everything
      this.moved.set(Array.from({ length: shifted }, (_, i) => i + 1));
      this.lastIndex.set(0);
      log.push({ kind: shifted ? 'warn' : 'step', text: shifted ? `add(0, ${value}): every one of the ${shifted} elements shifts one place right (System.arraycopy) to make room. O(n).` : `add(0, ${value}) into an empty list: nothing to shift.` });
    } else {
      list.push(value);
      this.moved.set([]);
      this.lastIndex.set(list.length - 1);
      log.push({ kind: 'step', text: `add(${value}) writes into the next free slot, index ${list.length - 1}. O(1) while there's room.` });
    }
    this.list.set(list);
    this.listLog.set(log);
  }

  protected addMany(): void {
    for (let i = 0; i < 10; i++) this.add(false);
  }

  protected removeFirst(): void {
    const list = [...this.list()];
    if (!list.length) return;
    const removed = list.shift();
    this.copies.update((c) => c + list.length);
    if (this.kind() === 'cow') this.capacity.set(list.length);
    this.moved.set(Array.from({ length: list.length }, (_, i) => i));
    this.lastIndex.set(-1);
    this.list.set(list);
    this.listLog.update((l) => [...l, { kind: 'warn', text: `remove(0) takes out ${removed} and shifts the other ${list.length} elements one place left. The capacity stays ${this.capacity()}: ArrayList never shrinks on its own (trimToSize() does that).` }]);
  }
}
