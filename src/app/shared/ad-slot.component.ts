import { afterRenderEffect, Component, computed, inject, input } from '@angular/core';
import { AdSlotName, SETTINGS } from '../app.settings';
import { AdsService } from '../core/ads.service';

/**
 * One AdSense ad unit, clearly labelled. Renders nothing unless AdSense is configured,
 * the unit has an id, and ads are allowed on this page for this visitor.
 */
@Component({
  selector: 'app-ad',
  template: `
    @if (visible()) {
      <aside class="ad" [class.ad-side]="slot() === 'sidebar'" aria-label="Advertisement">
        <span class="ad-label">Advertisement</span>
        <ins
          class="adsbygoogle"
          style="display: block"
          [attr.data-ad-client]="ads.client"
          [attr.data-ad-slot]="slotId()"
          [attr.data-ad-format]="slot() === 'inArticle' ? 'fluid' : 'auto'"
          [attr.data-ad-layout]="slot() === 'inArticle' ? 'in-article' : null"
          [attr.data-full-width-responsive]="slot() === 'inArticle' ? null : 'true'"
          [attr.data-adtest]="testMode ? 'on' : null"
        ></ins>
      </aside>
    }
  `,
})
export class AdSlotComponent {
  readonly slot = input.required<AdSlotName>();
  protected readonly ads = inject(AdsService);
  protected readonly testMode = SETTINGS.ads.testMode;
  protected readonly slotId = computed(() => this.ads.slotId(this.slot()));
  protected readonly visible = computed(() => this.ads.allowed() && !!this.slotId());
  private filled = false;

  constructor() {
    afterRenderEffect(() => {
      if (this.visible() && !this.filled) {
        this.filled = true;
        this.ads.fill();
      }
    });
  }
}
