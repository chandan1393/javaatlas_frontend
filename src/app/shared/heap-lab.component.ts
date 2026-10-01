import { Component, computed, inject, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Frame {
  arr: number[];
  hot: number[];
  note: string;
  kind: string;
}

const W = 560;

/** java.util.PriorityQueue: a binary heap stored in an array, shown as the array and as the tree it represents. */
@Component({
  selector: 'app-heap-lab',
  template: `
    <section class="hml hp" aria-labelledby="hp-h">
      <header class="hml-head">
        <div>
          <h2 id="hp-h">PriorityQueue lab</h2>
          <p class="muted">A PriorityQueue is a binary heap in an array: the smallest element is always at index 0. The children of index i live at 2i + 1 and 2i + 2.</p>
        </div>
        <div class="hml-presets" role="group" aria-label="Ordering">
          <button type="button" class="chip" [attr.aria-pressed]="!max()" (click)="setMax(false)">Min-heap (natural order)</button>
          <button type="button" class="chip" [attr.aria-pressed]="max()" (click)="setMax(true)">Max-heap (reverseOrder)</button>
        </div>
      </header>

      <div class="hml-controls">
        <label>value <input class="field ll-num" type="number" [value]="value()" (change)="value.set(+$any($event.target).value)" /></label>
        <button type="button" class="btn btn-primary btn-sm" (click)="offer()" [disabled]="busy()">offer({{ value() }})</button>
        <button type="button" class="btn btn-primary btn-sm" (click)="poll()" [disabled]="busy() || !arr().length">poll()</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="peek()" [disabled]="!arr().length">peek()</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="printIt()" [disabled]="!arr().length">System.out.println(pq)</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="reset()">Reset</button>
      </div>

      <svg class="hp-tree" [attr.viewBox]="'0 0 ' + width + ' ' + height()" role="img" aria-label="Heap as a tree">
        @for (e of edges(); track $index) {
          <line [attr.x1]="e.x1" [attr.y1]="e.y1" [attr.x2]="e.x2" [attr.y2]="e.y2" />
        }
        @for (n of points(); track n.i) {
          <g [class.hot]="hot().includes(n.i)">
            <circle [attr.cx]="n.x" [attr.cy]="n.y" r="18" />
            <text [attr.x]="n.x" [attr.y]="n.y + 5">{{ n.v }}</text>
            <text class="hp-idx" [attr.x]="n.x" [attr.y]="n.y + 32">[{{ n.i }}]</text>
          </g>
        }
      </svg>

      <span class="ml-label">The array inside</span>
      <div class="al-cells">
        @for (v of arr(); track $index; let i = $index) {
          <div class="al-cell" [class.hit]="hot().includes(i)">
            <b>{{ v }}</b>
            <small>{{ i }}</small>
          </div>
        }
      </div>

      <ol class="hml-steps" aria-live="polite">
        @for (s of log().slice(-6); track $index) {
          <li [class]="'st-' + s.kind">{{ s.text }}</li>
        } @empty {
          <li class="st-info">Offer a small number and watch it bubble up to the root. Then poll() and watch the last element sink down.</li>
        }
      </ol>
    </section>
  `,
})
export class HeapLabComponent implements OnDestroy {
  protected readonly width = W;
  protected readonly max = signal(false);
  protected readonly arr = signal<number[]>([]);
  protected readonly hot = signal<number[]>([]);
  protected readonly value = signal(4);
  protected readonly busy = signal(false);
  protected readonly log = signal<{ kind: string; text: string }[]>([]);
  private timers: ReturnType<typeof setTimeout>[] = [];
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly points = computed(() =>
    this.arr().map((v, i) => {
      const d = Math.floor(Math.log2(i + 1));
      const pos = i - (2 ** d - 1);
      return { i, v, x: ((pos + 0.5) / 2 ** d) * W, y: 30 + d * 64 };
    }),
  );
  protected readonly edges = computed(() => {
    const p = this.points();
    return p.slice(1).map((n) => {
      const parent = p[(n.i - 1) >> 1];
      return { x1: parent.x, y1: parent.y, x2: n.x, y2: n.y };
    });
  });
  protected readonly height = computed(() => 30 + Math.max(0, Math.floor(Math.log2(Math.max(1, this.arr().length))) ) * 64 + 50);

  constructor() {
    this.reset();
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  private before(a: number, b: number): boolean {
    return this.max() ? a > b : a < b;
  }

  private say(kind: string, text: string): void {
    this.log.update((l) => [...l, { kind, text }]);
  }

  protected setMax(m: boolean): void {
    this.max.set(m);
    this.reset();
  }

  protected reset(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.busy.set(false);
    // Build the heap the way repeated offer() calls would.
    const a: number[] = [];
    for (const v of [7, 3, 9, 1, 5, 8]) {
      a.push(v);
      let i = a.length - 1;
      while (i > 0 && this.before(a[i], a[(i - 1) >> 1])) {
        [a[i], a[(i - 1) >> 1]] = [a[(i - 1) >> 1], a[i]];
        i = (i - 1) >> 1;
      }
    }
    this.arr.set(a);
    this.hot.set([]);
    this.log.set([]);
  }

  private play(frames: Frame[]): void {
    if (!this.browser) {
      const last = frames[frames.length - 1];
      this.arr.set(last.arr);
      this.hot.set(last.hot);
      frames.forEach((f) => this.say(f.kind, f.note));
      return;
    }
    this.busy.set(true);
    frames.forEach((f, k) => {
      this.timers.push(
        setTimeout(() => {
          this.arr.set(f.arr);
          this.hot.set(f.hot);
          this.say(f.kind, f.note);
          if (k === frames.length - 1) this.busy.set(false);
        }, 650 * k),
      );
    });
  }

  protected offer(): void {
    const a = [...this.arr(), this.value()];
    const frames: Frame[] = [];
    let i = a.length - 1;
    frames.push({ arr: [...a], hot: [i], note: `offer(${this.value()}) adds it at the end of the array, index ${i}.`, kind: 'step' });
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.before(a[i], a[p])) {
        frames.push({ arr: [...a], hot: [i], note: `${a[i]} isn't ${this.max() ? 'larger' : 'smaller'} than its parent ${a[p]}, so it stays. Done: O(log n) swaps at most.`, kind: 'hit' });
        break;
      }
      [a[i], a[p]] = [a[p], a[i]];
      frames.push({ arr: [...a], hot: [p, i], note: `Sift up: ${a[p]} is ${this.max() ? 'larger' : 'smaller'} than its parent ${a[i]} (index ${p} = (${i} - 1) / 2), so they swap.`, kind: 'step' });
      i = p;
      if (i === 0) frames.push({ arr: [...a], hot: [0], note: `${a[0]} reached the root: it's the new ${this.max() ? 'largest' : 'smallest'} element.`, kind: 'hit' });
    }
    this.value.update((v) => v + 2);
    this.play(frames);
  }

  protected poll(): void {
    const a = [...this.arr()];
    const top = a[0];
    const last = a.pop()!;
    const frames: Frame[] = [];
    if (!a.length) {
      frames.push({ arr: [], hot: [], note: `poll() returns ${top}. The queue is now empty.`, kind: 'hit' });
      this.play(frames);
      return;
    }
    a[0] = last;
    frames.push({ arr: [...a], hot: [0], note: `poll() returns ${top} (the root). The last element, ${last}, moves to the root.`, kind: 'step' });
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let best = i;
      if (l < a.length && this.before(a[l], a[best])) best = l;
      if (r < a.length && this.before(a[r], a[best])) best = r;
      if (best === i) {
        frames.push({ arr: [...a], hot: [i], note: `${a[i]} is in place: ${this.max() ? 'no child is larger' : 'no child is smaller'}. The heap is valid again.`, kind: 'hit' });
        break;
      }
      [a[i], a[best]] = [a[best], a[i]];
      frames.push({ arr: [...a], hot: [i, best], note: `Sift down: swap ${a[best]} with its ${this.max() ? 'larger' : 'smaller'} child ${a[i]} (children of index ${i} are ${l} and ${r}).`, kind: 'step' });
      i = best;
    }
    this.play(frames);
  }

  protected peek(): void {
    this.hot.set([0]);
    this.say('info', `peek() returns ${this.arr()[0]}: the root, in O(1).`);
  }

  protected printIt(): void {
    const sorted = [...this.arr()].sort((x, y) => (this.max() ? y - x : x - y));
    this.say('warn', `println(pq) prints [${this.arr().join(', ')}]: the array order, NOT sorted. Only poll() hands out elements in order: ${sorted.join(', ')}.`);
  }
}
