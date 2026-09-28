/** Guided learning paths: an ordered list of lessons for one goal. */
export interface LearningPath {
  id: string;
  title: string;
  level: string;
  /** Who the path is for. */
  who: string;
  blurb: string;
  outcome: string;
  lessons: string[];
}

export const PATHS: LearningPath[] = [
  {
    id: 'java-from-zero',
    title: 'Java from zero',
    level: 'Beginner',
    who: 'You have never programmed, or you are new to Java.',
    blurb: 'Install Java and write real programs, then learn objects, collections and the modern Java basics every job expects.',
    outcome: 'You can write, run, debug and test small Java programs on your own.',
    lessons: [
      'jvm', 'types', 'operators', 'flow', 'arrays', 'methods', 'strings', 'input', 'numbers', 'recursion',
      'classes', 'static-final', 'packages', 'pillars', 'interfaces', 'enums', 'records', 'exceptions',
      'collections', 'lists-sets-queues', 'generics', 'lambdas', 'streams', 'clean', 'debugging',
    ],
  },
  {
    id: 'backend-developer',
    title: 'Job-ready backend developer',
    level: 'Intermediate',
    who: 'You know the Java basics and want to build and ship REST APIs.',
    blurb: 'Everything between "I know Java" and "I can build a production Spring Boot service": tools, testing, databases, Spring and deployment.',
    outcome: 'You can build, test, secure and deploy a Spring Boot REST API backed by PostgreSQL.',
    lessons: [
      'object', 'exceptions', 'collections', 'hashmap', 'generics', 'lambdas', 'streams', 'optional', 'maven',
      'logging', 'junit', 'mockito', 'json', 'annotations', 'jdbc', 'orm', 'entities', 'lifecycle', 'nplus1', 'tx',
      'networking', 'ioc', 'beans', 'mvc', 'boot', 'config', 'datajpa', 'rest', 'security', 'testing', 'caching', 'deploy', 'cicd',
    ],
  },
  {
    id: 'interview-prep',
    title: 'Crack the Java interview',
    level: 'Intermediate to advanced',
    who: 'You have a Java developer interview coming up.',
    blurb: 'The topics interviewers ask about most, from equals and HashMap internals to concurrency, data structures, Spring and system design.',
    outcome: 'You can explain the classic Java questions clearly and solve common coding problems.',
    lessons: [
      'object', 'strings', 'immutability', 'hashmap', 'collections', 'comparing', 'generics', 'exceptions', 'streams',
      'collectors', 'threads', 'sync', 'concurrent', 'cf', 'vthreads', 'memory', 'bigo', 'sorting', 'linkedlists',
      'trees', 'dp', 'solid', 'creational', 'ioc', 'tx', 'nplus1', 'security', 'ms',
    ],
  },
  {
    id: 'upgrade-to-modern-java',
    title: 'Upgrade from Java 8 to Java 25',
    level: 'Intermediate',
    who: 'You work on an older codebase and want to use modern Java.',
    blurb: 'What changed after Java 8 and how to use it: var, switch expressions, text blocks, records, pattern matching, the HTTP client, modules and virtual threads.',
    outcome: 'You can modernise a Java 8 codebase and plan the upgrade with confidence.',
    lessons: [
      'types', 'flow', 'strings', 'records', 'immutability', 'patterns', 'lists-sets-queues', 'collectors',
      'httpclient', 'modules', 'vthreads', 'concurrent', 'memory', 'classloading', 'json',
    ],
  },
  {
    id: 'microservices',
    title: 'Microservices and production',
    level: 'Advanced',
    who: 'You build services that have to scale and stay up.',
    blurb: 'Service boundaries, gateways, messaging, resilience, sagas, caching, background jobs, containers and CI/CD.',
    outcome: 'You can design, run and ship a set of Spring Boot services reliably.',
    lessons: [
      'boot', 'config', 'rest', 'security', 'testing', 'caching', 'scheduling', 'vthreads', 'cf', 'tx',
      'ms', 'gateway', 'comm', 'resilience', 'saga', 'logging', 'deploy', 'cicd',
    ],
  },
];
