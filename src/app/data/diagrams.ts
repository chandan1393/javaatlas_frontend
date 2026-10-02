/**
 * Interactive concept diagrams (shared/diagram.component.ts). A lesson shows one with `diagram: 'id'`; a subtopic or a
 * course lecture with the lab spec "diagram:id".
 * Tones: blue (classes, steps), violet (interfaces), ember (checked / attention), brick (errors), moss (good), muted (legacy).
 */
export type Tone = 'blue' | 'violet' | 'ember' | 'brick' | 'moss' | 'muted';

export interface DNode {
  id: string;
  label: string;
  sub?: string;
  info: string;
  tone?: Tone;
  children?: DNode[];
  /** Centre position, for state diagrams. */
  x?: number;
  y?: number;
}

export interface Diagram {
  id: string;
  title: string;
  intro: string;
  type: 'flow' | 'tree' | 'nest' | 'states' | 'bars';
  nodes?: DNode[];
  root?: DNode;
  edges?: { from: string; to: string; label?: string }[];
  bars?: { label: string; value: number; display?: string; info?: string; tone?: Tone }[];
  log?: boolean;
  tour?: string[];
  w?: number;
  h?: number;
}

const n = (id: string, label: string, info: string, extra: Partial<DNode> = {}): DNode => ({ id, label, info, ...extra });

