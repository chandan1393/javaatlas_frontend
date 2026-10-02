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
  {
    id: 'multithreading',
    title: 'Multithreading: beginner to advanced',
    level: 'Beginner to advanced',
    who: 'You know basic Java and want to understand threads properly, step by step.',
    blurb: 'Start with what a thread is, then learn why shared data breaks and how to protect it, then the tools real systems use: thread pools, CompletableFuture, concurrent collections and virtual threads.',
    outcome: 'You can write correct concurrent code, explain race conditions and deadlocks, and answer multithreading interview questions confidently.',
    lessons: ['threads', 'sync', 'executors', 'concurrent', 'forkjoin', 'cf', 'vthreads', 'hashmap-vs-concurrenthashmap', 'fail-fast-vs-fail-safe'],
  },
  {
    id: 'java8-collections',
    title: 'Java 8 and collections, practically',
    level: 'Intermediate',
    who: 'You can write basic Java and want to use lambdas and collections the way professionals do.',
    blurb: 'Lambdas and the core functional interfaces with real examples, every List, Set, Map and Queue, streams, and the comparisons interviewers love.',
    outcome: 'You pick the right collection without thinking twice and write clean, modern Java with lambdas and streams.',
    lessons: [
      'lambdas', 'collections', 'lists-sets-queues', 'maps', 'comparing', 'streams', 'collectors', 'optional',
      'arraylist-vs-linkedlist', 'hashset-vs-treeset', 'hashmap-vs-hashtable', 'hashmap-vs-concurrenthashmap',
      'hashmap-vs-linkedhashmap', 'comparable-vs-comparator', 'iterator-vs-listiterator', 'fail-fast-vs-fail-safe',
    ],
  },
  {
    id: 'hashmap-internals',
    title: 'HashMap internals, part by part',
    level: 'Intermediate',
    who: 'You use HashMap every day and want to know exactly what happens inside (a favourite interview topic).',
    blurb: 'Thirteen short lessons with an interactive lab: hashing, buckets, put and get, collisions, load factor, capacity, resizing, equals and hashCode, treeification, Java 7 vs 8 and mutable keys.',
    outcome: 'You can explain HashMap internals step by step, and avoid the bugs that come from misusing it.',
    lessons: [
      'hashmap', 'hm-hashing', 'hm-buckets', 'hm-put', 'hm-get', 'hm-collision', 'hm-collision-resolution', 'hm-load-factor',
      'hm-capacity', 'hm-resize', 'hm-equals-hashcode', 'hm-treeify', 'hm-java7-vs-java8', 'hm-mutable-keys',
    ],
  },
  {
    id: 'oop-in-practice',
    title: 'OOP in practice',
    level: 'Beginner to intermediate',
    who: 'You know the definitions of OOP and want to understand how it actually works and how to design with it.',
    blurb: 'Classes and constructors, overloading vs overriding, what really happens with a parent reference, interfaces vs abstract classes, composition over inheritance and object relationships.',
    outcome: 'You can design small class hierarchies sensibly and explain your choices in an interview.',
    lessons: [
      'classes', 'access-modifiers', 'pillars', 'overloading-vs-overriding', 'parent-reference', 'interfaces', 'interface-vs-abstract',
      'composition-vs-inheritance', 'relationships', 'object', 'immutability',
    ],
  },
];
