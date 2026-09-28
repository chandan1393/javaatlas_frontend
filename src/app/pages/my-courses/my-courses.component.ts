import { Component, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/account.service';
import { errorText } from '../../core/api.service';
import { CourseApiService } from '../../core/course-api.service';
import { MyCourse } from '../../core/models';
import { UiService } from '../../core/ui.service';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-my-courses',
  imports: [RouterLink],
  templateUrl: './my-courses.component.html',
})
export class MyCoursesComponent {
  protected readonly account = inject(AccountService);
  protected readonly ui = inject(UiService);
  private readonly api = inject(CourseApiService);
  protected readonly items = signal<MyCourse[] | null>(null);
  protected readonly error = signal('');

  constructor() {
    inject(SeoService).set({ title: 'My courses', description: 'Your JavaAtlas account.', path: '/my/courses', noindex: true });
    effect(() => {
      const me = this.account.me();
      if (!this.account.checked()) return;
      untracked(() => {
        this.items.set(null);
        if (me) void this.load();
      });
    });
  }

  protected pct(c: MyCourse): number {
    return c.lectureCount ? Math.round((c.completedCount / c.lectureCount) * 100) : 0;
  }

  private async load(): Promise<void> {
    try {
      this.items.set(await this.api.myCourses());
    } catch (e) {
      this.error.set(errorText(e));
      this.items.set([]);
    }
  }
}
