import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/account.service';
import { ApiService } from '../../core/api.service';
import { errorText } from '../../core/api.service';
import { CourseApiService } from '../../core/course-api.service';
import { fmtWhen, paiseText, priceText } from '../../core/markup';
import { AdminCourse, AdminOrders } from '../../core/models';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-admin',
  imports: [RouterLink],
  templateUrl: './admin.component.html',
})
export class AdminComponent {
  protected readonly account = inject(AccountService);
  private readonly api = inject(CourseApiService);
  protected readonly courses = signal<AdminCourse[] | null>(null);
  protected readonly orders = signal<AdminOrders | null>(null);
  protected readonly error = signal('');
  protected readonly when = fmtWhen;
  protected readonly money = paiseText;
  protected readonly price = priceText;
  protected readonly today = signal<{ visitors: number; pageviews: number; searches: number; signups: number; activeNow: number } | null>(null);
  private readonly http = inject(ApiService);
  protected readonly revenue = computed(() => paiseText(this.orders()?.revenuePaise ?? 0).replace('Free', '₹0'));

  constructor() {
    inject(SeoService).set({ title: 'Admin', description: 'Your JavaAtlas account.', path: '/admin', noindex: true });
    void this.http
      .get<{ activeNow: number; current: { visitors: number; pageviews: number; searches: number; signups: number } }>('/api/admin/analytics?days=1')
      .then((r) => this.today.set({ ...r.current, activeNow: r.activeNow }))
      .catch(() => undefined);
    effect(() => {
      const admin = this.account.isAdmin();
      if (!admin) return;
      untracked(() => void this.load());
    });
  }

  protected lectures(c: AdminCourse): number {
    return c.sections.reduce((n, s) => n + s.lectures.length, 0);
  }

  private async load(): Promise<void> {
    try {
      const [courses, orders] = await Promise.all([this.api.adminCourses(), this.api.adminOrders()]);
      this.courses.set(courses);
      this.orders.set(orders);
    } catch (e) {
      this.error.set(errorText(e));
    }
  }
}
