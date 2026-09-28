import { Component, computed, ElementRef, model, signal, viewChild } from '@angular/core';
import { richText, words } from '../core/markup';

type Mode = 'write' | 'split' | 'preview';

/** Lecture text editor: Markdown with a toolbar, shortcuts and a live preview in the learner's style. */
@Component({
  selector: 'app-md-editor',
  template: `
    <div class="mde">
      <div class="mde-bar" role="toolbar" aria-label="Formatting">
        <button type="button" title="Heading" (click)="line('## ')"><b>H</b></button>
        <button type="button" title="Bold (Ctrl+B)" (click)="wrap('**', '**', 'bold text')"><b>B</b></button>
        <button type="button" title="Inline code (Ctrl+E)" (click)="wrap('\`', '\`', 'code')"><code>&lt;/&gt;</code></button>
        <button type="button" title="Bulleted list" (click)="line('- ')">• List</button>
        <button type="button" title="Numbered list" (click)="line('1. ')">1. List</button>
        <button type="button" title="Java code block" (click)="block()">{{ '{ }' }} Code</button>
        <span class="grow"></span>
        <span class="seg mde-modes" role="group" aria-label="View">
          <button type="button" [attr.aria-pressed]="mode() === 'write'" (click)="mode.set('write')">Write</button>
          <button type="button" [attr.aria-pressed]="mode() === 'split'" (click)="mode.set('split')">Split</button>
          <button type="button" [attr.aria-pressed]="mode() === 'preview'" (click)="mode.set('preview')">Preview</button>
        </span>
      </div>
      <div class="mde-body" [class.split]="mode() === 'split'">
        @if (mode() !== 'preview') {
          <textarea #ta class="mde-ta" spellcheck="true" [attr.aria-label]="label" [value]="value()" (input)="value.set($any($event.target).value)" (keydown)="onKey($event)"></textarea>
        }
        @if (mode() !== 'write') {
          <div class="mde-preview rich prose" [innerHTML]="html() || empty"></div>
        }
      </div>
      <div class="mde-foot">
        <span>{{ count() }} words · about {{ minutes() }} min read</span>
        <span class="muted">## heading · **bold** · \`code\` · - list · \`\`\`java code block</span>
      </div>
    </div>
  `,
})
export class MdEditorComponent {
  readonly value = model('');
  protected readonly label = 'Lecture text (Markdown)';
  protected readonly mode = signal<Mode>('split');
  protected readonly html = computed(() => richText(this.value()));
  protected readonly count = computed(() => words(this.value()));
  protected readonly minutes = computed(() => Math.max(1, Math.round(this.count() / 200)));
  protected readonly empty = '<p class="muted">The preview appears here as you type.</p>';
  private readonly ta = viewChild<ElementRef<HTMLTextAreaElement>>('ta');

  protected onKey(e: KeyboardEvent): void {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      this.wrap('**', '**', 'bold text');
    } else if (mod && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      this.wrap('`', '`', 'code');
    } else if (e.key === 'Tab' && !mod) {
      e.preventDefault();
      this.insert('    ', '', '');
    }
  }

  protected wrap(before: string, after: string, placeholder: string): void {
    this.insert(before, after, placeholder);
  }

  protected line(prefix: string): void {
    const el = this.ta()?.nativeElement;
    const v = this.value();
    if (!el) {
      this.value.set(v + (v.endsWith('\n') || !v ? '' : '\n') + prefix);
      return;
    }
    const start = v.lastIndexOf('\n', el.selectionStart - 1) + 1;
    this.value.set(v.slice(0, start) + prefix + v.slice(start));
    this.restore(el, el.selectionStart + prefix.length, el.selectionEnd + prefix.length);
  }

  protected block(): void {
    const el = this.ta()?.nativeElement;
    const v = this.value();
    const pos = el ? el.selectionStart : v.length;
    const needsBreak = pos > 0 && v[pos - 1] !== '\n';
    const snippet = `${needsBreak ? '\n' : ''}\`\`\`java\n// your code\n\`\`\`\n`;
    this.value.set(v.slice(0, pos) + snippet + v.slice(el ? el.selectionEnd : v.length));
    if (el) this.restore(el, pos + (needsBreak ? 1 : 0) + 8, pos + (needsBreak ? 1 : 0) + 20);
  }

  private insert(before: string, after: string, placeholder: string): void {
    const el = this.ta()?.nativeElement;
    const v = this.value();
    if (!el) {
      this.value.set(v + before + placeholder + after);
      return;
    }
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = v.slice(s, e) || placeholder;
    this.value.set(v.slice(0, s) + before + selected + after + v.slice(e));
    this.restore(el, s + before.length, s + before.length + selected.length);
  }

  private restore(el: HTMLTextAreaElement, start: number, end: number): void {
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start, end);
    });
  }
}
