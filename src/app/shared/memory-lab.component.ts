import { Component, computed, inject, input, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Var {
  name: string;
  type: string;
  val?: string;
  ref?: number | null;
}
interface Frame {
  name: string;
  vars: Var[];
}
interface Field {
  name: string;
  val?: string;
  ref?: number | null;
}
interface HObj {
  id: number;
  type: string;
  fields: Field[];
  pool?: boolean;
  gc?: boolean;
}
interface Mem {
  frames: Frame[];
  heap: HObj[];
  out: { text: string; err?: boolean }[];
}
interface Step {
  line: number;
  note: string;
  apply: (m: Mem) => void;
}
interface Scenario {
  id: string;
  label: string;
  intro: string;
  code: string[];
  steps: Step[];
}

// ---- small helpers used by the scenario scripts -------------------------------------------------
const top = (m: Mem) => m.frames[m.frames.length - 1];
const setVar = (f: Frame, v: Var) => {
  const i = f.vars.findIndex((x) => x.name === v.name);
  if (i >= 0) f.vars[i] = v;
  else f.vars.push(v);
};
const obj = (m: Mem, id: number) => m.heap.find((o) => o.id === id)!;
const field = (o: HObj, f: Field) => {
  const i = o.fields.findIndex((x) => x.name === f.name);
  if (i >= 0) o.fields[i] = f;
  else o.fields.push(f);
};

const SCENARIOS: Scenario[] = [
  {
    id: 'pass-by-value',
    label: 'Pass-by-value',
    intro: 'Is Java pass-by-reference? Step through and watch what a method can and can’t change.',
    code: [
      'public static void main(String[] args) {',
      '    int age = 20;',
      '    Person p = new Person("Asha");',
      '    update(age, p);',
      '    System.out.println(age + " " + p.name);',
      '}',
      'static void update(int a, Person person) {',
      '    a = 99;',
      '    person.name = "Ravi";',
      '    person = new Person("Meera");',
      '}',
    ],
    steps: [
      { line: 1, note: 'main starts. Each method call gets a stack frame for its local variables.', apply: (m) => m.frames.push({ name: 'main', vars: [] }) },
      { line: 2, note: 'A primitive lives directly in the frame: age holds the value 20 itself.', apply: (m) => setVar(top(m), { name: 'age', type: 'int', val: '20' }) },
      {
        line: 3,
        note: 'new creates the object on the heap. p doesn’t hold the object, it holds a reference (an arrow) to it.',
        apply: (m) => {
          m.heap.push({ id: 1, type: 'Person', fields: [{ name: 'name', val: '"Asha"' }] });
          setVar(top(m), { name: 'p', type: 'Person', ref: 1 });
        },
      },
      {
        line: 7,
        note: 'Calling update copies the VALUES of the arguments: a gets a copy of 20, and person gets a copy of the reference. p and person now point to the same object.',
        apply: (m) => m.frames.push({ name: 'update', vars: [{ name: 'a', type: 'int', val: '20' }, { name: 'person', type: 'Person', ref: 1 }] }),
      },
      { line: 8, note: 'Only update’s copy changes. main’s age is still 20.', apply: (m) => setVar(top(m), { name: 'a', type: 'int', val: '99' }) },
      { line: 9, note: 'This changes the object itself. Both references point to it, so main will see "Ravi" too.', apply: (m) => field(obj(m, 1), { name: 'name', val: '"Ravi"' }) },
      {
        line: 10,
        note: 'Reassigning the parameter only changes update’s copy of the reference. main’s p still points to the first object.',
        apply: (m) => {
          m.heap.push({ id: 2, type: 'Person', fields: [{ name: 'name', val: '"Meera"' }] });
          setVar(top(m), { name: 'person', type: 'Person', ref: 2 });
        },
      },
      {
        line: 11,
        note: 'update returns and its frame disappears. Nothing references the "Meera" object any more, so it’s eligible for garbage collection.',
        apply: (m) => {
          m.frames.pop();
          obj(m, 2).gc = true;
        },
      },
      { line: 5, note: 'Java is always pass-by-value: a copy of the primitive, or a copy of the reference. Changing the object is visible; reassigning the parameter isn’t.', apply: (m) => m.out.push({ text: '20 Ravi' }) },
    ],
  },
  {
    id: 'string-pool',
    label: 'String pool',
    intro: 'Why does "java" == "java" work, but not always? Watch where each String lives.',
    code: [
      'String a = "java";',
      'String b = "java";',
      'String c = new String("java");',
      'String d = c.intern();',
      'System.out.println(a == b);',
      'System.out.println(a == c);',
      'System.out.println(a.equals(c));',
      'System.out.println(a == d);',
    ],
    steps: [
      {
        line: 1,
        note: 'A string literal is stored in the string pool, a shared area of the heap. a points to it.',
        apply: (m) => {
          m.frames.push({ name: 'main', vars: [] });
          m.heap.push({ id: 1, type: 'String', fields: [{ name: 'value', val: '"java"' }], pool: true });
          setVar(top(m), { name: 'a', type: 'String', ref: 1 });
        },
      },
      { line: 2, note: 'The same literal reuses the pooled object: a and b point to the very same String.', apply: (m) => setVar(top(m), { name: 'b', type: 'String', ref: 1 }) },
      {
        line: 3,
        note: 'new String(...) always creates a new object on the normal heap, even though the text is the same.',
        apply: (m) => {
          m.heap.push({ id: 2, type: 'String', fields: [{ name: 'value', val: '"java"' }] });
          setVar(top(m), { name: 'c', type: 'String', ref: 2 });
        },
      },
      { line: 4, note: 'intern() returns the pooled String with the same text, so d points to the pool object.', apply: (m) => setVar(top(m), { name: 'd', type: 'String', ref: 1 }) },
      { line: 5, note: '== compares references. a and b point to the same object: true.', apply: (m) => m.out.push({ text: 'true' }) },
      { line: 6, note: 'a and c are different objects, so == is false even though the text is equal.', apply: (m) => m.out.push({ text: 'false' }) },
      { line: 7, note: 'equals() compares the characters: true. Always compare strings with equals().', apply: (m) => m.out.push({ text: 'true' }) },
      { line: 8, note: 'd was interned, so it points to the pooled object: true.', apply: (m) => m.out.push({ text: 'true' }) },
    ],
  },
  {
    id: 'upcasting',
    label: 'Parent reference',
    intro: 'What happens with Animal a = new Dog()? The variable and the object have different types.',
    code: [
      'Animal a = new Dog();',
      'a.sound();',
      'Animal b = a;',
      'Dog d = (Dog) b;',
      'd.fetch();',
      'Animal plain = new Animal();',
      'Dog oops = (Dog) plain;',
    ],
    steps: [
      {
        line: 1,
        note: 'One Dog object on the heap. The variable’s type is Animal, but the object is, and always stays, a Dog.',
        apply: (m) => {
          m.frames.push({ name: 'main', vars: [] });
          m.heap.push({ id: 1, type: 'Dog', fields: [{ name: 'class', val: 'Dog (extends Animal)' }] });
          setVar(top(m), { name: 'a', type: 'Animal', ref: 1 });
        },
      },
      { line: 2, note: 'The compiler checks Animal has sound(); the JVM then runs the version in the object’s class, Dog. That’s dynamic dispatch.', apply: (m) => m.out.push({ text: 'Woof' }) },
      { line: 3, note: 'Copying a reference never copies the object: a and b point to the same Dog.', apply: (m) => setVar(top(m), { name: 'b', type: 'Animal', ref: 1 }) },
      { line: 4, note: 'Downcasting is checked at run time: the object really is a Dog, so the cast succeeds. The object itself doesn’t change.', apply: (m) => setVar(top(m), { name: 'd', type: 'Dog', ref: 1 }) },
      { line: 5, note: 'Through a Dog reference, Dog-only methods are allowed.', apply: (m) => m.out.push({ text: 'Fetching!' }) },
      {
        line: 6,
        note: 'A plain Animal object this time.',
        apply: (m) => {
          m.heap.push({ id: 2, type: 'Animal', fields: [{ name: 'class', val: 'Animal' }] });
          setVar(top(m), { name: 'plain', type: 'Animal', ref: 2 });
        },
      },
      { line: 7, note: 'The run-time check fails: the object is an Animal, not a Dog. The compiler allowed it, the JVM refuses it.', apply: (m) => m.out.push({ text: 'ClassCastException: Animal cannot be cast to Dog', err: true }) },
    ],
  },
  {
    id: 'recursion',
    label: 'Recursion',
    intro: 'Each recursive call gets its own stack frame. Watch the stack grow, then unwind.',
    code: [
      'static int factorial(int n) {',
      '    if (n <= 1) return 1;',
      '    return n * factorial(n - 1);',
      '}',
      '',
      'int result = factorial(3);',
      'System.out.println(result);',
    ],
    steps: [
      {
        line: 6,
        note: 'main calls factorial(3). A new frame is pushed with its own n.',
        apply: (m) => {
          m.frames.push({ name: 'main', vars: [{ name: 'result', type: 'int', val: '?' }] });
          m.frames.push({ name: 'factorial', vars: [{ name: 'n', type: 'int', val: '3' }] });
        },
      },
      { line: 3, note: 'n is 3, not the base case, so it calls factorial(2) and waits for the answer.', apply: (m) => m.frames.push({ name: 'factorial', vars: [{ name: 'n', type: 'int', val: '2' }] }) },
      { line: 3, note: 'Another frame, with n = 1. Three factorial frames are now on the stack, each with its own n.', apply: (m) => m.frames.push({ name: 'factorial', vars: [{ name: 'n', type: 'int', val: '1' }] }) },
      { line: 2, note: 'Base case: n <= 1, so this call returns 1 without calling itself again.', apply: (m) => setVar(top(m), { name: 'returns', type: '', val: '1' }) },
      {
        line: 3,
        note: 'The top frame is popped. factorial(2) resumes and computes 2 * 1.',
        apply: (m) => {
          m.frames.pop();
          setVar(top(m), { name: 'returns', type: '', val: '2 * 1 = 2' });
        },
      },
      {
        line: 3,
        note: 'Popped again. factorial(3) resumes and computes 3 * 2.',
        apply: (m) => {
          m.frames.pop();
          setVar(top(m), { name: 'returns', type: '', val: '3 * 2 = 6' });
        },
      },
      {
        line: 6,
        note: 'The last factorial frame is popped and main receives 6.',
        apply: (m) => {
          m.frames.pop();
          setVar(top(m), { name: 'result', type: 'int', val: '6' });
        },
      },
      { line: 7, note: 'Done. With no base case (or too deep a recursion), frames pile up until the stack runs out: StackOverflowError.', apply: (m) => m.out.push({ text: '6' }) },
    ],
  },
  {
    id: 'gc',
    label: 'Garbage collection',
    intro: 'An object can be collected once nothing reachable points to it. Watch objects become garbage.',
    code: [
      'Course c1 = new Course("Java");',
      'Course c2 = new Course("Spring");',
      'c1 = c2;',
      'c2 = null;',
      'List<Course> list = new ArrayList<>();',
      'list.add(c1);',
      'c1 = null;',
      'list = null;',
    ],
    steps: [
      {
        line: 1,
        note: 'A Course object on the heap, referenced by c1.',
        apply: (m) => {
          m.frames.push({ name: 'main', vars: [] });
          m.heap.push({ id: 1, type: 'Course', fields: [{ name: 'title', val: '"Java"' }] });
          setVar(top(m), { name: 'c1', type: 'Course', ref: 1 });
        },
      },
      {
        line: 2,
        note: 'A second Course, referenced by c2.',
        apply: (m) => {
          m.heap.push({ id: 2, type: 'Course', fields: [{ name: 'title', val: '"Spring"' }] });
          setVar(top(m), { name: 'c2', type: 'Course', ref: 2 });
        },
      },
      {
        line: 3,
        note: 'c1 now points to the Spring course. Nothing points to the Java course: it’s unreachable, so the garbage collector may reclaim it.',
        apply: (m) => {
          setVar(top(m), { name: 'c1', type: 'Course', ref: 2 });
          obj(m, 1).gc = true;
        },
      },
      { line: 4, note: 'c2 points nowhere now, but the Spring course is still reachable through c1.', apply: (m) => setVar(top(m), { name: 'c2', type: 'Course', ref: null, val: 'null' }) },
      {
        line: 5,
        note: 'An ArrayList object on the heap.',
        apply: (m) => {
          m.heap.push({ id: 3, type: 'ArrayList', fields: [{ name: 'size', val: '0' }] });
          setVar(top(m), { name: 'list', type: 'List<Course>', ref: 3 });
        },
      },
      {
        line: 6,
        note: 'The list stores a reference to the Spring course too.',
        apply: (m) => {
          field(obj(m, 3), { name: 'size', val: '1' });
          field(obj(m, 3), { name: '[0]', ref: 2 });
        },
      },
      { line: 7, note: 'No variable points to the Spring course directly, but it’s reachable through the list, so it stays alive. Reachability decides, not the number of variables.', apply: (m) => setVar(top(m), { name: 'c1', type: 'Course', ref: null, val: 'null' }) },
      {
        line: 8,
        note: 'Now the list isn’t reachable, and neither is the course it held: both are garbage. The collector frees them when it next runs.',
        apply: (m) => {
          setVar(top(m), { name: 'list', type: 'List<Course>', ref: null, val: 'null' });
          obj(m, 3).gc = true;
          obj(m, 2).gc = true;
        },
      },
    ],
  },
];

const COLORS = ['#2446E8', '#D9530A', '#0B8A6B', '#A21CAF', '#B45309', '#0E7490'];

function snapshot(m: Mem): Mem {
  return structuredClone(m);
}

/** Step through code and watch the stack, the heap, the string pool and garbage collection. */
@Component({
  selector: 'app-memory-lab',
  template: `
    <section class="hml ml" aria-labelledby="ml-h">
      <header class="hml-head">
        <div>
          <h2 id="ml-h">Memory lab</h2>
          <p class="muted">{{ scenario().intro }}</p>
        </div>
        <div class="hml-presets" role="group" aria-label="Examples">
          @for (s of scenarios; track s.id) {
            <button type="button" class="chip" [attr.aria-pressed]="scenario().id === s.id" (click)="load(s.id)">{{ s.label }}</button>
          }
        </div>
      </header>

      <div class="ml-grid">
        <pre class="ml-code" aria-label="Code">@for (line of scenario().code; track $index) {<span [class.cur]="current()?.line === $index + 1"><i>{{ $index + 1 }}</i>{{ line || ' ' }}</span>
}</pre>

        <div class="ml-col">
          <span class="ml-label">Stack</span>
          @for (f of framesTopFirst(); track $index; let first = $first) {
            <div class="ml-frame" [class.active]="first">
              <strong>{{ f.name }}()</strong>
              @for (v of f.vars; track v.name) {
                <div class="ml-var">
                  <span class="ml-type">{{ v.type }}</span> {{ v.name }}
                  @if (v.ref) {
                    <span class="ml-ref" [style.--c]="color(v.ref)">→ #{{ v.ref }}</span>
                  } @else {
                    <b>= {{ v.val }}</b>
                  }
                </div>
              }
            </div>
          } @empty {
            <p class="muted ml-empty">Empty. Press Next to start.</p>
          }
        </div>

        <div class="ml-col">
          <span class="ml-label">Heap</span>
          @for (o of heapObjects(); track o.id) {
            <div class="ml-obj" [style.--c]="color(o.id)" [class.gc]="o.gc">
              <strong>#{{ o.id }} {{ o.type }}</strong>
              @for (f of o.fields; track f.name) {
                <div class="ml-var">
                  {{ f.name }}
                  @if (f.ref) {
                    <span class="ml-ref" [style.--c]="color(f.ref)">→ #{{ f.ref }}</span>
                  } @else {
                    <b>= {{ f.val }}</b>
                  }
                </div>
              }
              @if (o.gc) {
                <em>unreachable: eligible for garbage collection</em>
              }
            </div>
          }
          @if (poolObjects().length) {
            <span class="ml-label ml-pool-label">String pool (inside the heap)</span>
            @for (o of poolObjects(); track o.id) {
              <div class="ml-obj pool" [style.--c]="color(o.id)">
                <strong>#{{ o.id }} String</strong>
                @for (f of o.fields; track f.name) {
                  <div class="ml-var"><b>{{ f.val }}</b></div>
                }
              </div>
            }
          }
          @if (!heapObjects().length && !poolObjects().length) {
            <p class="muted ml-empty">No objects yet.</p>
          }
        </div>
      </div>

      <div class="ml-out" aria-label="Console output">
        <span class="ml-label">Console</span>
        @for (o of mem().out; track $index) {
          <code [class.err]="o.err">{{ o.text }}</code>
        } @empty {
          <code class="muted">(no output yet)</code>
        }
      </div>

      <p class="ml-note" aria-live="polite">{{ current()?.note ?? 'Press Next to run the first line.' }}</p>

      <div class="hml-controls ml-bar">
        <button type="button" class="btn btn-ghost btn-sm" (click)="go(index() - 1)" [disabled]="index() < 0">← Back</button>
        <button type="button" class="btn btn-primary btn-sm" (click)="go(index() + 1)" [disabled]="index() >= scenario().steps.length - 1">Next →</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="toggle()">{{ playing() ? 'Pause' : 'Play' }}</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="go(-1)">Restart</button>
        <span class="muted">Step {{ index() + 1 }} of {{ scenario().steps.length }}</span>
      </div>
    </section>
  `,
})
export class MemoryLabComponent implements OnInit, OnDestroy {
  readonly preset = input<string>('pass-by-value');
  protected readonly scenarios = SCENARIOS;
  protected readonly scenario = signal<Scenario>(SCENARIOS[0]);
  protected readonly index = signal(-1);
  protected readonly playing = signal(false);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private timer: ReturnType<typeof setInterval> | null = null;

  /** State after each step (index -1 = before the first step). */
  private readonly states = computed(() => {
    const m: Mem = { frames: [], heap: [], out: [] };
    return this.scenario().steps.map((s) => {
      s.apply(m);
      return snapshot(m);
    });
  });
  protected readonly mem = computed<Mem>(() => (this.index() < 0 ? { frames: [], heap: [], out: [] } : this.states()[this.index()]));
  protected readonly current = computed(() => (this.index() < 0 ? null : this.scenario().steps[this.index()]));
  protected readonly framesTopFirst = computed(() => [...this.mem().frames].reverse());
  protected readonly heapObjects = computed(() => this.mem().heap.filter((o) => !o.pool));
  protected readonly poolObjects = computed(() => this.mem().heap.filter((o) => o.pool));

  ngOnInit(): void {
    this.load(SCENARIOS.some((s) => s.id === this.preset()) ? this.preset() : 'pass-by-value');
  }

  ngOnDestroy(): void {
    this.stop();
  }

  protected load(id: string): void {
    this.stop();
    this.scenario.set(SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0]);
    this.index.set(-1);
  }

  protected go(i: number): void {
    this.index.set(Math.max(-1, Math.min(i, this.scenario().steps.length - 1)));
    if (i < 0) this.stop();
  }

  protected toggle(): void {
    if (this.playing()) {
      this.stop();
      return;
    }
    if (!this.browser) return;
    if (this.index() >= this.scenario().steps.length - 1) this.index.set(-1);
    this.playing.set(true);
    this.timer = setInterval(() => {
      if (this.index() >= this.scenario().steps.length - 1) {
        this.stop();
        return;
      }
      this.index.update((i) => i + 1);
    }, 1800);
  }

  private stop(): void {
    this.playing.set(false);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  protected color(id: number): string {
    return COLORS[(id - 1) % COLORS.length];
  }
}
