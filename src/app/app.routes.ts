import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LearnComponent } from './pages/learn/learn.component';
import { adminGuard, unsavedChangesGuard } from './core/admin.guard';

/**
 * The home page and lessons load immediately; everything else is loaded on demand to keep the first visit fast.
 * Page titles, descriptions and structured data are set by each page through SeoService.
 */
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'learn', component: LearnComponent },
  { path: 'learn/:id', component: LearnComponent },
  { path: 'topics', loadComponent: () => import('./pages/topics/topics.component').then((m) => m.TopicsComponent) },
  { path: 'paths', loadComponent: () => import('./pages/paths/paths.component').then((m) => m.PathsComponent) },
  { path: 'paths/:id', loadComponent: () => import('./pages/paths/path-detail.component').then((m) => m.PathDetailComponent) },
  { path: 'versions', loadComponent: () => import('./pages/versions/versions.component').then((m) => m.VersionsComponent) },
  { path: 'versions/compatibility', loadComponent: () => import('./pages/product-versions/compatibility.component').then((m) => m.CompatibilityComponent) },
  { path: 'versions/:product', loadComponent: () => import('./pages/product-versions/product-versions.component').then((m) => m.ProductVersionsComponent) },
  { path: 'ai', loadComponent: () => import('./pages/ai-lab/ai-lab.component').then((m) => m.AiLabComponent) },
  { path: 'interview', loadComponent: () => import('./pages/interview/interview.component').then((m) => m.InterviewComponent) },
  { path: 'courses', loadComponent: () => import('./pages/courses/courses.component').then((m) => m.CoursesComponent) },
  { path: 'courses/:slug', loadComponent: () => import('./pages/course-detail/course-detail.component').then((m) => m.CourseDetailComponent) },
  { path: 'courses/:slug/learn', loadComponent: () => import('./pages/course-player/course-player.component').then((m) => m.CoursePlayerComponent) },
  { path: 'courses/:slug/learn/:lectureId', loadComponent: () => import('./pages/course-player/course-player.component').then((m) => m.CoursePlayerComponent) },
  { path: 'feedback', loadComponent: () => import('./pages/feedback/feedback.component').then((m) => m.FeedbackPageComponent) },
  { path: 'my/learning', loadComponent: () => import('./pages/my-learning/my-learning.component').then((m) => m.MyLearningComponent) },
  { path: 'my/courses', loadComponent: () => import('./pages/my-courses/my-courses.component').then((m) => m.MyCoursesComponent) },
  { path: 'my/orders', loadComponent: () => import('./pages/orders/orders.component').then((m) => m.OrdersComponent) },
  { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent) },
  { path: 'verify-email', loadComponent: () => import('./pages/verify-email/verify-email.component').then((m) => m.VerifyEmailComponent) },
  { path: 'about', loadComponent: () => import('./pages/legal/legal.component').then((m) => m.LegalComponent), data: { page: 'about' } },
  { path: 'contact', loadComponent: () => import('./pages/legal/legal.component').then((m) => m.LegalComponent), data: { page: 'contact' } },
  { path: 'privacy', loadComponent: () => import('./pages/legal/legal.component').then((m) => m.LegalComponent), data: { page: 'privacy' } },
  { path: 'terms', loadComponent: () => import('./pages/legal/legal.component').then((m) => m.LegalComponent), data: { page: 'terms' } },
  { path: 'refunds', loadComponent: () => import('./pages/legal/legal.component').then((m) => m.LegalComponent), data: { page: 'refunds' } },
  { path: 'delivery', loadComponent: () => import('./pages/legal/legal.component').then((m) => m.LegalComponent), data: { page: 'delivery' } },
  { path: 'admin/login', loadComponent: () => import('./pages/admin/admin-login.component').then((m) => m.AdminLoginComponent) },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-shell.component').then((m) => m.AdminShellComponent),
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent) },
      { path: 'analytics', loadComponent: () => import('./pages/admin/admin-analytics.component').then((m) => m.AdminAnalyticsComponent) },
      { path: 'feedback', loadComponent: () => import('./pages/admin/admin-feedback.component').then((m) => m.AdminFeedbackComponent) },
      { path: 'content', loadComponent: () => import('./pages/admin/admin-content.component').then((m) => m.AdminContentComponent) },
      { path: 'templates', loadComponent: () => import('./pages/admin/admin-templates.component').then((m) => m.AdminTemplatesComponent) },
      { path: 'security', loadComponent: () => import('./pages/admin/admin-security.component').then((m) => m.AdminSecurityComponent) },
      {
        path: 'courses/new',
        loadComponent: () => import('./pages/admin/course-editor.component').then((m) => m.CourseEditorComponent),
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'courses/:id',
        loadComponent: () => import('./pages/admin/course-editor.component').then((m) => m.CourseEditorComponent),
        canDeactivate: [unsavedChangesGuard],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
