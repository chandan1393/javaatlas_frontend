import { Component, computed, input, OnInit, signal } from '@angular/core';
import { javaHash, spread } from './hashmap-lab.component';

type Mode = 'insertion' | 'lru';
const CAPACITY = 8;
const LRU_MAX = 4;

/** java.util.LinkedHashMap: a hash table plus a doubly linked list through the entries. */
@Component({
  selector: 'app-linkedhashmap-lab',
  template: `
    <section class="hml lhm" aria-labelledby="lhm-h">
      <header class="hml-head">
        <div>
          <h2 id="lhm-h">LinkedHashMap lab</h2>
          <p class="muted">{{ mode() === 'insertion' ? 'Entries live in hash buckets like a HashMap, and a linked list through them remembers the order they were added.' : 'With accessOrder = true, every get or put moves the entry to the end; removeEldestEntry evicts the least recently used one when there are more than ' + max + '.' }}</p>
        </div>
        <div class="hml-presets" role="group" aria-label="Mode">
          <button type="button" class="chip" [attr.aria-pressed]="mode() === 'insertion'" (click)="load('insertion')">Insertion order</button>
          <button type="button" class="chip" [attr.aria-pressed]="mode() === 'lru'" (click)="load('lru')">LRU cache (access order)</button>
        </div>
      </header>

      <div class="hml-controls">
        <label>key <input class="field" [value]="key()" (input)="key.set($any($event.target).value)" (keydown.enter)="put()" maxlength="20" spellcheck="false" /></label>
        <button type="button" class="btn btn-primary btn-sm" (click)="put()">put("{{ key() }}")</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="get()">get("{{ key() }}")</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="remove()">remove("{{ key() }}")</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="load(mode())">Reset</button>
      </div>

      <span class="ml-label">The linked list (this is the iteration order)</span>
      <div class="ll-chain">
        <span class="ll-ptr">head</span>
        @for (k of order(); track k; let last = $last; let first = $first) {
          <span class="ll-node" [class.new]="k === touched()" [class.walk]="mode() === 'lru' && first">
            <b>{{ k }}</b>
            <em>bucket {{ bucketOf(k) }}</em>
          </span>
          @if (!last) {
            <span class="ll-arrow" aria-hidden="true">⇄</span>
          }
        } @empty {
          <span class="muted">empty</span>
        }
        <span class="ll-ptr">tail</span>
      </div>

      <span class="ml-label">The hash buckets ({{ capacity }} of them)</span>
      <div class="lhm-buckets">
        @for (b of buckets(); track $index; let i = $index) {
          <div class="lhm-bucket" [class.empty]="!b.length" [class.hot]="b.includes(touched())">
            <small>{{ i }}</small>
            @for (k of b; track k) {
              <span class="hml-node">{{ k }}</span>
            }
          </div>
        }
      </div>

      <p class="lhm-compare"><strong>A plain HashMap would iterate:</strong> [{{ hashOrder().join(', ') }}] <span class="muted">(bucket order: it depends on hash codes, not on when keys were added)</span></p>

      <ol class="hml-steps" aria-live="polite">
        @for (s of log().slice(-5); track $index) {
          <li [class]="'st-' + s.kind">{{ s.text }}</li>
        } @empty {
          <li class="st-info">{{ mode() === 'insertion' ? 'Put a new key: it always joins the end of the list, whatever bucket it lands in.' : 'Get the first key, then put two new ones: watch which entry gets evicted.' }}</li>
        }
      </ol>
    </section>
  `,
})
export class LinkedhashmapLabComponent implements OnInit {
  readonly preset = input<string>('insertion');
  protected readonly capacity = CAPACITY;
  protected readonly max = LRU_MAX;
  protected readonly mode = signal<Mode>('insertion');
  protected readonly order = signal<string[]>([]);
  protected readonly key = signal('kiwi');
  protected readonly touched = signal('');
  protected readonly log = signal<{ kind: string; text: string }[]>([]);

  protected readonly buckets = computed(() => {
    const b: string[][] = Array.from({ length: CAPACITY }, () => []);
    // Within a bucket, HashMap chains in insertion order of that bucket.
    for (const k of this.insertionHistory()) if (this.order().includes(k)) b[this.bucketOf(k)].push(k);
    return b;
  });
  protected readonly hashOrder = computed(() => this.buckets().flat());
  private readonly insertionHistory = signal<string[]>([]);

  ngOnInit(): void {
    this.load(this.preset() === 'lru' ? 'lru' : 'insertion');
  }

  protected bucketOf(k: string): number {
    return spread(javaHash(k)) & (CAPACITY - 1);
  }

  protected load(m: Mode): void {
    this.mode.set(m);
    const start = m === 'lru' ? ['/home', '/learn', '/courses', '/topics'] : ['mango', 'apple', 'zebra', 'banana'];
    this.order.set(start);
    this.insertionHistory.set([...start]);
    this.key.set(m === 'lru' ? '/home' : 'kiwi');
    this.touched.set('');
    this.log.set([]);
  }

  private say(kind: string, text: string): void {
    this.log.update((l) => [...l, { kind, text }]);
  }

  protected put(): void {
    const k = this.key().trim();
    if (!k) return;
    const order = [...this.order()];
    const exists = order.includes(k);
    if (exists) {
      if (this.mode() === 'lru') {
        this.order.set([...order.filter((x) => x !== k), k]);
        this.say('step', `put("${k}") updates an existing key. In access order that counts as a use, so it moves to the end of the list.`);
      } else {
        this.say('info', `put("${k}") replaces the value. Re-inserting an existing key does NOT change its position in insertion order.`);
      }
    } else {
      order.push(k);
      this.insertionHistory.update((h) => [...h.filter((x) => x !== k), k]);
      this.say('step', `put("${k}") stores the entry in bucket ${this.bucketOf(k)} (like a HashMap) and links it at the end of the list.`);
      if (this.mode() === 'lru' && order.length > LRU_MAX) {
        const eldest = order.shift()!;
        this.say('warn', `removeEldestEntry returned true (size ${order.length + 1} > ${LRU_MAX}), so the eldest entry "${eldest}", the least recently used one at the head, is evicted.`);
      }
      this.order.set(order);
    }
    this.touched.set(k);
  }

  protected get(): void {
    const k = this.key().trim();
    if (!this.order().includes(k)) {
      this.touched.set('');
      this.say('miss', `get("${k}") returns null: the key isn't in the map.`);
      return;
    }
    if (this.mode() === 'lru') {
      this.order.set([...this.order().filter((x) => x !== k), k]);
      this.say('hit', `get("${k}") finds it through bucket ${this.bucketOf(k)} in O(1), and access order moves it to the end: it's now the most recently used.`);
    } else {
      this.say('hit', `get("${k}") finds it through bucket ${this.bucketOf(k)} in O(1). In insertion order, reading doesn't change the list.`);
    }
    this.touched.set(k);
  }

  protected remove(): void {
    const k = this.key().trim();
    if (!this.order().includes(k)) {
      this.say('miss', `remove("${k}") does nothing: the key isn't there.`);
      return;
    }
    this.order.set(this.order().filter((x) => x !== k));
    this.touched.set('');
    this.say('step', `remove("${k}") unlinks it from bucket ${this.bucketOf(k)} and from the list: its neighbours now point at each other.`);
  }
}
