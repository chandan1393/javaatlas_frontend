import { Component, computed, input, OnInit, signal } from '@angular/core';
import { javaHash, spread } from './hashmap-lab.component';

type Mode = 'chm' | 'hashtable';
const N = 8;
const KEYS = ['java', 'spring', 'sql', 'docker', 'kafka', 'redis', 'react', 'maven', 'linux', 'git', 'aws', 'jpa', 'rest', 'json', 'kotlin', 'scala'];

interface Op {
  key: string;
  bucket: number;
  phase: 'locked' | 'waiting';
}
interface Th {
  name: string;
  key: string;
  op: Op | null;
}

/** Two threads writing to a ConcurrentHashMap (per-bucket locks, CAS) or a Hashtable (one lock for everything). */
@Component({
  selector: 'app-chm-lab',
  template: `
    <section class="hml chm" aria-labelledby="chm-h">
      <header class="hml-head">
        <div>
          <h2 id="chm-h">{{ mode() === 'chm' ? 'ConcurrentHashMap' : 'Hashtable' }} lab</h2>
          <p class="muted">{{ mode() === 'chm' ? 'Writes to an empty bucket use a lock-free CAS; writes to a non-empty bucket lock only that bucket. Reads never lock.' : 'Every method is synchronized on the whole table: while one thread is inside put(), every other thread waits, even for a different bucket, even to read.' }}</p>
        </div>
        <div class="hml-presets" role="group" aria-label="Map">
          <button type="button" class="chip" [attr.aria-pressed]="mode() === 'chm'" (click)="load('chm')">ConcurrentHashMap</button>
          <button type="button" class="chip" [attr.aria-pressed]="mode() === 'hashtable'" (click)="load('hashtable')">Hashtable / synchronizedMap</button>
        </div>
      </header>

      <div class="chm-threads">
        @for (t of threads(); track t.name; let ti = $index) {
          <div class="tl-thread" [class.blocked]="t.op?.phase === 'waiting'">
            <div class="tl-thead">
              <strong>{{ t.name }}</strong>
              <span class="tl-state" [attr.data-s]="t.op?.phase === 'waiting' ? 'BLOCKED' : t.op ? 'RUNNABLE' : 'TERMINATED'">{{ t.op?.phase === 'waiting' ? 'BLOCKED' : t.op ? 'IN put()' : 'idle' }}</span>
            </div>
            <label class="chm-key">key
              <select class="field" [value]="t.key" (change)="setKey(ti, $any($event.target).value)">
                @for (k of keys; track k) {
                  <option [value]="k" [selected]="k === t.key">{{ k }} → bucket {{ bucketOf(k) }}</option>
                }
              </select>
            </label>
            @if (!t.op) {
              <div class="hml-ops">
                <button type="button" class="btn btn-primary btn-sm" (click)="startPut(ti)">put("{{ t.key }}")</button>
                <button type="button" class="btn btn-ghost btn-sm" (click)="get(ti)">get("{{ t.key }}")</button>
              </div>
            } @else if (t.op.phase === 'waiting') {
              <button type="button" class="btn btn-ghost btn-sm" (click)="retry(ti)">Try again</button>
            } @else {
              <button type="button" class="btn btn-primary btn-sm" (click)="finish(ti)">Write and release the lock</button>
            }
          </div>
        }
      </div>

      <div class="hml-controls">
        <button type="button" class="btn btn-ghost btn-sm" (click)="sameBucket()">Give Thread 2 a key in Thread 1's bucket</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="otherBucket()">Give Thread 2 a key in another bucket</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="load(mode())">Reset</button>
      </div>

      @if (mode() === 'hashtable') {
        <div class="tl-lock chm-biglock" [class.held]="tableOwner()">table lock: {{ tableOwner() || 'free' }}</div>
      }
      <div class="lhm-buckets chm-table">
        @for (b of table(); track $index; let i = $index) {
          <div class="lhm-bucket" [class.empty]="!b.length" [class.locked]="bucketOwner(i)" [class.hot]="i === touched()">
            <small>{{ i }}</small>
            @for (k of b; track k) {
              <span class="hml-node">{{ k }}</span>
            }
            @if (bucketOwner(i); as o) {
              <em class="chm-lockbadge">locked by {{ o }}</em>
            }
          </div>
        }
      </div>

      <ol class="hml-steps" aria-live="polite">
        @for (s of log().slice(-6); track $index) {
          <li [class]="'st-' + s.kind">{{ s.text }}</li>
        } @empty {
          <li class="st-info">Start a put in Thread 1 (don't finish it), then start a put in Thread 2: first with a key in another bucket, then in the same bucket.</li>
        }
      </ol>
    </section>
  `,
})
export class ChmLabComponent implements OnInit {
  readonly preset = input<string>('chm');
  protected readonly keys = KEYS;
  protected readonly mode = signal<Mode>('chm');
  protected readonly table = signal<string[][]>([]);
  protected readonly threads = signal<Th[]>([]);
  protected readonly touched = signal(-1);
  protected readonly log = signal<{ kind: string; text: string }[]>([]);

  protected readonly tableOwner = computed(() => (this.mode() === 'hashtable' ? (this.threads().find((t) => t.op?.phase === 'locked')?.name ?? '') : ''));

  ngOnInit(): void {
    this.load(this.preset() === 'hashtable' ? 'hashtable' : 'chm');
  }

  protected bucketOf(k: string): number {
    return spread(javaHash(k)) & (N - 1);
  }

