import { Component, computed, input, OnInit, signal } from '@angular/core';

interface RB {
  key: number;
  red: boolean;
  left: RB | null;
  right: RB | null;
  parent: RB | null;
}
interface Snap {
  tree: SNode | null;
  hot: number[];
  note: string;
  kind: string;
}
interface SNode {
  key: number;
  red: boolean;
  left: SNode | null;
  right: SNode | null;
}

function freeze(n: RB | null): SNode | null {
  return n ? { key: n.key, red: n.red, left: freeze(n.left), right: freeze(n.right) } : null;
}

/** A red-black tree with the CLRS insertion fix-up (what java.util.TreeMap does), recording every step. */
class RedBlackTree {
  root: RB | null = null;

  insert(key: number): Snap[] {
    const steps: Snap[] = [];
    const snap = (hot: number[], note: string, kind = 'step') => steps.push({ tree: freeze(this.root), hot, note, kind });
    let y: RB | null = null;
    let x = this.root;
    const path: number[] = [];
    while (x) {
      y = x;
      path.push(x.key);
      if (key === x.key) {
        snap([key], `${key} is already in the tree (compareTo returned 0). A TreeMap replaces the value; a TreeSet's add() returns false.`, 'warn');
        return steps;
      }
      x = key < x.key ? x.left : x.right;
    }
    const z: RB = { key, red: true, left: null, right: null, parent: y };
    if (!y) this.root = z;
    else if (key < y.key) y.left = z;
    else y.right = z;
    snap([key], path.length ? `Compared with ${path.join(' → ')} and inserted ${key} as a RED leaf (new nodes are always red).` : `The tree was empty: ${key} becomes the root.`);

    let n = z;
    while (n.parent && n.parent.red) {
      const p = n.parent;
      const g = p.parent!;
      const leftSide = p === g.left;
      const u = leftSide ? g.right : g.left;
      if (u && u.red) {
        p.red = false;
        u.red = false;
        g.red = true;
        snap([p.key, u.key, g.key], `Red ${n.key} has a red parent (${p.key}) and a red uncle (${u.key}): recolour them black and the grandparent ${g.key} red, then check again from ${g.key}.`);
        n = g;
        continue;
      }
      if (leftSide && n === p.right) {
        this.rotateLeft(p);
        snap([n.key, p.key], `Red ${n.key} and red parent ${p.key} form a zig-zag with a black uncle: rotate left at ${p.key} to straighten it.`);
        n = p;
      } else if (!leftSide && n === p.left) {
        this.rotateRight(p);
        snap([n.key, p.key], `Red ${n.key} and red parent ${p.key} form a zig-zag with a black uncle: rotate right at ${p.key} to straighten it.`);
        n = p;
      }
      const parent = n.parent!;
      const grand = parent.parent!;
      parent.red = false;
      grand.red = true;
      if (leftSide) this.rotateRight(grand);
      else this.rotateLeft(grand);
      snap([parent.key, grand.key], `Straight line of reds with a black uncle: rotate ${leftSide ? 'right' : 'left'} at the grandparent ${grand.key} and swap colours. ${parent.key} moves up.`);
    }
    if (this.root && this.root.red) {
      this.root.red = false;
      snap([this.root.key], `The root is always black, so ${this.root.key} turns black.`);
    }
    snap([], `Balanced: every path from the root to a leaf has the same number of black nodes, so the height stays O(log n).`, 'hit');
    return steps;
  }

  private rotateLeft(x: RB): void {
    const y = x.right!;
    x.right = y.left;
    if (y.left) y.left.parent = x;
    y.parent = x.parent;
    if (!x.parent) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
  }

  private rotateRight(x: RB): void {
    const y = x.left!;
    x.left = y.right;
    if (y.right) y.right.parent = x;
    y.parent = x.parent;
    if (!x.parent) this.root = y;
    else if (x === x.parent.right) x.parent.right = y;
    else x.parent.left = y;
    y.right = x;
    x.parent = y;
  }

