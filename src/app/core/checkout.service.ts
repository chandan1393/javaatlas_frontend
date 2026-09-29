import { DOCUMENT, inject, Injectable } from '@angular/core';
import { SETTINGS } from '../app.settings';
import { AccountService } from './account.service';
import { ApiService, errorText, isApiError } from './api.service';
import { CourseRef } from './models';
import { UiService } from './ui.service';
import { AnalyticsService } from './analytics.service';

interface OrderResponse {
  free: boolean;
  courseSlug: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string | null;
  courseTitle: string;
  name: string | null;
  email: string | null;
}

interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: 'payment.failed', handler: (r: { error?: { description?: string } }) => void): void;
}

type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * The Enroll button: sign in if needed, then either enroll for free or
 * create a Razorpay order, open Razorpay Checkout, and verify the payment on the backend.
 */
@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly api = inject(ApiService);
  private readonly account = inject(AccountService);
  private readonly ui = inject(UiService);
  private readonly document = inject(DOCUMENT);
  private scriptLoad: Promise<void> | null = null;

  private readonly analytics = inject(AnalyticsService);

  enroll(course: CourseRef): void {
    this.analytics.event('checkout_start', `/courses/${course.slug}`);
    if (!this.account.checked()) {
      this.ui.toast('Still connecting. Try again in a moment.');
      return;
    }
    if (!this.account.online()) {
      this.ui.info('Enrollment opens soon', `Enrollment for “${course.title}” isn’t open yet. Every lesson stays free to read in the meantime.`);
      return;
    }
    if (course.priceInr > 0 && !this.account.checkoutOpen()) {
      this.ui.info('Payments open soon', 'Online payments aren’t switched on yet. Please check back soon.');
      return;
    }
    if (!this.account.me()) {
      this.ui.auth(course, 'signup');
      return;
    }
    void this.start(course);
  }

  async start(course: CourseRef): Promise<void> {
    const goToCourse = { label: 'Start learning', link: ['/courses', course.slug, 'learn'] };
    this.ui.info(course.priceInr > 0 ? 'Opening checkout…' : 'Enrolling…', `“${course.title}”`, true);
    let order: OrderResponse;
    try {
      order = await this.api.post<OrderResponse>('/api/payments/order', { courseSlug: course.slug });
    } catch (e) {
      if (isApiError(e) && e.status === 401) {
        this.account.forgetSession();
        this.ui.auth(course, 'login');
        return;
      }
      if (isApiError(e) && e.code === 'already_enrolled') {
        this.account.markEnrolled(course.slug);
        this.ui.info('You already own this course', `“${course.title}” is in My courses.`, false, { ...goToCourse, label: 'Go to course' });
        return;
      }
      this.ui.info('Enrollment didn’t start', errorText(e));
      return;
    }

    if (order.free) {
      this.account.markEnrolled(course.slug);
      this.ui.info('You’re enrolled', `“${course.title}” is now in My courses.`, false, goToCourse);
      return;
    }

    let Razorpay: RazorpayCtor;
    try {
      Razorpay = await this.loadRazorpay();
    } catch {
      this.ui.info('Checkout didn’t load', 'The payment window couldn’t load. Check your connection or turn off content blockers for this site, then try again.');
      return;
    }
    this.ui.closeDialog();
    const rzp = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: SETTINGS.brand,
      description: order.courseTitle,
      prefill: { name: order.name ?? '', email: order.email ?? '' },
      theme: { color: SETTINGS.accent },
      handler: (resp: RazorpaySuccess) => void this.confirm(course, resp),
      modal: { ondismiss: () => this.ui.toast('Checkout closed. You can try again any time.') },
    });
    rzp.on('payment.failed', (r) => this.ui.toast(r?.error?.description || 'The payment didn’t go through. You can try again.'));
    rzp.open();
  }

  private async confirm(course: CourseRef, resp: RazorpaySuccess): Promise<void> {
    this.ui.info('Confirming your payment…', 'This only takes a moment.', true);
    try {
      await this.api.post('/api/payments/verify', {
        razorpayOrderId: resp.razorpay_order_id,
        razorpayPaymentId: resp.razorpay_payment_id,
        razorpaySignature: resp.razorpay_signature,
      });
      this.account.markEnrolled(course.slug);
      this.ui.info('You’re enrolled', `Payment received for “${course.title}”. Payment ID: ${resp.razorpay_payment_id}.`, false, {
        label: 'Start learning',
        link: ['/courses', course.slug, 'learn'],
      });
    } catch {
      this.ui.info(
        'Payment received, confirmation pending',
        `We couldn’t confirm your payment just now. If money was deducted, the course is added to your account as soon as the payment is confirmed. Keep this payment ID for support: ${resp.razorpay_payment_id}.`,
      );
    }
  }

  private loadRazorpay(): Promise<RazorpayCtor> {
    const win = this.document.defaultView as (Window & { Razorpay?: RazorpayCtor }) | null;
    if (win?.Razorpay) return Promise.resolve(win.Razorpay);
    this.scriptLoad ??= new Promise<void>((resolve, reject) => {
      const s = this.document.createElement('script');
      s.src = RAZORPAY_SCRIPT;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        this.scriptLoad = null;
        s.remove();
        reject(new Error('Razorpay script failed to load'));
      };
      this.document.head.appendChild(s);
    });
    return this.scriptLoad.then(() => {
      if (!win?.Razorpay) throw new Error('Razorpay missing');
      return win.Razorpay;
    });
  }
}
