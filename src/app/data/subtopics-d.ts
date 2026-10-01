import { SubTopic } from '../core/models';

/** Subtopics for the multithreading track, Java 8 functional interfaces and every collection class. */
export const SUBTOPICS_D: Record<string, SubTopic[]> = {
  threads: [
    { id: 'process-vs-thread', t: 'Process vs thread', body: `- **Process**: a running program with its **own memory**. Processes are isolated: one crashing doesn't take others down. They talk through files, sockets or pipes, and they're expensive to create.
- **Thread**: a path of execution **inside** a process. Threads **share the process's heap** (objects) but each has its **own stack** (local variables, method calls). They're cheap to create and switch between, and they talk simply by sharing objects.

That sharing is the whole story of multithreading: it's what makes threads fast, and it's what makes them dangerous. A bug in one thread (corrupting shared data, or running out of memory) affects the whole process.`, code: `System.out.println("Process id: " + ProcessHandle.current().pid());          // Java 9+
System.out.println("Current thread: " + Thread.currentThread().getName());   // main
System.out.println("CPU cores: " + Runtime.getRuntime().availableProcessors());`, min: 9 },
    { id: 'extend-thread', t: 'Creating a thread by extending Thread', body: `The simplest way to see a thread: extend [[Thread]], put the work in [[run()]], then call [[start()]]. It works, but it uses up your one superclass and mixes "what to do" with "how it runs", so the next subtopic's [[Runnable]] is preferred.`, code: `class Downloader extends Thread {
    private final String url;
    Downloader(String url) { super("downloader"); this.url = url; }

    @Override public void run() {
        System.out.println(getName() + " downloading " + url);
    }
}

new Downloader("https://example.com/java.pdf").start();` },
    { id: 'runnable', t: 'Runnable: the task, separate from the thread', body: `[[Runnable]] is a functional interface with one method, [[void run()]]. You describe **what** to do as a Runnable and hand it to a Thread (or later, to a thread pool). Your class stays free to extend something else, and the same task can run anywhere. Give threads names: they show up in logs and thread dumps.`, code: `Runnable sendEmails = () -> System.out.println("Sending emails on " + Thread.currentThread().getName());

Thread worker = new Thread(sendEmails, "email-worker");
worker.start();                      // Sending emails on email-worker

new Thread(() -> System.out.println("Quick task")).start();   // a lambda is fine for small tasks` },
    { id: 'callable', t: 'Callable: a task that returns a result', body: `[[Callable<V>]] is like Runnable, but [[call()]] **returns a value** and **may throw** checked exceptions. A [[Thread]] can't take a Callable directly; wrap it in a [[FutureTask]] (a Runnable that also holds the result) or, in real code, submit it to an [[ExecutorService]] (the advanced lesson). [[get()]] waits for the result, and any exception thrown by the task arrives wrapped in an [[ExecutionException]].`, code: `Callable<Integer> countLines = () -> Files.readAllLines(Path.of("app.log")).size();   // may throw IOException

FutureTask<Integer> task = new FutureTask<>(countLines);
new Thread(task).start();

try {
    System.out.println("Lines: " + task.get());          // waits until the result is ready
} catch (ExecutionException e) {
    System.out.println("Failed: " + e.getCause());      // e.g. NoSuchFileException
}` },
    { id: 'lifecycle', t: 'The thread lifecycle', body: `A thread is always in one of six states ([[Thread.State]]):
- **NEW**: created, [[start()]] not called yet.
- **RUNNABLE**: running, or ready to run as soon as a CPU is free.
- **BLOCKED**: waiting to enter a [[synchronized]] block another thread holds.
- **WAITING**: waiting with no time limit, for example in [[join()]] or [[wait()]].
- **TIMED_WAITING**: waiting with a time limit, for example in [[sleep(ms)]] or [[join(ms)]].
- **TERMINATED**: [[run()]] has finished, normally or with an exception.`, code: `Thread t = new Thread(() -> {
    try { Thread.sleep(200); } catch (InterruptedException ignored) { }
});
System.out.println(t.getState());   // NEW
t.start();
Thread.sleep(50);
System.out.println(t.getState());   // TIMED_WAITING   (it's inside sleep)
t.join();
System.out.println(t.getState());   // TERMINATED` },
    { id: 'start-vs-run', t: 'start() vs run()', body: `- [[start()]] asks the JVM to create a **new thread**, which then calls [[run()]]. It returns immediately, so your code carries on in parallel.
- [[run()]] is just a normal method call on the **current** thread. Nothing runs in parallel.
- A thread can be started **only once**; calling [[start()]] again throws [[IllegalThreadStateException]].`, code: `Thread t = new Thread(() -> System.out.println("Running on " + Thread.currentThread().getName()));

t.run();      // Running on main       just an ordinary method call
t.start();    // Running on Thread-0   a new thread
// t.start(); // IllegalThreadStateException: can't start a thread twice` },
    { id: 'sleep', t: 'sleep(): pausing a thread', body: `[[Thread.sleep(ms)]] pauses the **current** thread for at least that long (the operating system may wake it slightly later).
- It **doesn't release locks**: a thread sleeping inside [[synchronized]] still blocks everyone waiting for that lock.
- It throws [[InterruptedException]] if another thread interrupts it; handle that by stopping, or by restoring the flag.
- Don't use sleep to wait for another thread to finish; that's what [[join()]] is for.`, code: `Thread.sleep(500);                         // half a second
TimeUnit.SECONDS.sleep(2);                  // more readable
Thread.sleep(Duration.ofMillis(250));       // Java 19+

// A polling loop that respects interruption:
while (!Thread.currentThread().isInterrupted()) {
    checkForNewOrders();
    try {
        Thread.sleep(1_000);
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();   // restore the flag; the loop condition ends the loop
    }
}` },
    { id: 'join', t: 'join(): waiting for a thread to finish', body: `[[t.join()]] makes the current thread wait until [[t]] has finished. [[join(ms)]] waits at most that long. Joining also guarantees you see everything the finished thread wrote, which is why it's the simple, correct way to collect results from threads.`, code: `long[] left = new long[1], right = new long[1];

Thread a = new Thread(() -> left[0] = sum(1, 500_000));
Thread b = new Thread(() -> right[0] = sum(500_001, 1_000_000));
a.start();
b.start();

a.join();                                 // wait for both halves
b.join();
System.out.println(left[0] + right[0]);   // 500000500000

static long sum(long from, long to) {
    long total = 0;
    for (long i = from; i <= to; i++) total += i;
    return total;
}` },
    { id: 'interrupt', t: 'Stopping a thread politely: interrupt()', body: `Java has no safe way to force-stop a thread: [[stop()]] was deprecated long ago, and since Java 20 it just throws [[UnsupportedOperationException]]. Instead, **ask** it: [[t.interrupt()]] sets a flag. Blocking calls such as [[sleep]], [[join]] and [[wait]] react by throwing [[InterruptedException]]; other code should check [[Thread.currentThread().isInterrupted()]] regularly. Never swallow InterruptedException silently: either stop, or call [[Thread.currentThread().interrupt()]] to keep the flag for the caller.` },
    { id: 'daemon', t: 'Daemon threads', body: `The JVM exits when all **non-daemon** (user) threads have finished. **Daemon** threads are background helpers that don't keep the JVM alive: set [[t.setDaemon(true)]] before [[start()]]. Use them for housekeeping that can be cut off at any moment (never for writing files or sending payments). Virtual threads are always daemon threads.` },
  ],

  executors: [
    { id: 'types', t: 'The ready-made thread pools', body: `- [[newFixedThreadPool(n)]]: exactly n threads and an **unbounded** queue. Predictable, but tasks can pile up.
- [[newCachedThreadPool()]]: creates threads as needed and reuses idle ones (60-second timeout). Great for many short tasks, dangerous under heavy load (no upper limit).
- [[newSingleThreadExecutor()]]: one thread, so tasks run **one at a time, in order**.
- [[newScheduledThreadPool(n)]]: runs tasks after a delay or repeatedly.
- [[newWorkStealingPool()]]: a [[ForkJoinPool]] that keeps all cores busy with many small tasks.
- [[newVirtualThreadPerTaskExecutor()]] (Java 21): a new virtual thread for every task; ideal for blocking I/O.` },
    { id: 'submit-vs-execute', t: 'submit() vs execute()', body: `[[execute(Runnable)]] returns nothing; if the task throws, the exception goes to the thread's uncaught-exception handler (usually printed). [[submit(...)]] returns a [[Future]], and any exception is **stored inside the Future**: if you never call [[get()]], the failure disappears silently. Use execute for fire-and-forget work, submit when you need the result or want to handle failures.`, code: `pool.execute(() -> { throw new IllegalStateException("boom"); });   // printed by the thread
Future<?> f = pool.submit(() -> { throw new IllegalStateException("boom"); });   // silent...
f.get();                                                            // ...until get() throws ExecutionException` },
    { id: 'future', t: 'Future: a result that arrives later', body: `A [[Future<V>]] is a handle to a result that isn't ready yet:
- [[get()]] waits for it; [[get(timeout, unit)]] waits at most that long and then throws [[TimeoutException]].
- [[isDone()]] checks without waiting.
- [[cancel(true)]] interrupts the task if it's running; [[isCancelled()]] tells you if it was.
- If the task threw, [[get()]] throws [[ExecutionException]]; the original exception is [[getCause()]].

Future can't be chained or combined; that's what [[CompletableFuture]] (next lesson) adds.` },
    { id: 'invoke', t: 'invokeAll() and invokeAny()', body: `[[invokeAll(tasks)]] runs a collection of Callables and returns their Futures once **all** have finished. [[invokeAny(tasks)]] returns the result of the **first one to succeed** and cancels the rest, handy for querying several mirrors and taking the fastest answer.`, code: `List<Callable<Integer>> lookups = List.of(
        () -> stockIn("pune"), () -> stockIn("delhi"), () -> stockIn("goa"));

int total = 0;
for (Future<Integer> f : pool.invokeAll(lookups, 5, TimeUnit.SECONDS)) {
    if (!f.isCancelled()) total += f.get();     // tasks that missed the timeout are cancelled
}

String fastest = pool.invokeAny(List.of(() -> fetchFrom("mirror-1"), () -> fetchFrom("mirror-2")));` },
    { id: 'threadpoolexecutor', t: 'ThreadPoolExecutor: the seven settings', body: `[[new ThreadPoolExecutor(core, max, keepAlive, unit, queue, threadFactory, handler)]]:
1. **corePoolSize**: threads kept alive even when idle.
2. **maximumPoolSize**: the upper limit.
3. **keepAliveTime** and **unit**: how long threads above core may stay idle.
4. **workQueue**: where waiting tasks go. Use a bounded [[ArrayBlockingQueue]] in production.
5. **threadFactory**: creates threads; use it to give them meaningful names.
6. **handler**: the rejection policy when both queue and threads are full.

A new task: start a core thread if below core → otherwise queue it → queue full: add a thread up to max → still full: reject.` },
    { id: 'rejection', t: 'Rejection policies', body: `When the queue is full and the pool is at its maximum:
- **AbortPolicy** (default): throws [[RejectedExecutionException]].
- **CallerRunsPolicy**: the thread that submitted the task runs it itself, which naturally slows producers down (simple back-pressure).
- **DiscardPolicy**: silently drops the task.
- **DiscardOldestPolicy**: drops the oldest queued task and retries.

Choose deliberately: silently dropping payments or emails is rarely acceptable.` },
    { id: 'sizing', t: 'How many threads?', body: `- **CPU-bound** work (calculations, compression): about the number of cores. More threads only add switching.
- **I/O-bound** work (HTTP calls, database queries): more, roughly **cores × (1 + wait time ÷ compute time)**. A task that waits 90 ms for every 10 ms of CPU on 8 cores suggests about 80 threads.
- Measure under realistic load, keep queues bounded, and use **separate pools** for different kinds of work, so a slow partner API can't starve everything else (the "bulkhead" idea). For lots of blocking I/O on Java 21+, virtual threads remove most of this tuning.` },
    { id: 'shutdown', t: 'Shutting down properly', body: `[[shutdown()]] stops accepting tasks and lets queued and running ones finish; [[awaitTermination()]] waits for that; [[shutdownNow()]] interrupts running tasks and returns the ones that never started. The pattern below is the one recommended in the [[ExecutorService]] documentation. Since Java 19, [[close()]] (and try-with-resources) does a graceful shutdown and waits.`, code: `pool.shutdown();
try {
    if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
        pool.shutdownNow();                     // cancel whatever is still running
    }
} catch (InterruptedException e) {
    pool.shutdownNow();
    Thread.currentThread().interrupt();
}` },
    { id: 'scheduled', t: 'Scheduled tasks', body: `[[ScheduledExecutorService]] runs tasks later or repeatedly. [[scheduleAtFixedRate]] starts runs at a fixed rhythm (every 10 minutes from the first start); [[scheduleWithFixedDelay]] waits a fixed time **after each run ends**, so slow runs never overlap. Catch exceptions inside the task: an uncaught exception silently cancels all future runs. In Spring Boot, [[@Scheduled]] does the same with less code.`, code: `ScheduledExecutorService timer = Executors.newSingleThreadScheduledExecutor();
timer.scheduleWithFixedDelay(() -> {
    try {
        refreshCache();
    } catch (Exception e) {
        log.error("Cache refresh failed", e);   // without this, one failure stops the schedule
    }
}, 0, 10, TimeUnit.MINUTES);` },
    { id: 'virtual', t: 'Virtual threads per task (Java 21)', body: `[[Executors.newVirtualThreadPerTaskExecutor()]] starts a cheap virtual thread for every task, so you can run thousands of blocking calls without sizing a pool. It's the modern default for I/O-heavy work; keep a bounded platform-thread pool (or a [[Semaphore]]) when you must limit how many calls hit a downstream system. The "Virtual threads" lesson covers this in depth.`, code: `try (ExecutorService perTask = Executors.newVirtualThreadPerTaskExecutor()) {
    for (String url : urls) perTask.submit(() -> download(url));
}   // waits for every task, then closes`, min: 21 },
  ],

  concurrent: [
    { id: 'concurrenthashmap', lab: 'chm:chm', t: 'ConcurrentHashMap in practice', body: `The thread-safe map for shared data. The key is to use its **atomic** methods instead of separate "check, then act" calls. It doesn't allow [[null]] keys or values, and its iterators never throw [[ConcurrentModificationException]]. The comparison lesson "HashMap vs ConcurrentHashMap" explains how it works inside.`, code: `ConcurrentHashMap<String, LongAdder> views = new ConcurrentHashMap<>();
views.computeIfAbsent("/learn/streams", k -> new LongAdder()).increment();   // hot counter

ConcurrentHashMap<String, Integer> stock = new ConcurrentHashMap<>();
stock.merge("pen", 10, Integer::sum);          // add 10, atomically
stock.computeIfPresent("pen", (k, qty) -> qty > 0 ? qty - 1 : null);   // returning null removes the key` },
    { id: 'countdownlatch', t: 'CountDownLatch: wait until N things have happened', body: `A latch starts at a count. Threads call [[countDown()]] when their part is done; threads calling [[await()]] block until the count reaches zero. It's **one-shot**: it can't be reset. Typical use: start serving only after several caches have warmed up. Put [[countDown()]] in a [[finally]] block, so a failing task doesn't leave everyone waiting forever.`, code: `CountDownLatch ready = new CountDownLatch(3);

for (String cache : List.of("courses", "lessons", "prices")) {
    pool.submit(() -> {
        try {
            warmUp(cache);
        } finally {
            ready.countDown();                  // always count down, even on failure
        }
    });
}

if (!ready.await(30, TimeUnit.SECONDS)) {       // wait at most 30 seconds
    log.warn("Starting before all caches were warm");
}` },
    { id: 'cyclicbarrier', t: 'CyclicBarrier: threads wait for each other', body: `A barrier makes a fixed number of threads (the "parties") **wait for each other** at a checkpoint; when the last one arrives, all continue. An optional **barrier action** runs once each time the barrier trips, and the barrier then **resets automatically**, so it suits work done in rounds. If one waiting thread is interrupted or times out, the others get [[BrokenBarrierException]].`, code: `int workers = 3;
CyclicBarrier roundDone = new CyclicBarrier(workers, () -> System.out.println("Round merged"));

for (int w = 0; w < workers; w++) {
    int id = w;
    new Thread(() -> {
        for (int round = 1; round <= 2; round++) {
            processChunk(id, round);
            try {
                roundDone.await();              // wait for the other workers
            } catch (InterruptedException | BrokenBarrierException e) {
                return;
            }
        }
    }).start();
}` },
    { id: 'semaphore', t: 'Semaphore: limit how many at once', body: `A semaphore holds a number of **permits**. [[acquire()]] takes one (waiting if none are left) and [[release()]] gives it back. Use it to cap concurrent access, for example at most 5 calls to a partner API at a time, even with hundreds of virtual threads. Always release in [[finally]]. [[tryAcquire(timeout, unit)]] gives up instead of waiting forever.`, code: `Semaphore partnerApi = new Semaphore(5);        // at most 5 calls in flight

String callPartner(String orderId) throws InterruptedException {
    if (!partnerApi.tryAcquire(2, TimeUnit.SECONDS)) {
        throw new IllegalStateException("Partner API busy, try again");
    }
    try {
        return httpCall(orderId);
    } finally {
        partnerApi.release();                   // always give the permit back
    }
}` },
    { id: 'latch-vs-barrier', t: 'CountDownLatch vs CyclicBarrier', body: `- **Who waits**: with a latch, one or more threads wait for **events** counted down by others; with a barrier, the **participating threads wait for each other**.
- **Reuse**: a latch is one-shot; a barrier resets after each round.
- **Counting**: anyone can count a latch down, even the same thread several times; a barrier needs exactly N different threads to arrive.
- **Action**: a barrier can run a barrier action each round; a latch can't.
- **Failure**: a barrier breaks for everyone if one participant fails; a latch just stays unreleased (use a timeout).

[[Phaser]] combines both ideas and allows parties to join and leave.` },
    { id: 'blockingqueue', lab: 'blockingqueue', t: 'BlockingQueue: producers and consumers', body: `A [[BlockingQueue]] hands work from producer threads to consumer threads: [[put()]] waits when the queue is full, [[take()]] waits when it's empty, so neither side needs manual locking. A bounded [[ArrayBlockingQueue]] also gives back-pressure: fast producers are slowed down instead of filling memory. A special "poison pill" item is a simple way to tell consumers to stop.`, code: `BlockingQueue<String> emails = new ArrayBlockingQueue<>(100);

Thread producer = new Thread(() -> {
    try {
        for (String user : users) emails.put(user);   // waits if 100 are already queued
        emails.put("STOP");                           // poison pill
    } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
});

Thread consumer = new Thread(() -> {
    try {
        for (String user; !(user = emails.take()).equals("STOP"); ) sendWelcomeEmail(user);
    } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
});` },
  ],

  lambdas: [
    { id: 'syntax', t: 'Lambda syntax', body: `A lambda is a short anonymous function: parameters, an arrow, then an expression or a block. Parameter types are usually inferred from where the lambda is used.`, code: `Runnable hello = () -> System.out.println("Hi");                        // no parameters
Function<Integer, Integer> square = x -> x * x;                         // one parameter: no brackets needed
Comparator<String> byLength = (a, b) -> Integer.compare(a.length(), b.length());   // two parameters
BinaryOperator<Integer> add = (a, b) -> {                               // a block needs return
    int sum = a + b;
    return sum;
};` },
    { id: 'functional-interfaces', t: 'Functional interfaces', body: `A lambda needs a **target type**: an interface with exactly **one abstract method** (default and static methods don't count). [[@FunctionalInterface]] makes the compiler check that. [[java.util.function]] has ready-made ones, so you rarely write your own:
- [[Predicate<T>]]: T → boolean (test)
- [[Consumer<T>]]: T → nothing (accept)
- [[Supplier<T>]]: nothing → T (get)
- [[Function<T, R>]]: T → R (apply)
- [[BiFunction<T, U, R>]]: (T, U) → R, plus [[BiConsumer]] and [[BiPredicate]]
- [[UnaryOperator<T>]] and [[BinaryOperator<T>]]: same type in and out
- Primitive versions such as [[IntPredicate]], [[ToIntFunction]] and [[IntBinaryOperator]] avoid boxing.

The next subtopics show each of the main ones doing real work.`, code: `@FunctionalInterface
interface DiscountRule {
    double apply(double price);                     // exactly one abstract method
    default DiscountRule then(DiscountRule next) {  // defaults are allowed
        return p -> next.apply(apply(p));
    }
}

DiscountRule festival = p -> p * 0.9;
DiscountRule coupon = p -> p - 100;
System.out.println(festival.then(coupon).apply(1000));   // 800.0` },
    { id: 'predicate', t: 'Predicate: yes-or-no rules', body: `[[Predicate<T>]] has [[boolean test(T t)]]. Use it for **rules and filters**: validation, search filters, feature flags. Predicates combine with [[and]], [[or]] and [[negate]], and [[Predicate.not]] (Java 11) reads nicely with method references. [[stream.filter]], [[removeIf]] and [[Optional.filter]] all take one.`, code: `record Order(String id, double amount, boolean paid, String city) {}

Predicate<Order> isPaid = Order::paid;
Predicate<Order> isBig = o -> o.amount() > 5_000;
Predicate<Order> inPune = o -> o.city().equals("Pune");

List<Order> vip = orders.stream()
        .filter(isPaid.and(isBig).or(inPune))       // paid AND big, OR anything in Pune
        .toList();

List<Order> open = new ArrayList<>(orders);
open.removeIf(isPaid);                                // keep only unpaid orders
List<String> filled = names.stream().filter(Predicate.not(String::isBlank)).toList();   // Java 11`, min: 16 },
    { id: 'consumer', t: 'Consumer: do something with each item', body: `[[Consumer<T>]] has [[void accept(T t)]]: it takes a value and returns nothing. Use it for **side effects**: sending, saving, printing, logging. [[andThen]] chains consumers. [[forEach]] takes a Consumer, and [[Map.forEach]] takes a [[BiConsumer]] (key and value).`, code: `Consumer<String> sendWelcome = email -> System.out.println("Welcome email to " + email);
Consumer<String> audit = email -> System.out.println("Audit: emailed " + email);

List.of("asha@example.com", "ravi@example.com")
        .forEach(sendWelcome.andThen(audit));        // both, in order, for each address

Map.of("java", 3, "sql", 1)
        .forEach((course, seats) -> System.out.println(course + ": " + seats + " seats left"));   // BiConsumer` },
    { id: 'supplier', t: 'Supplier: create or fetch a value when needed', body: `[[Supplier<T>]] has [[T get()]]: no input, one result. Its superpower is **laziness**: the code inside runs only when (and if) someone calls [[get()]]. Use it for defaults that are expensive to compute, factories, and log messages that are costly to build.`, code: `Supplier<LocalDateTime> now = LocalDateTime::now;
Supplier<List<String>> newList = ArrayList::new;                 // a factory

String name = Optional.ofNullable(input)
        .orElseGet(() -> loadDefaultNameFromDatabase());           // runs ONLY if input is null
// orElse(loadDefaultNameFromDatabase()) would run the query every time

Logger log = Logger.getLogger("orders");
log.fine(() -> "Order dump: " + expensiveDump(order));           // built only if FINE is enabled

ThreadLocal<SimpleDateFormat> fmt = ThreadLocal.withInitial(() -> new SimpleDateFormat("dd-MM-yyyy"));` },
    { id: 'function', t: 'Function: transform one thing into another', body: `[[Function<T, R>]] has [[R apply(T t)]]: one input, one output. It's the workhorse for **mapping**: entities to DTOs, strings to numbers, raw input to clean input. [[andThen]] runs another function after it; [[compose]] runs one before it; [[Function.identity()]] returns its input. [[stream.map]] and [[Map.computeIfAbsent]] take Functions.`, code: `record User(String name, String email) {}
record UserDto(String name) {}

Function<User, UserDto> toDto = u -> new UserDto(u.name());
List<UserDto> dtos = users.stream().map(toDto).toList();

Function<String, String> clean = String::strip;
Function<String, Integer> parse = clean.andThen(Integer::parseInt);   // strip, then parse
System.out.println(parse.apply("  42 "));                             // 42

Map<String, List<String>> byCity = new HashMap<>();
byCity.computeIfAbsent("Pune", city -> new ArrayList<>()).add("Asha");   // Function<String, List<String>>`, min: 16 },
    { id: 'bifunction', t: 'BiFunction: combine two inputs into a result', body: `[[BiFunction<T, U, R>]] has [[R apply(T t, U u)]]: two inputs, one output. Use it for **calculations and merges**: price with tax, combining two objects, resolving conflicts. [[Map.merge]], [[compute]] and [[replaceAll]] take one. When both inputs and the output share a type, [[BinaryOperator<T>]] is the shorter name.`, code: `BiFunction<Double, Double, Double> withGst = (price, rate) -> price * (1 + rate);
System.out.println(withGst.apply(1000.0, 0.18));                    // 1180.0

BiFunction<Double, Double, String> label = withGst.andThen(p -> "₹" + Math.round(p));
System.out.println(label.apply(1000.0, 0.18));                       // ₹1180

Map<String, Integer> stock = new HashMap<>(Map.of("pen", 10));
stock.merge("pen", 5, Integer::sum);                                 // 15: BinaryOperator<Integer>
stock.compute("pen", (item, qty) -> qty == null ? 1 : qty - 1);      // 14
stock.replaceAll((item, qty) -> qty * 2);                            // 28` },
    { id: 'method-references', t: 'Method references', body: `When a lambda only calls an existing method, a method reference is shorter and clearer. There are four kinds:
1. Static method: [[Integer::parseInt]] (same as [[s -> Integer.parseInt(s)]])
2. Method of a particular object: [[System.out::println]]
3. Method of any object of a type: [[String::toUpperCase]] (same as [[s -> s.toUpperCase()]])
4. Constructor: [[ArrayList::new]]`, code: `List<Integer> ids = texts.stream().map(Integer::parseInt).toList();
names.forEach(System.out::println);
List<String> upper = names.stream().map(String::toUpperCase).toList();
Supplier<Set<String>> freshSet = HashSet::new;`, min: 16 },
    { id: 'capture', t: 'Capturing variables', body: `A lambda can use local variables from the enclosing method only if they're **effectively final** (never reassigned after being set). Inside a lambda, [[this]] means the enclosing object, unlike inside an anonymous class.`, code: `int limit = 100;                        // effectively final
orders.removeIf(o -> o.amount() > limit);
// limit = 200;                         // would make the lambda above a compile error` },
    { id: 'where', t: 'Where lambdas show up every day', body: `Collections ([[forEach]], [[removeIf]], [[replaceAll]], [[sort]], [[computeIfAbsent]], [[merge]]), streams ([[filter]], [[map]], [[collect]]), [[Optional]] ([[map]], [[orElseGet]]), [[CompletableFuture]] ([[thenApply]], [[thenAccept]]), executors ([[submit]]), comparators ([[Comparator.comparing]]) and framework callbacks. Once Predicate, Consumer, Supplier and Function feel natural, most modern Java reads like plain English.` },
  ],

  'lists-sets-queues': [
    { id: 'arraylist', lab: 'array:arraylist', t: 'ArrayList', body: `A resizable array: the **default List**. Fast index access (O(1)), fast appends (O(1) on average), slower inserts and removals in the middle (O(n)). Not thread-safe. Use it unless you have a specific reason not to.`, code: `List<String> courses = new ArrayList<>(List.of("Java", "Spring"));
courses.add("Docker");
courses.add(1, "SQL");                 // [Java, SQL, Spring, Docker]
courses.set(0, "Java 25");
courses.remove("Spring");
System.out.println(courses.get(1));    // SQL` },
    { id: 'linkedlist', lab: 'linkedlist', t: 'LinkedList', body: `A doubly linked list that implements both [[List]] and [[Deque]]. Adding or removing at either end is O(1), but reaching an index is O(n), and each element carries extra memory. In practice it's rarely the best choice; see "ArrayList vs LinkedList".`, code: `LinkedList<String> history = new LinkedList<>();
history.addFirst("/learn/streams");
history.addFirst("/learn/lambdas");
history.removeLast();                  // O(1) at either end
System.out.println(history.getFirst());   // /learn/lambdas` },
    { id: 'vector', lab: 'array:vector', t: 'Vector (legacy)', body: `The Java 1.0 ancestor of ArrayList. **Every method is synchronized**, so it's slower even in single-threaded code, and it grows by doubling. Its synchronization doesn't make multi-step operations safe either. Use [[ArrayList]], and for shared lists use [[CopyOnWriteArrayList]] (read-mostly) or [[Collections.synchronizedList]] with care.` },
    { id: 'stack', lab: 'deque:stack', t: 'Stack (legacy)', body: `A last-in, first-out stack with [[push]], [[pop]] and [[peek]]. It extends [[Vector]], so it's synchronized and also exposes list methods like [[add(index, e)]], letting code break the stack's rules. The Javadoc itself recommends [[Deque]] instead: [[ArrayDeque]] has the same [[push]]/[[pop]]/[[peek]] and is faster.`, code: `Deque<String> undo = new ArrayDeque<>();   // use this instead of Stack
undo.push("typed 'Hello'");
undo.push("made it bold");
System.out.println(undo.pop());            // made it bold   (last in, first out)
System.out.println(undo.peek());           // typed 'Hello'` },
    { id: 'hashset', lab: 'hashmap:set', t: 'HashSet', body: `Unique elements with **no order**, backed by a [[HashMap]]. [[add]], [[contains]] and [[remove]] are O(1) on average, which makes it the go-to for "have I seen this before?". Elements need correct [[equals()]] and [[hashCode()]].`, code: `Set<String> seenEmails = new HashSet<>();
for (String email : signups) {
    if (!seenEmails.add(email.toLowerCase())) {     // add() returns false for duplicates
        System.out.println("Duplicate sign-up: " + email);
    }
}` },
    { id: 'linkedhashset', lab: 'linkedhashmap:insertion', t: 'LinkedHashSet', body: `A HashSet that also remembers **insertion order**. Nearly as fast, a little more memory. The easiest way to remove duplicates while keeping the original order.`, code: `List<String> tags = List.of("java", "spring", "java", "sql", "spring");
Set<String> unique = new LinkedHashSet<>(tags);
System.out.println(unique);            // [java, spring, sql]   first-seen order kept` },
    { id: 'treeset', lab: 'tree:set', t: 'TreeSet', body: `Unique elements kept **sorted**, backed by a red-black tree ([[TreeMap]]). Operations are O(log n). Adds navigation methods: [[first]], [[last]], [[floor]], [[ceiling]], [[headSet]], [[tailSet]], [[descendingSet]]. Uniqueness comes from [[compareTo()]] or your [[Comparator]].`, code: `TreeSet<Integer> scores = new TreeSet<>(List.of(72, 95, 88, 60));
scores.first();            // 60
scores.ceiling(80);        // 88    smallest score >= 80
scores.headSet(88);        // [60, 72]
scores.descendingSet();    // [95, 88, 72, 60]` },
    { id: 'priorityqueue', lab: 'heap', t: 'PriorityQueue', body: `A queue that always hands out the **smallest element first** (natural order or a Comparator), implemented as a binary heap. [[offer]] and [[poll]] are O(log n), [[peek]] is O(1). Great for scheduling by priority and "top k" problems. Two catches: **iterating it isn't sorted** (only [[poll]] order is), and it isn't thread-safe ([[PriorityBlockingQueue]] is).`, code: `record Task(String name, int priority) {}
PriorityQueue<Task> tasks = new PriorityQueue<>(Comparator.comparingInt(Task::priority));
tasks.offer(new Task("send newsletter", 3));
tasks.offer(new Task("fix payment bug", 1));
tasks.offer(new Task("update docs", 2));

while (!tasks.isEmpty()) System.out.println(tasks.poll().name());
// fix payment bug, update docs, send newsletter`, min: 16 },
    { id: 'arraydeque', lab: 'deque:queue', t: 'ArrayDeque', body: `A resizable circular array usable as a **stack** ([[push]], [[pop]]) or a **queue** ([[offer]], [[poll]]), with O(1) operations at both ends. Faster than [[Stack]] and usually faster than [[LinkedList]]. It doesn't allow [[null]].`, code: `Deque<String> queue = new ArrayDeque<>();
queue.offer("Asha");                   // join at the back
queue.offer("Ravi");
System.out.println(queue.poll());      // Asha   first in, first out

Deque<Character> brackets = new ArrayDeque<>();   // as a stack: check balanced brackets
for (char c : "(a[b]c)".toCharArray()) {
    if (c == '(' || c == '[') brackets.push(c);
    else if (c == ')' || c == ']') brackets.pop();
}` },
    { id: 'blockingqueue', lab: 'blockingqueue', t: 'BlockingQueue', body: `A thread-safe queue whose [[put()]] waits when it's full and [[take()]] waits when it's empty: the standard tool for handing work between threads. Implementations: [[ArrayBlockingQueue]] (bounded array), [[LinkedBlockingQueue]] (optionally bounded), [[PriorityBlockingQueue]], [[DelayQueue]] (items become available after a delay) and [[SynchronousQueue]] (a direct hand-off with no storage). The concurrency lesson shows a full producer-consumer example.`, code: `BlockingQueue<String> jobs = new LinkedBlockingQueue<>(1_000);
jobs.put("resize-image-42");                          // waits if full
String job = jobs.poll(2, TimeUnit.SECONDS);          // waits up to 2 s, then returns null` },
  ],

  maps: [
    { id: 'hashmap', lab: 'hashmap:fruits', t: 'HashMap', body: `The default map: keys to values with O(1) average operations, **no order**, one [[null]] key allowed, not thread-safe. Learn the Java 8 methods: they replace most "check, then put" code. The "HashMap internals" stage explains exactly how it works.`, code: `Map<String, Integer> seats = new HashMap<>();
seats.put("java", 30);
seats.getOrDefault("go", 0);                         // 0
seats.putIfAbsent("sql", 20);
seats.merge("java", -1, Integer::sum);               // 29: book one seat
seats.computeIfAbsent("docker", k -> loadSeats(k));  // load only if missing
for (Map.Entry<String, Integer> e : seats.entrySet()) {
    System.out.println(e.getKey() + " -> " + e.getValue());
}` },
    { id: 'linkedhashmap', lab: 'linkedhashmap:lru', t: 'LinkedHashMap', body: `A HashMap that remembers **insertion order** (or **access order**, for LRU caches). Use it when the order of keys matters, for example building JSON responses or showing "recently viewed" items. "HashMap vs LinkedHashMap" shows the LRU cache.`, code: `Map<String, Object> json = new LinkedHashMap<>();
json.put("id", 101);
json.put("title", "Streams");
json.put("minutes", 12);
System.out.println(json);     // {id=101, title=Streams, minutes=12}   always in this order` },
    { id: 'treemap', lab: 'tree:map', t: 'TreeMap', body: `Keys kept **sorted** (natural order or a Comparator), stored in a red-black tree, so operations are O(log n). Its navigation methods make range questions easy: [[firstKey]], [[lastKey]], [[floorKey]], [[ceilingEntry]], [[headMap]], [[tailMap]] and [[subMap]]. No [[null]] keys with natural ordering.`, code: `TreeMap<Integer, String> grades = new TreeMap<>(Map.of(90, "A", 75, "B", 60, "C", 0, "F"));

System.out.println(grades.floorEntry(82).getValue());   // B   the highest threshold <= 82
System.out.println(grades.floorEntry(95).getValue());   // A
System.out.println(grades.headMap(75));                 // {0=F, 60=C}   keys below 75
System.out.println(grades.descendingMap());             // {90=A, 75=B, 60=C, 0=F}` },
    { id: 'hashtable', lab: 'chm:hashtable', t: 'Hashtable (legacy)', body: `The Java 1.0 map: every method synchronized, no [[null]] keys or values, older [[Enumeration]] API. It's kept only for old code. Use [[HashMap]] in single-threaded code and [[ConcurrentHashMap]] when threads share the map; see "HashMap vs Hashtable".` },
    { id: 'concurrenthashmap', lab: 'chm:chm', t: 'ConcurrentHashMap', body: `The map to use when several threads read and write. Reads don't lock, writes lock only one bucket, and [[putIfAbsent]], [[computeIfAbsent]], [[compute]] and [[merge]] are **atomic**. No [[null]] keys or values. See "HashMap vs ConcurrentHashMap" for how it works.`, code: `Map<String, Integer> activeUsers = new ConcurrentHashMap<>();
activeUsers.merge("/learn/streams", 1, Integer::sum);                      // safe from any thread
activeUsers.computeIfPresent("/learn/streams", (page, n) -> n > 1 ? n - 1 : null);   // null removes` },
  ],
};
