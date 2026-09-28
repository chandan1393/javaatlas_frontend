import { Component, computed, DOCUMENT, inject, input } from '@angular/core';
import { highlight, LANG_NAMES } from '../core/markup';
import { Lang, Lesson } from '../core/models';
import { TutorService } from '../core/tutor.service';
import { UiService } from '../core/ui.service';

/** Highlighted code with Copy and (when the tutor is on) Explain buttons. */
@Component({
  selector: 'app-code-block',
  template: `
    <div class="code">
      <div class="code-head">
        <span class="cap">{{ label() }}</span>
        <button type="button" (click)="copy()">Copy</button>
        @if (canExplain()) {
          <button type="button" (click)="explain()">Explain</button>
        }
      </div>
      <pre tabindex="0" [attr.aria-label]="label()"><code [innerHTML]="html()"></code></pre>
    </div>
  `,
})
export class CodeBlockComponent {
  readonly src = input.required<string>();
  readonly lang = input<Lang>('java');
  readonly cap = input<string>('');
  /** The lesson this code belongs to; enables the Explain button. */
  readonly lesson = input<Lesson | null>(null);

  private readonly tutor = inject(TutorService);
  private readonly ui = inject(UiService);
  private readonly document = inject(DOCUMENT);

  protected readonly html = computed(() => highlight(this.src(), this.lang()));
  protected readonly label = computed(() => this.cap() || LANG_NAMES[this.lang()]);
  protected readonly canExplain = computed(() => !!this.tutor.mode() && !!this.lesson() && this.lang() !== 'text');

  protected copy(): void {
    const text = this.src();
    const fallback = () => {
      const ta = this.document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      this.document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = this.document.execCommand('copy');
      } catch {
        ok = false;
      }
      ta.remove();
      this.ui.toast(ok ? 'Copied to clipboard' : 'Copy isn’t allowed here. Select the code and copy it manually.');
    };
    const clip = this.document.defaultView?.navigator.clipboard;
    if (clip?.writeText) clip.writeText(text).then(() => this.ui.toast('Copied to clipboard'), fallback);
    else fallback();
  }

  protected explain(): void {
    const lesson = this.lesson();
    if (!lesson) return;
    this.tutor.explain(lesson, this.src(), this.lang());
    const panel = this.document.querySelector('.tutor');
    const win = this.document.defaultView;
    if (panel && win && win.innerWidth <= 1180) {
      const reduce = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
      panel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }
}
