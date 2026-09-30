import { RenderMode, ServerRoute } from '@angular/ssr';
import { CURRICULUM } from './data/curriculum';
import { PATHS } from './data/paths';
import { PRODUCTS } from './data/products';

/**
 * Free lessons and the other public pages are rendered to static HTML at build time (good for Google).
 * Course, account and admin pages depend on the database and the signed-in user,
 * so they render in the browser.
 */
const clientOnly = [
  'courses',
  'courses/:slug',
  'courses/:slug/learn',
  'courses/:slug/learn/:lectureId',
  'my/courses',
  'my/orders',
  'my/learning',
  'reset-password',
  'admin',
  'admin/login',
  'admin/content',
  'admin/templates',
  'admin/analytics',
  'admin/feedback',
  'admin/security',
  'admin/courses/new',
  'admin/courses/:id',
];

export const serverRoutes: ServerRoute[] = [
  ...clientOnly.map((path): ServerRoute => ({ path, renderMode: RenderMode.Client })),
  {
    path: 'learn/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return CURRICULUM.flatMap((s) => s.lessons).map((l) => ({ id: l.id }));
    },
  },
  {
    path: 'paths/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return PATHS.map((p) => ({ id: p.id }));
    },
  },
  {
    path: 'versions/:product',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return PRODUCTS.map((p) => ({ product: p.id }));
    },
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
