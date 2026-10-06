import { Lesson, Level, Stage } from '../core/models';
import { STAGES_A } from './lessons-a';
import { STAGES_B } from './lessons-b';
import { STAGES_C } from './lessons-c';
import { STAGES_D } from './lessons-d';
import { EXTRA_LESSONS, EXTRA_STAGES } from './lessons-e';
import { MORE_LESSONS } from './lessons-f';
import { SPRING_LESSONS } from './lessons-g';

interface StagePlan {
  id: string;
  title: string;
  level: Level;
  /** Blurb for the stage; when omitted, the blurb from the stage with the same id in the lesson files is used. */
  blurb?: string;
  lessons: string[];
}

/**
 * The curriculum in teaching order, organised the way beginners learn: Core Java topic by topic
 * (basics, OOP, strings, exceptions, multithreading, collections), then Java 8 and beyond, then problem solving,
 * then databases, Spring and microservices.
 *
 * Lesson URLs and progress are keyed by lesson id, so moving lessons between stages never breaks links.
 * Every lesson must appear exactly once; the build fails otherwise.
 */
const LAYOUT: { id: string; title: string; stages: StagePlan[] }[] = [
  {
    id: 'core-java',
    title: 'Core Java',
    stages: [
      { id: 'fundamentals', title: 'Java basics', level: 'B', blurb: 'How Java runs, variables and types, operators, decisions, loops and arrays, methods, input and output, numbers and recursion.', lessons: ['jvm', 'types', 'operators', 'flow', 'arrays', 'methods', 'input', 'numbers', 'recursion'] },
      { id: 'oop', title: 'Object-oriented programming', level: 'B', lessons: ['classes', 'static-final', 'packages', 'access-modifiers', 'pillars', 'overloading-vs-overriding', 'parent-reference', 'interfaces', 'interface-vs-abstract', 'composition-vs-inheritance', 'relationships', 'inner', 'enums', 'records', 'object', 'immutability'] },
      { id: 'strings', title: 'Strings', level: 'B', blurb: 'String, StringBuilder, the string pool, text blocks, formatting and regular expressions.', lessons: ['strings', 'regex'] },
      { id: 'exceptions', title: 'Exception handling', level: 'B', blurb: 'try, catch and finally, checked vs unchecked exceptions, try-with-resources, custom exceptions and good error design.', lessons: ['exceptions'] },
      { id: 'concurrency', title: 'Multithreading', level: 'I', blurb: 'Step by step: threads, Runnable and Callable, then race conditions and synchronization, then thread pools, Fork/Join, CompletableFuture, concurrent collections and virtual threads.', lessons: ['threads', 'sync', 'executors', 'concurrent', 'forkjoin', 'cf', 'vthreads'] },
      { id: 'collections', title: 'Collections', level: 'B', blurb: 'Every List, Set, Map and Queue with an interactive visual for each one, sorting with Comparable and Comparator, and generics.', lessons: ['collections', 'lists-sets-queues', 'maps', 'hashmap', 'comparing', 'generics'] },
      { id: 'hashmap-internals', title: 'HashMap internals', level: 'I', lessons: ['hm-hashing', 'hm-buckets', 'hm-put', 'hm-get', 'hm-collision', 'hm-collision-resolution', 'hm-load-factor', 'hm-capacity', 'hm-resize', 'hm-equals-hashcode', 'hm-treeify', 'hm-java7-vs-java8', 'hm-mutable-keys'] },
      { id: 'collections-compared', title: 'Collections compared', level: 'I', lessons: ['arraylist-vs-linkedlist', 'hashset-vs-treeset', 'hashmap-vs-hashtable', 'hashmap-vs-concurrenthashmap', 'hashmap-vs-linkedhashmap', 'comparable-vs-comparator', 'iterator-vs-listiterator', 'fail-fast-vs-fail-safe'] },
      { id: 'core', title: 'More core APIs', level: 'I', blurb: 'Dates and times, files and I/O, serialization, reflection, networking and internationalisation.', lessons: ['datetime', 'io', 'serialization', 'reflection', 'networking', 'i18n'] },
      { id: 'jvm', title: 'JVM internals', level: 'A', blurb: 'How the JVM manages memory and garbage collection, and how classes are loaded.', lessons: ['memory', 'classloading'] },
    ],
  },
  {
    id: 'modern-java',
    title: 'Java 8 and beyond',
    stages: [
      { id: 'java8', title: 'Java 8: lambdas and streams', level: 'I', blurb: 'The features that changed Java: lambdas and functional interfaces, the Stream API, collectors and Optional.', lessons: ['lambdas', 'streams', 'collectors', 'optional'] },
      { id: 'modern', title: 'Java 9 to 25', level: 'I', blurb: 'A guided tour of every language feature from Java 10 to 25, then pattern matching, modules and the HTTP client in depth.', lessons: ['modern-features', 'patterns', 'modules', 'httpclient'] },
    ],
  },
  {
    id: 'problem-solving',
    title: 'Problem solving and design',
    stages: [
      { id: 'dsa', title: 'Data structures and algorithms', level: 'I', lessons: ['bigo', 'sorting', 'linkedlists', 'trees', 'dp'] },
      { id: 'design', title: 'Design and clean code', level: 'I', lessons: ['clean', 'solid', 'creational', 'structural', 'behavioral'] },
      { id: 'tools', title: 'Tools and testing', level: 'I', lessons: ['maven', 'logging', 'junit', 'mockito', 'debugging', 'annotations', 'json'] },
    ],
  },
  {
    id: 'backend',
    title: 'Databases, Spring and microservices',
    stages: [
      { id: 'data', title: 'JDBC, JPA and Hibernate', level: 'I', lessons: ['jdbc', 'orm', 'entities', 'lifecycle', 'nplus1', 'tx'] },
      { id: 'spring', title: 'Spring Core and Spring MVC', level: 'I', blurb: 'How Spring really works: the IoC container, dependency injection, scopes and lifecycle, Java configuration, AOP and proxies, events, and the MVC request flow, with interactive labs.', lessons: ['ioc', 'di', 'beans', 'configuration', 'aop', 'proxies', 'spring-events', 'mvc'] },
      { id: 'boot', title: 'Spring Boot', level: 'I', lessons: ['boot', 'config', 'datajpa', 'rest', 'testing', 'caching', 'scheduling', 'reactive'] },
      { id: 'sec', title: 'Spring Security', level: 'I', blurb: 'From the filter chain to OAuth 2.0: authentication, password storage, authorization, JWT, OpenID Connect, CSRF and CORS, with labs that sign real tokens and hash real passwords.', lessons: ['security', 'sec-architecture', 'sec-authentication', 'sec-passwords', 'sec-authorization', 'sec-jwt', 'sec-oauth2', 'sec-csrf-cors'] },
      { id: 'micro', title: 'Microservices', level: 'A', lessons: ['ms', 'gateway', 'comm', 'resilience', 'saga', 'deploy', 'cicd'] },
    ],
  },
];

