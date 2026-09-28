import { Component, computed, DestroyRef, effect, inject, input, model, output, signal, untracked } from '@angular/core';
import { AdminVideoService, VideoInfo } from '../core/admin-video.service';
import { errorText } from '../core/api.service';
import { VideoComponent } from './video.component';

type Mode = 'upload' | 'library' | 'link';
const BUNNY = /^bunny:([0-9a-fA-F-]{36})$/;

/**
 * Video picker for the course editor: upload a file straight to Bunny Stream (resumable, with progress),
 * choose a video already in the Bunny library, or paste a YouTube/Vimeo/.mp4 link.
 * The value is "bunny:<video id>" or an https link.
 */
@Component({
  selector: 'app-lecture-video',
  imports: [VideoComponent],
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
  template: `
    <div class="lv">
      @if (bunnyId(); as id) {
        <div class="lv-current">
          <span class="lv-ico" aria-hidden="true">▶</span>
          <div class="lv-info">
            <strong>{{ info()?.title || 'Bunny Stream video' }}</strong>
            <span class="muted">
              @if (info(); as i) {
                {{ i.ready ? 'Ready' : i.statusText }}{{ !i.ready && i.encodeProgress ? ' ' + i.encodeProgress + '%' : '' }}{{ i.lengthSeconds ? ' · ' + clock(i.lengthSeconds) : '' }}
              } @else {
                Checking status…
              }
              · signed playback for enrolled learners
            </span>
            @if (info() && !info()!.ready && info()!.status < 4) {
              <div class="bar" aria-hidden="true"><i [style.width.%]="info()!.encodeProgress || 5"></i></div>
            }
          </div>
          <div class="lv-actions">
            <button type="button" class="btn btn-ghost btn-sm" (click)="preview(id)" [disabled]="!info()?.ready">Preview</button>
            <button type="button" class="btn btn-ghost btn-sm" (click)="clear()">Replace</button>
          </div>
        </div>
        @if (previewUrl()) {
          <app-video [url]="previewUrl()" [title]="label()" />
        }
      } @else {
        @if (uploading(); as u) {
          <div class="lv-upload">
            <div class="row-between">
              <strong>Uploading {{ u.name }}</strong>
              <button type="button" class="btn btn-ghost btn-sm" (click)="cancel()">Cancel</button>
            </div>
            <div class="bar lv-bar" role="progressbar" [attr.aria-valuenow]="u.pct" aria-valuemin="0" aria-valuemax="100"><i [style.width.%]="u.pct"></i></div>
            <span class="muted">{{ u.pct }}% · {{ mb(u.sent) }} of {{ mb(u.total) }}{{ u.speed ? ' · ' + mb(u.speed) + '/s' : '' }}{{ u.eta ? ' · about ' + u.eta + ' left' : '' }}</span>
            <small class="muted">Keep this tab open until the upload finishes. It resumes by itself if your connection drops.</small>
          </div>
        } @else {
          <div class="seg lv-tabs" role="tablist" aria-label="Video source">
            @if (uploads()) {
              <button type="button" role="tab" [attr.aria-selected]="mode() === 'upload'" (click)="mode.set('upload')">Upload</button>
              <button type="button" role="tab" [attr.aria-selected]="mode() === 'library'" (click)="openLibrary()">From library</button>
            }
            <button type="button" role="tab" [attr.aria-selected]="mode() === 'link'" (click)="mode.set('link')">Paste a link</button>
          </div>
          @switch (mode()) {
            @case ('upload') {
              <label class="lv-drop" [class.over]="dragging()" (dragover)="$event.preventDefault(); dragging.set(true)" (dragleave)="dragging.set(false)" (drop)="onDrop($event)">
                <input type="file" accept="video/*" (change)="onFile($any($event.target).files)" />
                <span class="lv-drop-ico" aria-hidden="true">⬆</span>
                <strong>Drop a video here or choose a file</strong>
                <span class="muted">MP4, MOV, MKV or WebM. Uploads go straight to Bunny Stream; large files are fine.</span>
              </label>
            }
            @case ('library') {
              @if (library() === null) {
                <p class="muted">Loading your Bunny library…</p>
              } @else if (!library()!.length) {
                <p class="muted">No videos in the library yet.</p>
              } @else {
                <ul class="lv-lib">
                  @for (v of library(); track v.videoId) {
                    <li>
                      <span class="lv-title">{{ v.title }}</span>
                      <span class="muted">{{ v.ready ? clock(v.lengthSeconds) : v.statusText }}</span>
                      <button type="button" class="btn btn-ghost btn-sm" (click)="choose(v)">Use</button>
                    </li>
                  }
                </ul>
              }
            }
            @case ('link') {
              <input class="field lv-link" [value]="value() ?? ''" (input)="setLink($any($event.target).value)" placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…" maxlength="500" />
              <small [class.err-inline]="!!value() && !linkOk()" class="muted">
                {{ !value() ? 'YouTube, Vimeo, Bunny Stream or a direct https .mp4 link. For paid lectures, uploads are safer: public links can be shared.' : linkOk() ? 'Supported link.' : 'This isn’t a supported video link.' }}
              </small>
              @if (value() && linkOk()) {
                <details class="vid-prev">
                  <summary>Preview video</summary>
                  <app-video [url]="value() ?? null" [title]="label()" />
                </details>
              }
            }
          }
        }
      }
      @if (error()) {
        <p class="err">{{ error() }}</p>
      }
    </div>
  `,
})
export class LectureVideoComponent {
  readonly value = model<string | null | undefined>(null);
  /** Used as the video title in Bunny. */
  readonly label = input('Lecture video', { alias: 'title' });
  /** Emits the video length in minutes once Bunny knows it. */
  readonly durationFound = output<number>();

