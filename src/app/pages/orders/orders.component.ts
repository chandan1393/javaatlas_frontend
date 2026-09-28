import { Component, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/account.service';
import { errorText } from '../../core/api.service';
import { CourseApiService } from '../../core/course-api.service';
import { fmtWhen, paiseText } from '../../core/markup';
import { Order, OrderStatus } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { PasswordStrengthComponent } from '../../shared/password-strength.component';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-orders',
  imports: [RouterLink, PasswordStrengthComponent],
  templateUrl: './orders.component.html',
})
export class OrdersComponent {
  protected readonly account = inject(AccountService);
  protected readonly ui = inject(UiService);
  private readonly api = inject(CourseApiService);
  protected readonly orders = signal<Order[] | null>(null);
  protected readonly error = signal('');
  protected readonly when = fmtWhen;
  protected readonly money = paiseText;

  // Change password
  protected readonly current = signal('');
  protected readonly next = signal('');
  protected readonly pwMessage = signal('');
  protected readonly pwSaving = signal(false);

  constructor() {
    inject(SeoService).set({ title: 'Orders and account', description: 'Your JavaAtlas account.', path: '/my/orders', noindex: true });
    effect(() => {
      const me = this.account.me();
      if (!this.account.checked()) return;
      untracked(() => {
        this.orders.set(null);
        if (me) void this.load();
      });
    });
  }

  protected status(s: OrderStatus): string {
    return s === 'PAID' ? 'Paid' : s === 'FAILED' ? 'Failed' : 'Not completed';
  }

  protected async changePassword(): Promise<void> {
    if (this.next().length < 8) {
      this.pwMessage.set('New passwords need at least 8 characters.');
      return;
    }
    this.pwSaving.set(true);
    try {
      await this.account.changePassword(this.current(), this.next());
      this.current.set('');
      this.next.set('');
      this.pwMessage.set('Password changed.');
    } catch (e) {
      this.pwMessage.set(errorText(e));
    } finally {
      this.pwSaving.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      this.orders.set(await this.api.orders());
    } catch (e) {
      this.error.set(errorText(e));
      this.orders.set([]);
    }
  }
}
