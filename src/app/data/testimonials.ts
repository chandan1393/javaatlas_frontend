/**
 * Learner testimonials for the home page. The section stays hidden while this list is empty.
 * Only add real quotes from real learners, with their permission.
 */
export interface Testimonial {
  quote: string;
  name: string;
  /** e.g. 'Backend developer, Pune' */
  role: string;
}

export const TESTIMONIALS: Testimonial[] = [];