  private readonly api = inject(AdminVideoService);
  protected readonly uploads = signal(false);
  protected readonly mode = signal<Mode>('link');
  protected readonly info = signal<VideoInfo | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly library = signal<VideoInfo[] | null>(null);
  protected readonly uploading = signal<{ name: string; pct: number; sent: number; total: number; speed: number; eta: string } | null>(null);
  protected readonly error = signal('');
  protected readonly dragging = signal(false);
  protected readonly bunnyId = computed(() => BUNNY.exec(this.value() ?? '')?.[1] ?? null);
  protected readonly linkOk = computed(() => isSupportedLink(this.value() ?? ''));
  private upload: { abort: (terminate?: boolean) => Promise<void> } | null = null;
  private poll: ReturnType<typeof setTimeout> | undefined;
  private watching: string | null = null;

  constructor() {
    void this.api.status().then((s) => {
      this.uploads.set(s.uploads);
      if (s.uploads && !this.value()) this.mode.set('upload');
    });
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.poll);
      void this.upload?.abort();
    });
    // Watch the processing status of the current Bunny video.
    effect(() => {
      this.bunnyId();
      untracked(() => this.watch());
    });
  }

  protected onBeforeUnload(e: BeforeUnloadEvent): void {
    if (this.uploading()) e.preventDefault();
  }

  protected setLink(v: string): void {
    this.value.set(v.trim() || null);
  }

  protected clear(): void {
    this.value.set(null);
    this.info.set(null);
    this.previewUrl.set(null);
    this.watching = null;
    clearTimeout(this.poll);
    this.mode.set(this.uploads() ? 'upload' : 'link');
  }

  protected async openLibrary(): Promise<void> {
    this.mode.set('library');
    this.library.set(null);
    try {
      this.library.set(await this.api.recent());
    } catch (e) {
      this.error.set(errorText(e));
      this.library.set([]);
    }
  }

  protected choose(v: VideoInfo): void {
    this.value.set(`bunny:${v.videoId}`);
    this.info.set(v);
    if (v.ready && v.lengthSeconds) this.durationFound.emit(Math.max(1, Math.round(v.lengthSeconds / 60)));
    this.watch();
  }

  protected async preview(id: string): Promise<void> {
    try {
      this.previewUrl.set(await this.api.playUrl(id));
    } catch (e) {
      this.error.set(errorText(e));
    }
  }

  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(false);
    void this.onFile(e.dataTransfer?.files ?? null);
  }

  protected async onFile(files: FileList | null): Promise<void> {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/') && !/\.(mp4|mov|mkv|webm|m4v|avi)$/i.test(file.name)) {
      this.error.set('Choose a video file (MP4, MOV, MKV or WebM).');
      return;
    }
    this.error.set('');
    const title = (this.label() || file.name).slice(0, 200);
    try {
      const ticket = await this.api.createUpload(title);
      const { Upload } = await import('tus-js-client/lib.esm/browser/index.js');
      const started = Date.now();
      this.uploading.set({ name: file.name, pct: 0, sent: 0, total: file.size, speed: 0, eta: '' });
      await new Promise<void>((resolve, reject) => {
        const up = new Upload(file, {
          endpoint: ticket.endpoint,
          retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
          chunkSize: 50 * 1024 * 1024,
          headers: {
            AuthorizationSignature: ticket.signature,
            AuthorizationExpire: String(ticket.expires),
            VideoId: ticket.videoId,
            LibraryId: ticket.libraryId,
          },
          metadata: { filetype: file.type || 'video/mp4', title },
          onProgress: (sent, total) => {
            const secs = (Date.now() - started) / 1000;
            const speed = secs > 1 ? sent / secs : 0;
            const left = speed ? (total - sent) / speed : 0;
            this.uploading.set({ name: file.name, pct: Math.floor((sent / total) * 100), sent, total, speed, eta: left > 5 ? duration(left) : '' });
          },
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        });
        this.upload = up;
        up.start();
      });
      this.uploading.set(null);
      this.upload = null;
      this.value.set(`bunny:${ticket.videoId}`);
      this.info.set(null);
      this.watch();
    } catch (e) {
      const cancelled = !this.uploading() && !this.upload;
      this.uploading.set(null);
      this.upload = null;
      if (!cancelled) this.error.set(e instanceof Error && !('status' in e) ? `The upload failed: ${e.message}` : errorText(e));
    }
  }

  protected async cancel(): Promise<void> {
    const up = this.upload;
    this.upload = null;
    this.uploading.set(null);
    await up?.abort(true);
  }

  protected clock(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  protected mb(bytes: number): string {
    return bytes >= 1024 ** 3 ? (bytes / 1024 ** 3).toFixed(2) + ' GB' : (bytes / 1024 ** 2).toFixed(1) + ' MB';
  }

  private watch(): void {
    const id = this.bunnyId();
    if (!id || this.watching === id) return;
    this.watching = id;
    const tick = async () => {
      if (this.watching !== id) return;
      try {
        const i = await this.api.info(id);
        if (this.watching !== id) return;
        const wasReady = this.info()?.ready;
        this.info.set(i);
        if (i.ready && !wasReady && i.lengthSeconds) this.durationFound.emit(Math.max(1, Math.round(i.lengthSeconds / 60)));
        if (!i.ready && i.status < 5) this.poll = setTimeout(tick, 5000);
      } catch (e) {
        this.error.set(errorText(e));
      }
    };
    void tick();
  }
}

function duration(seconds: number): string {
  if (seconds < 90) return `${Math.round(seconds)} s`;
  if (seconds < 5400) return `${Math.round(seconds / 60)} min`;
  return `${(seconds / 3600).toFixed(1)} h`;
}

/** The same video links the player accepts. */
export function isSupportedLink(u: string): boolean {
  const url = u.trim();
  return (
    /^https:\/\//.test(url) &&
    (/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{11}/.test(url) ||
      /vimeo\.com\/(?:video\/)?\d+/.test(url) ||
      /^https:\/\/iframe\.mediadelivery\.net\/(?:embed|play)\/\d+\/[\w-]+/.test(url) ||
      /\.(mp4|webm)(\?.*)?$/i.test(url))
  );
}
