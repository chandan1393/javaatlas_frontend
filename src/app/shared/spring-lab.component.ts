import { Component, computed, inject, input, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Mode = 'startup' | 'qualifier' | 'circular' | 'scopes';
type State = 'defined' | 'creating' | 'ready' | 'failed';

interface Def {
  name: string;
  cls: string;
  /** The type it can be injected as (its class, or the interface it implements). */
  as: string;
  /** Constructor parameters, by type. */
  deps: string[];
  layer: 'web' | 'service' | 'data' | 'infra';
  primary?: boolean;
}
interface Frame {
  states: Record<string, State>;
  stack: string[];
  injected: Record<string, string[]>;
  note: string;
  kind: 'step' | 'hit' | 'miss' | 'warn' | 'info';
}

const LAYERS: Def['layer'][] = ['web', 'service', 'data', 'infra'];
const LAYER_NAMES: Record<Def['layer'], string> = { web: '@RestController', service: '@Service', data: '@Repository', infra: '@Component' };

function defs(mode: Mode, opts: { primary: boolean; qualifier: boolean; lazy: boolean; refactor: boolean }): Def[] {
  if (mode === 'qualifier') {
    return [
      { name: 'checkoutController', cls: 'CheckoutController', as: 'CheckoutController', deps: ['CheckoutService'], layer: 'web' },
      { name: 'checkoutService', cls: 'CheckoutService', as: 'CheckoutService', deps: [opts.qualifier ? 'PaymentGateway @Qualifier("stripeGateway")' : 'PaymentGateway'], layer: 'service' },
      { name: 'razorpayGateway', cls: 'RazorpayGateway', as: 'PaymentGateway', deps: [], layer: 'infra', primary: opts.primary },
      { name: 'stripeGateway', cls: 'StripeGateway', as: 'PaymentGateway', deps: [], layer: 'infra' },
    ];
  }
  if (mode === 'circular') {
    if (opts.refactor) {
      return [
        { name: 'orderService', cls: 'OrderService', as: 'OrderService', deps: ['PricingRules'], layer: 'service' },
        { name: 'invoiceService', cls: 'InvoiceService', as: 'InvoiceService', deps: ['PricingRules'], layer: 'service' },
        { name: 'pricingRules', cls: 'PricingRules', as: 'PricingRules', deps: [], layer: 'infra' },
      ];
    }
    return [
      { name: 'orderService', cls: 'OrderService', as: 'OrderService', deps: ['InvoiceService'], layer: 'service' },
      { name: 'invoiceService', cls: 'InvoiceService', as: 'InvoiceService', deps: [opts.lazy ? 'OrderService @Lazy' : 'OrderService'], layer: 'service' },
    ];
  }
  return [
    { name: 'orderController', cls: 'OrderController', as: 'OrderController', deps: ['OrderService'], layer: 'web' },
    { name: 'orderService', cls: 'OrderService', as: 'OrderService', deps: ['PaymentGateway', 'OrderRepository', 'Notifier'], layer: 'service' },
    { name: 'jpaOrderRepository', cls: 'JpaOrderRepository', as: 'OrderRepository', deps: [], layer: 'data' },
    { name: 'razorpayGateway', cls: 'RazorpayGateway', as: 'PaymentGateway', deps: [], layer: 'infra' },
    { name: 'emailNotifier', cls: 'EmailNotifier', as: 'Notifier', deps: [], layer: 'infra' },
  ];
}

/** Simulates ApplicationContext startup: create each bean, creating its dependencies first (depth-first). */
function simulate(list: Def[]): Frame[] {
  const frames: Frame[] = [];
  const states: Record<string, State> = Object.fromEntries(list.map((d) => [d.name, 'defined' as State]));
  const injected: Record<string, string[]> = {};
  const stack: string[] = [];
  let failed = false;
  const snap = (note: string, kind: Frame['kind'] = 'step') =>
    frames.push({ states: { ...states }, stack: [...stack], injected: JSON.parse(JSON.stringify(injected)), note, kind });

  snap(`Component scan found ${list.length} classes: ${list.map((d) => d.cls).join(', ')}. Spring registers a bean definition for each, then creates the singletons.`, 'info');

  const create = (d: Def): boolean => {
    states[d.name] = 'creating';
    stack.push(d.name);
    snap(d.deps.length ? `Creating ${d.name}: its constructor needs ${d.deps.join(', ')}, so those must exist first.` : `Creating ${d.name}: no dependencies, so Spring calls new ${d.cls}() straight away.`);
    for (const raw of d.deps) {
      const lazy = raw.includes('@Lazy');
      const qualifier = /@Qualifier\("(.+?)"\)/.exec(raw)?.[1];
      const type = raw.split(' ')[0];
      let candidates = list.filter((c) => c.as === type || c.cls === type);
      if (candidates.length > 1) {
        const total = candidates.length;
        const byQualifier = qualifier ? candidates.filter((c) => c.name === qualifier) : [];
        const byPrimary = candidates.filter((c) => c.primary);
        if (byQualifier.length === 1) {
          candidates = byQualifier;
          snap(`${total} ${type} beans exist, but @Qualifier("${qualifier}") on the parameter picks ${qualifier} (a qualifier beats @Primary).`, 'hit');
        } else if (byPrimary.length === 1) {
          candidates = byPrimary;
          snap(`${total} ${type} beans exist; ${byPrimary[0].name} is marked @Primary, so it is injected.`, 'hit');
        } else {
          states[d.name] = 'failed';
          failed = true;
          snap(`NoUniqueBeanDefinitionException: ${d.name} needs one ${type}, but ${candidates.length} beans match (${candidates.map((c) => c.name).join(', ')}). Spring can't guess, so startup fails.`, 'miss');
          return false;
        }
      }
      if (!candidates.length) {
        states[d.name] = 'failed';
        failed = true;
        snap(`NoSuchBeanDefinitionException: no bean of type ${type} exists.`, 'miss');
        return false;
      }
      const target = candidates[0];
      if (states[target.name] === 'ready') {
        (injected[d.name] ??= []).push(target.name);
        snap(`${target.name} already exists (singleton), so the same instance is injected into ${d.name}.`);
        continue;
      }
      if (states[target.name] === 'creating') {
        if (lazy) {
          (injected[d.name] ??= []).push(target.name + ' (lazy proxy)');
          snap(`${target.name} is still being created, but the parameter is @Lazy: Spring injects a proxy now and resolves the real bean on first use.`, 'warn');
          continue;
        }
        states[d.name] = 'failed';
        failed = true;
        snap(`BeanCurrentlyInCreationException: ${d.name} needs ${target.name}, which is still being created (${[...stack, target.name].join(' → ')}). The dependencies form a cycle, and Spring Boot refuses to start.`, 'miss');
        return false;
      }
      snap(`${target.name} doesn't exist yet: create it first (${d.name} waits on the creation stack).`);
      if (!create(target)) return false;
      (injected[d.name] ??= []).push(target.name);
      snap(`${target.name} is ready and injected into ${d.name}.`);
    }
    states[d.name] = 'ready';
    stack.pop();
    snap(`new ${d.cls}(${(injected[d.name] ?? []).join(', ')}) done: ${d.name} is ready.`, 'hit');
    return true;
  };

  for (const d of list) {
    if (failed) break;
    if (states[d.name] === 'defined' && !create(d)) break;
  }
  if (!failed) snap('Every bean is created and wired: the ApplicationContext is refreshed and the application starts.', 'hit');
  return frames;
}

/** The Spring IoC container at work: bean creation, injection errors and their fixes, and scopes. */
@Component({
  selector: 'app-spring-lab',
  template: `
    <section class="hml sp" aria-labelledby="sp-h">
      <header class="hml-head">
        <div>
          <h2 id="sp-h">Spring container lab</h2>
          <p class="muted">{{ intro() }}</p>
        </div>
        <div class="hml-presets" role="group" aria-label="Scenarios">
          @for (p of presets; track p.id) {
            <button type="button" class="chip" [attr.aria-pressed]="mode() === p.id" (click)="load(p.id)">{{ p.label }}</button>
          }
        </div>
      </header>

      @if (mode() !== 'scopes') {
        @if (mode() === 'qualifier') {
          <div class="hml-controls sp-fixes">
            <label><input type="checkbox" [checked]="primary()" (change)="primary.set($any($event.target).checked); rerun()" /> Mark RazorpayGateway <code>&#64;Primary</code></label>
            <label><input type="checkbox" [checked]="qualifier()" (change)="qualifier.set($any($event.target).checked); rerun()" /> Add <code>&#64;Qualifier("stripeGateway")</code> to the constructor parameter</label>
          </div>
        }
        @if (mode() === 'circular') {
          <div class="hml-controls sp-fixes">
            <label><input type="checkbox" [checked]="refactor()" (change)="refactor.set($any($event.target).checked); rerun()" /> Fix the design: move the shared logic into a new PricingRules bean</label>
            <label><input type="checkbox" [checked]="lazy()" (change)="lazy.set($any($event.target).checked); rerun()" [disabled]="refactor()" /> Work around it: <code>&#64;Lazy</code> on one parameter</label>
          </div>
        }

        <div class="sp-layers">
          @for (layer of layersInUse(); track layer) {
            <div class="sp-layer">
              <span class="ml-label">{{ layerName(layer) }}</span>
              @for (d of byLayer(layer); track d.name) {
                <div class="sp-bean" [attr.data-state]="frame().states[d.name]" [class.top]="frame().stack[frame().stack.length - 1] === d.name">
                  <strong>{{ d.name }}</strong>
                  <small>{{ d.cls }}{{ d.as !== d.cls ? ' implements ' + d.as : '' }}{{ d.primary ? ' · @Primary' : '' }}</small>
                  @if (d.deps.length) {
                    <em>needs {{ d.deps.join(', ') }}</em>
                  }
                  @if (frame().injected[d.name]?.length) {
                    <em class="sp-inj">got {{ frame().injected[d.name].join(', ') }}</em>
                  }
                  <span class="sp-state">{{ stateLabel(frame().states[d.name]) }}</span>
                </div>
              }
            </div>
          }
        </div>

        <p class="sp-stack"><span class="ml-label">Currently in creation</span> {{ frame().stack.length ? frame().stack.join(' → ') : '(empty)' }}</p>
        <p class="ml-note" [class.hitnote]="frame().kind === 'hit'" [class.missnote]="frame().kind === 'miss'" aria-live="polite">{{ frame().note }}</p>
        <div class="hml-controls ml-bar">
          <button type="button" class="btn btn-ghost btn-sm" (click)="go(index() - 1)" [disabled]="index() === 0">← Back</button>
          <button type="button" class="btn btn-primary btn-sm" (click)="go(index() + 1)" [disabled]="index() >= frames().length - 1">Next →</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="toggle()">{{ playing() ? 'Pause' : 'Play' }}</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="go(frames().length - 1)">Skip to the end</button>
          <span class="muted">Step {{ index() + 1 }} of {{ frames().length }}</span>
        </div>
      } @else {
        <div class="hml-controls">
          <button type="button" class="btn btn-primary btn-sm" (click)="getBean('PriceService')">context.getBean(PriceService.class)</button>
          <button type="button" class="btn btn-primary btn-sm" (click)="getBean('ShoppingCart')">context.getBean(ShoppingCart.class)</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="checkout(false)">checkoutService.checkout() (cart injected)</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="checkout(true)">checkout() using ObjectProvider</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="load('scopes')">Reset</button>
        </div>
        <div class="sp-scopes">
          <div class="sp-layer"><span class="ml-label">PriceService · singleton (default)</span>
            <div class="tp-queue">@for (i of priceRefs(); track $index) { <span class="tp-task">#{{ i }}</span> } @empty { <span class="muted">not requested yet</span> }</div></div>
          <div class="sp-layer"><span class="ml-label">ShoppingCart · &#64;Scope("prototype")</span>
            <div class="tp-queue">@for (i of cartRefs(); track $index) { <span class="tp-task sp-proto">#{{ i }}</span> } @empty { <span class="muted">not requested yet</span> }</div></div>
          <div class="sp-layer"><span class="ml-label">Carts used by CheckoutService (a singleton)</span>
            <div class="tp-queue">@for (i of checkoutRefs(); track $index) { <span class="tp-task" [class.sp-proto]="i !== injectedCart">#{{ i }}</span> } @empty { <span class="muted">no checkouts yet</span> }</div></div>
        </div>
        <ol class="hml-steps" aria-live="polite">
          @for (s of scopeLog().slice(-5); track $index) {
            <li [class]="'st-' + s.kind">{{ s.text }}</li>
          } @empty {
            <li class="st-info">Ask for each bean twice and compare the instance numbers.</li>
          }
        </ol>
      }
    </section>
  `,
})
export class SpringLabComponent implements OnInit, OnDestroy {
  readonly preset = input<string>('startup');
  protected readonly presets: { id: Mode; label: string }[] = [
    { id: 'startup', label: 'Startup' },
    { id: 'qualifier', label: 'Two candidates' },
    { id: 'circular', label: 'Circular dependency' },
    { id: 'scopes', label: 'Scopes' },
  ];
  protected readonly mode = signal<Mode>('startup');
  protected readonly primary = signal(false);
  protected readonly qualifier = signal(false);
  protected readonly lazy = signal(false);
  protected readonly refactor = signal(false);
  protected readonly index = signal(0);
  protected readonly playing = signal(false);
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly list = computed(() => defs(this.mode(), { primary: this.primary(), qualifier: this.qualifier(), lazy: this.lazy(), refactor: this.refactor() }));
  protected readonly frames = computed(() => simulate(this.list()));
  protected readonly frame = computed(() => this.frames()[Math.min(this.index(), this.frames().length - 1)]);
  protected readonly layersInUse = computed(() => LAYERS.filter((l) => this.list().some((d) => d.layer === l)));
  protected readonly intro = computed(() => ({
    startup: 'Watch the ApplicationContext start: it creates each bean, creating whatever the constructor needs first.',
    qualifier: 'CheckoutService needs a PaymentGateway, but there are two. Run it, see the error, then fix it.',
    circular: 'OrderService needs InvoiceService and InvoiceService needs OrderService. Run it and watch the cycle being detected.',
    scopes: 'A singleton is created once and shared; a prototype is created fresh every time it is requested.',
  })[this.mode()]);

  // scopes mode
  protected readonly priceRefs = signal<number[]>([]);
  protected readonly cartRefs = signal<number[]>([]);
  protected readonly checkoutRefs = signal<number[]>([]);
  protected readonly scopeLog = signal<{ kind: string; text: string }[]>([]);
  protected injectedCart = 0;
  private priceInstance = 0;
  private nextInstance = 1;

  ngOnInit(): void {
    const ids = this.presets.map((p) => p.id);
    this.load(ids.includes(this.preset() as Mode) ? (this.preset() as Mode) : 'startup');
  }

  ngOnDestroy(): void {
    this.stop();
  }

  protected load(m: Mode): void {
    this.stop();
    this.mode.set(m);
    this.primary.set(false);
    this.qualifier.set(false);
    this.lazy.set(false);
    this.refactor.set(false);
    this.index.set(0);
    if (m === 'scopes') {
      this.priceRefs.set([]);
      this.cartRefs.set([]);
      this.checkoutRefs.set([]);
      this.scopeLog.set([]);
      this.priceInstance = 0;
      this.nextInstance = 1;
      this.injectedCart = 0;
    }
  }

  protected rerun(): void {
    this.stop();
    this.index.set(0);
  }

  protected byLayer(layer: Def['layer']): Def[] {
    return this.list().filter((d) => d.layer === layer);
  }

  protected layerName(layer: Def['layer']): string {
    return LAYER_NAMES[layer];
  }

  protected stateLabel(s: State): string {
    return { defined: 'definition only', creating: 'being created', ready: 'ready', failed: 'failed' }[s];
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
    }, 1400);
  }

  private stop(): void {
    this.playing.set(false);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private say(kind: string, text: string): void {
    this.scopeLog.update((l) => [...l, { kind, text }]);
  }

  protected getBean(type: 'PriceService' | 'ShoppingCart'): void {
    if (type === 'PriceService') {
      const first = !this.priceInstance;
      if (first) this.priceInstance = this.nextInstance++;
      this.priceRefs.update((r) => [...r, this.priceInstance]);
      this.say(first ? 'step' : 'hit', first ? `PriceService #${this.priceInstance} is created (at startup in a real app) and cached.` : `getBean returns the SAME PriceService #${this.priceInstance}: one instance per container, shared by everyone. Keep singletons stateless.`);
    } else {
      const id = this.nextInstance++;
      this.cartRefs.update((r) => [...r, id]);
      this.say('step', `A brand-new ShoppingCart #${id} is created for this request: prototype beans are never cached.`);
    }
  }

  protected checkout(provider: boolean): void {
    if (provider) {
      const id = this.nextInstance++;
      this.checkoutRefs.update((r) => [...r, id]);
      this.say('hit', `ObjectProvider<ShoppingCart>.getObject() asks the container each time: checkout uses a fresh cart #${id}.`);
      return;
    }
    if (!this.injectedCart) {
      this.injectedCart = this.nextInstance++;
      this.say('info', `CheckoutService is a singleton, created once. Its ShoppingCart was injected at that moment: cart #${this.injectedCart}.`);
    }
    this.checkoutRefs.update((r) => [...r, this.injectedCart]);
    this.say('warn', `checkout() uses cart #${this.injectedCart} again. A prototype injected into a singleton is created only once, so every customer would share one cart!`);
  }
}
