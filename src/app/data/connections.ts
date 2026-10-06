/**
 * How the lessons connect: for each lesson, the lessons worth knowing first.
 * "Where this leads" on each lesson page is worked out from this list in reverse.
 */
export const PREREQS: Record<string, string[]> = {
  // Fundamentals
  types: ['jvm'], operators: ['types'], flow: ['operators'], arrays: ['flow'], methods: ['arrays'],
  strings: ['methods'], input: ['strings'], numbers: ['operators'], recursion: ['methods'],
  // Object-oriented programming
  classes: ['methods'], 'static-final': ['classes'], packages: ['classes'], pillars: ['classes'],
  interfaces: ['pillars'], inner: ['classes', 'interfaces'], enums: ['classes', 'flow'],
  records: ['classes', 'interfaces'], object: ['pillars'], immutability: ['records', 'static-final'],
  // Core APIs
  exceptions: ['classes'], collections: ['arrays', 'classes'], 'lists-sets-queues': ['collections'],
  comparing: ['collections', 'interfaces'], hashmap: ['collections', 'object'], maps: ['hashmap'],
  generics: ['collections'], datetime: ['classes'], io: ['exceptions', 'strings'], regex: ['strings'], networking: ['io', 'exceptions'], i18n: ['strings', 'datetime'],
  // Modern Java
  lambdas: ['interfaces'], streams: ['lambdas', 'collections'], collectors: ['streams', 'maps'],
  optional: ['lambdas'], patterns: ['records', 'flow'], modules: ['packages'], httpclient: ['exceptions', 'lambdas'],
  // Data structures and algorithms
  bigo: ['arrays', 'collections'], sorting: ['bigo', 'recursion'], linkedlists: ['bigo', 'classes'],
  trees: ['linkedlists', 'recursion'], dp: ['recursion', 'arrays'],
  // Design and clean code
  clean: ['methods', 'classes'], solid: ['interfaces', 'clean'], creational: ['static-final', 'enums'],
  behavioral: ['lambdas', 'interfaces'],
  // Tools and testing
  maven: ['packages'], logging: ['exceptions'], junit: ['maven', 'exceptions'], mockito: ['junit', 'interfaces'],
  debugging: ['exceptions'], annotations: ['interfaces'], json: ['records', 'maven'],
  // Concurrency and the JVM
  threads: ['classes', 'exceptions'], sync: ['threads'], concurrent: ['executors'], cf: ['executors', 'lambdas'],
  vthreads: ['threads'], memory: ['jvm', 'classes'], classloading: ['jvm', 'memory'],
  // JDBC, JPA and Hibernate
  jdbc: ['exceptions', 'maven'], orm: ['jdbc', 'annotations'], entities: ['orm'], lifecycle: ['entities'],
  nplus1: ['entities', 'lifecycle'], tx: ['lifecycle'],
  // Spring
  ioc: ['interfaces', 'annotations'], beans: ['ioc'], aop: ['beans'], mvc: ['ioc', 'json'],
  // Spring Boot
  boot: ['ioc'], config: ['boot'], datajpa: ['boot', 'entities'], rest: ['mvc', 'boot'], security: ['rest'],
  testing: ['junit', 'mockito', 'boot'], caching: ['boot'], scheduling: ['boot', 'threads'],
  // Microservices
  ms: ['boot', 'rest'], gateway: ['ms'], comm: ['ms'], resilience: ['comm'], saga: ['comm', 'tx'],
  deploy: ['boot'], cicd: ['deploy', 'testing'],
  // OOP in practice
  'overloading-vs-overriding': ['methods', 'pillars'], 'parent-reference': ['pillars', 'overloading-vs-overriding'],
  'interface-vs-abstract': ['interfaces'], 'composition-vs-inheritance': ['pillars', 'interfaces'],
  relationships: ['classes', 'composition-vs-inheritance'],
  // Multithreading track
  executors: ['threads', 'sync'],
  // HashMap internals (a series: each part builds on the one before)
  'hm-hashing': ['hashmap', 'object'], 'hm-buckets': ['hm-hashing'], 'hm-put': ['hm-buckets'], 'hm-get': ['hm-put'],
  'hm-collision': ['hm-get'], 'hm-collision-resolution': ['hm-collision'], 'hm-load-factor': ['hm-collision-resolution'],
  'hm-capacity': ['hm-load-factor'], 'hm-resize': ['hm-capacity'], 'hm-equals-hashcode': ['hm-resize', 'object'],
  'hm-treeify': ['hm-equals-hashcode'], 'hm-java7-vs-java8': ['hm-treeify'], 'hm-mutable-keys': ['hm-java7-vs-java8', 'immutability'],
  // Collections compared
  'arraylist-vs-linkedlist': ['lists-sets-queues'], 'hashset-vs-treeset': ['lists-sets-queues', 'object'],
  'hashmap-vs-hashtable': ['maps', 'hashmap'], 'hashmap-vs-concurrenthashmap': ['maps', 'sync'],
  'hashmap-vs-linkedhashmap': ['maps'], 'comparable-vs-comparator': ['comparing'],
  'iterator-vs-listiterator': ['lists-sets-queues'], 'fail-fast-vs-fail-safe': ['lists-sets-queues', 'concurrent'],
  // Completing the curriculum
  'access-modifiers': ['packages', 'classes'], forkjoin: ['executors', 'streams'], serialization: ['io', 'classes'],
  reflection: ['annotations', 'classes'], 'modern-features': ['records', 'patterns'], structural: ['creational', 'composition-vs-inheritance'],
  reactive: ['rest', 'cf'],
  // Spring Core and Spring Security in depth
  di: ['ioc'], configuration: ['di', 'beans'], proxies: ['aop', 'tx'], 'spring-events': ['di', 'tx'],
  'sec-architecture': ['security', 'mvc'], 'sec-authentication': ['sec-architecture'], 'sec-passwords': ['sec-authentication'],
  'sec-authorization': ['sec-authentication'], 'sec-jwt': ['sec-authorization'], 'sec-oauth2': ['sec-jwt'], 'sec-csrf-cors': ['sec-architecture'],
};
