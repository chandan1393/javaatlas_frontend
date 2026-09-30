import { SubTopic } from '../core/models';

/** Subtopics for modern Java and concurrency. Keyed by lesson id. */
export const SUBTOPICS_C: Record<string, SubTopic[]> = {
  streams: [
    { id: 'create', t: 'Creating streams', body: `Streams come from collections, arrays, values, ranges, generators and files.`, code: `orders.stream();
Stream.of("a", "b", "c");
Arrays.stream(new int[]{3, 1, 2});
IntStream.rangeClosed(1, 5);                   // 1..5
Stream.iterate(1, n -> n * 2).limit(10);        // 1, 2, 4, ...
Files.lines(Path.of("app.log"));                // close it (try-with-resources)` },
    { id: 'intermediate', t: 'Intermediate operations', body: `These return a new stream and run lazily: [[filter]], [[map]], [[flatMap]] (flatten nested collections), [[distinct]], [[sorted]], [[limit]], [[skip]], [[peek]] (for debugging), and [[takeWhile]]/[[dropWhile]] (Java 9).`, code: `List<String> tags = courses.stream()
    .flatMap(c -> c.tags().stream())      // List<List<String>> -> Stream<String>
    .map(String::toLowerCase)
    .distinct()
    .sorted()
    .toList();`, min: 16 },
    { id: 'terminal', t: 'Terminal operations', body: `A terminal operation runs the pipeline and produces a result: [[collect]], [[toList]] (Java 16), [[forEach]], [[count]], [[min]]/[[max]], [[reduce]], [[anyMatch]]/[[allMatch]]/[[noneMatch]], and [[findFirst]]/[[findAny]] (which return an [[Optional]]).`, code: `long paid = orders.stream().filter(Order::isPaid).count();
boolean anyBig = orders.stream().anyMatch(o -> o.amount() > 10_000);
Optional<Order> latest = orders.stream().max(Comparator.comparing(Order::placedAt));` },
    { id: 'primitive', t: 'Primitive streams', body: `[[IntStream]], [[LongStream]] and [[DoubleStream]] avoid boxing and add [[sum]], [[average]] and [[summaryStatistics]]. Convert with [[mapToInt]] and back with [[boxed]].`, code: `int total = orders.stream().mapToInt(Order::quantity).sum();
OptionalDouble avg = orders.stream().mapToDouble(Order::amount).average();
IntSummaryStatistics stats = IntStream.of(4, 8, 15).summaryStatistics();` },
    { id: 'lazy', t: 'Laziness, short-circuiting and single use', body: `Nothing happens until a terminal operation runs, and operations like [[limit]], [[findFirst]] and [[anyMatch]] stop early. A stream can be consumed only **once**; reusing it throws [[IllegalStateException]].`, code: `Stream<String> s = names.stream().filter(n -> {
    System.out.println("checking " + n);   // not printed yet
    return n.startsWith("A");
});
s.findFirst();       // now it runs, and stops at the first match
// s.count();        // IllegalStateException: already used` },
    { id: 'reduce', t: 'reduce', body: `[[reduce]] folds all elements into one value using an identity value and an associative function. For sums and joins, prefer the specialised [[sum()]] and [[Collectors.joining]].`, code: `int product = IntStream.rangeClosed(1, 5).reduce(1, (a, b) -> a * b);   // 120
BigDecimal total = items.stream().map(Item::price).reduce(BigDecimal.ZERO, BigDecimal::add);` },
    { id: 'parallel', t: 'Parallel streams', body: `[[parallelStream()]] splits work across the common ForkJoinPool. It helps only for large, CPU-heavy, independent work, and hurts for small collections, I/O or shared mutable state. Measure before using it, and never modify shared variables inside.`, code: `long primes = LongStream.rangeClosed(2, 5_000_000)
    .parallel()
    .filter(Maths::isPrime)
    .count();` },
    { id: 'gatherers', t: 'Stream gatherers (Java 24)', body: `Gatherers add custom intermediate operations. The built-in ones include [[windowFixed]] (batches) and [[windowSliding]] (moving windows).`, code: `List<List<Integer>> batches = Stream.of(1, 2, 3, 4, 5)
    .gather(Gatherers.windowFixed(2))
    .toList();          // [[1, 2], [3, 4], [5]]`, min: 24 },
  ],
  sync: [
    { id: 'race', t: 'Race conditions', body: `[[count++]] is really read, add and write. When two threads do it at the same time, updates get lost. Any shared, changing data needs protection.`, code: `class Counter {
    private int count;
    void increment() { count++; }   // not thread-safe: two threads lose updates
}` },
    { id: 'synchronization', t: 'What synchronization guarantees', body: `Synchronization gives you two separate guarantees, and you usually need both:
- **Mutual exclusion**: only one thread at a time runs a critical section, so read-modify-write steps like [[count++]] can't interleave.
- **Visibility**: changes a thread makes before releasing a lock are seen by the next thread that acquires the same lock. Without it, another thread may keep seeing an old value, possibly forever.

The tools, from simplest to most specialised: [[synchronized]], [[Lock]] objects, **atomic variables**, [[volatile]] (visibility only) and concurrent collections. The golden rule: **every** access to a shared, changing variable must be protected by the **same** lock. Better still, avoid sharing: immutable objects and thread-confined data need no synchronization at all.` },
    { id: 'synchronized', t: 'synchronized methods and blocks', body: `[[synchronized]] lets only one thread at a time hold an object's lock, and it also makes changes visible to the next thread that takes the lock. Lock the smallest block you can, and use a private lock object so outside code can't interfere. Locks are re-entrant: a thread can re-take a lock it already holds.`, code: `class Counter {
    private final Object lock = new Object();
    private int count;

    void increment() {
        synchronized (lock) { count++; }
    }
}` },
    { id: 'locks', t: 'ReentrantLock, ReadWriteLock and StampedLock', body: `[[java.util.concurrent.locks]] offers more control than [[synchronized]]: [[tryLock]] with timeouts, interruptible waiting, fairness and several [[Condition]]s. [[ReentrantReadWriteLock]] lets many readers in at once but only one writer. Always unlock in [[finally]].`, code: `private final ReentrantLock lock = new ReentrantLock();

void transfer(Account from, Account to, long paise) throws InterruptedException {
    if (lock.tryLock(1, TimeUnit.SECONDS)) {
        try {
            from.debit(paise);
            to.credit(paise);
        } finally {
            lock.unlock();
        }
    } else {
        throw new IllegalStateException("busy, try again");
    }
}` },
    { id: 'deadlock', t: 'Deadlock and how to avoid it', body: `Deadlock happens when two threads each hold a lock the other needs. Prevent it by always taking locks in the **same order**, holding locks briefly, avoiding calls to unknown code while holding a lock, or using [[tryLock]] with a timeout.` },
    { id: 'volatile', t: 'volatile: visibility, not atomicity', body: `A [[volatile]] field is always read from and written to main memory, so every thread sees the latest value. It's right for simple flags. It does **not** make compound actions like [[count++]] atomic; use [[AtomicInteger]] or a lock for those.`, code: `private volatile boolean running = true;

void stop() { running = false; }          // other threads see this immediately
void loop() { while (running) doWork(); }` },
    { id: 'atomic', t: 'Atomic variables', body: `[[AtomicInteger]], [[AtomicLong]], [[AtomicBoolean]] and [[AtomicReference]] update a single value **atomically without locks**, using the CPU's compare-and-set (CAS) instruction. [[incrementAndGet()]], [[updateAndGet()]] and [[compareAndSet(expected, new)]] are the everyday methods. They're perfect for counters, IDs and flags. For counters updated by many threads at once, [[LongAdder]] scales better. Atomics protect one variable; to keep several variables consistent together, you still need a lock.`, code: `class Counter {
    private final AtomicInteger count = new AtomicInteger();
    void increment() { count.incrementAndGet(); }       // atomic and lock-free
    int get() { return count.get(); }
}

AtomicReference<String> status = new AtomicReference<>("NEW");
boolean mine = status.compareAndSet("NEW", "PROCESSING");   // only ONE thread can win this

LongAdder pageViews = new LongAdder();
pageViews.increment();                                      // best for very hot counters
long total = pageViews.sum();` },
    { id: 'jmm', t: 'The Java Memory Model and happens-before', body: `Without synchronization, one thread may never see another's writes, or may see them out of order. **Happens-before** rules guarantee visibility: releasing a lock happens-before the next acquire of it; a [[volatile]] write happens-before later reads of it; [[Thread.start()]] happens-before the thread's actions; and a thread's actions happen-before another thread's successful [[join()]] on it.` },
    { id: 'wait-notify', t: 'wait and notify', body: `[[wait()]] releases the lock and sleeps until another thread calls [[notify()]]/[[notifyAll()]]. Always call [[wait]] in a loop that re-checks the condition. In new code, prefer [[BlockingQueue]], [[CountDownLatch]] or [[Condition]], which are far easier to get right.` },
    { id: 'threadlocal', t: 'ThreadLocal and ScopedValue', body: `A [[ThreadLocal]] gives each thread its own copy of a value, such as the current user or request id. In thread pools, always [[remove()]] it when done, or the value leaks into the next task. Java 25 finalised [[ScopedValue]], a safer, immutable alternative that works well with virtual threads.`, code: `private static final ThreadLocal<String> REQUEST_ID = new ThreadLocal<>();

void handle(Request r) {
    REQUEST_ID.set(r.id());
    try { process(r); } finally { REQUEST_ID.remove(); }
}

static final ScopedValue<String> USER = ScopedValue.newInstance();
ScopedValue.where(USER, "asha").run(() -> service.load());   // Java 25`, min: 25 },
  ],
  memory: [
    { id: 'stack-heap', t: 'Stack, heap and metaspace', body: `Each thread has a **stack** of frames holding local variables, primitives and references. Objects live on the shared **heap**. Class metadata lives in **metaspace**. Too-deep recursion overflows the stack ([[StackOverflowError]]); too many live objects fill the heap ([[OutOfMemoryError]]).` },
    { id: 'gc-basics', t: 'How garbage collection works', body: `An object is garbage when nothing reachable from the **GC roots** (thread stacks, static fields and a few others) points to it. Most objects die young, so the heap is split into a young generation (collected often and cheaply) and an old generation (collected less often).` },
    { id: 'collectors', t: 'Choosing a garbage collector', body: `- **G1** (the default): balanced throughput and pause times for most apps.
- **ZGC**: very short pauses even with huge heaps; generational since Java 21 and the only mode since Java 23.
- **Parallel**: maximum throughput for batch jobs, with longer pauses.
- **Serial**: tiny heaps and single-CPU containers.

Pick one with flags such as [[-XX:+UseZGC]].` },
    { id: 'leaks', t: 'Memory leaks in Java', body: `Java still leaks when objects stay reachable by mistake: ever-growing static maps or caches without eviction, listeners that are never removed, [[ThreadLocal]] values in pools, and unclosed resources. Find them with a heap dump ([[jcmd <pid> GC.heap_dump]]) opened in Eclipse MAT or VisualVM.` },
    { id: 'oom', t: 'OutOfMemoryError messages', body: `- "Java heap space": too many live objects, or the heap is too small.
- "Metaspace": too many classes loaded (often a class-loader leak).
- "GC overhead limit exceeded": the JVM spends almost all its time collecting.
- "unable to create native thread": too many platform threads (virtual threads help).

Add [[-XX:+HeapDumpOnOutOfMemoryError]] in production so you have evidence.` },
    { id: 'references', t: 'Strong, soft, weak and phantom references', body: `Normal references are **strong**. A [[SoftReference]] is cleared only when memory runs low (simple caches). A [[WeakReference]] is cleared at the next GC ([[WeakHashMap]]). Phantom references and [[Cleaner]] run clean-up after an object is gone, replacing [[finalize]].` },
    { id: 'tuning', t: 'Heap sizing and containers', body: `[[-Xms]] and [[-Xmx]] set the starting and maximum heap. In containers, the JVM reads the memory limit automatically; [[-XX:MaxRAMPercentage=75]] is a common way to size the heap relative to it. Turn on GC logging ([[-Xlog:gc]]) before you tune anything.` },
  ],
};
