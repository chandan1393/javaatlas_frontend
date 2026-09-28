import { CourseSummary } from './models';

/**
 * Shown only when the backend can't be reached (for example static hosting).
 * With the backend running, courses come from the database and are edited at /admin.
 */
export const FALLBACK_COURSES: CourseSummary[] = [
  {
    slug: 'java-in-an-hour',
    title: 'Java in an hour',
    subtitle: 'A free quick start: install Java, write real programs, and understand what you wrote.',
    level: 'Beginner',
    priceInr: 0,
    lectureCount: 4,
    totalMinutes: 52,
    outcomes: [],
  },
  {
    slug: 'spring-boot-rest-api',
    title: 'Build a production REST API with Spring Boot',
    subtitle: 'Design, build, secure, test and ship a real REST API with Spring Boot, PostgreSQL and Docker.',
    level: 'Intermediate',
    priceInr: 1499,
    lectureCount: 7,
    totalMinutes: 108,
    outcomes: [],
  },
  {
    slug: 'jpa-performance-clinic',
    title: 'JPA and Hibernate performance clinic',
    subtitle: 'Find and fix the slow queries that an ORM makes easy to write.',
    level: 'Advanced',
    priceInr: 1299,
    lectureCount: 6,
    totalMinutes: 87,
    outcomes: [],
  },
  {
    slug: 'java-interview-sprint',
    title: 'Java interview sprint',
    subtitle: 'The questions Java backend interviews actually ask, with model answers and follow-ups.',
    level: 'Intermediate',
    priceInr: 999,
    lectureCount: 7,
    totalMinutes: 98,
    outcomes: [],
  },
];
