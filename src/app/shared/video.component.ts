import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

type Embed = { kind: 'iframe'; url: SafeResourceUrl } | { kind: 'file'; url: string };

/**
 * Lecture video. Supports YouTube, Vimeo, Bunny Stream embed links and direct .mp4/.webm files.
 * Only these known providers are embedded; anything else is ignored.
 */
@Component({
  selector: 'app-video',
  template: `
    @if (embed(); as e) {
      @if (e.kind === 'iframe') {
        <div class="video">
          <iframe
            [src]="e.url"
            [title]="title()"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowfullscreen
          ></iframe>
        </div>
      } @else {
        <video class="video-file" [src]="e.url" controls preload="metadata" controlsList="nodownload"></video>
      }
    }
  `,
})
export class VideoComponent {
  readonly url = input<string | null>(null);
  readonly title = input('Lecture video');
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly embed = computed<Embed | null>(() => {
    const url = (this.url() ?? '').trim();
    if (!url.startsWith('https://')) return null;
    const trusted = (u: string): Embed => ({ kind: 'iframe', url: this.sanitizer.bypassSecurityTrustResourceUrl(u) });
    let m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    if (m) return trusted(`https://www.youtube-nocookie.com/embed/${m[1]}?rel=0`);
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([\da-f]+))?/);
    if (m) return trusted(`https://player.vimeo.com/video/${m[1]}${m[2] ? '?h=' + m[2] : ''}`);
    m = url.match(/^https:\/\/iframe\.mediadelivery\.net\/(?:embed|play)\/(\d+)\/([\w-]+)(?:\?(.*))?$/);
    if (m) {
      // Keep Bunny's signed-playback parameters (strictly validated), drop anything else.
      const q = new URLSearchParams(m[3] ?? '');
      const token = q.get('token') ?? '';
      const expires = q.get('expires') ?? '';
      const signed = /^[0-9a-f]{64}$/.test(token) && /^\d{9,11}$/.test(expires) ? `token=${token}&expires=${expires}&` : '';
      return trusted(`https://iframe.mediadelivery.net/embed/${m[1]}/${m[2]}?${signed}responsive=true&preload=true`);
    }
    if (/\.(mp4|webm)(\?.*)?$/i.test(url)) return { kind: 'file', url };
    return null;
  });
}