const LIST: Diagram[] = [
  // ------------------------------------------------------------------ Java basics
  {
    id: 'how-java-runs',
    title: 'How a Java program runs',
    intro: 'From the code you type to instructions the CPU executes.',
    type: 'flow',
    nodes: [
      n('source', 'Hello.java', 'You write source code in a .java file. Humans can read it; computers can’t run it directly.', { sub: 'source code' }),
      n('javac', 'javac', 'The compiler checks your code for errors and translates it into bytecode. Most mistakes are caught here, before the program ever runs.', { sub: 'compiler', tone: 'violet' }),
      n('bytecode', 'Hello.class', 'Bytecode: instructions for the Java Virtual Machine, not for any particular CPU. The same .class file runs on Windows, macOS and Linux. That is “write once, run anywhere”.', { sub: 'bytecode' }),
      n('loader', 'Class loader', 'The JVM loads each class the first time it’s needed, then verifies the bytecode is safe before running it.', { sub: 'inside the JVM', tone: 'violet' }),
      n('interp', 'Interpreter', 'The JVM starts by interpreting bytecode one instruction at a time, so programs start quickly.', { sub: 'inside the JVM', tone: 'violet' }),
      n('jit', 'JIT compiler', 'Code that runs often (“hot” code) is compiled to native machine code while the program runs, optimised for how it’s actually used. That’s why Java programs speed up after warming up.', { sub: 'inside the JVM', tone: 'ember' }),
      n('cpu', 'CPU', 'The processor executes native machine code. The garbage collector cleans up unused objects alongside, automatically.', { sub: 'machine code', tone: 'moss' }),
    ],
    tour: ['source', 'javac', 'bytecode', 'loader', 'interp', 'jit', 'cpu'],
  },
  {
    id: 'jdk-jre-jvm',
    title: 'JDK, JRE and JVM',
    intro: 'Each one contains the next. Developers install the JDK.',
    type: 'nest',
    root: n('jdk', 'JDK', 'The Java Development Kit: everything needed to write, compile, package and run Java. This is what you install.', {
      sub: 'Java Development Kit',
      tone: 'violet',
      children: [
        n('tools', 'Development tools', 'javac (compiler), java (launcher), jar (packaging), jshell (try code interactively), javadoc, jdb (debugger), jlink and more.', { sub: 'javac, jar, jshell, javadoc' }),
        n('jre', 'JRE', 'The Java Runtime Environment: what’s needed to run Java programs. Since Java 11 there is no separate JRE download; jlink can build a small custom runtime for your app instead.', {
          sub: 'Java Runtime Environment',
          tone: 'blue',
          children: [
            n('libs', 'Class library', 'The standard API: java.lang, java.util, java.io, java.time, java.net and more, organised into modules such as java.base.', { sub: 'java.lang, java.util, …' }),
            n('jvm', 'JVM', 'The Java Virtual Machine runs bytecode: it loads classes, executes them (interpreter and JIT compiler), manages memory and collects garbage.', {
              sub: 'Java Virtual Machine',
              tone: 'ember',
              children: [
                n('cl', 'Class loader', 'Loads and verifies classes on demand.'),
                n('engine', 'Execution engine', 'Interpreter plus JIT compiler.'),
                n('gc', 'Garbage collector', 'Frees memory used by unreachable objects.'),
                n('mem', 'Memory areas', 'Heap, stacks, metaspace and code cache.'),
              ],
            }),
          ],
        }),
      ],
    }),
  },
  {
    id: 'primitive-sizes',
    title: 'The 8 primitive types',
    intro: 'Size in bits. Bigger types hold bigger numbers but use more memory.',
    type: 'bars',
    bars: [
      { label: 'byte', value: 8, display: '8 bits', info: 'byte: -128 to 127. Used for raw binary data such as file contents.' },
      { label: 'short', value: 16, display: '16 bits', info: 'short: -32,768 to 32,767. Rarely used today.' },
      { label: 'char', value: 16, display: '16 bits', info: 'char: an unsigned 16-bit UTF-16 code unit, 0 to 65,535. Emoji need two chars.', tone: 'violet' },
      { label: 'int', value: 32, display: '32 bits', info: 'int: about ±2.1 billion (-2,147,483,648 to 2,147,483,647). The default for whole numbers.', tone: 'moss' },
      { label: 'float', value: 32, display: '32 bits', info: 'float: decimal numbers with about 7 significant digits. Prefer double.', tone: 'ember' },
      { label: 'long', value: 64, display: '64 bits', info: 'long: about ±9.2 quintillion. Use it for IDs, timestamps in milliseconds and money in paise.' },
      { label: 'double', value: 64, display: '64 bits', info: 'double: about 15–16 significant digits. The default for decimals, but never for money (use BigDecimal).', tone: 'ember' },
      { label: 'boolean', value: 8, display: 'JVM-specific', info: 'boolean: true or false. Its size isn’t fixed by the language; JVMs typically use a byte in arrays.', tone: 'muted' },
    ],
  },
  // ------------------------------------------------------------------ OOP
  {
    id: 'oop-pillars',
    title: 'The four pillars of OOP',
    intro: 'Four ideas that together make object-oriented code easier to change.',
    type: 'nest',
    root: n('oop', 'Object-oriented programming', 'Organise code as objects that combine data (fields) with the behaviour (methods) that works on it.', {
      tone: 'violet',
      children: [
        n('enc', 'Encapsulation', 'Hide the internal state and expose only safe methods: private fields, public methods. The object protects its own rules.', { sub: 'private fields, public methods', tone: 'blue' }),
        n('inh', 'Inheritance', 'A class extends another to reuse and specialise it: Dog extends Animal. Use it for true IS-A relationships only.', { sub: 'extends: IS-A', tone: 'blue' }),
        n('poly', 'Polymorphism', 'One reference type, many behaviours: animal.sound() runs Dog’s or Cat’s version depending on the actual object.', { sub: 'one call, many forms', tone: 'blue' }),
        n('abs', 'Abstraction', 'Expose what an object does, not how: interfaces and abstract classes let callers depend on a contract.', { sub: 'interfaces, abstract classes', tone: 'blue' }),
      ],
    }),
  },
  {
    id: 'access-modifiers',
    title: 'Who can see what',
    intro: 'Each access level adds a wider circle of code that can use a member.',
    type: 'nest',
    root: n('public', 'public', 'Visible to all code everywhere (and, with modules, in every module that reads an exported package).', {
      sub: 'everywhere',
      tone: 'moss',
      children: [
        n('protected', 'protected', 'Visible in the same package, plus subclasses in other packages (through inheritance).', {
          sub: 'package + subclasses',
          tone: 'blue',
          children: [
            n('default', 'package-private', 'No modifier at all: visible only to classes in the same package.', {
              sub: '(no keyword) same package',
              tone: 'violet',
              children: [n('private', 'private', 'Visible only inside the class that declares it. The default choice for fields.', { sub: 'same class only', tone: 'brick' })],
            }),
          ],
        }),
      ],
    }),
  },
  // ------------------------------------------------------------------ Exceptions
  {
    id: 'exception-hierarchy',
    title: 'The exception hierarchy',
    intro: 'Everything that can be thrown extends Throwable. Where a class sits decides how you must handle it.',
    type: 'tree',
    root: n('throwable', 'Throwable', 'The root of everything that can be thrown and caught.', {
      tone: 'violet',
      children: [
        n('error', 'Error', 'Serious problems in the JVM itself. Don’t catch these; the program usually can’t recover.', {
          tone: 'brick',
          children: [
            n('oom', 'OutOfMemoryError', 'The heap is full and garbage collection can’t free enough space.', { tone: 'brick' }),
            n('soe', 'StackOverflowError', 'The call stack ran out of space, usually from endless recursion.', { tone: 'brick' }),
          ],
        }),
        n('exception', 'Exception', 'Checked exceptions: problems a program should anticipate. The compiler forces you to catch them or declare them with throws.', {
          tone: 'ember',
          sub: 'checked',
          children: [
            n('io', 'IOException', 'A file, network or stream operation failed (FileNotFoundException is a subclass).', { tone: 'ember', sub: 'checked' }),
            n('sql', 'SQLException', 'A database operation failed.', { tone: 'ember', sub: 'checked' }),
            n('interrupted', 'InterruptedException', 'A waiting or sleeping thread was interrupted.', { tone: 'ember', sub: 'checked' }),
            n('runtime', 'RuntimeException', 'Unchecked exceptions: usually programming bugs. The compiler doesn’t force you to handle them.', {
              tone: 'blue',
              sub: 'unchecked',
              children: [
                n('npe', 'NullPointerException', 'A method or field was used on a null reference.', { tone: 'blue' }),
                n('iae', 'IllegalArgumentException', 'A method received an invalid argument (NumberFormatException is a subclass).', { tone: 'blue' }),
                n('ise', 'IllegalStateException', 'A method was called at the wrong time, for example reading a closed resource.', { tone: 'blue' }),
                n('ioobe', 'IndexOutOfBoundsException', 'An index was outside an array, list or string.', { tone: 'blue' }),
              ],
            }),
          ],
        }),
      ],
    }),
    tour: ['throwable', 'error', 'exception', 'io', 'runtime', 'npe'],
  },
  {
    id: 'try-catch-finally',
    title: 'What happens when an exception is thrown',
    intro: 'Follow an exception from the line that throws it to the code that handles it.',
    type: 'flow',
    nodes: [
      n('try', 'try { … }', 'The code that might fail runs inside the try block.', { sub: 'normal execution' }),
      n('throw', 'Exception thrown', 'Something goes wrong: the rest of the try block is skipped immediately.', { sub: 'try block stops', tone: 'brick' }),
      n('match', 'Find a catch', 'The JVM checks the catch blocks from top to bottom and picks the first one whose type matches (a subclass matches its parent).', { sub: 'first matching type', tone: 'violet' }),
      n('catch', 'catch (…) { … }', 'The matching catch block handles the exception: log it, retry, or throw a more meaningful exception.', { sub: 'handle it', tone: 'ember' }),
      n('finally', 'finally { … }', 'Always runs, whether or not an exception happened, even after return. try-with-resources closes resources here automatically.', { sub: 'always runs', tone: 'moss' }),
      n('after', 'Continue or propagate', 'If a catch handled it, the program continues after the try statement. If nothing matched, the exception propagates up the call stack to the caller, and if no one catches it, the thread ends with a stack trace.', { sub: 'next line, or up the stack' }),
    ],
    tour: ['try', 'throw', 'match', 'catch', 'finally', 'after'],
  },
  // ------------------------------------------------------------------ Multithreading
  {
    id: 'thread-lifecycle',
    title: 'The life of a thread',
    intro: 'A thread is always in one of six states. Click a state, or follow a thread through its life.',
    type: 'states',
    w: 700,
    h: 330,
    nodes: [
      n('new', 'NEW', 'Created with new Thread(...), but start() hasn’t been called yet.', { x: 90, y: 165, tone: 'muted' }),
      n('runnable', 'RUNNABLE', 'Running on a CPU, or ready to run as soon as one is free. The scheduler decides.', { x: 330, y: 165, tone: 'moss' }),
      n('blocked', 'BLOCKED', 'Waiting to enter a synchronized block or method that another thread holds.', { x: 590, y: 50, tone: 'brick' }),
      n('waiting', 'WAITING', 'Waiting indefinitely for another thread: wait(), join() or LockSupport.park().', { x: 590, y: 165, tone: 'ember' }),
      n('timed', 'TIMED_WAITING', 'Waiting with a time limit: sleep(ms), wait(ms) or join(ms).', { x: 590, y: 280, tone: 'ember' }),
      n('terminated', 'TERMINATED', 'run() has finished, normally or with an exception. A thread can’t be started again.', { x: 330, y: 290, tone: 'muted' }),
    ],
    edges: [
      { from: 'new', to: 'runnable', label: 'start()' },
      { from: 'runnable', to: 'blocked', label: 'wants a lock' },
      { from: 'blocked', to: 'runnable', label: 'gets it' },
      { from: 'runnable', to: 'waiting', label: 'wait() / join()' },
      { from: 'waiting', to: 'runnable', label: 'notified' },
      { from: 'runnable', to: 'timed', label: 'sleep(ms)' },
      { from: 'timed', to: 'runnable', label: 'time up' },
      { from: 'runnable', to: 'terminated', label: 'run() ends' },
    ],
    tour: ['new', 'runnable', 'timed', 'runnable', 'blocked', 'runnable', 'terminated'],
  },
  {
    id: 'fork-join',
    title: 'Fork/Join: divide and conquer',
    intro: 'A big task splits itself until the pieces are small enough to compute directly, then the results are joined.',
    type: 'tree',
    root: n('all', 'sum(0..8M)', 'The whole task is too big, so it forks into two halves.', {
      tone: 'violet',
      children: [
        n('l', 'sum(0..4M)', 'Still too big: split again. fork() puts one half in this worker’s queue.', {
          children: [n('ll', 'sum(0..2M)', 'Small enough (below the threshold): computed directly with a loop.', { tone: 'moss' }), n('lr', 'sum(2..4M)', 'Computed directly, possibly by another worker that stole this task.', { tone: 'moss' })],
        }),
        n('r', 'sum(4..8M)', 'The other half, computed in parallel.', {
          children: [n('rl', 'sum(4..6M)', 'Computed directly.', { tone: 'moss' }), n('rr', 'sum(6..8M)', 'Computed directly. Idle workers steal tasks from busy workers’ queues: work stealing keeps every core busy.', { tone: 'moss' })],
        }),
      ],
    }),
    tour: ['all', 'l', 'll', 'lr', 'r', 'rr'],
  },
  // ------------------------------------------------------------------ Collections
  {
    id: 'collection-hierarchy',
    title: 'The Collection hierarchy',
    intro: 'Interfaces (purple) define what a collection can do; classes (blue) are the implementations you create.',
    type: 'tree',
    root: n('iterable', 'Iterable', 'Anything you can loop over with for-each.', {
      tone: 'violet',
      children: [
        n('collection', 'Collection', 'A group of elements: add, remove, contains, size, stream.', {
          tone: 'violet',
          children: [
            n('list', 'List', 'Ordered, indexed, allows duplicates.', {
              tone: 'violet',
              children: [
                n('arraylist', 'ArrayList', 'A resizable array: the default List.', { tone: 'blue' }),
                n('linkedlist', 'LinkedList', 'A doubly linked list; also a Deque.', { tone: 'blue' }),
                n('vector', 'Vector', 'Legacy synchronized list; Stack extends it.', { tone: 'muted' }),
              ],
            }),
            n('set', 'Set', 'No duplicates.', {
              tone: 'violet',
              children: [
                n('hashset', 'HashSet', 'Fast, unordered (backed by HashMap). LinkedHashSet keeps insertion order.', { tone: 'blue' }),
                n('treeset', 'TreeSet', 'Sorted (a SortedSet / NavigableSet backed by TreeMap).', { tone: 'blue' }),
              ],
            }),
            n('queue', 'Queue', 'Elements waiting to be processed, usually first in, first out.', {
              tone: 'violet',
              children: [
                n('pq', 'PriorityQueue', 'Always hands out the smallest element first.', { tone: 'blue' }),
                n('deque', 'Deque → ArrayDeque', 'A double-ended queue: use ArrayDeque as a queue or a stack.', { tone: 'blue' }),
              ],
            }),
          ],
        }),
      ],
    }),
  },
  {
    id: 'map-hierarchy',
    title: 'The Map family',
    intro: 'Map is not a Collection: it stores key → value pairs. Pick the implementation by the order and thread safety you need.',
    type: 'tree',
    root: n('map', 'Map', 'Keys map to values; keys are unique.', {
      tone: 'violet',
      children: [
        n('hashmap', 'HashMap', 'Fast and unordered. The default.', { tone: 'blue', children: [n('lhm', 'LinkedHashMap', 'Remembers insertion (or access) order. Great for LRU caches.', { tone: 'blue' })] }),
        n('sorted', 'SortedMap → NavigableMap', 'Keys kept sorted, with floor, ceiling and range views.', { tone: 'violet', children: [n('treemap', 'TreeMap', 'A red-black tree: sorted keys, O(log n).', { tone: 'blue' })] }),
        n('concurrent', 'ConcurrentMap', 'Thread-safe maps with atomic operations.', { tone: 'violet', children: [n('chm', 'ConcurrentHashMap', 'The map to share between threads.', { tone: 'blue' })] }),
        n('special', 'Special-purpose', 'EnumMap (enum keys, very fast), WeakHashMap (entries vanish when keys are garbage collected), IdentityHashMap (compares keys with ==).', { tone: 'blue' }),
        n('hashtable', 'Hashtable', 'Legacy (Java 1.0), synchronized on every method. Don’t use it in new code.', { tone: 'muted' }),
      ],
    }),
  },
  // ------------------------------------------------------------------ JVM
  {
    id: 'jvm-memory',
    title: 'Inside JVM memory',
    intro: 'Where your variables, objects and classes live while the program runs.',
    type: 'nest',
    root: n('jvmmem', 'JVM memory', 'The JVM divides memory into areas with different jobs and lifetimes.', {
      tone: 'violet',
      children: [
        n('heap', 'Heap', 'Shared by all threads: every object created with new lives here. The garbage collector manages it.', {
          sub: 'objects, shared by all threads',
          tone: 'blue',
          children: [
            n('young', 'Young generation', 'Where new objects are born. Most die young and are cleaned up cheaply.', {
              children: [n('eden', 'Eden', 'Brand-new objects are allocated here.'), n('s0', 'Survivor S0', 'Objects that survived a collection.'), n('s1', 'Survivor S1', 'The other survivor space; they swap roles each collection.')],
            }),
            n('old', 'Old generation', 'Long-lived objects that survived many collections, such as caches and singletons.'),
          ],
        }),
        n('stacks', 'Thread stacks', 'One per thread: a frame for every method call, holding local variables and references. Freed automatically when the method returns.', { sub: 'one per thread', tone: 'ember' }),
        n('meta', 'Metaspace', 'Class metadata: the structure of each loaded class, its methods and constants. Lives in native memory.', { sub: 'class information', tone: 'moss' }),
        n('codecache', 'Code cache', 'Machine code produced by the JIT compiler.', { sub: 'JIT-compiled code', tone: 'muted' }),
      ],
    }),
  },
  {
    id: 'gc-generations',
    title: 'How generational garbage collection works',
    intro: 'Most objects die young, so the JVM collects young objects often and cheaply.',
    type: 'flow',
    nodes: [
      n('alloc', 'new Object()', 'Every new object is allocated in Eden, which is extremely fast (just a pointer bump).', { sub: 'allocate' }),
      n('eden', 'Eden fills up', 'When Eden is full, a minor collection starts.', { sub: 'young generation', tone: 'ember' }),
      n('minor', 'Minor GC', 'Only live objects are copied out of Eden to a survivor space; everything else is simply forgotten. The cost depends on the survivors, not the garbage.', { sub: 'fast and frequent', tone: 'violet' }),
      n('survive', 'Survivor spaces', 'Objects that keep surviving move between the two survivor spaces and age by one each time.', { sub: 'aging' }),
      n('promote', 'Promotion', 'After surviving enough collections, an object is promoted to the old generation.', { sub: 'tenuring', tone: 'ember' }),
      n('major', 'Old-gen collection', 'When the old generation fills, a bigger (mixed or full) collection runs. Modern collectors such as G1 and ZGC do most of this work concurrently to keep pauses short.', { sub: 'rarer, more work', tone: 'brick' }),
    ],
    tour: ['alloc', 'eden', 'minor', 'survive', 'promote', 'major'],
  },
  {
    id: 'class-loaders',
    title: 'Class loader delegation',
    intro: 'Each class loader asks its parent first, so core classes always come from the JDK itself.',
    type: 'tree',
    root: n('bootstrap', 'Bootstrap loader', 'Built into the JVM. Loads the core modules such as java.base (java.lang.String, java.util.List).', {
      tone: 'violet',
      children: [
        n('platform', 'Platform loader', 'Loads the other standard platform modules, such as java.sql.', {
          tone: 'violet',
          children: [
            n('app', 'Application loader', 'Loads your classes and libraries from the class path or module path.', {
              tone: 'blue',
              children: [n('custom', 'Custom loaders', 'Created by application servers, plugin systems and frameworks to load code separately (and to unload it).', { tone: 'muted' })],
            }),
          ],
        }),
      ],
    }),
    tour: ['app', 'platform', 'bootstrap', 'platform', 'app'],
  },
  // ------------------------------------------------------------------ Data
  {
    id: 'jdbc-flow',
    title: 'A JDBC query, step by step',
    intro: 'What happens between your Java code and the database.',
    type: 'flow',
    nodes: [
      n('ds', 'DataSource', 'Hands out connections, usually from a pool (HikariCP in Spring Boot) so they’re reused instead of reopened.', { sub: 'connection pool', tone: 'violet' }),
      n('conn', 'Connection', 'A session with the database. Transactions belong to a connection.', { sub: 'getConnection()' }),
      n('ps', 'PreparedStatement', 'SQL with ? placeholders. Values are sent separately, which prevents SQL injection and lets the database reuse the plan.', { sub: 'SELECT … WHERE id = ?', tone: 'moss' }),
      n('exec', 'executeQuery()', 'The database runs the SQL.', { sub: 'or executeUpdate()' }),
      n('rs', 'ResultSet', 'A cursor over the rows: call next() and read columns by name or index.', { sub: 'rows' }),
      n('map', 'Map to objects', 'Turn each row into a Java object, such as a record.', { sub: 'rs.getString("title")' }),
      n('close', 'close()', 'try-with-resources closes the ResultSet, statement and connection (returning it to the pool), even when something fails.', { sub: 'try-with-resources', tone: 'ember' }),
    ],
    tour: ['ds', 'conn', 'ps', 'exec', 'rs', 'map', 'close'],
  },
  {
    id: 'entity-states',
    title: 'JPA entity states',
    intro: 'An entity object is always in one of four states, and the state decides whether changes reach the database.',
    type: 'states',
    w: 700,
    h: 320,
    nodes: [
      n('transient', 'Transient', 'Just created with new: JPA knows nothing about it. Nothing is saved.', { x: 100, y: 160, tone: 'muted' }),
      n('managed', 'Managed', 'Tracked by the persistence context. Any change to its fields is written to the database automatically at flush/commit (dirty checking). find() also returns managed entities.', { x: 350, y: 160, tone: 'moss' }),
      n('detached', 'Detached', 'Was managed, but the persistence context closed or it was detached. Changes are no longer tracked.', { x: 590, y: 60, tone: 'ember' }),
      n('removed', 'Removed', 'Scheduled for deletion: the DELETE runs at flush/commit.', { x: 590, y: 260, tone: 'brick' }),
    ],
    edges: [
      { from: 'transient', to: 'managed', label: 'persist()' },
      { from: 'managed', to: 'detached', label: 'detach() / close' },
      { from: 'detached', to: 'managed', label: 'merge()' },
      { from: 'managed', to: 'removed', label: 'remove()' },
      { from: 'removed', to: 'managed', label: 'persist()' },
    ],
    tour: ['transient', 'managed', 'detached', 'managed', 'removed'],
  },
  // ------------------------------------------------------------------ Spring
  {
    id: 'spring-ioc',
    title: 'Inversion of control in Spring',
    intro: 'You describe your objects; Spring creates them and connects them.',
    type: 'flow',
    nodes: [
      n('classes', 'Your classes', 'Classes annotated with @Component, @Service, @Repository or @Controller, plus @Bean methods in @Configuration classes.', { sub: '@Service, @Bean', tone: 'violet' }),
      n('scan', 'Component scan', 'At startup Spring finds those classes in your packages.', { sub: 'startup' }),
      n('context', 'ApplicationContext', 'The IoC container. It decides the creation order from the dependencies between beans.', { sub: 'the container', tone: 'ember' }),
      n('create', 'Create beans', 'Spring calls the constructors. By default each bean is a singleton: one instance shared everywhere.', { sub: 'singletons by default' }),
      n('inject', 'Inject dependencies', 'Each bean gets the beans it needs, ideally through its constructor. Your code never calls new for its collaborators.', { sub: 'constructor injection', tone: 'moss' }),
      n('ready', 'Ready to use', 'Controllers, services and repositories are wired together and the application starts serving.', { sub: 'application running' }),
    ],
    tour: ['classes', 'scan', 'context', 'create', 'inject', 'ready'],
  },
  {
    id: 'bean-lifecycle',
    title: 'The life of a Spring bean',
    intro: 'Each step is a hook where Spring (or you) can add behaviour.',
    type: 'flow',
    nodes: [
      n('instantiate', 'Instantiate', 'Spring calls the constructor (with constructor-injected dependencies).', { sub: 'constructor' }),
      n('populate', 'Populate', 'Field and setter injection, if used.', { sub: 'more dependencies' }),
      n('aware', 'Aware callbacks', 'Interfaces such as BeanNameAware or ApplicationContextAware receive container details. Rarely needed.', { sub: 'optional', tone: 'muted' }),
      n('before', 'postProcessBefore…', 'BeanPostProcessors can inspect or change the bean before initialisation.', { sub: 'BeanPostProcessor', tone: 'violet' }),
      n('init', '@PostConstruct', 'Your initialisation code runs: load caches, validate configuration.', { sub: 'init methods', tone: 'moss' }),
      n('after', 'postProcessAfter…', 'Proxies are created here: this is how @Transactional, @Async and @Cacheable add behaviour around your methods.', { sub: 'proxies', tone: 'ember' }),
      n('ready', 'In use', 'The bean serves requests for the life of the application.', { sub: 'ready' }),
      n('destroy', '@PreDestroy', 'On shutdown, clean up: close connections, stop threads.', { sub: 'shutdown', tone: 'brick' }),
    ],
    tour: ['instantiate', 'populate', 'aware', 'before', 'init', 'after', 'ready', 'destroy'],
  },
  {
    id: 'spring-mvc-request',
    title: 'A request through Spring MVC',
    intro: 'What happens between an HTTP request arriving and JSON going back.',
    type: 'flow',
    nodes: [
      n('request', 'HTTP request', 'GET /api/courses/42 arrives at the embedded Tomcat server.', { sub: 'GET /api/courses/42' }),
      n('filters', 'Filters', 'Servlet filters run first, including Spring Security’s filter chain (authentication, CORS, CSRF).', { sub: 'security', tone: 'ember' }),
      n('dispatcher', 'DispatcherServlet', 'The front controller: every request goes through it.', { sub: 'front controller', tone: 'violet' }),
      n('mapping', 'HandlerMapping', 'Finds the controller method whose @GetMapping path matches.', { sub: 'which method?' }),
      n('controller', '@RestController', 'Spring converts path variables and the JSON body into method arguments (validating @Valid ones), then calls your method.', { sub: 'your code', tone: 'moss' }),
      n('service', 'Service → Repository', 'Business logic and database access, usually in a transaction.', { sub: 'business logic' }),
      n('converter', 'HttpMessageConverter', 'Jackson turns the returned object into JSON. Exceptions go to @ControllerAdvice handlers instead.', { sub: 'object → JSON', tone: 'violet' }),
      n('response', 'HTTP response', '200 OK with a JSON body goes back to the client.', { sub: '200 OK + JSON', tone: 'moss' }),
    ],
    tour: ['request', 'filters', 'dispatcher', 'mapping', 'controller', 'service', 'converter', 'response'],
  },
  {
    id: 'layered-architecture',
    title: 'The layers of a Spring Boot API',
    intro: 'Each layer has one job and talks only to the layer below it.',
    type: 'flow',
    nodes: [
      n('client', 'Client', 'A browser, mobile app or another service sends HTTP requests.', { sub: 'HTTP + JSON', tone: 'muted' }),
      n('controller', 'Controller', 'Receives requests, validates input DTOs and returns response DTOs. No business logic here.', { sub: 'web layer', tone: 'violet' }),
      n('service', 'Service', 'Business rules and transactions (@Transactional). The heart of the application.', { sub: 'business layer', tone: 'moss' }),
      n('repository', 'Repository', 'Reads and writes data, usually a Spring Data JPA interface.', { sub: 'data layer' }),
      n('db', 'Database', 'PostgreSQL or another store.', { sub: 'PostgreSQL', tone: 'ember' }),
    ],
    tour: ['client', 'controller', 'service', 'repository', 'db'],
  },
  {
    id: 'security-filter-chain',
    title: 'Spring Security’s filter chain',
    intro: 'Every request passes a chain of security filters before reaching your controller.',
    type: 'flow',
    nodes: [
      n('req', 'Request', 'An HTTP request arrives.', { sub: 'incoming' }),
      n('cors', 'CORS', 'Checks whether a browser on another origin may call this API.', { sub: 'cross-origin' }),
      n('csrf', 'CSRF', 'Protects cookie-based sessions from forged cross-site requests.', { sub: 'forgery check' }),
      n('authn', 'Authentication', 'Reads the session cookie, JWT or credentials and works out who the user is. Failure: 401 Unauthorized.', { sub: 'who are you?', tone: 'ember' }),
      n('context', 'SecurityContext', 'The authenticated user is stored for this request; your code can read it.', { sub: 'current user', tone: 'violet' }),
      n('authz', 'Authorization', 'Checks the rules (roles, @PreAuthorize). Failure: 403 Forbidden.', { sub: 'are you allowed?', tone: 'ember' }),
      n('controller', 'Your controller', 'Only requests that passed every check get here.', { sub: 'allowed', tone: 'moss' }),
    ],
    tour: ['req', 'cors', 'csrf', 'authn', 'context', 'authz', 'controller'],
  },
  {
    id: 'reactive-flow',
    title: 'How a reactive stream flows',
    intro: 'Nothing happens until someone subscribes, and the subscriber controls the pace.',
    type: 'flow',
    nodes: [
      n('publisher', 'Publisher', 'A Flux (0..N items) or Mono (0..1), for example rows from R2DBC or a WebClient response. Just a description so far.', { sub: 'Flux / Mono', tone: 'violet' }),
      n('operators', 'Operators', 'map, filter, flatMap, zip: each returns a new Flux or Mono describing the next step. Still nothing runs.', { sub: 'map, filter, flatMap' }),
      n('subscribe', 'subscribe()', 'The subscription starts the flow. In WebFlux, the framework subscribes for you when you return a Mono or Flux.', { sub: 'the trigger', tone: 'ember' }),
      n('request', 'request(n)', 'Backpressure: the subscriber says how many items it can handle, so a fast producer can’t overwhelm it.', { sub: 'backpressure', tone: 'moss' }),
      n('onnext', 'onNext(item)', 'Items are pushed downstream as they become available, without blocking a thread while waiting.', { sub: 'items arrive' }),
      n('complete', 'onComplete / onError', 'The stream ends with completion or an error, which travels down the chain to error operators.', { sub: 'end of stream' }),
    ],
    tour: ['publisher', 'operators', 'subscribe', 'request', 'onnext', 'complete'],
  },
  {
    id: 'microservices-architecture',
    title: 'A typical microservices system',
    intro: 'Small services with their own data, behind a gateway, talking over HTTP and events.',
    type: 'nest',
    root: n('system', 'QuickBite platform', 'One product built from independently deployable services.', {
      tone: 'violet',
      children: [
        n('clients', 'Clients', 'Web and mobile apps call one entry point.', { sub: 'web, mobile', tone: 'muted' }),
        n('gateway', 'API gateway', 'Routing, authentication, rate limiting. Clients never call services directly.', { sub: 'single entry point', tone: 'ember' }),
        n('services', 'Services', 'Each owns its data and can be deployed on its own.', {
          tone: 'blue',
          children: [
            n('orders', 'Order service', 'Places and tracks orders. Own database.', { sub: 'own DB' }),
            n('payments', 'Payment service', 'Charges customers. Own database.', { sub: 'own DB' }),
            n('delivery', 'Delivery service', 'Assigns riders. Own database.', { sub: 'own DB' }),
          ],
        }),
        n('kafka', 'Kafka', 'Services publish events (OrderPlaced, PaymentCaptured) instead of calling each other for everything.', { sub: 'events', tone: 'moss' }),
        n('platform', 'Platform', 'Configuration, discovery, tracing, metrics and logs that every service relies on.', { sub: 'observability, config', tone: 'muted' }),
      ],
    }),
  },
  // ------------------------------------------------------------------ Tools, DSA, versions, patterns, I/O
  {
    id: 'maven-lifecycle',
    title: 'The Maven build lifecycle',
    intro: 'Running a phase runs every phase before it.',
    type: 'flow',
    nodes: [
      n('validate', 'validate', 'Checks the project is correct and all information is available.'),
      n('compile', 'compile', 'Compiles src/main/java into target/classes.'),
      n('test', 'test', 'Runs unit tests with Surefire. A failing test stops the build.', { tone: 'ember' }),
      n('package', 'package', 'Builds the JAR (or WAR) in target/. mvn package is the command you run most.', { tone: 'moss' }),
      n('verify', 'verify', 'Runs integration tests and quality checks.'),
      n('install', 'install', 'Copies the JAR into your local repository (~/.m2) so other local projects can use it.'),
      n('deploy', 'deploy', 'Uploads the artifact to a remote repository for your team.', { tone: 'violet' }),
    ],
    tour: ['validate', 'compile', 'test', 'package', 'verify', 'install', 'deploy'],
  },
  {
    id: 'big-o-growth',
    title: 'How many steps for 1,000 items?',
    intro: 'The same input, very different amounts of work. (The bars use a logarithmic scale.)',
    type: 'bars',
    log: true,
    bars: [
      { label: 'O(1)', value: 1, display: '1', tone: 'moss', info: 'Constant: HashMap.get, array index. The size of the input doesn’t matter.' },
      { label: 'O(log n)', value: 10, display: '≈ 10', tone: 'moss', info: 'Logarithmic: binary search, TreeMap. Doubling the input adds just one step.' },
      { label: 'O(n)', value: 1000, display: '1,000', info: 'Linear: one loop over the data, such as finding the maximum.' },
      { label: 'O(n log n)', value: 10000, display: '≈ 10,000', info: 'Good sorting algorithms (List.sort, Arrays.sort for objects).' },
      { label: 'O(n²)', value: 1_000_000, display: '1,000,000', tone: 'ember', info: 'Quadratic: a loop inside a loop, such as comparing every pair. Fine for 100 items, painful for a million.' },
      { label: 'O(2ⁿ)', value: 1e12, display: 'more than atoms in the universe', tone: 'brick', info: 'Exponential: trying every subset. 2^1000 has 302 digits; only tiny inputs are feasible.' },
    ],
  },
  {
    id: 'java-timeline',
    title: 'Long-term-support releases and what they brought',
    intro: 'Most companies upgrade from one LTS release to the next.',
    type: 'flow',
    nodes: [
      n('j8', 'Java 8', 'March 2014: lambdas, streams, Optional, the java.time API and default methods. The release that modernised Java.', { sub: '2014 · lambdas, streams', tone: 'muted' }),
      n('j11', 'Java 11', 'September 2018: the HTTP client, var in lambda parameters, running a single source file with java Hello.java, new String methods.', { sub: '2018 · HttpClient' }),
      n('j17', 'Java 17', 'September 2021: records, sealed classes, text blocks, switch expressions and pattern matching for instanceof (all finalised by 17).', { sub: '2021 · records, sealed' }),
      n('j21', 'Java 21', 'September 2023: virtual threads, pattern matching for switch, record patterns and sequenced collections.', { sub: '2023 · virtual threads', tone: 'violet' }),
      n('j25', 'Java 25', 'September 2025: compact source files and instance main methods, scoped values, flexible constructor bodies and module import declarations.', { sub: '2025 · compact source files', tone: 'moss' }),
    ],
    tour: ['j8', 'j11', 'j17', 'j21', 'j25'],
  },
  {
    id: 'decorator-wrapping',
    title: 'Decorators wrap decorators',
    intro: 'Java I/O builds features by wrapping one object in another. Each layer adds one thing.',
    type: 'nest',
    root: n('buffered', 'BufferedReader', 'Adds buffering and readLine(). It wraps any Reader.', {
      sub: 'adds lines and buffering',
      tone: 'moss',
      children: [
        n('isr', 'InputStreamReader', 'An adapter: turns bytes into characters using a charset such as UTF-8.', {
          sub: 'bytes → characters',
          tone: 'violet',
          children: [n('fis', 'FileInputStream', 'Reads raw bytes from the file.', { sub: 'raw bytes', tone: 'blue', children: [n('file', 'notes.txt', 'The file on disk.', { tone: 'muted' })] })],
        }),
      ],
    }),
  },
  {
    id: 'serialization-flow',
    title: 'Serialization round trip',
    intro: 'An object becomes bytes, travels or is stored, and becomes an object again.',
    type: 'flow',
    nodes: [
      n('obj', 'Object in memory', 'An instance of a class that implements Serializable.', { sub: 'implements Serializable' }),
      n('oos', 'ObjectOutputStream', 'writeObject() writes the class description and every non-transient, non-static field, following references to other objects.', { sub: 'writeObject()', tone: 'violet' }),
      n('bytes', 'Bytes', 'Stored in a file or sent over the network. transient fields (passwords, caches) are not included.', { sub: 'file or network', tone: 'ember' }),
      n('ois', 'ObjectInputStream', 'readObject() checks serialVersionUID and rebuilds the objects. The class’s own constructors are NOT called. Never deserialize untrusted data without a filter.', { sub: 'readObject()', tone: 'brick' }),
      n('copy', 'New object', 'A new object with the same field values; transient fields get default values (null, 0, false).', { sub: 'a copy', tone: 'moss' }),
    ],
    tour: ['obj', 'oos', 'bytes', 'ois', 'copy'],
  },
  {
    id: 'reflection-map',
    title: 'What reflection can see',
    intro: 'Starting from a Class object, code can inspect and use any part of a class at run time.',
    type: 'tree',
    root: n('class', 'Class<?>', 'Get it with obj.getClass(), MyType.class or Class.forName("com.shop.Order").', {
      tone: 'violet',
      children: [
        n('fields', 'Fields', 'getDeclaredFields(): read and write values with get() and set(). Jackson and Hibernate use this.', { sub: 'Field.get / set', tone: 'blue' }),
        n('methods', 'Methods', 'getDeclaredMethods(): call any method with invoke(). JUnit finds and runs @Test methods this way.', { sub: 'Method.invoke', tone: 'blue' }),
        n('ctors', 'Constructors', 'getDeclaredConstructor(...).newInstance(...): create objects without new. Spring creates your beans like this.', { sub: 'newInstance', tone: 'blue' }),
        n('annotations', 'Annotations', 'getAnnotation(...): read @RUNTIME annotations such as @Entity or @GetMapping.', { sub: 'getAnnotation', tone: 'ember' }),
        n('hier', 'Type information', 'getSuperclass(), getInterfaces(), getModifiers(), isRecord() and getRecordComponents().', { sub: 'structure', tone: 'muted' }),
      ],
    }),
  },
];

export const DIAGRAMS: Record<string, Diagram> = Object.fromEntries(LIST.map((d) => [d.id, d]));
