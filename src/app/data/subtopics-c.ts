import { SubTopic } from '../core/models';

/** Subtopics for modern Java and concurrency. Keyed by lesson id. */
export const SUBTOPICS_C: Record<string, SubTopic[]> = {
  lambdas: [
    { id: 'syntax', t: 'Lambda syntax', body: `A lambda is a short anonymous function: parameters, an arrow, then an expression or a block. Parameter types are usually inferred.`, code: `Runnable hello = () -> System.out.println("Hi");
Comparator<String> byLength = (a, b) -> Integer.compare(a.length(), b.length());
Function<Integer, Integer> square = x -> x * x;
BinaryOperator<Integer> add = (a, b) -> {
    int sum = a + b;
    return sum;
};` },
    { id: 'functional-interfaces', t: 'The built-in functional interfaces', body: `[[java.util.function]] covers most needs:
- [[Function<T, R>]]: T in, R out. [[BiFunction]] takes two inputs.
- [[Supplier<T>]]: nothing in, T out.
- [[Consumer<T>]]: T in, nothing out.
- [[Predicate<T>]]: T in, boolean out.
- [[UnaryOperator<T>]] and [[BinaryOperator<T>]]: same type in and out.
- Primitive versions such as [[IntPredicate]] and [[ToIntFunction]] avoid boxing.` },
    { id: 'method-references', t: 'Method references', body: `When a lambda just calls an existing method, a method reference is shorter. There are four kinds:
1. Static: [[Integer::parseInt]]
2. On a specific object: [[System.out::println]]
3. On any object of a type: [[String::toUpperCase]]
4. Constructor: [[ArrayList::new]]`, code: `List<Integer> ids = texts.stream().map(Integer::parseInt).toList();
names.forEach(System.out::println);
List<String> upper = names.stream().map(String::toUpperCase).toList();
Supplier<List<String>> fresh = ArrayList::new;`, min: 16 },
    { id: 'capture', t: 'Capturing variables', body: `A lambda can use local variables from the enclosing method only if they're **effectively final** (never reassigned). Inside a lambda, [[this]] means the enclosing object, unlike in an anonymous class.`, code: `int limit = 100;               // effectively final
orders.removeIf(o -> o.amount() > limit);
// limit = 200;                // would make the lambda above a compile error` },
    { id: 'composition', t: 'Composing functions', body: `Functional interfaces have default methods to combine them: [[andThen]] and [[compose]] for functions, [[and]], [[or]] and [[negate]] for predicates, and [[thenComparing]] and [[reversed]] for comparators.`, code: `Predicate<Order> paid = Order::isPaid;
Predicate<Order> big = o -> o.amount() > 1000;
orders.stream().filter(paid.and(big.negate())).toList();

Function<String, String> trim = String::strip;
Function<String, Integer> length = trim.andThen(String::length);`, min: 16 },
    { id: 'where', t: 'Where lambdas show up', body: `Collections ([[forEach]], [[removeIf]], [[replaceAll]], [[computeIfAbsent]], [[sort]]), streams, [[Optional]], [[CompletableFuture]], executors and event listeners in frameworks. Once you know lambdas, a lot of modern Java reads naturally.` },
  ],
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
  threads: [
    { id: 'create', t: 'Creating threads', body: `Give a [[Thread]] a [[Runnable]] (often a lambda) and call [[start()]], which runs it on a new thread. Calling [[run()]] directly just runs it on the current thread, a classic mistake.`, code: `Thread worker = new Thread(() -> System.out.println("Working on " + Thread.currentThread().getName()));
worker.start();          // new thread
// worker.run();         // same thread: not concurrent

Thread vt = Thread.ofVirtual().start(() -> fetchPrices());   // Java 21 virtual thread`, min: 21 },
    { id: 'lifecycle', t: 'Thread states', body: `A thread moves through [[NEW]] → [[RUNNABLE]] → ([[BLOCKED]], [[WAITING]], [[TIMED_WAITING]]) → [[TERMINATED]]. A thread dump ([[jcmd <pid> Thread.print]]) shows each thread's state, which is how you find stuck or deadlocked code.` },
    { id: 'sleep-join-interrupt', t: 'sleep, join and interrupt', body: `[[sleep]] pauses the current thread; [[join]] waits for another thread to finish. [[interrupt()]] politely asks a thread to stop: blocking calls then throw [[InterruptedException]]. Handle it by stopping, and restore the flag if you can't rethrow.`, code: `Thread t = new Thread(() -> {
    try {
        while (true) { doWork(); Thread.sleep(1000); }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();   // keep the flag, then exit
    }
});
t.start();
t.interrupt();
t.join();` },
    { id: 'daemon', t: 'Daemon and user threads', body: `The JVM exits when all **user** threads finish; **daemon** threads (background helpers) don't keep it alive. Virtual threads are always daemon threads.` },
    { id: 'executors', t: 'ExecutorService and thread pools', body: `Creating threads by hand doesn't scale. An [[ExecutorService]] reuses a pool of threads and queues tasks. Always shut it down; since Java 19 it's [[AutoCloseable]], so try-with-resources waits for tasks and closes it.`, code: `try (ExecutorService pool = Executors.newFixedThreadPool(4)) {
    for (String url : urls) pool.submit(() -> download(url));
}   // waits for all tasks, then shuts down

try (var perTask = Executors.newVirtualThreadPerTaskExecutor()) {
    urls.forEach(u -> perTask.submit(() -> download(u)));
}`, min: 21 },
    { id: 'callable-future', t: 'Callable and Future', body: `A [[Callable]] returns a value (and may throw). Submitting it gives a [[Future]]; [[get()]] waits for the result, preferably with a timeout. [[invokeAll]] runs a batch and waits for all.`, code: `Future<Integer> count = pool.submit(() -> countLines(path));
try {
    int lines = count.get(5, TimeUnit.SECONDS);
} catch (TimeoutException e) {
    count.cancel(true);
}` },
    { id: 'scheduled', t: 'Scheduled tasks', body: `A [[ScheduledExecutorService]] runs tasks after a delay or repeatedly. In Spring Boot, [[@Scheduled]] does the same with less code.`, code: `ScheduledExecutorService timer = Executors.newSingleThreadScheduledExecutor();
timer.scheduleAtFixedRate(this::refreshCache, 0, 10, TimeUnit.MINUTES);` },
  ],
  sync: [
    { id: 'race', t: 'Race conditions', body: `[[count++]] is really read, add and write. When two threads do it at the same time, updates get lost. Any shared, changing data needs protection.`, code: `class Counter {
    private int count;
    void increment() { count++; }   // not thread-safe: two threads lose updates
}` },
    { id: 'synchronized', t: 'synchronized methods and blocks', body: `[[synchronized]] lets only one thread at a time hold an object's lock, and it also makes changes visible to the next thread that takes the lock. Lock the smallest block you can, and use a private lock object so outside code can't interfere. Locks are re-entrant: a thread can re-take a lock it already holds.`, code: `class Counter {
    private final Object lock = new Object();
    private int count;

    void increment() {
        synchronized (lock) { count++; }
    }
}` },
    { id: 'volatile', t: 'volatile: visibility, not atomicity', body: `A [[volatile]] field is always read from and written to main memory, so every thread sees the latest value. It's right for simple flags. It does **not** make compound actions like [[count++]] atomic; use [[AtomicInteger]] or a lock for those.`, code: `private volatile boolean running = true;

void stop() { running = false; }          // other threads see this immediately
void loop() { while (running) doWork(); }` },
    { id: 'jmm', t: 'The Java Memory Model and happens-before', body: `Without synchronization, one thread may never see another's writes, or may see them out of order. **Happens-before** rules guarantee visibility: releasing a lock happens-before the next acquire of it; a [[volatile]] write happens-before later reads of it; [[Thread.start()]] happens-before the thread's actions; and a thread's actions happen-before another thread's successful [[join()]] on it.` },
    { id: 'deadlock', t: 'Deadlock and how to avoid it', body: `Deadlock happens when two threads each hold a lock the other needs. Prevent it by always taking locks in the **same order**, holding locks briefly, avoiding calls to unknown code while holding a lock, or using [[tryLock]] with a timeout.` },
    { id: 'wait-notify', t: 'wait and notify', body: `[[wait()]] releases the lock and sleeps until another thread calls [[notify()]]/[[notifyAll()]]. Always call [[wait]] in a loop that re-checks the condition. In new code, prefer [[BlockingQueue]], [[CountDownLatch]] or [[Condition]], which are far easier to get right.` },
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
