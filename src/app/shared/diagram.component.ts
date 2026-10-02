import { Component, computed, inject, input, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { DIAGRAMS, Diagram, DNode } from '../data/diagrams';

/** Interactive concept diagrams: click any part to see what it is, or take the guided tour. */
@Component({
  selector: 'app-diagram',
  imports: [NgTemplateOutlet],
  template: `
    @if (d(); as d) {
      <section class="dg" [attr.aria-labelledby]="'dg-h-' + d.id">
        <header class="dg-head">
          <div>
            <h2 [id]="'dg-h-' + d.id">{{ d.title }}</h2>
            <p class="muted">{{ d.intro }}</p>
          </div>
          @if (d.tour?.length) {
            <div class="dg-tour">
              @if (tourAt() < 0) {
                <button type="button" class="btn btn-brand btn-sm" (click)="startTour()">Walk me through it</button>
              } @else {
                <button type="button" class="btn btn-ghost btn-sm" (click)="tourGo(tourAt() - 1)" [disabled]="tourAt() === 0">←</button>
                <span class="muted">{{ tourAt() + 1 }} / {{ d.tour!.length }}</span>
                <button type="button" class="btn btn-primary btn-sm" (click)="tourGo(tourAt() + 1)" [disabled]="tourAt() >= d.tour!.length - 1">Next →</button>
                <button type="button" class="btn btn-ghost btn-sm" (click)="toggleAuto()">{{ auto() ? 'Pause' : 'Play' }}</button>
                <button type="button" class="btn btn-ghost btn-sm" (click)="endTour()">Done</button>
              }
            </div>
          }
        </header>

        @switch (d.type) {
          @case ('flow') {
            <ol class="dg-flow">
              @for (n of d.nodes ?? []; track n.id; let last = $last) {
                <li>
                  <button type="button" class="dg-node" [attr.data-tone]="n.tone" [class.on]="n.id === active()" [attr.aria-pressed]="n.id === active()" (click)="pick(n)">
                    <b>{{ n.label }}</b>
                    @if (n.sub) { <small>{{ n.sub }}</small> }
                  </button>
                  @if (!last) { <span class="dg-arrow" aria-hidden="true"></span> }
                </li>
              }
            </ol>
          }
          @case ('tree') {
            <div class="dg-tree-wrap" [class.outline]="outline()">
              <ul class="dg-tree">
                <ng-container [ngTemplateOutlet]="treeNode" [ngTemplateOutletContext]="{ $implicit: d.root }" />
              </ul>
            </div>
          }
          @case ('nest') {
            <div class="dg-nest">
              <ng-container [ngTemplateOutlet]="boxNode" [ngTemplateOutletContext]="{ $implicit: d.root }" />
            </div>
          }
          @case ('states') {
            <div class="table-wrap">
              <svg class="dg-states" [attr.viewBox]="'0 0 ' + (d.w ?? 640) + ' ' + (d.h ?? 320)" role="img" [attr.aria-label]="d.title">
                <defs>
                  <marker [id]="'dg-arrow-' + d.id" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" /></marker>
                </defs>
                @for (e of edges(); track $index) {
                  <g class="dg-edge" [class.on]="e.from === active() || e.to === active()">
                    <line [attr.x1]="e.x1" [attr.y1]="e.y1" [attr.x2]="e.x2" [attr.y2]="e.y2" [attr.marker-end]="'url(#dg-arrow-' + d.id + ')'" />
                    @if (e.label) {
                      <text [attr.x]="e.lx" [attr.y]="e.ly">{{ e.label }}</text>
                    }
                  </g>
                }
                @for (n of d.nodes ?? []; track n.id) {
                  <g class="dg-state" [attr.data-tone]="n.tone" [class.on]="n.id === active()" (click)="pick(n)" (keydown.enter)="pick(n)" tabindex="0" role="button" [attr.aria-label]="n.label">
                    <rect [attr.x]="n.x! - 64" [attr.y]="n.y! - 20" width="128" height="40" rx="10" />
                    <text [attr.x]="n.x" [attr.y]="n.y! + 5">{{ n.label }}</text>
                  </g>
                }
              </svg>
            </div>
          }
          @case ('bars') {
            <div class="dg-bars">
              @for (b of d.bars ?? []; track b.label) {
                <button type="button" class="dg-bar-row" [class.on]="b.label === active()" (click)="pickBar(b)">
                  <span class="dg-bar-label">{{ b.label }}</span>
                  <span class="dg-bar-track"><i [attr.data-tone]="b.tone" [style.width.%]="barWidth(b.value)"></i></span>
                  <span class="dg-bar-value">{{ b.display ?? b.value }}</span>
                </button>
              }
            </div>
          }
        }

        <p class="dg-info" aria-live="polite">
          @if (selected(); as s) {
            <strong>{{ s.label }}</strong> {{ s.info }}
          } @else {
            <span class="muted">{{ d.type === 'bars' ? 'Click a bar' : 'Click any part of the diagram' }} to see what it means.</span>
          }
        </p>
      </section>

      <ng-template #treeNode let-n>
        <li>
          <button type="button" class="dg-node" [attr.data-tone]="n.tone" [class.on]="n.id === active()" [attr.aria-pressed]="n.id === active()" (click)="pick(n)">
            <b>{{ n.label }}</b>
            @if (n.sub) { <small>{{ n.sub }}</small> }
          </button>
          @if (n.children?.length) {
            <ul>
              @for (c of n.children; track c.id) {
                <ng-container [ngTemplateOutlet]="treeNode" [ngTemplateOutletContext]="{ $implicit: c }" />
              }
            </ul>
          }
        </li>
      </ng-template>

      <ng-template #boxNode let-n>
        <div class="dg-box" [attr.data-tone]="n.tone" [class.on]="n.id === active()" [class.leaf]="!n.children?.length">
          <button type="button" class="dg-box-label" [attr.aria-pressed]="n.id === active()" (click)="pick(n)">
            <b>{{ n.label }}</b>
            @if (n.sub) { <small>{{ n.sub }}</small> }
          </button>
          @if (n.children?.length) {
            <div class="dg-kids">
              @for (c of n.children; track c.id) {
                <ng-container [ngTemplateOutlet]="boxNode" [ngTemplateOutletContext]="{ $implicit: c }" />
              }
            </div>
          }
        </div>
      </ng-template>
    }
  `,
})
export class DiagramComponent implements OnDestroy {
  readonly id = input.required<string>();
  protected readonly d = computed<Diagram | undefined>(() => DIAGRAMS[this.id()]);
  protected readonly active = signal('');
  protected readonly tourAt = signal(-1);
  protected readonly auto = signal(false);
  private readonly picked = signal<{ label: string; info: string } | null>(null);
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Every node by id, flattened from trees and boxes. */
  private readonly index = computed(() => {
    const map = new Map<string, DNode>();
    const walk = (n?: DNode) => {
      if (!n) return;
      map.set(n.id, n);
      n.children?.forEach(walk);
    };
    const d = this.d();
    d?.nodes?.forEach(walk);
    walk(d?.root);
    return map;
  });
  protected readonly selected = computed(() => {
    const n = this.index().get(this.active());
    return n ? { label: n.label, info: n.info } : this.picked();
  });

  /** State-machine edges, shortened to the node borders, with label positions. */
  protected readonly edges = computed(() => {
    const d = this.d();
    if (!d || d.type !== 'states') return [];
    const pos = new Map((d.nodes ?? []).map((n) => [n.id, n]));
    const pairs = new Set((d.edges ?? []).map((e) => `${e.from}>${e.to}`));
    return (d.edges ?? []).map((e) => {
      const a = pos.get(e.from)!;
      const b = pos.get(e.to)!;
      let dx = b.x! - a.x!;
      let dy = b.y! - a.y!;
      const len = Math.hypot(dx, dy) || 1;
      // Two-way transitions are drawn as two parallel lines.
      const both = pairs.has(`${e.to}>${e.from}`);
      const ox = both ? (-dy / len) * 9 : 0;
      const oy = both ? (dx / len) * 9 : 0;
      const clip = (ddx: number, ddy: number) => Math.min(64 / Math.abs(ddx || 1e-6), 20 / Math.abs(ddy || 1e-6), 1);
      const t = clip(dx, dy);
      const x1 = a.x! + dx * t + ox;
      const y1 = a.y! + dy * t + oy;
      const x2 = b.x! - dx * t + ox;
      const y2 = b.y! - dy * t + oy;
      dx /= len;
      dy /= len;
      return { from: e.from, to: e.to, label: e.label, x1, y1, x2, y2, lx: (x1 + x2) / 2 + ox * 2.2, ly: (y1 + y2) / 2 + oy * 2.2 + 4 };
    });
  });

  /** Wide trees (more than four leaves) read better as an indented outline than as an org chart. */
  protected readonly outline = computed(() => {
    const leaves = (n?: DNode): number => (!n ? 0 : n.children?.length ? n.children.reduce((sum, c) => sum + leaves(c), 0) : 1);
    return leaves(this.d()?.root) > 4;
  });

  private readonly maxBar = computed(() => Math.max(1, ...(this.d()?.bars ?? []).map((b) => b.value)));

  ngOnDestroy(): void {
    this.stopAuto();
  }

  protected pick(n: DNode): void {
    this.active.set(this.active() === n.id ? '' : n.id);
  }

  protected pickBar(b: { label: string; info?: string }): void {
    this.active.set('');
    this.picked.set({ label: b.label, info: b.info ?? '' });
    this.active.set(b.label);
  }

  protected barWidth(v: number): number {
    const d = this.d();
    if (d?.log) return v <= 1 ? 2 : (Math.log10(v) / Math.log10(this.maxBar())) * 100;
    return (v / this.maxBar()) * 100;
  }

  protected startTour(): void {
    this.tourGo(0);
  }

  protected tourGo(i: number): void {
    const tour = this.d()?.tour ?? [];
    const k = Math.max(0, Math.min(i, tour.length - 1));
    this.tourAt.set(k);
    this.active.set(tour[k]);
  }

  protected endTour(): void {
    this.stopAuto();
    this.tourAt.set(-1);
    this.active.set('');
  }

  protected toggleAuto(): void {
    if (this.auto()) {
      this.stopAuto();
      return;
    }
    if (!this.browser) return;
    this.auto.set(true);
    this.timer = setInterval(() => {
      const last = (this.d()?.tour?.length ?? 1) - 1;
      if (this.tourAt() >= last) {
        this.stopAuto();
        return;
      }
      this.tourGo(this.tourAt() + 1);
    }, 3200);
  }

  private stopAuto(): void {
    this.auto.set(false);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
