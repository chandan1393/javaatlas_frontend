import { Component, computed, inject, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface LNode {
  id: number;
  val: number;
}

/** java.util.LinkedList as a doubly linked chain: cheap at the ends, a walk to reach the middle. */
@Component({
  selector: 'app-linkedlist-lab',
  template: `
    <section class="hml ll" aria-labelledby="ll-h">
      <header class="hml-head">
        <div>
          <h2 id="ll-h">LinkedList lab</h2>
          <p class="muted">Every element is a node with links to the previous and next node. Adding at either end is instant; reaching index i means walking there.</p>
        </div>
      </header>

      <div class="hml-controls">
        <label>value <input class="field ll-num" type="number" [value]="value()" (change)="value.set(+$any($event.target).value)" /></label>
        <label>index <input class="field ll-num" type="number" min="0" [value]="index()" (change)="index.set(+$any($event.target).value)" /></label>
      </div>
      <div class="hml-controls">
        <button type="button" class="btn btn-primary btn-sm" (click)="addFirst()">addFirst({{ value() }})</button>
        <button type="button" class="btn btn-primary btn-sm" (click)="addLast()">addLast({{ value() }})</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="addAt()">add({{ index() }}, {{ value() }})</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="get()" [disabled]="walking()">get({{ index() }})</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="removeFirst()" [disabled]="!nodes().length">removeFirst()</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="removeLast()" [disabled]="!nodes().length">removeLast()</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="reset()">Reset</button>
      </div>

      <dl class="hml-stats">
        <div><dt>size()</dt><dd>{{ nodes().length }}</dd></div>
        <div><dt>last op: node hops</dt><dd>{{ hops() }}</dd></div>
        <div><dt>ArrayList would need</dt><dd>{{ arrayCost() }}</dd></div>
      </dl>

      <div class="ll-chain" aria-label="Linked list">
        <span class="ll-ptr">head</span>
        @for (n of nodes(); track n.id; let i = $index; let last = $last) {
          <span class="ll-node" [class.new]="n.id === fresh()" [class.walk]="visited().includes(n.id)" [class.target]="n.id === target()">
            <small class="ll-link">{{ i === 0 ? 'null' : '◂' }}</small>
            <b>{{ n.val }}</b>
            <small class="ll-link">{{ last ? 'null' : '▸' }}</small>
            <em>[{{ i }}]</em>
          </span>
          @if (!last) {
            <span class="ll-arrow" aria-hidden="true">⇄</span>
          }
        } @empty {
          <span class="muted">empty (head = tail = null)</span>
        }
        <span class="ll-ptr">tail</span>
      </div>

      <ol class="hml-steps" aria-live="polite">
        @for (s of log().slice(-5); track $index) {
          <li [class]="'st-' + s.kind">{{ s.text }}</li>
        } @empty {
          <li class="st-info">Try get() on an index near the middle, then near the end: watch which end the walk starts from.</li>
        }
      </ol>
    </section>
  `,
})
export class LinkedlistLabComponent implements OnDestroy {
  protected readonly nodes = signal<LNode[]>([10, 20, 30, 40, 50, 60].map((v, i) => ({ id: i + 1, val: v })));
  protected readonly value = signal(25);
  protected readonly index = signal(3);
  protected readonly fresh = signal(-1);
  protected readonly visited = signal<number[]>([]);
  protected readonly target = signal(-1);
  protected readonly hops = signal(0);
  protected readonly arrayCost = signal('–');
  protected readonly walking = signal(false);
  protected readonly log = signal<{ kind: string; text: string }[]>([]);
  private nextId = 7;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly size = computed(() => this.nodes().length);

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  private say(kind: string, text: string): void {
    this.log.update((l) => [...l, { kind, text }]);
  }

  private clearMarks(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.walking.set(false);
    this.visited.set([]);
    this.target.set(-1);
    this.fresh.set(-1);
  }

  protected addFirst(): void {
    this.clearMarks();
    const n = { id: this.nextId++, val: this.value() };
    this.nodes.update((ns) => [n, ...ns]);
    this.fresh.set(n.id);
    this.hops.set(0);
    this.arrayCost.set(`${this.size() - 1} shifts`);
    this.say('hit', `addFirst(${n.val}): a new node links to the old head and becomes the head. O(1), no matter how long the list is.`);
  }

  protected addLast(): void {
    this.clearMarks();
    const n = { id: this.nextId++, val: this.value() };
    this.nodes.update((ns) => [...ns, n]);
    this.fresh.set(n.id);
    this.hops.set(0);
    this.arrayCost.set('1 (O(1))');
    this.say('hit', `addLast(${n.val}): the node is linked after the tail using the tail pointer. O(1).`);
  }

  /** The walk LinkedList.node(index) performs: from the head if index is in the first half, else from the tail. */
  private path(i: number): number[] {
    const ns = this.nodes();
    if (i < ns.length >> 1) return ns.slice(0, i + 1).map((n) => n.id);
    return ns.slice(i).map((n) => n.id).reverse();
  }

  protected get(): void {
    this.clearMarks();
    const i = this.index();
    const ns = this.nodes();
    if (i < 0 || i >= ns.length) {
      this.say('miss', `get(${i}) throws IndexOutOfBoundsException: valid indexes are 0 to ${ns.length - 1}.`);
      return;
    }
    const path = this.path(i);
    const fromHead = i < ns.length >> 1;
    this.hops.set(path.length - 1);
    this.arrayCost.set('1 (O(1))');
    this.say('step', `get(${i}): index ${i} is in the ${fromHead ? 'first' : 'second'} half, so the walk starts at the ${fromHead ? 'head' : 'tail'} and follows ${fromHead ? 'next' : 'prev'} links.`);
    if (!this.browser) {
      this.visited.set(path);
      this.target.set(path[path.length - 1]);
      return;
    }
    this.walking.set(true);
    path.forEach((id, k) => {
      this.timers.push(
        setTimeout(() => {
          this.visited.update((v) => [...v, id]);
          if (k === path.length - 1) {
            this.target.set(id);
            this.walking.set(false);
            this.say('hit', `Found ${ns[i].val} after ${path.length - 1} hop${path.length === 2 ? '' : 's'}. An ArrayList jumps straight to index ${i} in one step.`);
          }
        }, 380 * k),
      );
    });
  }

  protected addAt(): void {
    this.clearMarks();
    const i = this.index();
    const ns = this.nodes();
    if (i < 0 || i > ns.length) {
      this.say('miss', `add(${i}, x) throws IndexOutOfBoundsException: the index must be 0 to ${ns.length}.`);
      return;
    }
    const hops = i === ns.length ? 0 : this.path(i).length - 1;
    const n = { id: this.nextId++, val: this.value() };
    this.nodes.update((list) => [...list.slice(0, i), n, ...list.slice(i)]);
    this.fresh.set(n.id);
    this.hops.set(hops);
    this.arrayCost.set(`${ns.length - i} shifts`);
    this.say('step', `add(${i}, ${n.val}): walk ${hops} hop${hops === 1 ? '' : 's'} to reach index ${i}, then relink 4 pointers. Linking is O(1); the walk is O(n).`);
  }

  protected removeFirst(): void {
    this.clearMarks();
    const [first, ...rest] = this.nodes();
    this.nodes.set(rest);
    this.hops.set(0);
    this.arrayCost.set(`${rest.length} shifts`);
    this.say('hit', `removeFirst() returns ${first.val}: the head moves to the next node. O(1). An ArrayList would shift ${rest.length} elements left.`);
  }

  protected removeLast(): void {
    this.clearMarks();
    const ns = this.nodes();
    const last = ns[ns.length - 1];
    this.nodes.set(ns.slice(0, -1));
    this.hops.set(0);
    this.arrayCost.set('1 (O(1))');
    this.say('hit', `removeLast() returns ${last.val}: the tail moves back one node using its prev link. O(1).`);
  }

  protected reset(): void {
    this.clearMarks();
    this.nodes.set([10, 20, 30, 40, 50, 60].map((v, i) => ({ id: i + 1, val: v })));
    this.nextId = 7;
    this.hops.set(0);
    this.arrayCost.set('–');
    this.log.set([]);
  }
}
