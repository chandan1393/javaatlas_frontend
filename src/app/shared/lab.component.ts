import { Component, computed, input } from '@angular/core';
import { ArrayLabComponent } from './array-lab.component';
import { HashmapLabComponent } from './hashmap-lab.component';
import { MemoryLabComponent } from './memory-lab.component';
import { StreamLabComponent } from './stream-lab.component';
import { ThreadpoolLabComponent } from './threadpool-lab.component';
import { ThreadsLabComponent } from './threads-lab.component';

/** Every lab kind, for validation and documentation. Spec format: "kind" or "kind:preset". */
export const LAB_KINDS = ['hashmap', 'threads', 'memory', 'threadpool', 'stream', 'array'] as const;

/**
 * Shows an interactive lab by spec, e.g. "threads:race" or "memory:pass-by-value". Used by free lessons (lesson.lab)
 * and by course lectures (a line "::lab threads:race" in the lecture text). Each lab is loaded only when it scrolls
 * into view, so pages stay light.
 */
@Component({
  selector: 'app-lab',
  imports: [HashmapLabComponent, ThreadsLabComponent, MemoryLabComponent, ThreadpoolLabComponent, StreamLabComponent, ArrayLabComponent],
  template: `
    @switch (kind()) {
      @case ('hashmap') {
        @defer (on viewport) { <app-hashmap-lab [preset]="preset() || 'basic'" /> } @placeholder { <div class="lab-ph">HashMap lab</div> }
      }
      @case ('threads') {
        @defer (on viewport) { <app-threads-lab [preset]="preset() || 'race'" /> } @placeholder { <div class="lab-ph">Threads lab</div> }
      }
      @case ('memory') {
        @defer (on viewport) { <app-memory-lab [preset]="preset() || 'pass-by-value'" /> } @placeholder { <div class="lab-ph">Memory lab</div> }
      }
      @case ('threadpool') {
        @defer (on viewport) { <app-threadpool-lab [preset]="preset() || 'bounded'" /> } @placeholder { <div class="lab-ph">Thread pool lab</div> }
      }
      @case ('stream') {
        @defer (on viewport) { <app-stream-lab [preset]="preset() || 'lazy'" /> } @placeholder { <div class="lab-ph">Stream lab</div> }
      }
      @case ('array') {
        @defer (on viewport) { <app-array-lab [preset]="preset() || 'binary-search'" /> } @placeholder { <div class="lab-ph">Array lab</div> }
      }
    }
  `,
})
export class LabComponent {
  readonly spec = input.required<string>();
  protected readonly kind = computed(() => this.spec().split(':')[0].trim());
  protected readonly preset = computed(() => (this.spec().split(':')[1] ?? '').trim());
}

/** Splits lecture text into Markdown parts and "::lab kind:preset" lines. */
export function splitLabs(text: string): { md?: string; lab?: string }[] {
  const parts: { md?: string; lab?: string }[] = [];
  let buffer: string[] = [];
  for (const line of (text ?? '').split('\n')) {
    const m = /^::lab\s+([a-z-]+(?::[a-z0-9-]+)?)\s*$/.exec(line.trim());
    if (m && (LAB_KINDS as readonly string[]).includes(m[1].split(':')[0])) {
      if (buffer.join('\n').trim()) parts.push({ md: buffer.join('\n') });
      parts.push({ lab: m[1] });
      buffer = [];
    } else {
      buffer.push(line);
    }
  }
  if (buffer.join('\n').trim()) parts.push({ md: buffer.join('\n') });
  return parts;
}