export const CURRICULUM: Stage[] = build();

function build(): Stage[] {
  const base = [...STAGES_A, ...STAGES_D, ...STAGES_B, ...STAGES_C, ...EXTRA_STAGES.map((e) => e.stage)];
  const pool = new Map<string, Lesson>();
  const add = (l: Lesson) => {
    if (pool.has(l.id)) throw new Error(`Duplicate lesson id: ${l.id}`);
    pool.set(l.id, l);
  };
  base.forEach((st) => st.lessons.forEach(add));
  EXTRA_LESSONS.forEach((e) => e.lessons.forEach(add));
  MORE_LESSONS.forEach(add);
  SPRING_LESSONS.forEach(add);
  const blurbs = new Map(base.map((st) => [st.id, st.blurb]));

  const used = new Set<string>();
  const stages: Stage[] = [];
  LAYOUT.forEach((part, pi) => {
    for (const plan of part.stages) {
      const lessons = plan.lessons.map((id) => {
        const lesson = pool.get(id);
        if (!lesson) throw new Error(`curriculum: unknown lesson "${id}" in stage ${plan.id}`);
        if (used.has(id)) throw new Error(`curriculum: lesson "${id}" is used twice`);
        used.add(id);
        return lesson;
      });
      stages.push({
        id: plan.id,
        title: plan.title,
        level: plan.level,
        blurb: plan.blurb ?? blurbs.get(plan.id) ?? '',
        lessons,
        part: { id: part.id, no: pi + 1, title: part.title },
      });
    }
  });
  const missing = [...pool.keys()].filter((id) => !used.has(id));
  if (missing.length) throw new Error(`curriculum: lessons not placed in any stage: ${missing.join(', ')}`);
  return stages;
}
