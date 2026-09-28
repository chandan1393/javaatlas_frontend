import { Component, inject } from '@angular/core';
import { UiService } from '../core/ui.service';

@Component({
  selector: 'app-toast',
  template: `<div class="toast" [class.show]="ui.toastVisible()" role="status" aria-live="polite">{{ ui.toastText() }}</div>`,
})
export class ToastComponent {
  protected readonly ui = inject(UiService);
}
