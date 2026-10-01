export type Level = 'B' | 'I' | 'A';
export type Lang = 'java' | 'yaml' | 'bash' | 'dockerfile' | 'text';
export type Depth = 'beginner' | 'developer' | 'interview';
export type FeatType = 'l' | 'a' | 'j' | 't' | 's' | 'x';
export type FeatStatus = 'final' | 'preview' | 'incubator' | 'experimental';

export interface CodeExtra {
  cap: string;
  src: string;
  lang?: Lang;
}

/** One lesson. See README "Editing content" for what each field does. */
export interface Lesson {
  id: string;
  t: string;
  lvl: Level;
  /** Lowest Java version the lesson's code compiles on. */
  min?: number;
  eli5?: string;
  body: string;
  code: string;
  lang?: Lang;
  old?: string;
  neu?: string;
  oldLabel?: string;
  newLabel?: string;
  more?: CodeExtra[];
  pro?: string;
  trap?: string;
  iq?: [string, string][];
  /** [question, options, index of the right option, explanation] */
  quiz?: [string, string[], number, string];
  /** Subtopics shown as numbered sections with their own table of contents (see data/subtopics-*.ts). */
  subs?: SubTopic[];
  /** A side-by-side comparison table, for "X vs Y" lessons. Cells may use [[code]] and **bold**. */
  vs?: { a: string; b: string; rows: [string, string, string][] };
  /** An interactive lab shown after the explanation, e.g. 'hashmap:collision'. */
  lab?: string;
}

export interface SubTopic {
  id: string;
  t: string;
  /** Lesson markup: **bold**, [[code]], "- " lists, "1. " lists. */
  body: string;
  code?: string;
  lang?: Lang;
  /** Lowest Java version this subtopic's code needs. */
  min?: number;
  /** An interactive lab shown at the end of the subtopic, e.g. 'linkedlist' or 'tree:set'. */
  lab?: string;
}

export interface Stage {
  id: string;
  title: string;
  level: Level;
  blurb: string;
  lessons: Lesson[];
  /** The part of the curriculum the stage belongs to (set by data/curriculum.ts). */
  part?: { id: string; no: number; title: string };
}

export interface VersionEntry {
  v: string;
  n: number;
  date: string;
  name: string;
  aka?: string;
  lts?: boolean;
  planned?: boolean;
  f: string[];
  sig?: string;
}

export interface EcoEntry {
  y: number;
  track: string;
  t: string;
  p: string;
}

export interface Feature {
  /** DOM id, also used as the URL fragment: f-<version>-<index> */
  id: string;
  type: FeatType;
  status: FeatStatus;
  tag: string;
  text: string;
  star: number;
  version: VersionEntry;
}

export interface Question {
  id: string;
  q: string;
  a: string;
  lesson: Lesson;
}

export interface SearchHit {
  kind: string;
  title: string;
  sub: string;
  link: string[];
  fragment?: string;
  feature?: Feature;
  eco?: boolean;
}

export interface Me {
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface CourseSummary {
  slug: string;
  title: string;
  subtitle: string;
  level: string;
  priceInr: number;
  lectureCount: number;
  totalMinutes: number;
  /** Lectures with a video, and their total minutes. */
  videoCount?: number;
  videoMinutes?: number;
  outcomes: string[];
}

/** The minimum needed to start a checkout. */
export type CourseRef = Pick<CourseSummary, 'slug' | 'title' | 'priceInr'>;

export interface LectureItem {
  id: number;
  title: string;
  durationMin: number;
  freePreview: boolean;
  hasVideo: boolean;
}

export interface SectionItem {
  title: string;
  lectures: LectureItem[];
}

export interface CourseDetail extends CourseSummary {
  description: string;
  sections: SectionItem[];
  enrolled: boolean;
  published: boolean;
  completedLectureIds: number[];
  /** Public intro video for the course page (a playable link). */
  trailerUrl?: string | null;
}

export interface LectureView {
  id: number;
  title: string;
  sectionTitle: string;
  durationMin: number;
  freePreview: boolean;
  videoUrl: string | null;
  content: string;
  prevId: number | null;
  nextId: number | null;
  completed: boolean;
}

export interface MyCourse {
  slug: string;
  title: string;
  subtitle: string;
  lectureCount: number;
  completedCount: number;
  nextLectureId: number | null;
}

export type OrderStatus = 'CREATED' | 'PAID' | 'FAILED';
export type ApiDate = string | number;

export interface Order {
  orderId: string;
  courseSlug: string;
  courseTitle: string;
  amountPaise: number;
  status: OrderStatus;
  createdAt: ApiDate;
  paidAt: ApiDate | null;
  paymentId: string | null;
}

export interface AdminLecture {
  id: number | null;
  title: string;
  durationMin: number;
  freePreview: boolean;
  videoUrl: string | null;
  content: string;
}

export interface AdminSection {
  id: number | null;
  title: string;
  lectures: AdminLecture[];
}

export interface AdminCourse {
  id: number | null;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  outcomes: string[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  priceInr: number;
  published: boolean;
  sortOrder: number;
  sections: AdminSection[];
  /** "bunny:<id>" or an https video link. */
  trailerUrl?: string | null;
  enrollments: number;
}

export interface AdminOrder {
  orderId: string;
  userEmail: string;
  courseTitle: string;
  amountPaise: number;
  status: OrderStatus;
  createdAt: ApiDate;
  paidAt: ApiDate | null;
  paymentId: string | null;
}

export interface AdminOrders {
  paidCount: number;
  revenuePaise: number;
  orders: AdminOrder[];
}

export const LEVEL_NAMES: Record<Level, string> = { B: 'Beginner', I: 'Intermediate', A: 'Advanced' };

export const TYPE_NAMES: Record<FeatType, string> = {
  l: 'Language',
  a: 'Libraries and APIs',
  j: 'JVM, GC and performance',
  t: 'Tools',
  s: 'Security',
  x: 'Removed or restricted',
};

export const DEPTHS: { key: Depth; name: string; hint: string }[] = [
  { key: 'beginner', name: 'Beginner', hint: 'A plain-language analogy first, then the essentials.' },
  { key: 'developer', name: 'Developer', hint: 'The essentials plus production detail and pitfalls.' },
  { key: 'interview', name: 'Interview', hint: 'Adds the questions interviewers ask, with model answers.' },
];

/** Which optional sections each depth shows. */
export const SHOW: Record<Depth, { eli5: boolean; pro: boolean; iq: boolean }> = {
  beginner: { eli5: true, pro: false, iq: false },
  developer: { eli5: false, pro: true, iq: false },
  interview: { eli5: false, pro: true, iq: true },
};
