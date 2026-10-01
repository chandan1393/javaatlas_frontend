import { Component, computed, inject, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const CAP = 3;

/** A producer and a consumer sharing an ArrayBlockingQueue(3): put() waits when full, take() waits when empty. */
@Component({
  selector: 'app-blockingqueue-lab',
  template: `
    <section class="hml bq" aria-labelledby="bq-h">
      <header class="hml-head">
        <div>
          <h2 id="bq-h">BlockingQueue lab</h2>
          <p class="muted">new ArrayBlockingQueue&lt;&gt;({{ cap }}): the producer's put() waits while the queue is full, and the consumer's take() waits while it's empty. No locks or wait/notify in your code.</p>
        </div>
      </header>

      <div class="bq-row">
        <div class="tl-thread" [class.blocked]="producerBlocked()">
          <div class="tl-thead"><strong>Producer</strong><span class="tl-state" [attr.data-s]="producerBlocked() ? 'BLOCKED' : 'RUNNABLE'">{{ producerBlocked() ? 'BLOCKED in put()' : 'RUNNABLE' }}</span></div>
          <button type="button" class="btn btn-primary btn-sm" (click)="put()" [disabled]="producerBlocked()">put(order #{{ next() }})</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="offer()" [disabled]="producerBlocked()">offer(order #{{ next() }})</button>
        </div>

        <div class="bq-queue">
          <span class="ml-label">queue ({{ queue().length }}/{{ cap }})</span>
          <div class="tp-queue">
            @for (t of queue(); track t) {
              <span class="tp-task">#{{ t }}</span>
            }
            @for (s of emptySlots(); track $index) {
              <span class="tp-slot"></span>
            }
          </div>
        </div>

        <div class="tl-thread" [class.blocked]="consumerBlocked()">
          <div class="tl-thead"><strong>Consumer</strong><span class="tl-state" [attr.data-s]="consumerBlocked() ? 'BLOCKED' : 'RUNNABLE'">{{ consumerBlocked() ? 'BLOCKED in take()' : 'RUNNABLE' }}</span></div>
          <button type="button" class="btn btn-primary btn-sm" (click)="take()" [disabled]="consumerBlocked()">take()</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="poll()" [disabled]="consumerBlocked()">poll()</button>
        </div>
      </div>

      <div class="hml-controls">
        <button type="button" class="btn btn-brand btn-sm" (click)="toggle('fast-producer')">{{ auto() === 'fast-producer' ? 'Stop' : 'Run: fast producer, slow consumer' }}</button>
        <button type="button" class="btn btn-brand btn-sm" (click)="toggle('fast-consumer')">{{ auto() === 'fast-consumer' ? 'Stop' : 'Run: slow producer, fast consumer' }}</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="reset()">Reset</button>
      </div>

      <dl class="hml-stats">
        <div><dt>produced</dt><dd>{{ produced() }}</dd></div>
        <div><dt>consumed</dt><dd>{{ consumed() }}</dd></div>
        <div><dt>offer() refused</dt><dd>{{ refused() }}</dd></div>
      </dl>

      <ol class="hml-steps" aria-live="polite">
        @for (s of log().slice(-6); track $index) {
          <li [class]="'st-' + s.kind">{{ s.text }}</li>
        } @empty {
          <li class="st-info">Press take() first: the consumer blocks on the empty queue. Then put() an order and watch it wake up.</li>
        }
      </ol>
    </section>
  `,
})
export class BlockingqueueLabComponent implements OnDestroy {
  protected readonly cap = CAP;
  protected readonly queue = signal<number[]>([]);
  protected readonly next = signal(1);
  protected readonly producerBlocked = signal(false);
  protected readonly consumerBlocked = signal(false);
  protected readonly produced = signal(0);
  protected readonly consumed = signal(0);
  protected readonly refused = signal(0);
  protected readonly auto = signal<'' | 'fast-producer' | 'fast-consumer'>('');
  protected readonly log = signal<{ kind: string; text: string }[]>([]);
  protected readonly emptySlots = computed(() => Array.from({ length: CAP - this.queue().length }));
  private timer: ReturnType<typeof setInterval> | null = null;
  private tickNo = 0;
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnDestroy(): void {
    this.stop();
  }

  private say(kind: string, text: string): void {
    this.log.update((l) => [...l.slice(-30), { kind, text }]);
  }

  protected put(): void {
    const item = this.next();
    if (this.queue().length >= CAP) {
      this.producerBlocked.set(true);
      this.say('warn', `put(#${item}): the queue is full, so the producer BLOCKS until the consumer makes room.`);
      return;
    }
    this.enqueue(item, 'put');
  }

  protected offer(): void {
    const item = this.next();
    if (this.queue().length >= CAP) {
      this.refused.update((n) => n + 1);
      this.say('miss', `offer(#${item}) returns false immediately: the queue is full. The producer doesn't wait (decide yourself what to do).`);
      return;
    }
    this.enqueue(item, 'offer');
  }

  private enqueue(item: number, how: string): void {
    this.queue.update((q) => [...q, item]);
    this.next.update((n) => n + 1);
    this.produced.update((n) => n + 1);
    this.say('step', `${how}(#${item}) adds it to the queue (${this.queue().length}/${CAP}).`);
    if (this.consumerBlocked()) {
      this.consumerBlocked.set(false);
      this.dequeue(true);
    }
  }

  protected take(): void {
    if (!this.queue().length) {
      this.consumerBlocked.set(true);
      this.say('warn', 'take(): the queue is empty, so the consumer BLOCKS until something arrives. No busy-waiting, no CPU used.');
      return;
    }
    this.dequeue(false);
  }

  protected poll(): void {
    if (!this.queue().length) {
      this.say('miss', 'poll() returns null immediately: the queue is empty.');
      return;
    }
    this.dequeue(false);
  }

  private dequeue(woken: boolean): void {
    const [first, ...rest] = this.queue();
    this.queue.set(rest);
    this.consumed.update((n) => n + 1);
    this.say('hit', woken ? `The consumer wakes up and take() returns #${first}.` : `take() returns #${first} (${rest.length}/${CAP} left).`);
    if (this.producerBlocked()) {
      this.producerBlocked.set(false);
      this.say('info', 'There is room again, so the blocked producer wakes up and its put() completes.');
      this.enqueue(this.next(), 'put');
    }
  }

  protected toggle(kind: 'fast-producer' | 'fast-consumer'): void {
    if (this.auto() === kind) {
      this.stop();
      return;
    }
    this.stop();
    if (!this.browser) return;
    this.auto.set(kind);
    this.timer = setInterval(() => {
      this.tickNo++;
      const produce = kind === 'fast-producer' ? true : this.tickNo % 3 === 0;
      const consume = kind === 'fast-producer' ? this.tickNo % 3 === 0 : true;
      if (produce && !this.producerBlocked()) this.put();
      if (consume && !this.consumerBlocked()) this.take();
    }, 700);
  }

  private stop(): void {
    this.auto.set('');
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  protected reset(): void {
    this.stop();
    this.queue.set([]);
    this.next.set(1);
    this.producerBlocked.set(false);
    this.consumerBlocked.set(false);
    this.produced.set(0);
    this.consumed.set(0);
    this.refused.set(0);
    this.log.set([]);
    this.tickNo = 0;
  }
}
