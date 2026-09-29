import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';

export interface FeedbackPayload {
  type: 'idea' | 'bug' | 'content' | 'praise' | 'other' | 'lesson';
  rating?: number | null;
  helpful?: boolean | null;
  reasons?: string[];
  message?: string;
  name?: string;
  email?: string;
  page?: string;
  lessonId?: string;
  website?: string;
  elapsedMs?: number;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly api = inject(ApiService);

  send(f: FeedbackPayload): Promise<void> {
    return this.api.post<void>('/api/feedback', f);
  }
}
