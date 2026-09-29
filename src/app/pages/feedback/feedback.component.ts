import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { FeedbackFormComponent } from '../../shared/feedback-form.component';

/** /feedback: the full-page feedback form. */
@Component({
  selector: 'app-feedback-page',
  imports: [FeedbackFormComponent, RouterLink],
  template: `
    <div class="wrap fb-page">
      <header class="page-head">
        <p class="eyebrow">Feedback</p>
        <h1>Help us make JavaAtlas better</h1>
        <p>Found a mistake, have an idea for a lesson, or something isn’t working? Every message is read, and many changes on this site started as feedback.</p>
      </header>
      <div class="fb-page-grid">
        <section class="panel">
          <app-feedback-form />
        </section>
        <aside class="fb-aside">
          <div class="panel">
            <h2>Good feedback includes</h2>
            <ul>
              <li><strong>Where:</strong> the lesson or page (we add the page automatically).</li>
              <li><strong>What:</strong> what you expected and what happened.</li>
              <li><strong>Your setup</strong> for bugs: phone or computer, and browser.</li>
            </ul>
          </div>
          <div class="panel">
            <h2>Need help with a payment?</h2>
            <p class="muted">For orders and refunds, use the <a routerLink="/contact">contact page</a> so we can find your order quickly.</p>
          </div>
        </aside>
      </div>
    </div>
  `,
})
export class FeedbackPageComponent {
  constructor() {
    inject(SeoService).set({
      title: 'Send feedback',
      description: 'Suggest a lesson, report a mistake or a bug, or tell us what you like about JavaAtlas.',
      path: '/feedback',
    });
  }
}
