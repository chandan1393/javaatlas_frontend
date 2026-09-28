import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';

const finePointer = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Soft light that follows the cursor across a card (sets --mx and --my; styled by .spot in CSS). */
@Directive({ selector: '[appSpot]', host: { class: 'spot', '(pointermove)': 'move($event)' } })
export class SpotlightDirective {
  private readonly el = inject(ElementRef<HTMLElement>);

  protected move(e: PointerEvent): void {
    const r = this.el.nativeElement.getBoundingClientRect();
    this.el.nativeElement.style.setProperty('--mx', `${e.clientX - r.left}px`);
    this.el.nativeElement.style.setProperty('--my', `${e.clientY - r.top}px`);
  }
}

/** Gentle 3D tilt towards the cursor. */
@Directive({ selector: '[appTilt]', host: { '(pointermove)': 'move($event)', '(pointerleave)': 'reset()' } })
export class TiltDirective {
  readonly appTilt = input(6);
  private readonly el = inject(ElementRef<HTMLElement>);

  protected move(e: PointerEvent): void {
    if (!finePointer()) return;
    const r = this.el.nativeElement.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    const max = this.appTilt();
    this.el.nativeElement.style.transform = `perspective(1100px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`;
  }

  protected reset(): void {
    this.el.nativeElement.style.transform = '';
  }
}

/** Counts a number up from zero the first time it scrolls into view. */
@Directive({ selector: '[appCount]' })
export class CountUpDirective {
  readonly appCount = input.required<number>();
  readonly suffix = input('');
  private readonly el = inject(ElementRef<HTMLElement>);

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const node = this.el.nativeElement;
      const target = this.appCount();
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce || typeof IntersectionObserver === 'undefined') {
        node.textContent = `${target}${this.suffix()}`;
        return;
      }
      node.textContent = `0${this.suffix()}`;
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((en) => en.isIntersecting)) return;
        io.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / 1200);
          const eased = 1 - Math.pow(1 - t, 3);
          node.textContent = `${Math.round(target * eased)}${this.suffix()}`;
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
      io.observe(node);
      destroy.onDestroy(() => io.disconnect());
    });
  }
}
