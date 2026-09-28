import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AdminCourse, AdminOrders, CourseDetail, LectureView, MyCourse, Order } from './models';

/** Course pages, lectures, learner progress and the admin course editor. */
@Injectable({ providedIn: 'root' })
export class CourseApiService {
  private readonly api = inject(ApiService);

  detail(slug: string): Promise<CourseDetail> {
    return this.api.get(`/api/courses/${encodeURIComponent(slug)}`);
  }

  lecture(slug: string, lectureId: number): Promise<LectureView> {
    return this.api.get(`/api/courses/${encodeURIComponent(slug)}/lectures/${lectureId}`);
  }

  myCourses(): Promise<MyCourse[]> {
    return this.api.get('/api/me/courses');
  }

  orders(): Promise<Order[]> {
    return this.api.get('/api/me/orders');
  }

  setProgress(lectureId: number, done: boolean): Promise<{ done: boolean }> {
    return this.api.post(`/api/me/lectures/${lectureId}/progress`, { done });
  }

  // ---- admin ----
  adminCourses(): Promise<AdminCourse[]> {
    return this.api.get('/api/admin/courses');
  }

  adminCourse(id: number): Promise<AdminCourse> {
    return this.api.get(`/api/admin/courses/${id}`);
  }

  saveCourse(course: AdminCourse): Promise<AdminCourse> {
    return course.id ? this.api.put(`/api/admin/courses/${course.id}`, course) : this.api.post('/api/admin/courses', course);
  }

  deleteCourse(id: number): Promise<void> {
    return this.api.delete(`/api/admin/courses/${id}`);
  }

  adminOrders(): Promise<AdminOrders> {
    return this.api.get('/api/admin/orders');
  }
}
