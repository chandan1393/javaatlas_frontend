import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface UploadTicket {
  videoId: string;
  libraryId: string;
  expires: number;
  signature: string;
  endpoint: string;
}

export interface VideoInfo {
  videoId: string;
  title: string;
  status: number;
  statusText: string;
  encodeProgress: number;
  lengthSeconds: number;
  ready: boolean;
}

/** Bunny Stream uploads for the course editor. */
@Injectable({ providedIn: 'root' })
export class AdminVideoService {
  private readonly api = inject(ApiService);
  private statusCache: Promise<{ uploads: boolean; signedPlayback: boolean }> | null = null;

  status(): Promise<{ uploads: boolean; signedPlayback: boolean }> {
    this.statusCache ??= this.api.get<{ uploads: boolean; signedPlayback: boolean }>('/api/admin/videos/status').catch(() => ({ uploads: false, signedPlayback: false }));
    return this.statusCache;
  }

  createUpload(title: string): Promise<UploadTicket> {
    return this.api.post<UploadTicket>('/api/admin/videos', { title });
  }

  info(id: string): Promise<VideoInfo> {
    return this.api.get<VideoInfo>(`/api/admin/videos/${encodeURIComponent(id)}`);
  }

  recent(): Promise<VideoInfo[]> {
    return this.api.get<VideoInfo[]>('/api/admin/videos');
  }

  async playUrl(id: string): Promise<string> {
    return (await this.api.get<{ url: string }>(`/api/admin/videos/${encodeURIComponent(id)}/play`)).url;
  }
}
