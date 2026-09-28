import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

/** Admin pages need an admin session; until two-factor sign-in is set up, only the Security page opens. */
export const adminGuard: CanActivateFn = async (_route, state) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  const me = await auth.load();
  if (!me) return router.createUrlTree(['/admin/login'], { queryParams: { next: state.url } });
  if (auth.needs2fa() && !state.url.startsWith('/admin/security')) return router.createUrlTree(['/admin/security'], { queryParams: { setup: 1 } });
  return true;
};

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/** Asks before leaving a page with unsaved edits. */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  !component?.hasUnsavedChanges() || confirm('You have unsaved changes. Leave without saving?');
