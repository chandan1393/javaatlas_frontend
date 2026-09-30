import { Component, computed, ElementRef, inject, input, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Java's String.hashCode(): s[0]*31^(n-1) + ... + s[n-1], with int overflow. */
export function javaHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

/** HashMap.hash(): mixes the high 16 bits into the low 16. */
export function spread(h: number): number {
  return (h ^ (h >>> 16)) | 0;
}

/** HashMap.tableSizeFor(): the next power of two. */
export function tableSizeFor(cap: number): number {
  let n = 1;
  while (n < cap) n *= 2;
  return Math.max(1, Math.min(n, 1 << 30));
}

interface Entry {
  key: string;
  value: string;
  /** The spread hash stored when the entry was put (never recalculated). */
  hash: number;
  mutated?: boolean;
}

interface Bucket {
  entries: Entry[];
  tree: boolean;
}

const TREEIFY_THRESHOLD = 8;
const UNTREEIFY_THRESHOLD = 6;
const MIN_TREEIFY_CAPACITY = 64;

const FRUITS = ['apple', 'banana', 'mango', 'grape', 'kiwi', 'cherry', 'orange'];
const RESIZE_KEYS = ['apple', 'banana', 'mango', 'grape', 'kiwi', 'cherry', 'orange', 'lemon', 'peach', 'plum', 'pear', 'guava'];
/** 16 different strings with the same hashCode (built from "Aa"/"BB" blocks). */
const COLLIDING = (() => {
  let keys = [''];
  for (let i = 0; i < 4; i++) keys = keys.flatMap((k) => [k + 'Aa', k + 'BB']);
  return keys;
})();

type Preset = 'basic' | 'fruits' | 'collision' | 'capacity' | 'resize' | 'treeify' | 'mutable';

/**
 * An interactive, faithful simulation of java.util.HashMap (Java 8+): String.hashCode, hash spreading,
 * power-of-two tables, tail insertion, load-factor resizing with lo/hi splits, and treeification rules.
 */
@Component({
  selector: 'app-hashmap-lab',
  template: `
    <section class="hml" aria-labelledby="hml-h">
      <header class="hml-head">
        <div>
          <h2 id="hml-h">HashMap lab</h2>
          <p class="muted">A faithful simulation of Java's HashMap. Type a key and watch every step.</p>
        </div>
        <div class="hml-presets" role="group" aria-label="Examples">
          @for (p of presets; track p.id) {
            <button type="button" class="chip" [attr.aria-pressed]="current() === p.id" (click)="load(p.id)">{{ p.label }}</button>
          }
        </div>
      </header>

      <div class="hml-controls">
        <label>Key <input class="field" [value]="key()" (input)="key.set($any($event.target).value)" (keydown.enter)="put()" maxlength="40" spellcheck="false" /></label>
        <label>Value <input class="field" [value]="value()" (input)="value.set($any($event.target).value)" (keydown.enter)="put()" maxlength="20" placeholder="optional" /></label>
        <div class="hml-ops">
          <button type="button" class="btn btn-primary btn-sm" (click)="put()">put</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="get()">get</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="remove()">remove</button>
        </div>
        @if (current() === 'treeify') {
          <button type="button" class="btn btn-brand btn-sm" (click)="addColliding()" [disabled]="collidingLeft() === 0">Add a colliding key ({{ collidingLeft() }} left)</button>
        }
        @if (current() === 'resize') {
          <button type="button" class="btn btn-brand btn-sm" (click)="key.set('melon'); put()">put "melon" (the 13th key)</button>
        }
      </div>

      @if (current() === 'mutable') {
        <div class="hml-mutate">
          <span>Change a key's field while it's inside the map:</span>
          <select class="field" [value]="mutateFrom()" (change)="mutateFrom.set($any($event.target).value)" aria-label="Key to change">
            @for (k of keys(); track k) {
              <option [value]="k">{{ k }}</option>
            }
          </select>
          <span aria-hidden="true">→</span>
          <input class="field" [value]="mutateTo()" (input)="mutateTo.set($any($event.target).value)" aria-label="New value of the key" />
          <button type="button" class="btn btn-ghost btn-sm" (click)="mutate()">Change the key</button>
        </div>
      }

      <div class="hml-settings">
        <label>new HashMap&lt;&gt;(<select class="field" [value]="requested()" (change)="setCapacity(+$any($event.target).value)" aria-label="Initial capacity">
          @for (c of capacities; track c) {
            <option [value]="c" [selected]="c === requested()">{{ c }}</option>
          }
        </select>,
        <select class="field" [value]="lf()" (change)="setLoadFactor(+$any($event.target).value)" aria-label="Load factor">
          @for (f of factors; track f) {
            <option [value]="f" [selected]="f === lf()">{{ f }}f</option>
          }
        </select>)</label>
        <button type="button" class="btn btn-ghost btn-sm" (click)="reset()">Empty the map</button>
      </div>

      <dl class="hml-stats">
        <div><dt>size</dt><dd>{{ view().size }}</dd></div>
        <div><dt>capacity</dt><dd>{{ view().created ? view().n : '–' }}</dd></div>
        <div><dt>threshold</dt><dd>{{ view().created ? view().threshold : '–' }}</dd></div>
        <div><dt>load</dt><dd>{{ view().created ? (view().size / view().n).toFixed(2) : '–' }}</dd></div>
        <div><dt>resizes</dt><dd>{{ view().resizes }}</dd></div>
        <div title="Nodes in the fullest bucket"><dt>longest</dt><dd>{{ view().longest }}</dd></div>
      </dl>

      @if (!view().created) {
        <p class="hml-empty">The table isn't created yet: HashMap allocates its buckets on the first put (capacity {{ tableSizeFor(requested()) }}{{ tableSizeFor(requested()) !== requested() ? ', rounded up from ' + requested() : '' }}).</p>
      } @else {
        <div class="hml-table" [style.--cols]="view().n > 16 ? 4 : 2">
          @for (b of view().buckets; track $index; let bi = $index) {
            <div class="hml-bucket" [class.hot]="bi === hot()" [class.tree]="b.tree" [class.empty]="!b.entries.length">
              <span class="hml-idx">{{ bi }}</span>
              @if (b.tree) {
                <span class="hml-tree" title="Red-black tree bucket">tree</span>
              }
              <span class="hml-chain">
                @for (e of b.entries; track e.key + $index; let last = $last) {
                  <span class="hml-node" [class.hit]="e.key === hotKey() && bi === hot()" [class.moved]="moved().has(e.key)" [class.mutated]="e.mutated" [title]="e.key + ' = ' + e.value + ' (stored hash ' + e.hash + ')'">{{ e.key }}<small>={{ e.value }}</small></span>
                  @if (!last) {
                    <span class="hml-arrow" aria-hidden="true">{{ b.tree ? '·' : '→' }}</span>
                  }
                }
              </span>
            </div>
          }
        </div>
      }

      <ol class="hml-steps" aria-live="polite">
        @for (s of steps(); track $index) {
          <li [class]="'st-' + s.kind"><span [innerHTML]="s.html"></span></li>
        } @empty {
          <li class="st-info">Press <strong>put</strong> to add the key, or pick an example above.</li>
        }
      </ol>
    </section>
  `,
})
export class HashmapLabComponent implements OnInit {
  readonly preset = input<Preset | string>('basic');
  protected readonly tableSizeFor = tableSizeFor;
  protected readonly presets: { id: Preset; label: string }[] = [
    { id: 'fruits', label: 'Fruits' },
    { id: 'collision', label: 'Collisions' },
    { id: 'resize', label: 'Resize' },
    { id: 'treeify', label: 'Treeify demo' },
    { id: 'mutable', label: 'Mutable key' },
    { id: 'basic', label: 'Empty' },
  ];
  protected readonly capacities = [2, 4, 10, 16, 32, 64, 100];
  protected readonly factors = [0.5, 0.75, 1];

  protected readonly key = signal('java');
  protected readonly value = signal('');
  protected readonly requested = signal(16);
  protected readonly lf = signal(0.75);
  protected readonly steps = signal<{ kind: string; html: string }[]>([]);
  protected readonly hot = signal(-1);
  protected readonly hotKey = signal('');
  protected readonly moved = signal<Set<string>>(new Set());
  protected readonly mutateFrom = signal('asha@old.com');
  protected readonly mutateTo = signal('asha@new.com');
  protected readonly current = signal<Preset>('basic');

  // Simulation state
  private table: Bucket[] | null = null;
  private size = 0;
  private resizes = 0;
  private colliding = 0;
  private counter = 0;
  private readonly tick = signal(0);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly view = computed(() => {
    this.tick();
    const n = this.table?.length ?? tableSizeFor(this.requested());
    return {
      created: !!this.table,
      n,
      threshold: Math.floor(n * this.lf()),
      size: this.size,
      resizes: this.resizes,
      longest: this.table ? Math.max(0, ...this.table.map((b) => b.entries.length)) : 0,
      buckets: this.table ?? [],
    };
  });
  protected readonly keys = computed(() => {
    this.tick();
    return (this.table ?? []).flatMap((b) => b.entries.map((e) => e.key));
  });
  protected readonly collidingLeft = computed(() => {
    this.tick();
    return COLLIDING.length - this.colliding;
  });

  ngOnInit(): void {
    const all: Preset[] = ['basic', 'fruits', 'collision', 'capacity', 'resize', 'treeify', 'mutable'];
    const p = (all.includes(this.preset() as Preset) ? this.preset() : 'basic') as Preset;
    this.load(p);
  }

  protected load(p: Preset): void {
    this.current.set(p);
    this.requested.set(p === 'capacity' ? 4 : 16);
    this.lf.set(0.75);
    this.clear();
    const quiet = (keys: string[]) => keys.forEach((k, i) => this.putInternal(k, String(i + 1), []));
    if (p === 'fruits' || p === 'capacity') quiet(FRUITS);
    if (p === 'resize') quiet(RESIZE_KEYS);
    if (p === 'collision') quiet(['Aa', 'BB', 'book', 'cat', 'Asha', 'Ravi', 'java']);
    if (p === 'mutable') {
      this.putInternal('asha@old.com', 'ADMIN', []);
      this.putInternal('ravi@site.com', 'USER', []);
      this.putInternal('meera@site.com', 'USER', []);
      this.mutateFrom.set('asha@old.com');
      this.mutateTo.set('asha@new.com');
    }
    this.key.set(p === 'collision' ? 'BB' : p === 'mutable' ? 'asha@old.com' : p === 'fruits' ? 'cherry' : 'java');
    this.value.set('');
    this.hot.set(-1);
    this.moved.set(new Set());
    const intro: Record<Preset, string> = {
      basic: 'An empty HashMap. Type any key and press <strong>put</strong>.',
      fruits: 'Seven fruits are in the map. Notice <code>apple</code> and <code>cherry</code> share a bucket, and so do <code>banana</code> and <code>orange</code>. Try <strong>get</strong> on <code>cherry</code>.',
      collision: '<code>Aa</code> and <code>BB</code> have the same hashCode (2112). <code>book</code> and <code>cat</code>, and <code>Asha</code> and <code>Ravi</code>, have different hash codes but share a bucket. Try <strong>get</strong> on <code>BB</code>.',
      capacity: 'Started with <code>new HashMap&lt;&gt;(4)</code> and 7 fruits: it has already resized. Change the initial capacity above and press put to compare.',
      resize: '12 keys with capacity 16 and load factor 0.75: the map is exactly at its threshold (12). The next new key triggers a resize to 32.',
      treeify: 'Press <strong>Add a colliding key</strong> repeatedly. All 16 keys share one hashCode. Watch the 9th and 10th keys force resizes (the table is under 64 buckets) and the 11th turn the bucket into a tree.',
      mutable: '<code>asha@old.com</code> is a key. Press <strong>Change the key</strong>, then try <strong>get</strong> with the new and the old email.',
    };
    this.steps.set([{ kind: 'info', html: intro[p] }]);
    this.bump();
  }

  protected reset(): void {
    this.clear();
    this.steps.set([{ kind: 'info', html: 'The map is empty. The table will be created on the next put.' }]);
    this.bump();
  }

  protected setCapacity(c: number): void {
    this.requested.set(c);
    this.reset();
    const actual = tableSizeFor(c);
    this.steps.set([
      { kind: 'info', html: `<code>new HashMap&lt;&gt;(${c}, ${this.lf()}f)</code> will use <strong>${actual}</strong> buckets${actual !== c ? ` (rounded up from ${c} to a power of two)` : ''}, with threshold ${Math.floor(actual * this.lf())}.` },
    ]);
  }

  protected setLoadFactor(f: number): void {
    this.lf.set(f);
    this.reset();
    const n = tableSizeFor(this.requested());
    this.steps.set([{ kind: 'info', html: `Load factor ${f}: with ${n} buckets the map resizes when size goes over <strong>${Math.floor(n * f)}</strong>.` }]);
  }

  protected put(): void {
    const k = this.key().trim();
    if (!k) return;
    const v = this.value().trim() || String(++this.counter);
    const steps: { kind: string; html: string }[] = [];
    this.putInternal(k, v, steps);
    this.steps.set(steps);
    this.bump();
  }

  protected addColliding(): void {
    if (this.colliding >= COLLIDING.length) return;
    const k = COLLIDING[this.colliding++];
    this.key.set(k);
    const steps: { kind: string; html: string }[] = [];
    this.putInternal(k, String(this.colliding), steps);
    this.steps.set(steps);
    this.bump();
  }

  protected get(): void {
    const k = this.key().trim();
    if (!k) return;
    const steps = this.hashSteps(k);
    if (!this.table) {
      steps.push({ kind: 'miss', html: 'The table hasn’t been created yet, so <code>get</code> returns <strong>null</strong>.' });
      this.steps.set(steps);
      return;
    }
    const h = spread(javaHash(k));
    const i = h & (this.table.length - 1);
    steps.push(this.indexStep(h, i));
    const b = this.table[i];
    this.hot.set(i);
    this.moved.set(new Set());
    if (!b.entries.length) {
      steps.push({ kind: 'miss', html: `Bucket ${i} is empty: <code>get("${esc(k)}")</code> returns <strong>null</strong>.` });
    } else {
      let comparisons = 0;
      let found: Entry | undefined;
      for (const e of b.entries) {
        comparisons++;
        const sameHash = e.hash === h;
        if (sameHash && e.key === k) {
          found = e;
          break;
        }
        if (!b.tree) {
          steps.push({ kind: 'step', html: `Compared with <code>${esc(e.key)}</code>: ${sameHash ? 'hash equal, but <code>equals()</code> is false' : 'stored hash differs, so it can’t be the same key'}.` });
        }
      }
      if (b.tree) {
        const depth = Math.ceil(Math.log2(b.entries.length + 1));
        steps.push({ kind: 'step', html: `Bucket ${i} is a tree: a search takes about ${depth} comparisons instead of walking ${b.entries.length} nodes.` });
      }
      if (found) {
        this.hotKey.set(found.key);
        steps.push({ kind: 'hit', html: `Found it${b.tree ? '' : ` after ${comparisons} comparison${comparisons === 1 ? '' : 's'}`}: same hash and <code>equals()</code> is true. Returns <strong>${esc(found.value)}</strong>.` });
      } else {
        const stranded = b.entries.find((e) => e.mutated);
        steps.push({ kind: 'miss', html: `No matching key in bucket ${i}: <code>get</code> returns <strong>null</strong>.${stranded ? ` (The changed key <code>${esc(stranded.key)}</code> sits here with its <em>old</em> stored hash, so it no longer matches anything.)` : ''}` });
        this.hotKey.set('');
      }
    }
    this.steps.set(steps);
    this.bump();
  }

  protected remove(): void {
    const k = this.key().trim();
    if (!k || !this.table) return;
    const h = spread(javaHash(k));
    const i = h & (this.table.length - 1);
    const steps = this.hashSteps(k);
    steps.push(this.indexStep(h, i));
    const b = this.table[i];
    const at = b.entries.findIndex((e) => e.hash === h && e.key === k);
    this.hot.set(i);
    if (at < 0) {
      steps.push({ kind: 'miss', html: `No matching key in bucket ${i}: nothing removed, <code>remove</code> returns null.` });
    } else {
      const [gone] = b.entries.splice(at, 1);
      this.size--;
      steps.push({ kind: 'hit', html: `Removed <code>${esc(k)}</code> (value ${esc(gone.value)}); size is now ${this.size}. The table never shrinks.` });
      if (b.tree && b.entries.length <= UNTREEIFY_THRESHOLD) {
        b.tree = false;
        steps.push({ kind: 'step', html: `The tree bucket is small again, so it goes back to a linked list.` });
      }
    }
    this.steps.set(steps);
    this.bump();
  }

  protected mutate(): void {
    if (!this.table) return;
    const from = this.mutateFrom();
    const to = this.mutateTo().trim();
    if (!to || to === from) return;
    for (let i = 0; i < this.table.length; i++) {
      const e = this.table[i].entries.find((x) => x.key === from);
      if (e) {
        e.key = to;
        e.mutated = true;
        this.hot.set(i);
        this.hotKey.set(to);
        this.mutateFrom.set(to);
        const newIndex = spread(javaHash(to)) & (this.table.length - 1);
        this.key.set(to);
        this.steps.set([
          { kind: 'warn', html: `The key object changed from <code>${esc(from)}</code> to <code>${esc(to)}</code> while inside the map. HashMap doesn’t know: the entry stays in bucket ${i} with its old stored hash.` },
          { kind: 'step', html: `A lookup for <code>${esc(to)}</code> now goes to bucket <strong>${newIndex}</strong>${newIndex === i ? ' (the same bucket by chance, but the stored hash no longer matches)' : ''}. Press <strong>get</strong> to see it fail, then try the old email.` },
        ]);
        this.bump();
        return;
      }
    }
  }

  // ---------------------------------------------------------------------------------------------

  private clear(): void {
    this.table = null;
    this.size = 0;
    this.resizes = 0;
    this.colliding = 0;
    this.counter = 0;
    this.hot.set(-1);
    this.hotKey.set('');
  }

  private bump(): void {
    this.tick.update((t) => t + 1);
    if (this.browser) setTimeout(() => this.revealHot());
  }

  /** Scrolls the bucket list (not the page) so the bucket just touched is visible. */
  private revealHot(): void {
    const root = this.host.nativeElement as HTMLElement;
    const list = root.querySelector('.hml-table') as HTMLElement | null;
    const hot = root.querySelector('.hml-bucket.hot') as HTMLElement | null;
    if (!list || !hot) return;
    const lr = list.getBoundingClientRect();
    const hr = hot.getBoundingClientRect();
    if (hr.top < lr.top || hr.bottom > lr.bottom) {
      const top = hr.top - lr.top + list.scrollTop;          // the bucket's position inside the scrolling list
      list.scrollTo({ top: Math.max(0, top - list.clientHeight / 2 + hr.height / 2), behavior: 'smooth' });
    }
  }

  private hashSteps(k: string): { kind: string; html: string }[] {
    const raw = javaHash(k);
    const h = spread(raw);
    return [
      { kind: 'step', html: `<code>"${esc(k)}".hashCode()</code> = <strong>${raw}</strong>` },
      { kind: 'step', html: `Spread: <code>h ^ (h &gt;&gt;&gt; 16)</code> = <strong>${h}</strong>` },
    ];
  }

  private indexStep(h: number, i: number): { kind: string; html: string } {
    const n = this.table!.length;
    const bits = Math.log2(n);
    const bin = (h >>> 0).toString(2).padStart(32, '0');
    const low = bits ? bin.slice(-bits) : '';
    return {
      kind: 'step',
      html: `Index: <code>hash &amp; (${n} − 1)</code> keeps the lowest ${bits} bit${bits === 1 ? '' : 's'} …<code>${bin.slice(-Math.max(bits + 4, 8), -bits || undefined)}<mark>${low}</mark></code> = bucket <strong>${i}</strong>`,
    };
  }

  private putInternal(k: string, v: string, steps: { kind: string; html: string }[]): void {
    const log = steps;
    const raw = javaHash(k);
    const h = spread(raw);
    log.push(...this.hashSteps(k));
    if (!this.table) {
      const n = tableSizeFor(this.requested());
      this.table = Array.from({ length: n }, () => ({ entries: [], tree: false }));
      log.push({ kind: 'step', html: `First put: the table is created with <strong>${n}</strong> buckets (threshold ${Math.floor(n * this.lf())}).` });
    }
    const n = this.table.length;
    const i = h & (n - 1);
    log.push(this.indexStep(h, i));
    const b = this.table[i];
    this.hot.set(i);
    this.hotKey.set(k);
    this.moved.set(new Set());

    const existing = b.entries.find((e) => e.hash === h && e.key === k);
    if (existing) {
      const old = existing.value;
      existing.value = v;
      log.push({ kind: 'hit', html: `The same key is already in bucket ${i} (hash equal, <code>equals()</code> true): value replaced, <code>put</code> returns the old value <strong>${esc(old)}</strong>. Size stays ${this.size}.` });
      return;
    }

    if (!b.entries.length) {
      log.push({ kind: 'step', html: `Bucket ${i} was empty: a new node goes straight in.` });
      b.entries.push({ key: k, value: v, hash: h });
    } else if (b.tree) {
      b.entries.push({ key: k, value: v, hash: h });
      log.push({ kind: 'step', html: `Bucket ${i} is a red-black tree: the key is inserted into the tree (O(log n)).` });
    } else {
      const before = b.entries.length;
      const sameHash = b.entries.filter((e) => e.hash === h).length;
      log.push({
        kind: 'warn',
        html: `Collision: bucket ${i} already holds ${before} node${before === 1 ? '' : 's'}${sameHash ? ` (${sameHash} with the very same hash)` : ' (different hash codes, same bucket)'}. None is equal to <code>${esc(k)}</code>, so the new node is linked at the <strong>tail</strong> (Java 8+).`,
      });
      b.entries.push({ key: k, value: v, hash: h });
      if (before >= TREEIFY_THRESHOLD) {
        if (n < MIN_TREEIFY_CAPACITY) {
          log.push({ kind: 'warn', html: `The bucket already had ${before} nodes (≥ 8), but the table has only ${n} buckets (&lt; 64): HashMap <strong>resizes instead of treeifying</strong>.` });
          this.resize(log);
        } else {
          b.tree = true;
          log.push({ kind: 'hit', html: `The bucket already had ${before} nodes (≥ 8) and the table has ${n} buckets (≥ 64): the bucket is <strong>treeified</strong> into a red-black tree.` });
        }
      }
    }
    this.size++;
    const threshold = Math.floor(this.table.length * this.lf());
    if (this.size > threshold) {
      log.push({ kind: 'warn', html: `Size is now ${this.size}, more than the threshold ${threshold}: <strong>resize</strong>.` });
      this.resize(log);
    } else {
      log.push({ kind: 'info', html: `Size is now ${this.size} (threshold ${threshold}). <code>put</code> returns null.` });
    }
    this.hot.set(spread(javaHash(k)) & (this.table.length - 1));
  }

  private resize(log: { kind: string; html: string }[]): void {
    const old = this.table!;
    const oldCap = old.length;
    const newCap = oldCap * 2;
    const next: Bucket[] = Array.from({ length: newCap }, () => ({ entries: [], tree: false }));
    const moved = new Set<string>();
    old.forEach((b, i) => {
      const lo = b.entries.filter((e) => (e.hash & oldCap) === 0);
      const hi = b.entries.filter((e) => (e.hash & oldCap) !== 0);
      next[i].entries = lo;
      next[i + oldCap].entries = hi;
      hi.forEach((e) => moved.add(e.key));
      if (b.tree) {
        next[i].tree = lo.length > UNTREEIFY_THRESHOLD;
        next[i + oldCap].tree = hi.length > UNTREEIFY_THRESHOLD;
      }
    });
    this.table = next;
    this.resizes++;
    this.moved.set(moved);
    log.push({
      kind: 'step',
      html: `Resized ${oldCap} → <strong>${newCap}</strong> buckets (new threshold ${Math.floor(newCap * this.lf())}). Using the stored hashes, each entry stayed at index i or moved to i + ${oldCap}, decided by the bit <code>hash &amp; ${oldCap}</code>: <strong>${moved.size}</strong> moved (highlighted), the rest stayed.`,
    });
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
