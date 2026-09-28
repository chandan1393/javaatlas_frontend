import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SETTINGS } from '../app.settings';

export interface ApiError {
  status: number;
  code?: string;
  message: string;
  /** true when the backend sent a readable error (safe to show to the user) */
  server: boolean;
}

export function isApiError(e: unknown): e is ApiError {
  return !!e && typeof e === 'object' && 'status' in e && 'message' in e;
}

/** A message that is safe to show for any error. */
export function errorText(e: unknown): string {
  return isApiError(e) && e.server ? e.message : 'Couldn’t reach the server. Check your connection and try again.';
}

function toApiError(e: unknown): ApiError {
  if (e instanceof HttpErrorResponse) {
    const body = e.error && typeof e.error === 'object' ? (e.error as Record<string, unknown>) : null;
    const problem = !!body && ('detail' in body || 'title' in body);
    const props = body && typeof body['properties'] === 'object' ? (body['properties'] as Record<string, unknown>) : null;
    const code = (body?.['code'] ?? props?.['code']) as string | undefined;
    const detail = (body?.['detail'] ?? body?.['title']) as string | undefined;
    return {
      status: e.status,
      code,
      server: problem,
      message:
        (problem && detail) ||
        (e.status ? `Something went wrong (${e.status}). Please try again.` : 'Couldn’t reach the server. Check your connection and try again.'),
    };
  }
  return { status: 0, message: 'Something went wrong. Please try again.', server: false };
}

/** Thin wrapper over HttpClient: sends the session cookie and returns promises with readable errors. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = SETTINGS.apiBase.replace(/\/+$/, '');

  get<T>(path: string): Promise<T> {
    return this.run(this.http.get<T>(this.base + path, { withCredentials: true }));
  }

  post<T>(path: string, body: unknown = {}, abort?: AbortSignal): Promise<T> {
    return this.run(this.http.post<T>(this.base + path, body, { withCredentials: true }), abort);
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.run(this.http.put<T>(this.base + path, body, { withCredentials: true }));
  }

  delete<T>(path: string): Promise<T> {
    return this.run(this.http.delete<T>(this.base + path, { withCredentials: true }));
  }

  private run<T>(source: Observable<T>, abort?: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const sub = source.subscribe({ next: (v) => resolve(v), error: (e) => reject(toApiError(e)) });
      abort?.addEventListener(
        'abort',
        () => {
          sub.unsubscribe();
          reject({ status: 0, code: 'cancelled', message: 'Cancelled', server: false } satisfies ApiError);
        },
        { once: true },
      );
    });
  }
}
