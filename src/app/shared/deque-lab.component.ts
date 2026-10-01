import { Component, computed, input, OnInit, signal } from '@angular/core';

type Mode = 'queue' | 'stack';

/** java.util.ArrayDeque: a circular array with head and tail indexes, used as a queue or a stack. */
@Component({
  selector: 'app-deque-lab',
  template: `
    <section class="hml dq" aria-labelledby="dq-h">
      <header class="hml-head">
        <div>
          <h2 id="dq-h">ArrayDeque lab</h2>
          <p class="muted">{{ mode() === 'queue' ? 'As a queue: offer() adds at the back, poll() takes from the front (first in, first out).' : 'As a stack: push() and pop() both work at the front (last in, first out). This is what to use instead of Stack.' }}</p>
        </div>
        <div class="hml-presets" role="group" aria-label="Use as">
          <button type="button" class="chip" [attr.aria-pressed]="mode() === 'queue'" (click)="load('queue')">Queue</button>
          <button type="button" class="chip" [attr.aria-pressed]="mode() === 'stack'" (click)="load('stack')">Stack</button>
        </div>
      </header>

      <div class="hml-controls">
        @if (mode() === 'queue') {
          <button type="button" class="btn btn-primary btn-sm" (click)="addLast()">offer({{ next() }})</button>
          <button type="button" class="btn btn-primary btn-sm" (click)="pollFirst()" [disabled]="!size()">poll()</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="addFirst()">offerFirst({{ next() }})</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="pollLast()" [disabled]="!size()">pollLast()</button>
        } @else {
          <button type="button" class="btn btn-primary btn-sm" (click)="addFirst()">push({{ next() }})</button>
          <button type="button" class="btn btn-primary btn-sm" (click)="pollFirst()" [disabled]="!size()">pop()</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="peek()" [disabled]="!size()">peek()</button>
        }
        <button type="button" class="btn btn-ghost btn-sm" (click)="load(mode())">Reset</button>
      </div>

      <dl class="hml-stats">
        <div><dt>size()</dt><dd>{{ size() }}</dd></div>
        <div><dt>array length</dt><dd>{{ es().length }}</dd></div>
        <div><dt>head</dt><dd>{{ head() }}</dd></div>
        <div><dt>tail</dt><dd>{{ tail() }}</dd></div>
      </dl>

      <span class="ml-label">The array inside (circular: the end wraps round to index 0)</span>
      <div class="dq-ring">
        @for (v of es(); track $index; let i = $index) {
          <div class="al-cell" [class.empty]="v === null" [class.hit]="i === touched()">
            <b>{{ v ?? '' }}</b>
            <small>{{ i }}</small>
            <span class="al-marks">
              @if (i === head()) { <i data-m="lo">head</i> }
              @if (i === tail()) { <i data-m="end">tail</i> }
            </span>
          </div>
        }
      </div>

      <span class="ml-label">What the program sees ({{ mode() === 'queue' ? 'front → back' : 'top → bottom' }})</span>
      <div class="tp-queue">
        @for (v of logical(); track $index) {
          <span class="tp-task">{{ v }}</span>
        } @empty {
          <span class="muted">empty</span>
        }
      </div>

      <ol class="hml-steps" aria-live="polite">
        @for (s of log().slice(-5); track $index) {
          <li [class]="'st-' + s.kind">{{ s.text }}</li>
        } @empty {
          <li class="st-info">{{ mode() === 'queue' ? 'Offer a few values, poll some, then offer more: watch the tail wrap round to index 0.' : 'Push a few values: the head moves backwards and wraps to the end of the array.' }}</li>
        }
      </ol>
    </section>
  `,
})
export class DequeLabComponent implements OnInit {
  readonly preset = input<string>('queue');
  protected readonly mode = signal<Mode>('queue');
  /** Like new ArrayDeque<>(7): an array of 8 slots. */
  protected readonly es = signal<(number | null)[]>(Array(8).fill(null));
  protected readonly head = signal(0);
  protected readonly tail = signal(0);
  protected readonly touched = signal(-1);
  protected readonly next = signal(1);
  protected readonly log = signal<{ kind: string; text: string }[]>([]);

