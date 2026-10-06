import { Component, computed, input } from '@angular/core';
import { ArrayLabComponent } from './array-lab.component';
import { BlockingqueueLabComponent } from './blockingqueue-lab.component';
import { ChmLabComponent } from './chm-lab.component';
import { DequeLabComponent } from './deque-lab.component';
import { DiagramComponent } from './diagram.component';
import { JwtLabComponent } from './jwt-lab.component';
import { PasswordLabComponent } from './password-lab.component';
import { ProxyLabComponent } from './proxy-lab.component';
import { SecurityLabComponent } from './security-lab.component';
import { SpringLabComponent } from './spring-lab.component';
import { HeapLabComponent } from './heap-lab.component';
import { LinkedhashmapLabComponent } from './linkedhashmap-lab.component';
import { LinkedlistLabComponent } from './linkedlist-lab.component';
import { TreeLabComponent } from './tree-lab.component';
import { HashmapLabComponent } from './hashmap-lab.component';
import { MemoryLabComponent } from './memory-lab.component';
import { StreamLabComponent } from './stream-lab.component';
import { ThreadpoolLabComponent } from './threadpool-lab.component';
import { ThreadsLabComponent } from './threads-lab.component';

/** Every lab kind, for validation and documentation. Spec format: "kind" or "kind:preset". */
export const LAB_KINDS = [
  'hashmap', 'threads', 'memory', 'threadpool', 'stream', 'array',
  'linkedlist', 'deque', 'heap', 'tree', 'linkedhashmap', 'chm', 'blockingqueue', 'diagram',
  'spring', 'proxy', 'security', 'jwt', 'password',
] as const;

/**
 * Shows an interactive lab by spec, e.g. "threads:race" or "memory:pass-by-value". Used by free lessons (lesson.lab)
 * and by course lectures (a line "::lab threads:race" in the lecture text). Each lab is loaded only when it scrolls
 * into view, so pages stay light.
 */
@Component({
  selector: 'app-lab',
  imports: [
    HashmapLabComponent, ThreadsLabComponent, MemoryLabComponent, ThreadpoolLabComponent, StreamLabComponent, ArrayLabComponent,
    LinkedlistLabComponent, DequeLabComponent, HeapLabComponent, TreeLabComponent, LinkedhashmapLabComponent, ChmLabComponent,
    BlockingqueueLabComponent, DiagramComponent, SpringLabComponent, ProxyLabComponent, SecurityLabComponent, JwtLabComponent,
    PasswordLabComponent,
  ],
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
      @case ('linkedlist') {
        @defer (on viewport) { <app-linkedlist-lab /> } @placeholder { <div class="lab-ph">LinkedList lab</div> }
      }
      @case ('deque') {
        @defer (on viewport) { <app-deque-lab [preset]="preset() || 'queue'" /> } @placeholder { <div class="lab-ph">ArrayDeque lab</div> }
      }
      @case ('heap') {
        @defer (on viewport) { <app-heap-lab /> } @placeholder { <div class="lab-ph">PriorityQueue lab</div> }
      }
      @case ('tree') {
        @defer (on viewport) { <app-tree-lab [preset]="preset() || 'map'" /> } @placeholder { <div class="lab-ph">TreeMap lab</div> }
      }
      @case ('linkedhashmap') {
        @defer (on viewport) { <app-linkedhashmap-lab [preset]="preset() || 'insertion'" /> } @placeholder { <div class="lab-ph">LinkedHashMap lab</div> }
      }
      @case ('chm') {
        @defer (on viewport) { <app-chm-lab [preset]="preset() || 'chm'" /> } @placeholder { <div class="lab-ph">ConcurrentHashMap lab</div> }
      }
      @case ('spring') {
        @defer (on viewport) { <app-spring-lab [preset]="preset() || 'startup'" /> } @placeholder { <div class="lab-ph">Spring container lab</div> }
      }
      @case ('proxy') {
        @defer (on viewport) { <app-proxy-lab [preset]="preset() || 'transactional'" /> } @placeholder { <div class="lab-ph">Proxy lab</div> }
      }
      @case ('security') {
        @defer (on viewport) { <app-security-lab /> } @placeholder { <div class="lab-ph">Security filter chain lab</div> }
      }
      @case ('jwt') {
        @defer (on viewport) { <app-jwt-lab /> } @placeholder { <div class="lab-ph">JWT lab</div> }
      }
      @case ('password') {
        @defer (on viewport) { <app-password-lab /> } @placeholder { <div class="lab-ph">Password lab</div> }
      }
      @case ('diagram') {
        @defer (on viewport) { <app-diagram [id]="preset()" /> } @placeholder { <div class="lab-ph">Diagram</div> }
      }
      @case ('blockingqueue') {
        @defer (on viewport) { <app-blockingqueue-lab /> } @placeholder { <div class="lab-ph">BlockingQueue lab</div> }
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
