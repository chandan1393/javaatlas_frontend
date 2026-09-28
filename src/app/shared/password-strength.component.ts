import { Component, computed, input } from '@angular/core';

/** A four-step strength bar shown under new-password fields. */
@Component({
  selector: 'app-password-strength',
  template: `
    @if (value()) {
      <div class="strength" [attr.data-score]="score()" aria-live="polite">
        <span class="segs" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span>{{ label() }}</span>
      </div>
    }
  `,
})
export class PasswordStrengthComponent {
  readonly value = input('');

  protected readonly score = computed(() => {
    const v = this.value();
    if (v.length < 8) return 1;
    let s = 1;
    if (v.length >= 12) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
    else if (/\d/.test(v) || /[^A-Za-z0-9]/.test(v)) s += 0.5;
    return Math.min(4, Math.floor(s));
  });

  protected readonly label = computed(() => (this.value().length < 8 ? 'Too short' : ['', 'Weak', 'Okay', 'Good', 'Strong'][this.score()]));
}
