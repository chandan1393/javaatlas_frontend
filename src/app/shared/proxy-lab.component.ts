import { Component, computed, inject, input, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Mode = 'transactional' | 'self' | 'final';
type Failure = 'none' | 'runtime' | 'checked';
type Actor = 'caller' | 'proxy' | 'target' | 'db' | 'none';
interface Row {
  text: string;
  state: 'pending' | 'committed' | 'gone';
}
interface Frame {
  actor: Actor;
  tx: 'none' | 'active' | 'committed' | 'rolled back';
  rows: Row[];
  note: string;
  kind: 'step' | 'hit' | 'miss' | 'warn' | 'info';
}

const CODE: Record<Mode, string> = {
  transactional: `@Service
public class OrderService {
    @Transactional
    public void placeOrder(Order order) {
        orders.save(order);                 // INSERT order
        payments.charge(order);             // may throw
        paymentRecords.save(...);           // INSERT payment
    }
}`,
  self: `@Service
public class OrderService {
    public void checkout(Order order) {     // no @Transactional
        validate(order);
        this.placeOrder(order);             // internal call!
    }

    @Transactional
    public void placeOrder(Order order) { ... }
}`,
  final: `@Service
public class OrderService {
    @Transactional
    public final void placeOrder(Order order) {   // final!
        orders.save(order);
        payments.charge(order);
    }
}`,
};

/** Builds the frames for one call, following Spring's real proxy and transaction rules. */
function run(mode: Mode, failure: Failure, viaOtherBean: boolean, jdk: boolean): Frame[] {
  const frames: Frame[] = [];
  let tx: Frame['tx'] = 'none';
  const rows: Row[] = [];
  const snap = (actor: Actor, note: string, kind: Frame['kind'] = 'step') => frames.push({ actor, tx, rows: rows.map((r) => ({ ...r })), note, kind });
  const proxyName = jdk ? 'a JDK dynamic proxy (implements the OrderOperations interface)' : 'a CGLIB subclass proxy (OrderService$$SpringCGLIB$$0)';
  const insert = (text: string) => rows.push({ text, state: tx === 'active' ? 'pending' : 'committed' });

  const body = (): boolean => {
    insert('order #101');
    snap('db', tx === 'active' ? 'INSERT order #101: written inside the transaction, not yet visible to other connections.' : 'INSERT order #101: with no transaction, it is committed immediately (auto-commit).', tx === 'active' ? 'step' : 'warn');
    if (failure !== 'none') {
      snap('target', failure === 'runtime'
        ? 'payments.charge() throws PaymentDeclinedException, a RuntimeException.'
        : 'payments.charge() throws IOException, a checked exception.', 'miss');
      return false;
    }
    snap('target', 'payments.charge() succeeds.');
    insert('payment for #101');
    snap('db', tx === 'active' ? 'INSERT payment record: also pending inside the same transaction.' : 'INSERT payment record: committed immediately.');
    return true;
  };

  if (mode === 'transactional') {
    snap('caller', `OrderController calls orderService.placeOrder(order). The orderService it holds is not your object: it is ${proxyName}.`, 'info');
    snap('proxy', 'The proxy intercepts the call. TransactionInterceptor sees @Transactional and opens a transaction (gets a connection, sets auto-commit off).');
    tx = 'active';
    snap('proxy', 'Transaction started. Now the proxy calls the real OrderService.placeOrder().');
    snap('target', 'Your method runs on the real target object.');
    const ok = body();
    if (ok) {
      tx = 'committed';
      rows.forEach((r) => (r.state = 'committed'));
      snap('proxy', 'The method returned normally, so the interceptor COMMITS: both rows become permanent together.', 'hit');
    } else if (failure === 'runtime') {
      tx = 'rolled back';
      rows.forEach((r) => (r.state = 'gone'));
      snap('proxy', 'The exception passes back through the proxy. It is a RuntimeException, so the interceptor ROLLS BACK: the order insert disappears too. All or nothing.', 'hit');
    } else {
      tx = 'committed';
      rows.forEach((r) => (r.state = 'committed'));
      snap('proxy', 'Surprise: by default Spring only rolls back for RuntimeException and Error. For a checked exception it COMMITS, leaving an order without a payment. Use @Transactional(rollbackFor = Exception.class).', 'miss');
    }
    snap('caller', ok ? 'placeOrder() returns to the controller.' : 'The exception reaches the controller (and then your @ControllerAdvice).', ok ? 'hit' : 'info');
    return frames;
  }

  if (mode === 'self') {
    if (viaOtherBean) {
      snap('caller', 'checkout() now calls orderWriter.placeOrder(order): placeOrder lives in a separate OrderWriter bean.', 'info');
      snap('proxy', 'The call goes through OrderWriter’s proxy, so TransactionInterceptor opens a transaction.');
      tx = 'active';
      snap('target', 'OrderWriter.placeOrder() runs inside the transaction.');
      const ok = body();
      if (ok) {
        tx = 'committed';
        rows.forEach((r) => (r.state = 'committed'));
        snap('proxy', 'Committed: both rows saved together.', 'hit');
      } else if (failure === 'runtime') {
        tx = 'rolled back';
        rows.forEach((r) => (r.state = 'gone'));
        snap('proxy', 'Rolled back: no half-saved order. The transaction works because the call crossed a proxy.', 'hit');
      } else {
        tx = 'committed';
        rows.forEach((r) => (r.state = 'committed'));
        snap('proxy', 'The transaction exists now, but a checked exception still COMMITS by default. Add rollbackFor = Exception.class to roll back for it too.', 'miss');
      }
      return frames;
    }
    snap('caller', 'The controller calls orderService.checkout(order) through the proxy. checkout() has no @Transactional, so the proxy just passes the call on.', 'info');
    snap('target', 'checkout() runs on the real object and calls this.placeOrder(order).');
    snap('target', 'this is the real object, not the proxy. The call never passes through the proxy, so @Transactional on placeOrder is IGNORED. No transaction.', 'warn');
    const ok = body();
    snap('target', ok ? 'It worked this time, but only by luck: there was never a transaction.' : 'The order row was already committed and nothing rolls it back: an order without a payment is now in the database.', ok ? 'warn' : 'miss');
    return frames;
  }

  // final method
  snap('caller', 'The controller calls orderService.placeOrder(order) on the CGLIB proxy.', 'info');
  snap('proxy', 'CGLIB proxies work by subclassing and overriding methods. placeOrder is final, so it can’t be overridden: the proxy has no interceptor for it.', 'warn');
  snap('target', 'The call runs the method body directly on the PROXY instance, whose injected fields were never set: orders is null.', 'warn');
  snap('db', 'orders.save(order) throws NullPointerException (or, in other cases, the code runs with no transaction at all). Never put @Transactional on final or private methods.', 'miss');
  return frames;
}

/** How a call travels through a Spring proxy into a @Transactional method. */
@Component({
  selector: 'app-proxy-lab',
  template: `
    <section class="hml px" aria-labelledby="px-h">
      <header class="hml-head">
        <div>
          <h2 id="px-h">Proxy lab</h2>
          <p class="muted">{{ intro() }}</p>
        </div>
        <div class="hml-presets" role="group" aria-label="Scenarios">
          @for (p of presets; track p.id) {
            <button type="button" class="chip" [attr.aria-pressed]="mode() === p.id" (click)="load(p.id)">{{ p.label }}</button>
          }
        </div>
      </header>

      <div class="hml-controls sp-fixes">
        @if (mode() !== 'final') {
          <label>payments.charge()
            <select class="field" [value]="failure()" (change)="failure.set($any($event.target).value); rerun()">
              <option value="none" [selected]="failure() === 'none'">succeeds</option>
              <option value="runtime" [selected]="failure() === 'runtime'">throws a RuntimeException</option>
              <option value="checked" [selected]="failure() === 'checked'">throws a checked IOException</option>
            </select>
          </label>
        }
        @if (mode() === 'transactional') {
          <label><input type="checkbox" [checked]="jdk()" (change)="jdk.set($any($event.target).checked); rerun()" /> Use a JDK interface proxy instead of CGLIB</label>
        }
        @if (mode() === 'self') {
          <label><input type="checkbox" [checked]="other()" (change)="other.set($any($event.target).checked); rerun()" /> Fix: move placeOrder() into another bean</label>
        }
      </div>

      <div class="px-grid">
        <pre class="tl-code px-code">{{ code() }}</pre>
        <div class="px-flow">
          <div class="px-actor" [class.on]="frame().actor === 'caller'"><b>Caller</b><small>OrderController</small></div>
          <span class="dg-arrow" aria-hidden="true"></span>
          <div class="px-actor proxy" [class.on]="frame().actor === 'proxy'"><b>Proxy</b><small>{{ jdk() && mode() === 'transactional' ? 'JDK dynamic proxy' : 'CGLIB subclass' }} + TransactionInterceptor</small></div>
          <span class="dg-arrow" aria-hidden="true"></span>
          <div class="px-actor" [class.on]="frame().actor === 'target'"><b>Target</b><small>your OrderService</small></div>
          <span class="dg-arrow" aria-hidden="true"></span>
          <div class="px-actor db" [class.on]="frame().actor === 'db'"><b>Database</b>
            <span class="px-tx" [attr.data-tx]="frame().tx">transaction: {{ frame().tx }}</span>
            @for (r of frame().rows; track $index) {
              <span class="px-row" [attr.data-state]="r.state">{{ r.text }}</span>
            }
          </div>
        </div>
      </div>

      <p class="ml-note" [class.hitnote]="frame().kind === 'hit'" [class.missnote]="frame().kind === 'miss'" aria-live="polite">{{ frame().note }}</p>
      <div class="hml-controls ml-bar">
        <button type="button" class="btn btn-ghost btn-sm" (click)="go(index() - 1)" [disabled]="index() === 0">← Back</button>
        <button type="button" class="btn btn-primary btn-sm" (click)="go(index() + 1)" [disabled]="index() >= frames().length - 1">Next →</button>
        <button type="button" class="btn btn-ghost btn-sm" (click)="toggle()">{{ playing() ? 'Pause' : 'Play' }}</button>
        <span class="muted">Step {{ index() + 1 }} of {{ frames().length }}</span>
      </div>
    </section>
  `,
})
export class ProxyLabComponent implements OnInit, OnDestroy {
  readonly preset = input<string>('transactional');
  protected readonly presets: { id: Mode; label: string }[] = [
    { id: 'transactional', label: '@Transactional' },
    { id: 'self', label: 'Self-invocation trap' },
    { id: 'final', label: 'final method' },
  ];
  protected readonly mode = signal<Mode>('transactional');
  protected readonly failure = signal<Failure>('runtime');
  protected readonly jdk = signal(false);
  protected readonly other = signal(false);
  protected readonly index = signal(0);
  protected readonly playing = signal(false);
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly frames = computed(() => run(this.mode(), this.failure(), this.other(), this.jdk()));
  protected readonly frame = computed(() => this.frames()[Math.min(this.index(), this.frames().length - 1)]);
  protected readonly code = computed(() => CODE[this.mode()]);
  protected readonly intro = computed(() => ({
    transactional: 'Spring wraps your bean in a proxy. The proxy, not your code, starts and ends the transaction. Try each kind of failure.',
    self: 'A @Transactional method called from inside the same class: watch where the call goes.',
    final: 'CGLIB proxies override your methods. What happens when a method can’t be overridden?',
  })[this.mode()]);

  ngOnInit(): void {
    const ids = this.presets.map((p) => p.id);
    this.load(ids.includes(this.preset() as Mode) ? (this.preset() as Mode) : 'transactional');
  }

  ngOnDestroy(): void {
    this.stop();
  }

  protected load(m: Mode): void {
    this.stop();
    this.mode.set(m);
    this.failure.set(m === 'transactional' ? 'runtime' : m === 'self' ? 'runtime' : 'none');
    this.jdk.set(false);
    this.other.set(false);
    this.index.set(0);
  }

  protected rerun(): void {
    this.stop();
    this.index.set(0);
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
    }, 1700);
  }

  private stop(): void {
    this.playing.set(false);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
