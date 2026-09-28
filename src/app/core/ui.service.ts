import { Injectable, signal } from '@angular/core';
import { CourseRef } from './models';

export type AuthMode = 'signup' | 'login' | 'forgot';

export interface DialogAction {
  label: string;
  link: string[];
}

export type DialogState =
  | { kind: 'info'; title: string; text: string; waiting: boolean; action?: DialogAction }
  /** Log in / sign up. With a course, checkout continues after signing in. */
  | { kind: 'auth'; mode: AuthMode; course: CourseRef | null; redirect?: string };

/** Search result waiting to be highlighted on the versions page. */
export interface PendingHit {
  id: string;
  final: boolean;
  eco: boolean;
}

/** Shared UI state: dialog, toast, search overlay. */
@Injectable({ providedIn: 'root' })
export class UiService {
  readonly dialog = signal<DialogState | null>(null);
  readonly searchOpen = signal(false);
  readonly pendingHit = signal<PendingHit | null>(null);
  readonly toastText = signal('');
  readonly toastVisible = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  toast(message: string): void {
    this.toastText.set(message);
    this.toastVisible.set(true);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), 2600);
  }

  info(title: string, text: string, waiting = false, action?: DialogAction): void {
    this.dialog.set({ kind: 'info', title, text, waiting, action });
  }

  auth(course: CourseRef | null, mode: AuthMode = 'signup', redirect?: string): void {
    this.dialog.set({ kind: 'auth', mode, course, redirect });
  }

  closeDialog(): void {
    this.dialog.set(null);
  }
}