  keys(): number[] {
    const out: number[] = [];
    const walk = (n: RB | null) => {
      if (!n) return;
      walk(n.left);
      out.push(n.key);
      walk(n.right);
    };
    walk(this.root);
    return out;
  }

  /** The nodes visited looking for key, and the floor/ceiling found on the way. */
  search(key: number): { path: number[]; found: boolean; floor: number | null; ceiling: number | null } {
    const path: number[] = [];
    let n = this.root;
    let floor: number | null = null;
    let ceiling: number | null = null;
    while (n) {
      path.push(n.key);
      if (key === n.key) return { path, found: true, floor: key, ceiling: key };
      if (key < n.key) {
        ceiling = n.key;
        n = n.left;
      } else {
        floor = n.key;
        n = n.right;
      }
    }
    return { path, found: false, floor, ceiling };
  }
}

/** TreeMap / TreeSet: a red-black tree, step by step. */
@Component({
  selector: 'app-tree-lab',
  template: `
    <section class="hml rbt" aria-labelledby="rbt-h">
      <header class="hml-head">
        <div>
          <h2 id="rbt-h">{{ setMode() ? 'TreeSet' : 'TreeMap' }} lab</h2>
          <p class="muted">A {{ setMode() ? 'TreeSet' : 'TreeMap' }} keeps its {{ setMode() ? 'elements' : 'keys' }} in a red-black tree: always sorted, and never more than about 2·log₂(n) levels deep, so every operation is O(log n).</p>
        </div>
      </header>

      <div class="hml-controls">
        <label>key <input class="field ll-num" type="number" [value]="key()" (change)="key.set(+$any($event.target).value)" /></label>
        <button type="button" class="btn btn-primary btn-sm" (click)="put()">{{ setMode() ? 'add' : 'put' }}({{ key() }})</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="find('get')">{{ setMode() ? 'contains' : 'get' }}({{ key() }})</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="find('floor')">floor({{ key() }})</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="find('ceiling')">ceiling({{ key() }})</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="iterate()">iterate</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="reset()">Reset</button>
      </div>

      <div class="table-wrap">
        <svg class="hp-tree rb-tree" [attr.viewBox]="'0 0 ' + layout().w + ' ' + layout().h" [attr.width]="layout().w" [attr.height]="layout().h" role="img" aria-label="Red-black tree">
          @for (e of layout().edges; track $index) {
            <line [attr.x1]="e.x1" [attr.y1]="e.y1" [attr.x2]="e.x2" [attr.y2]="e.y2" />
          }
          @for (n of layout().nodes; track n.key) {
            <g [class.red]="n.red" [class.hot]="hot().includes(n.key)">
              <circle [attr.cx]="n.x" [attr.cy]="n.y" r="18" />
              <text [attr.x]="n.x" [attr.y]="n.y + 5">{{ n.key }}</text>
            </g>
          }
        </svg>
      </div>

      @if (steps().length > 1) {
        <div class="hml-controls ml-bar">
          <button type="button" class="btn btn-ghost btn-sm" (click)="go(stepIndex() - 1)" [disabled]="stepIndex() === 0">← Back</button>
          <button type="button" class="btn btn-primary btn-sm" (click)="go(stepIndex() + 1)" [disabled]="stepIndex() >= steps().length - 1">Next step →</button>
          <span class="muted">Insertion step {{ stepIndex() + 1 }} of {{ steps().length }}</span>
        </div>
      }
      <p class="ml-note" [class.hitnote]="note().kind === 'hit'" [class.missnote]="note().kind === 'miss'" aria-live="polite">{{ note().text }}</p>
    </section>
  `,
})
export class TreeLabComponent implements OnInit {
  readonly preset = input<string>('map');
  protected readonly setMode = signal(false);
  protected readonly key = signal(30);
  private tree = new RedBlackTree();
  protected readonly steps = signal<Snap[]>([]);
  protected readonly stepIndex = signal(0);
  private readonly view = signal<{ tree: SNode | null; hot: number[]; note: string; kind: string }>({ tree: null, hot: [], note: '', kind: 'info' });

