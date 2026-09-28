import { Component, computed, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { aiToHtml } from '../../core/markup';
import { DEPTHS, Lesson } from '../../core/models';
import { ProgressService } from '../../core/progress.service';
import { TutorService } from '../../core/tutor.service';

/** "Ask about this lesson" chat. Hidden when no AI is configured. */
@Component({
  selector: 'app-tutor',
  templateUrl: './tutor-panel.component.html',
})
export class TutorPanelComponent {
  readonly lesson = input.required<Lesson>();

  protected readonly tutor = inject(TutorService);
  protected readonly progress = inject(ProgressService);
  protected readonly draft = signal('');
  protected readonly suggestions = [
    'Explain it with a real-life example',
    'What mistakes do beginners make here?',
    'How is this used in a real Spring Boot project?',
  ];
  private readonly threadEl = viewChild<ElementRef<HTMLElement>>('thread');

  protected readonly depthName = computed(() => (DEPTHS.find((d) => d.key === this.progress.depth())?.name ?? '').toLowerCase());
  protected readonly items = computed(() =>
    (this.tutor.threads()[this.lesson().id] ?? []).map((m) => ({
      role: m.role,
      text: m.show ?? m.content,
      html: m.role === 'assistant' ? aiToHtml(m.content) : '',
    })),
  );
  protected readonly live = computed(() => {
    const l = this.tutor.live();
    return l && l.lessonId === this.lesson().id ? l.text : null;
  });
  protected readonly liveHtml = computed(() => {
    const t = this.live();
    return t ? aiToHtml(t) : '<p>Thinking…</p>';
  });

  constructor() {
    // Keep the newest message in view.
    effect(() => {
      this.items();
      this.live();
      const el = this.threadEl()?.nativeElement;
      if (el) setTimeout(() => (el.scrollTop = el.scrollHeight));
    });
  }

  protected ask(text: string): void {
    void this.tutor.ask(this.lesson(), text);
  }

  protected send(): void {
    const text = this.draft().trim();
    if (!text || this.tutor.busy()) return;
    this.draft.set('');
    this.ask(text);
  }

  protected onInput(e: Event): void {
    const ta = e.target as HTMLTextAreaElement;
    this.draft.set(ta.value);
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }

  protected onKey(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      this.send();
    }
  }
}
