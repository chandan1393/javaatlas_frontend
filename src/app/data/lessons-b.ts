import { Stage } from '../core/models';

/** Stages 5-6: concurrency and the JVM, JDBC/JPA/Hibernate. */
export const STAGES_B: Stage[] = [
{id:`concurrency`,title:`Concurrency and the JVM`,level:`A`,blurb:`Threads, locks, CompletableFuture, virtual threads, memory and garbage collection.`,lessons:[
{id:`threads`,t:`Multithreading basics: threads, Runnable and Callable`,lvl:`B`,min:8,
eli5:`A process is a restaurant; threads are the cooks inside it. The cooks share one kitchen (memory), so several dishes get made at once, but two cooks grabbing the same pan at the same moment causes trouble.`,
body:`**Multithreading** lets one program do several things at the same time: serve many web requests at once, download files while the screen stays responsive, or use every CPU core for a big calculation.
- A **process** is a running program with its own memory. A **thread** is a path of execution inside a process, and all threads of a process **share its memory** (the heap).
- Every Java program starts with one thread, [[main]]. You create more by giving a [[Thread]] a task and calling [[start()]].
- A task is a [[Runnable]] (no result) or a [[Callable<T>]] (returns a value and may throw).
- A thread moves through states: NEW → RUNNABLE → (BLOCKED, WAITING or TIMED_WAITING) → TERMINATED.
- [[Thread.sleep(ms)]] pauses the current thread; [[join()]] waits for another thread to finish.

This is the first step of the multithreading track. Next: what goes wrong when threads share data (race conditions and synchronization), then the tools professionals use (thread pools, CompletableFuture, concurrent collections).`,
code:`public class Kitchen {
    public static void main(String[] args) throws InterruptedException {
        Runnable makeTea = () -> {
            System.out.println("Tea started by " + Thread.currentThread().getName());
            pause(500);
            System.out.println("Tea ready");
        };

        Thread cook1 = new Thread(makeTea, "cook-1");
        Thread cook2 = new Thread(() -> System.out.println("Toast by " + Thread.currentThread().getName()), "cook-2");

        cook1.start();                 // both cooks now work at the same time
        cook2.start();

        cook1.join();                  // main waits until both have finished
        cook2.join();
        System.out.println("Breakfast served by " + Thread.currentThread().getName());   // main
    }

    static void pause(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();       // keep the interrupt flag
        }
    }
}`,
pro:`Sharing memory is what makes threads fast and what makes them dangerous: two threads changing the same variable can corrupt it, which is the next lesson. The **order of output between threads isn't guaranteed**; run the example a few times and it can change. In real applications you rarely create threads by hand: servers and [[ExecutorService]] manage pools of threads, and since Java 21 virtual threads make one thread per task cheap.`,
trap:`Calling thread.run() instead of thread.start(). run() executes the task on the current thread, so nothing happens in parallel.`,
iq:[[`Process vs thread?`,`A process is a running program with its own memory and resources. Threads run inside a process and share its heap, so they're cheaper to create and switch between, and they can communicate through shared objects, which is also why they need synchronization.`],
[`Runnable vs Callable?`,`Runnable.run() returns nothing and can't throw checked exceptions. Callable.call() returns a value and can throw; run it with an ExecutorService (or a FutureTask) to get a Future for the result.`]],
quiz:[`Which method actually starts a new thread?`,[`run()`,`start()`,`execute()`,`init()`],1,`start() asks the JVM to create a new thread, which then calls run().`]},

{id:`sync`,lab:`threads:race`,t:`Race conditions and synchronization: synchronized, locks, volatile and atomics`,lvl:`I`,
eli5:`A shared class notebook: synchronized is the rule that only one student writes at a time. volatile means everyone always reads the latest page, never an old photocopy.`,
body:`When threads share mutable data you get **race conditions** and **visibility** problems.

- [[synchronized]]: only one thread at a time enters the block for a given lock object, and its changes become visible to the next thread that takes the lock.
- [[volatile]]: guarantees visibility and ordering for one variable, but **not atomicity**; [[count++]] is still unsafe.
- **Atomics** ([[AtomicInteger]], [[LongAdder]]): lock-free counters and updates.
- [[ReentrantLock]]: like synchronized, plus [[tryLock]], timeouts and fairness.
- Concurrent collections: [[ConcurrentHashMap]], [[CopyOnWriteArrayList]], [[BlockingQueue]].

Best of all, avoid sharing mutable state. Immutable objects are thread-safe for free.`,
code:`class Counter {
    private int unsafe = 0;
    private final AtomicInteger safe = new AtomicInteger();
    private volatile boolean running = true;         // visibility flag only

    void hit() {
        unsafe++;                  // read-modify-write: updates get lost
        safe.incrementAndGet();    // atomic
    }

    private final ReentrantLock lock = new ReentrantLock();

    void transfer(Account from, Account to, int amount) throws InterruptedException {
        if (lock.tryLock(1, TimeUnit.SECONDS)) {
            try {
                from.debit(amount);
                to.credit(amount);
            } finally {
                lock.unlock();                        // always unlock in finally
            }
        }
    }
}`,
pro:`The **Java Memory Model** defines "happens-before" rules: unlocking a monitor happens-before the next lock of the same monitor, and a volatile write happens-before every later read of it. Without such rules, the CPU and JIT may reorder instructions. The usual fix for **deadlock** is to always acquire locks in one fixed global order. Since Java 24, virtual threads no longer pin their carrier thread while inside synchronized blocks.`,
trap:`Using volatile for a counter that many threads increment. volatile doesn't make count++ atomic; use AtomicInteger or LongAdder.`,
iq:[[`synchronized vs volatile?`,`synchronized gives mutual exclusion and visibility for a whole block. volatile gives visibility and ordering for a single variable but no atomicity for compound actions like count++.`],
[`How do you prevent deadlock?`,`Acquire locks in a consistent order, keep critical sections short, use tryLock with timeouts, or avoid nested locks by using higher-level concurrency utilities.`]],
quiz:[`Is count++ on a volatile int thread-safe?`,[`Yes`,`No`,`Only on 64-bit JVMs`,`Only in Java 21+`],1,`It's a read-modify-write sequence; two threads can read the same value and both write back value + 1.`]},

{id:`concurrent`,lab:`threads:atomic`,t:`Concurrent collections and synchronizers: ConcurrentHashMap, CountDownLatch, CyclicBarrier and Semaphore`,lvl:`A`,min:9,
eli5:`A CountDownLatch is a starting gun that waits until every runner is ready. A Semaphore is a car park with a fixed number of spaces. An atomic counter is a turnstile that never double-counts.`,
body:`[[java.util.concurrent]] gives you tested building blocks, so you rarely need low-level [[wait]] and [[notify]]:
- **Atomics** ([[AtomicInteger]], [[AtomicLong]], [[AtomicReference]], [[LongAdder]]): lock-free updates such as [[incrementAndGet]] and [[compareAndSet]].
- **CountDownLatch**: threads wait until a count reaches zero, for example until three caches have warmed up.
- **Semaphore**: limits how many threads use a resource at once, for example at most ten calls to a partner API.
- **CyclicBarrier** and **Phaser**: threads wait for each other at a checkpoint, repeatedly.
- **BlockingQueue**: producer-consumer hand-off; [[put]] waits when the queue is full and [[take]] waits when it's empty.
- **ConcurrentHashMap** and **CopyOnWriteArrayList**: thread-safe collections.

Pick the highest-level tool that fits; it's much easier to get right than locks.`,
code:`ExecutorService pool = Executors.newFixedThreadPool(4);

// Wait for three warm-up tasks
CountDownLatch ready = new CountDownLatch(3);
for (String cache : List.of("courses", "users", "prices")) {
    pool.submit(() -> {
        try { warmUp(cache); } finally { ready.countDown(); }
    });
}
ready.await(10, TimeUnit.SECONDS);

// At most two calls at a time to a rate-limited partner API
Semaphore permits = new Semaphore(2);
Runnable call = () -> {
    try {
        permits.acquire();
        try { partnerApi.fetch(); } finally { permits.release(); }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
};

// Producer and consumer
BlockingQueue<String> emails = new LinkedBlockingQueue<>(100);
pool.submit(() -> { emails.put("welcome:asha@example.com"); return null; });
pool.submit(() -> { send(emails.take()); return null; });

LongAdder pageViews = new LongAdder();
pageViews.increment();                   // scales better than AtomicLong under heavy contention`,
pro:`Atomics rely on the CPU's compare-and-swap instruction: read, compute, and write only if nobody changed the value in between, retrying otherwise. Under heavy contention many threads keep retrying, which is why [[LongAdder]] spreads updates across cells and sums them when read. With virtual threads, a [[Semaphore]] is the standard way to protect scarce resources such as database connections.`,
trap:`Calling countDown() outside a finally block. If the task throws, the latch never reaches zero and await() blocks until it times out.`,
iq:[[`CountDownLatch vs CyclicBarrier?`,`A CountDownLatch is one-shot: threads wait until the count reaches zero, and it can't be reset. A CyclicBarrier makes a fixed number of threads wait for each other and can be reused for repeated rounds.`],
[`How does AtomicInteger stay thread-safe without locks?`,`It uses compare-and-swap: read the value, compute the new one, and write only if the value hasn't changed, retrying otherwise.`]],
quiz:[`Which tool limits how many threads use a resource at once?`,[`CountDownLatch`,`Semaphore`,`AtomicInteger`,`ThreadLocal`],1,`A Semaphore hands out a fixed number of permits.`]},

{id:`cf`,t:`CompletableFuture`,lvl:`A`,min:9,
eli5:`Ordering food on an app: you don't stand at the restaurant waiting. You get a notification when it's ready, and you can say "when it arrives, send it to my friend".`,
body:`[[CompletableFuture]] (Java 8) represents an asynchronous result that you can **compose** without blocking.

- Start: [[supplyAsync(supplier, executor)]], [[runAsync]]
- Transform: [[thenApply]] (like map), [[thenCompose]] (like flatMap, for dependent async calls)
- Combine: [[thenCombine]] (two futures), [[allOf]], [[anyOf]]
- Errors: [[exceptionally]], [[handle]], [[whenComplete]]
- Timeouts (Java 9): [[orTimeout]], [[completeOnTimeout]]

It's ideal for calling several services in parallel and merging the results.`,
code:`ExecutorService io = Executors.newFixedThreadPool(8);

CompletableFuture<User> user =
    CompletableFuture.supplyAsync(() -> userApi.get(id), io);
CompletableFuture<List<Course>> courses =
    CompletableFuture.supplyAsync(() -> courseApi.forUser(id), io);

CompletableFuture<Dashboard> dashboard = user
    .thenCombine(courses, Dashboard::new)
    .orTimeout(2, TimeUnit.SECONDS)                  // Java 9+
    .exceptionally(ex -> Dashboard.fallback(id));

Dashboard d = dashboard.join();`,
pro:`Without an explicit executor, the async methods use [[ForkJoinPool.commonPool()]], which the whole JVM shares; blocking I/O there starves parallel streams and other tasks. With **virtual threads** (Java 21), plain blocking code in [[Executors.newVirtualThreadPerTaskExecutor()]] is often clearer than long CompletableFuture chains.`,
trap:`Using thenApply when your function itself returns a CompletableFuture. You end up with CompletableFuture<CompletableFuture<T>>; use thenCompose instead.`,
iq:[[`thenApply vs thenCompose?`,`thenApply maps the result with a synchronous function. thenCompose chains a function that returns another CompletableFuture and flattens the result.`],
[`Future vs CompletableFuture?`,`A Future only lets you block with get() or poll isDone(). A CompletableFuture can be completed manually, chained, combined with others, and handles errors through callbacks.`]],
quiz:[`Which method waits for all of several futures?`,[`anyOf`,`allOf`,`thenCombine`,`join`],1,`CompletableFuture.allOf(...) completes when every given future has completed.`]},

{id:`vthreads`,t:`Virtual threads`,lvl:`A`,min:21,
eli5:`Platform threads are full-time employees: expensive, so you hire only a few. Virtual threads are freelancers who use a desk only while actually working, so you can have a million of them.`,
body:`**Virtual threads** (final in Java 21, from Project Loom) are lightweight threads managed by the JVM rather than the operating system. When a virtual thread blocks on I/O, the JVM parks it and frees the underlying **carrier** thread for other work.

Why it matters: the simple **thread-per-request** style (blocking JDBC, [[RestClient]]) now scales to hundreds of thousands of concurrent requests without reactive code.

- Create one with [[Thread.ofVirtual().start(...)]] or [[Executors.newVirtualThreadPerTaskExecutor()]].
- In Spring Boot 3.2+, set [[spring.threads.virtual.enabled=true]].
- **Don't pool** virtual threads; create one per task.
- They help I/O-bound work. CPU-bound work gains nothing.`,
code:`try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<String>> results = IntStream.range(0, 10_000)
        .mapToObj(i -> executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));    // blocking is fine here
            return "task " + i;
        }))
        .toList();
    System.out.println(results.getLast().get());    // about 1 second in total, not 10,000
}`,
pro:`Virtual threads are cheap because their stacks live on the heap as small, growable chunks. Watch for: blocking inside [[synchronized]] pinned the carrier before Java 24 (JEP 491 fixed it); [[ThreadLocal]] with large objects multiplies memory across millions of threads, so prefer **scoped values** (final in Java 25). Downstream limits still apply: 10,000 virtual threads will happily exhaust a 10-connection database pool, so guard scarce resources with a [[Semaphore]].`,
trap:`Putting virtual threads in a fixed-size pool, or expecting CPU-heavy work to run faster. They increase how many tasks can wait at once, not raw computing speed.`,
iq:[[`Virtual vs platform threads?`,`Platform threads wrap OS threads: expensive, about 1 MB of stack, thousands at most. Virtual threads are scheduled by the JVM onto a few carrier threads, cost a few hundred bytes to a few KB, and unmount while blocked, so millions are possible.`],
[`Do virtual threads make code faster?`,`They raise throughput (more concurrent tasks) for I/O-bound workloads. Each individual task is no faster, and CPU-bound work gains nothing.`]],
quiz:[`Should you pool virtual threads?`,[`Yes, always`,`No, create one per task`,`Only in Spring`,`Only with synchronized`],1,`They're cheap to create; pooling defeats the purpose.`]},

{id:`memory`,lab:`memory:gc`,t:`JVM memory and garbage collection`,lvl:`A`,
eli5:`The heap is a big shared warehouse, each thread has its own small desk (the stack), and the garbage collector is a cleaner who removes boxes that nobody points to any more.`,
body:`The main JVM memory areas:
- **Heap**: every object. Split into a **young** generation (Eden and survivor spaces) and an **old** generation.
- **Stack**, one per thread: method frames, local variables and references.
- **Metaspace** (Java 8+, replacing PermGen): class metadata, stored in native memory.
- **Code cache**: native code produced by the JIT.

An object becomes garbage when no chain of references from a **GC root** (stack variables, static fields, active threads) reaches it. Most objects die young, so collecting the young generation often is cheap.

Collectors:
- **G1**: the default since Java 9, and in every environment since Java 27. Balanced.
- **ZGC**: sub-millisecond pauses on huge heaps; generational by default since Java 23.
- **Shenandoah**: low pauses; its generational mode became production-ready in Java 25.
- **Parallel** for maximum batch throughput, **Serial** for tiny heaps.`,
code:`# Size the heap and choose a collector
java -Xms512m -Xmx2g -XX:+UseZGC -jar app.jar

# In containers, size the heap relative to the memory limit
java -XX:MaxRAMPercentage=75 -jar app.jar

# Diagnose a running JVM
jcmd <pid> GC.heap_info
jcmd <pid> Thread.print                   # thread dump
jcmd <pid> GC.heap_dump /tmp/heap.hprof   # open in Eclipse MAT
java -XX:StartFlightRecording=duration=60s,filename=rec.jfr -jar app.jar`,lang:`bash`,
pro:`Memory leaks in Java are references you forgot about: static collections that only grow, caches with no eviction, listeners never removed, [[ThreadLocal]] values left in pooled threads. **Compact object headers** (production-ready in Java 25, on by default in Java 27) shrink each object header from 12 to 8 bytes on typical 64-bit JVMs, which noticeably reduces heap use for object-heavy apps.`,
trap:`Setting -Xmx equal to the container's memory limit. Metaspace, thread stacks and direct buffers live outside the heap, so the container gets killed. Leave headroom, for example MaxRAMPercentage=75.`,
iq:[[`Stack vs heap?`,`The stack is per thread and stores frames, local primitives and references; it's freed automatically when methods return. The heap is shared, stores objects, and is managed by the garbage collector.`],
[`What are GC roots?`,`The starting points for reachability: local variables on thread stacks, static fields, active threads and JNI references. Anything not reachable from a root can be collected.`]],
quiz:[`What replaced PermGen in Java 8?`,[`Code cache`,`Metaspace`,`Old generation`,`Eden`],1,`Class metadata moved to Metaspace, in native memory.`]},

{id:`classloading`,t:`Class loading and the JIT compiler`,lvl:`A`,
eli5:`Class loading is the JVM fetching a recipe card the first time a dish is ordered. The JIT is a chef who, after cooking the same dish many times, works out a faster way to make it.`,
body:`**Class loading** happens lazily, the first time a class is used:
1. **Loading**: a class loader finds the bytes, from a JAR or the module path.
2. **Linking**: verification (the bytecode is safe), preparation (static fields get default values) and resolution.
3. **Initialisation**: static initialisers and static field assignments run, once and thread-safely.

Loaders form a hierarchy: **bootstrap** (the core JDK), **platform**, and **application** (your classpath). Each asks its parent first, so your code can't replace [[java.lang.String]].

**Execution** starts in the interpreter. The JVM counts how often methods run, and hot methods are compiled to native code by **C1** (quick) and then **C2** (heavily optimised). The JIT inlines small methods, removes dead code and uses runtime profiles, which is why Java gets faster after warming up.

Startup keeps improving: class-data sharing and Java 24 to 26's ahead-of-time caches (Project Leyden) reuse work from earlier runs.`,
code:`public class Config {
    static {
        System.out.println("Config initialised");       // runs once, on first real use
    }
    static final String NAME = "JavaAtlas";              // compile-time constant: inlined, no init
    static String region = loadRegion();                 // reading this triggers initialisation

    static String loadRegion() { return System.getenv().getOrDefault("REGION", "ap-south-1"); }
}

System.out.println(Config.NAME);     // prints JavaAtlas, but doesn't initialise Config
System.out.println(Config.region);   // "Config initialised", then the region`,
more:[{cap:`See it happen`,lang:`bash`,src:`# Watch classes load and methods get compiled
java -Xlog:class+load:file=classes.txt -jar app.jar
java -XX:+PrintCompilation -jar app.jar | head

# Java 25+: record a training run, then start faster from the AOT cache
java -XX:AOTCacheOutput=app.aot -jar app.jar     # run a typical workload, then stop
java -XX:AOTCache=app.aot -jar app.jar           # later starts reuse the cache`}],
pro:`The holder-class singleton works because class initialisation is lazy and thread-safe. [[ClassNotFoundException]] means code asked for a class by name at runtime and it wasn't found; [[NoClassDefFoundError]] means a class present at compile time is missing, or failed to initialise, at runtime, often because of a dependency conflict. Tools that reload code use separate class loaders, the source of confusing "same class, different loader" ClassCastExceptions.`,
trap:`Measuring performance right after startup. Hot code hasn't been compiled yet; use JMH for micro-benchmarks, with warm-up iterations.`,
iq:[[`ClassNotFoundException vs NoClassDefFoundError?`,`ClassNotFoundException is thrown when code loads a class by name (for example Class.forName) and it isn't on the classpath. NoClassDefFoundError is thrown when a class present at compile time is missing or failed to initialise at runtime.`],
[`What is the parent delegation model?`,`A class loader first asks its parent to load a class and only loads it itself if the parent can't, which stops core classes from being replaced.`]],
quiz:[`Which JIT compiler produces the most optimised code?`,[`C1`,`C2`,`The interpreter`,`javac`],1,`In tiered compilation, C2 compiles the hottest methods with aggressive optimisations.`]}
]},

{id:`data`,title:`JDBC, JPA and Hibernate`,level:`I`,blurb:`From raw JDBC to entity mapping, the persistence context, N+1 queries and transactions. Examples use Jakarta Persistence with Hibernate 6/7 and Spring Boot 3+, which need Java 17.`,lessons:[
{id:`jdbc`,t:`JDBC: talking to databases`,lvl:`I`,min:7,
eli5:`JDBC is a phone line between Java and the database. You dial (connect), speak SQL, listen to the answer (a ResultSet), and hang up.`,
body:`**JDBC** (since JDK 1.1) is the low-level API that every Java database tool builds on, including Hibernate and Spring Data.

The core pieces: a [[DataSource]] gives you a [[Connection]], which creates a [[PreparedStatement]], which returns a [[ResultSet]].

Always use [[PreparedStatement]] with [[?]] placeholders. It prevents **SQL injection** and lets the database reuse query plans.

Real apps use a **connection pool** (HikariCP is Spring Boot's default) to reuse open connections, because opening a new database connection takes milliseconds.`,
code:`String sql = "SELECT id, title, price FROM course WHERE price < ? ORDER BY price";

try (Connection con = dataSource.getConnection();
     PreparedStatement ps = con.prepareStatement(sql)) {
    ps.setBigDecimal(1, new BigDecimal("999"));
    try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
            System.out.printf("%d %s %s%n",
                rs.getLong("id"), rs.getString("title"), rs.getBigDecimal("price"));
        }
    }
}

// Spring Boot 3.2+: JdbcClient removes most of the boilerplate
List<Course> cheap = jdbcClient.sql("SELECT * FROM course WHERE price < :max")
    .param("max", 999)
    .query(Course.class)
    .list();`,
pro:`JDBC transactions: [[con.setAutoCommit(false)]], then [[commit()]] or [[rollback()]]. Batch inserts with [[addBatch()]] and [[executeBatch()]] cut network round trips dramatically. Spring's [[JdbcTemplate]] and [[JdbcClient]] manage resources for you and translate [[SQLException]] into Spring's unchecked [[DataAccessException]] hierarchy.`,
trap:`Building SQL by concatenating user input ("... WHERE name = '" + name + "'"). That's SQL injection. Always bind parameters.`,
iq:[[`Statement vs PreparedStatement?`,`PreparedStatement is precompiled with bound parameters: safe from SQL injection, faster when repeated, and handles types properly. Statement sends raw concatenated SQL.`],
[`Why use a connection pool?`,`Creating a connection is slow (TCP, authentication, session setup). A pool reuses a bounded set of open connections, which improves latency and protects the database from overload.`]],
quiz:[`What mainly protects against SQL injection?`,[`Stored procedures only`,`PreparedStatement with bound parameters`,`Escaping quotes by hand`,`Using SELECT *`],1,`Bound parameters are sent as data and are never parsed as SQL.`]},

{id:`orm`,t:`JPA vs Hibernate: what's the difference?`,lvl:`I`,min:17,
eli5:`JPA is the rulebook of a sport. Hibernate is one team that plays by those rules and adds a few moves of its own. Spring Data JPA is the coach who runs the boring drills for you.`,
body:`**ORM** (object-relational mapping) maps Java objects to database tables, so you work with objects instead of hand-writing SQL for every operation.

- **JPA**, now called **Jakarta Persistence**, is a **specification**: annotations ([[@Entity]], [[@Id]]) and interfaces ([[EntityManager]]). The package moved from [[javax.persistence]] to [[jakarta.persistence]] in version 3.0.
- **Hibernate** is the most popular **implementation** of JPA (EclipseLink is another). It adds extras such as [[@BatchSize]], [[@Formula]], filters and its own [[Session]] API.
- **Spring Data JPA** sits on top and generates repositories, so you often write no data-access code at all.

The stack: your code, then Spring Data JPA, then the JPA API, then Hibernate, then JDBC, then the database.`,
code:`// Plain JPA: works with any provider
@PersistenceContext
EntityManager em;

@Transactional
public Long enroll(String email, Long courseId) {
    Course course = em.find(Course.class, courseId);
    Student s = new Student(email);
    s.enroll(course);
    em.persist(s);                       // INSERT happens at flush or commit
    return s.getId();
}

List<Course> popular = em.createQuery(
        "select c from Course c where c.rating >= :r order by c.rating desc", Course.class)
    .setParameter("r", 4.5)
    .setMaxResults(10)
    .getResultList();`,
pro:`Versions worth knowing: JPA 2.0 (2009) added the Criteria API; 2.1 added entity graphs and [[@Convert]]; 2.2 added java.time and stream results; Jakarta Persistence 3.0 renamed the packages; 3.2 (2024) brought record embeddables and JPQL set operations. Hibernate 6 rewrote the query engine (SQM); Hibernate 7 implements Jakarta Persistence 3.2 and is Apache-licensed. Spring Boot 3 and later require the jakarta namespace. See the Spring and JPA timeline on the Java versions page.`,
trap:`Copying javax.persistence imports from old tutorials into a Spring Boot 3 or 4 project. Boot 3+ uses jakarta.persistence, so those imports won't compile.`,
iq:[[`Is Hibernate the same as JPA?`,`No. JPA is a specification (an API plus rules). Hibernate is one implementation of it, with extra native features.`],
[`What does Spring Data JPA add?`,`Repository interfaces with generated implementations: CRUD, paging, queries derived from method names, @Query, projections and auditing, on top of a JPA provider.`]],
quiz:[`Which one is a specification rather than a library you run?`,[`Hibernate`,`EclipseLink`,`Jakarta Persistence (JPA)`,`HikariCP`],2,`JPA defines the API; providers such as Hibernate implement it.`]},

{id:`entities`,t:`Entity mapping and relationships`,lvl:`I`,min:17,
eli5:`Each entity class is a table and each object is a row. Relationships are like family trees: one author has many books, and each book has one author.`,
body:`Key mapping annotations:
- [[@Entity]] and [[@Table(name = ...)]]
- [[@Id]] with [[@GeneratedValue]]: prefer [[SEQUENCE]] on PostgreSQL, because [[IDENTITY]] disables JDBC insert batching
- [[@Column(nullable = false, unique = true)]] and [[@Enumerated(EnumType.STRING)]]
- [[@Embedded]] value objects, and [[@Version]] for optimistic locking

Relationships:
- [[@ManyToOne]]: the side holding the foreign key, called the **owning** side.
- [[@OneToMany(mappedBy = ...)]]: the inverse side.
- [[@OneToOne]] and [[@ManyToMany]] (usually better modelled as an explicit join entity).

**Fetch defaults:** [[@ManyToOne]] and [[@OneToOne]] are EAGER; collections are LAZY. Set [[fetch = LAZY]] on every [[@ManyToOne]] and fetch explicitly when you need the data.`,
code:`@Entity
@Table(name = "course")
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Enumerated(EnumType.STRING)
    private Level level;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    private Author author;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Lesson> lessons = new ArrayList<>();

    @Version
    private int version;

    protected Course() {}                        // required by JPA

    public void addLesson(Lesson l) {            // keep both sides in sync
        lessons.add(l);
        l.setCourse(this);
    }
}`,
pro:`Only the owning side (the [[@ManyToOne]], the side without [[mappedBy]]) is used to write the foreign key; changing only the inverse collection does nothing in the database. Avoid [[CascadeType.REMOVE]] on [[@ManyToMany]], which can delete shared rows. [[orphanRemoval = true]] deletes children that you remove from the collection.`,
trap:`Calling course.getLessons().add(lesson) without lesson.setCourse(course). The foreign key stays null. Use helper methods that set both sides.`,
iq:[[`What is the owning side of a relationship?`,`The side that holds the foreign key and whose changes Hibernate writes to the database, typically the @ManyToOne. The other side uses mappedBy and is ignored for writes.`],
[`What are JPA's default fetch types?`,`@ManyToOne and @OneToOne: EAGER. @OneToMany and @ManyToMany: LAZY. Best practice is LAZY everywhere, with explicit fetching per use case.`]],
quiz:[`In Course and Lesson, which side owns the foreign key?`,[`Course.lessons with mappedBy`,`Lesson.course with @ManyToOne`,`Both`,`Neither`],1,`The @ManyToOne side holds the join column.`]},

{id:`lifecycle`,t:`Persistence context and entity states`,lvl:`A`,min:17,
eli5:`The persistence context is Hibernate's short-term memory for one transaction. Anything it's watching gets saved automatically when you change it, like a document with autosave.`,
body:`The **persistence context** (the first-level cache) is a map of entities managed by an [[EntityManager]], usually one per transaction.

Entity states:
- **Transient**: [[new Course()]], unknown to JPA.
- **Managed**: persisted or loaded inside the context; changes are tracked.
- **Detached**: the context has closed (the transaction ended); changes are no longer tracked.
- **Removed**: scheduled for deletion.

**Dirty checking**: at flush time Hibernate compares managed entities with the snapshot taken when they were loaded and issues UPDATEs automatically. You don't need [[save()]] after changing a managed entity.

Inside one context, loading the same id twice returns the **same object** and hits the database only once.`,
code:`@Transactional
public void rename(Long id, String title) {
    Course c = courseRepository.findById(id).orElseThrow();   // managed
    c.setTitle(title);                                         // no save() needed
}   // commit: flush, dirty check, then UPDATE course SET title = ? ...

@Transactional
public void identity(Long id) {
    Course a = em.find(Course.class, id);
    Course b = em.find(Course.class, id);
    System.out.println(a == b);          // true: first-level cache, one SELECT
}

Course detached = service.load(id);    // that transaction has ended
detached.setTitle("New title");        // not saved automatically
Course merged = em.merge(detached);    // copies state onto a managed instance`,
pro:`A flush happens before commit, before a JPQL query that touches affected tables (AUTO flush mode), or when you call [[em.flush()]]. [[LazyInitializationException]] means you touched a lazy association on a detached entity. Fix it with a fetch join, an entity graph or a DTO projection, not with Open Session in View; Spring Boot enables [[spring.jpa.open-in-view]] by default and logs a warning, so set it to false. The optional second-level cache is shared across sessions.`,
trap:`Loading 100,000 entities in one transaction. The persistence context keeps all of them plus their snapshots and memory explodes. Page or stream instead, and call clear() periodically in batch jobs.`,
iq:[[`What is dirty checking?`,`At flush, Hibernate compares each managed entity with the snapshot taken when it was loaded and issues UPDATE statements for changed fields, with no explicit save call.`],
[`persist vs merge?`,`persist makes a transient instance managed (the same object). merge copies the state of a detached instance onto a managed one and returns that managed instance; the argument stays detached.`]],
quiz:[`You change a field of a managed entity inside @Transactional without calling save(). What happens?`,[`The change is ignored`,`It's saved at commit`,`It throws`,`It needs flush() to compile`],1,`Dirty checking writes the change at flush or commit.`]},

{id:`nplus1`,t:`The N+1 problem (and how to fix it)`,lvl:`A`,min:17,
eli5:`You ask a librarian for 50 books, then go back 50 separate times to ask who wrote each one. One trip for the list plus N trips for the details. Better to ask for the books with their authors in one trip.`,
body:`**N+1** happens when you load N parent rows with one query, and then touching a lazy association fires **one more query per row**.

It's the most common JPA performance bug, and it hides in loops, [[toString()]], JSON serialization and templates.

Fixes, roughly in order of preference:
- **JOIN FETCH** in JPQL: [[select c from Course c join fetch c.author]]
- **@EntityGraph** on a Spring Data method
- **DTO projections** that select exactly the columns you need
- **Batch fetching**: [[@BatchSize(size = 50)]] or [[hibernate.default_batch_fetch_size]] loads lazy data in groups using [[IN (...)]]

To detect it, turn on SQL logging in development or assert query counts in tests.`,
code:`// N+1: one query for courses, then one per course for its author
List<Course> courses = courseRepository.findAll();
courses.forEach(c -> System.out.println(c.getAuthor().getName()));

// Fix 1: fetch join
@Query("select c from Course c join fetch c.author where c.published = true")
List<Course> findPublishedWithAuthor();

// Fix 2: entity graph
@EntityGraph(attributePaths = {"author", "tags"})
List<Course> findByLevel(Level level);

// Fix 3: DTO projection: one query, only the columns you need
record CourseCard(String title, String authorName) {}

@Query("select new com.javaatlas.CourseCard(c.title, a.name) from Course c join c.author a")
List<CourseCard> findCards();`,
pro:`Fetch-joining two collections at once causes a **cartesian product** of rows, and Hibernate refuses two [[List]] bags with [[MultipleBagFetchException]]; fetch one collection per query or use batch fetching. A fetch join combined with pagination makes Hibernate paginate in memory (it logs a warning); page the ids first, then fetch by those ids. Set [[spring.jpa.properties.hibernate.default_batch_fetch_size=50]] as a safety net.`,
trap:`Switching associations to EAGER to "fix" LazyInitializationException. EAGER doesn't remove N+1; it makes it happen on every query, even where you don't need the data.`,
iq:[[`What is the N+1 select problem?`,`Loading a list with one query, then lazily loading an association for each element, which causes N extra queries. Fix it with join fetch, entity graphs, projections or batch fetching.`],
[`Why not just use FetchType.EAGER?`,`EAGER applies to every query and can't be turned off per use case. With JPQL it still loads associations through extra selects, so it often makes N+1 worse and loads data you don't need.`]],
quiz:[`Which is NOT a fix for N+1?`,[`join fetch`,`@EntityGraph`,`Switching everything to EAGER`,`@BatchSize`],2,`EAGER keeps the extra selects and forces them onto every query.`]},

{id:`tx`,t:`Transactions, propagation and locking`,lvl:`A`,min:17,
eli5:`A transaction is all or nothing, like a bank transfer: the money leaves one account and arrives in the other, or neither happens.`,
body:`Transactions are **ACID**: atomic, consistent, isolated and durable.

In Spring, [[@Transactional]] wraps a method in a transaction through a **proxy**.

Key attributes:
- **propagation**: [[REQUIRED]] (the default: join the current transaction or start one), [[REQUIRES_NEW]] (always a new, independent transaction, for example audit logs), [[MANDATORY]], [[NESTED]].
- **isolation**: [[READ_COMMITTED]] (PostgreSQL's default), [[REPEATABLE_READ]], [[SERIALIZABLE]].
- [[readOnly = true]] for queries, so Hibernate skips dirty checking.
- **rollback**: by default only on unchecked exceptions.

**Locking**:
- **Optimistic** ([[@Version]]): no database lock; a conflicting update fails with [[OptimisticLockException]]. A good default for web apps.
- **Pessimistic** ([[@Lock(PESSIMISTIC_WRITE)]], which issues [[SELECT ... FOR UPDATE]]): locks the row. Use it for hot rows such as the last seats in a batch.`,
code:`@Service
public class EnrollmentService {

    @Transactional
    public void enroll(Long studentId, Long courseId) {
        Course course = courseRepository.findByIdForUpdate(courseId);   // row locked
        if (course.getSeatsLeft() == 0) throw new SoldOutException(courseId);
        course.decrementSeats();
        enrollmentRepository.save(new Enrollment(studentId, courseId));
        auditService.log("ENROLL", studentId);   // REQUIRES_NEW: kept even if we roll back
    }
}

public interface CourseRepository extends JpaRepository<Course, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Course c where c.id = :id")
    Course findByIdForUpdate(@Param("id") Long id);
}

@Service
class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, Long userId) { /* insert audit row */ }
}`,
pro:`Because [[@Transactional]] works through a proxy, **self-invocation** (calling a transactional method from another method of the same class) bypasses it, and so do private methods. Long transactions hold database connections and locks, so never call slow external APIs inside one. The classic anomalies are dirty reads, non-repeatable reads, phantom reads and lost updates; [[@Version]] prevents lost updates even at READ_COMMITTED.`,
trap:`Calling this.saveAll() from a non-transactional method in the same bean and expecting @Transactional on saveAll to apply. The call never passes through the proxy.`,
iq:[[`Why doesn't @Transactional work on self-invocation?`,`Spring applies it through a proxy that wraps the bean. A call through this goes straight to the target object, skipping the proxy and its transaction logic.`],
[`Optimistic vs pessimistic locking?`,`Optimistic locking uses a version column and detects conflicts when updating, without database locks; good for low contention. Pessimistic locking takes row locks (SELECT FOR UPDATE) up front; good for high contention on a few rows.`]],
quiz:[`By default, @Transactional rolls back on…`,[`Any exception`,`Only checked exceptions`,`Unchecked exceptions and errors`,`Never`],2,`Checked exceptions commit unless you set rollbackFor.`]}
]}
];