  protected readonly hot = computed(() => this.view().hot);
  protected readonly note = computed(() => ({ text: this.view().note, kind: this.view().kind }));
  protected readonly layout = computed(() => {
    const nodes: { key: number; red: boolean; x: number; y: number }[] = [];
    const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
    let rank = 0;
    let depth = 0;
    const place = (n: SNode | null, d: number): { x: number; y: number } | null => {
      if (!n) return null;
      const l = place(n.left, d + 1);
      const me = { key: n.key, red: n.red, x: 30 + rank++ * 48, y: 30 + d * 62 };
      depth = Math.max(depth, d);
      nodes.push(me);
      const r = place(n.right, d + 1);
      if (l) edges.push({ x1: me.x, y1: me.y, x2: l.x, y2: l.y });
      if (r) edges.push({ x1: me.x, y1: me.y, x2: r.x, y2: r.y });
      return me;
    };
    place(this.view().tree, 0);
    return { nodes, edges, w: Math.max(320, 30 + rank * 48 + 12), h: 30 + depth * 62 + 40 };
  });

  ngOnInit(): void {
    this.setMode.set(this.preset() === 'set');
    this.reset();
  }

  protected reset(): void {
    this.tree = new RedBlackTree();
    for (const k of [50, 40, 60, 20]) this.tree.insert(k);
    this.steps.set([]);
    this.stepIndex.set(0);
    this.key.set(10);
    this.view.set({
      tree: freeze(this.tree.root),
      hot: [],
      note: `Try ${this.setMode() ? 'add' : 'put'}(10): it lands under red 20 and forces a rotation. Then try 30, 45 and 5.`,
      kind: 'info',
    });
  }

  protected put(): void {
    const steps = this.tree.insert(this.key());
    this.steps.set(steps);
    this.go(0);
  }

  protected go(i: number): void {
    const steps = this.steps();
    const k = Math.max(0, Math.min(i, steps.length - 1));
    this.stepIndex.set(k);
    const s = steps[k];
    if (s) this.view.set({ tree: s.tree, hot: s.hot, note: s.note, kind: s.kind });
  }

  protected find(kind: 'get' | 'floor' | 'ceiling'): void {
    this.steps.set([]);
    const k = this.key();
    const r = this.tree.search(k);
    const result = kind === 'get' ? (r.found ? k : null) : kind === 'floor' ? r.floor : r.ceiling;
    const what = kind === 'get' ? (this.setMode() ? 'contains' : 'get') : kind;
    const text =
      kind === 'get'
        ? `${what}(${k}) visits ${r.path.join(' → ')}: ${r.found ? 'found' : 'not found'} after ${r.path.length} comparison${r.path.length === 1 ? '' : 's'}. At each node, smaller goes left and larger goes right.`
        : `${what}(${k}) visits ${r.path.join(' → ')} and returns ${result ?? 'null'}: the ${kind === 'floor' ? 'largest key ≤' : 'smallest key ≥'} ${k}.`;
    this.view.set({ tree: freeze(this.tree.root), hot: result === null ? r.path : [...r.path.filter((x) => x !== result), result], note: text, kind: result === null && kind === 'get' ? 'miss' : 'hit' });
  }

  protected iterate(): void {
    this.steps.set([]);
    const keys = this.tree.keys();
    this.view.set({
      tree: freeze(this.tree.root),
      hot: keys,
      note: `Iterating walks the tree in order (left, node, right), so ${this.setMode() ? 'elements' : 'keys'} always come out sorted: [${keys.join(', ')}].`,
      kind: 'hit',
    });
  }
}