  protected readonly size = computed(() => this.es().filter((v) => v !== null).length);
  protected readonly logical = computed(() => {
    const es = this.es();
    const out: number[] = [];
    for (let i = this.head(), n = 0; n < this.size(); i = (i + 1) % es.length, n++) out.push(es[i]!);
    return out;
  });

  ngOnInit(): void {
    this.load(this.preset() === 'stack' ? 'stack' : 'queue');
  }

  protected load(m: Mode): void {
    this.mode.set(m);
    this.es.set(Array(8).fill(null));
    this.head.set(0);
    this.tail.set(0);
    this.touched.set(-1);
    this.next.set(1);
    this.log.set([]);
  }

  private say(kind: string, text: string): void {
    this.log.update((l) => [...l, { kind, text }]);
  }

  private take(): number {
    const v = this.next();
    this.next.update((n) => n + 1);
    return v * 10;
  }

  protected addLast(): void {
    const es = [...this.es()];
    const v = this.take();
    const t = this.tail();
    es[t] = v;
    const newTail = (t + 1) % es.length;
    this.es.set(es);
    this.tail.set(newTail);
    this.touched.set(t);
    this.say('step', `${this.mode() === 'queue' ? 'offer' : 'addLast'}(${v}) writes at index ${t} (the tail), then the tail moves to ${newTail}${newTail === 0 ? ', wrapping round to the start' : ''}.`);
    if (newTail === this.head()) this.grow();
  }

  protected addFirst(): void {
    const es = [...this.es()];
    const v = this.take();
    const h = (this.head() - 1 + es.length) % es.length;
    es[h] = v;
    this.es.set(es);
    this.head.set(h);
    this.touched.set(h);
    this.say('step', `${this.mode() === 'stack' ? 'push' : 'offerFirst'}(${v}): the head moves back to index ${h}${h === es.length - 1 ? ' (wrapping round to the end of the array)' : ''} and ${v} is written there. Nothing else moves.`);
    if (h === this.tail()) this.grow();
  }

  protected pollFirst(): void {
    const es = [...this.es()];
    const h = this.head();
    const v = es[h];
    es[h] = null;
    this.es.set(es);
    this.head.set((h + 1) % es.length);
    this.touched.set(-1);
    this.say('hit', `${this.mode() === 'stack' ? 'pop' : 'poll'}() returns ${v} from index ${h} and the head moves forward. O(1): no elements shift.`);
  }

  protected pollLast(): void {
    const es = [...this.es()];
    const t = (this.tail() - 1 + es.length) % es.length;
    const v = es[t];
    es[t] = null;
    this.es.set(es);
    this.tail.set(t);
    this.touched.set(-1);
    this.say('hit', `pollLast() returns ${v}: the tail moves back to index ${t}. O(1).`);
  }

  protected peek(): void {
    this.touched.set(this.head());
    this.say('info', `peek() returns ${this.es()[this.head()]} (the top) without removing it.`);
  }

  /** ArrayDeque.grow(): when the array is completely full, grow it (by old + 2 while small) and close the gap. */
  private grow(): void {
    const old = this.es();
    const oldCap = old.length;
    const newCap = oldCap + (oldCap < 64 ? oldCap + 2 : oldCap >> 1);
    const es: (number | null)[] = [...old, ...Array(newCap - oldCap).fill(null)];
    const h = this.head();
    // The array was full (head == tail). Move the head segment to the end of the new array so the elements stay in order.
    const space = newCap - oldCap;
    for (let i = oldCap - 1; i >= h; i--) {
      es[i + space] = es[i];
      es[i] = null;
    }
    this.es.set(es);
    this.head.set(h + space);
    this.say('warn', `The array was full, so it grows from ${oldCap} to ${newCap} slots. The elements from the head onwards move to the end of the new array, so the deque stays in order.`);
  }
}