  protected bucketOwner(i: number): string {
    if (this.mode() !== 'chm') return '';
    return this.threads().find((t) => t.op?.phase === 'locked' && t.op.bucket === i)?.name ?? '';
  }

  protected load(m: Mode): void {
    this.mode.set(m);
    const table: string[][] = Array.from({ length: N }, () => []);
    for (const k of ['java', 'sql', 'react', 'redis']) table[this.bucketOf(k)].push(k);   // buckets 3, 7, 2 and 6
    this.table.set(table);
    this.threads.set([
      { name: 'Thread 1', key: 'docker', op: null },   // bucket 7: occupied, so a put locks it
      { name: 'Thread 2', key: 'git', op: null },      // bucket 3: occupied too, but a different bucket
    ]);
    this.touched.set(-1);
    this.log.set([]);
  }

  private say(kind: string, text: string): void {
    this.log.update((l) => [...l, { kind, text }]);
  }

  private patch(i: number, change: Partial<Th>): void {
    this.threads.update((ts) => ts.map((t, k) => (k === i ? { ...t, ...change } : t)));
  }

  protected setKey(i: number, key: string): void {
    this.patch(i, { key });
  }

  /** Who currently blocks a put into this bucket (or the whole table, for Hashtable). */
  private blocker(i: number, bucket: number): string {
    const other = this.threads().find((t, k) => k !== i && t.op?.phase === 'locked');
    if (!other) return '';
    if (this.mode() === 'hashtable') return other.name;
    return other.op!.bucket === bucket ? other.name : '';
  }

  protected startPut(i: number): void {
    const t = this.threads()[i];
    const bucket = this.bucketOf(t.key);
    this.touched.set(bucket);
    if (this.mode() === 'chm' && !this.table()[bucket].length && !this.blocker(i, bucket)) {
      this.write(t.key, bucket);
      this.say('hit', `${t.name}: put("${t.key}") → bucket ${bucket} is empty, so the new node is placed with one atomic compare-and-set. No lock at all.`);
      return;
    }
    const by = this.blocker(i, bucket);
    if (by) {
      this.patch(i, { op: { key: t.key, bucket, phase: 'waiting' } });
      this.say('warn', this.mode() === 'chm'
        ? `${t.name}: put("${t.key}") → bucket ${bucket} is locked by ${by}, so ${t.name} waits. Only this bucket is blocked.`
        : `${t.name}: put("${t.key}") must take the table lock, but ${by} holds it. ${t.name} waits, although it wants bucket ${bucket}.`);
      return;
    }
    this.patch(i, { op: { key: t.key, bucket, phase: 'locked' } });
    this.say('step', this.mode() === 'chm'
      ? `${t.name}: put("${t.key}") → bucket ${bucket} already has nodes, so it locks just that bucket (synchronized on its first node).`
      : `${t.name}: put("${t.key}") takes the lock on the WHOLE table (bucket ${bucket}).`);
  }

  protected retry(i: number): void {
    this.patch(i, { op: null });
    this.startPut(i);       // logs whether it got the lock or is still waiting
  }

  protected finish(i: number): void {
    const t = this.threads()[i];
    if (!t.op) return;
    this.write(t.op.key, t.op.bucket);
    this.patch(i, { op: null });
    this.say('hit', `${t.name}: writes "${t.op.key}" into bucket ${t.op.bucket} and releases the ${this.mode() === 'chm' ? 'bucket' : 'table'} lock.`);
    const waiting = this.threads().find((x) => x.op?.phase === 'waiting');
    if (waiting) this.say('info', `${waiting.name} can now try again.`);
  }

  protected get(i: number): void {
    const t = this.threads()[i];
    const bucket = this.bucketOf(t.key);
    this.touched.set(bucket);
    const found = this.table()[bucket].includes(t.key);
    if (this.mode() === 'hashtable' && this.blocker(i, bucket)) {
      this.say('warn', `${t.name}: get("${t.key}") is synchronized too, so it waits for ${this.blocker(i, bucket)} to release the table lock. Even reads are blocked.`);
      return;
    }
    this.say('hit', `${t.name}: get("${t.key}") reads bucket ${bucket} ${this.mode() === 'chm' ? 'without any lock (volatile reads), even if another thread is writing elsewhere' : 'while holding the table lock'}: ${found ? 'found' : 'null'}.`);
  }

  private write(key: string, bucket: number): void {
    this.table.update((tb) => tb.map((b, k) => (k === bucket && !b.includes(key) ? [...b, key] : b)));
    this.touched.set(bucket);
  }

  protected sameBucket(): void {
    const b = this.bucketOf(this.threads()[0].key);
    const candidates = KEYS.filter((x) => x !== this.threads()[0].key && this.bucketOf(x) === b);
    const k = candidates.find((x) => !this.table()[b].includes(x)) ?? candidates[0];
    if (k) {
      this.setKey(1, k);
      this.say('info', `Thread 2 now uses "${k}", which also lands in bucket ${b}.`);
    } else {
      this.say('info', `No other sample key shares bucket ${b}; pick a different key for Thread 1.`);
    }
  }

  protected otherBucket(): void {
    const b = this.bucketOf(this.threads()[0].key);
    const k = KEYS.find((x) => this.bucketOf(x) !== b && this.table()[this.bucketOf(x)].length > 0) ?? KEYS.find((x) => this.bucketOf(x) !== b)!;
    this.setKey(1, k);
    this.say('info', `Thread 2 now uses "${k}" (bucket ${this.bucketOf(k)}), a different bucket from Thread 1's.`);
  }
}
