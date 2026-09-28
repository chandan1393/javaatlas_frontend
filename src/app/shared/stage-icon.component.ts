import { Component, computed, input } from '@angular/core';
import { DEFAULT_STAGE_STYLE, STAGE_STYLE } from '../data/stage-style';

/** A stage's icon on its gradient tile. */
@Component({
  selector: 'app-stage-icon',
  template: `
    <span class="sicon" [class.sm]="size() === 'sm'" [style.--c1]="style().c1" [style.--c2]="style().c2" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="style().icon" /></svg>
    </span>
  `,
  styles: [':host{display:inline-flex;flex:none}'],
})
export class StageIconComponent {
  readonly stage = input.required<string>();
  readonly size = input<'sm' | 'md'>('md');
  protected readonly style = computed(() => STAGE_STYLE[this.stage()] ?? DEFAULT_STAGE_STYLE);
}
