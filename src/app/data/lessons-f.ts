import { Lesson } from '../core/models';

/** Lessons that complete the curriculum. Their place in the course is set in data/curriculum.ts. */
export const MORE_LESSONS: Lesson[] = [
{id:`access-modifiers`,diagram:`access-modifiers`,t:`Access modifiers: private, package-private, protected and public`,lvl:`B`,min:8,
eli5:`Think of a house. Your diary is private (only you), the kitchen is for the family (your package), the garden is open to relatives who visit (subclasses), and the front door has your address for everyone (public).`,
body:`Access modifiers decide **which code can use** a class, field, method or constructor. They're how a class protects its rules: outside code can only touch what you deliberately expose.
- **private**: only inside the same class. Use it for fields almost always.
- **package-private** (no keyword): any class in the same package.
- **protected**: the same package, plus subclasses in other packages (through inheritance).
- **public**: any code anywhere.

Rules of thumb:
- Make fields **private** and expose behaviour through methods. That's encapsulation.
- Start with the **most restrictive** level that works, and widen it only when needed. Narrowing it later breaks other people's code.
- A top-level class can only be **public** or **package-private**; nested classes can use all four.
- An overriding method can keep or **widen** the access level, never narrow it.`,
vs:{a:`Who can access it`,b:`Typical use`,rows:[
[`private`,`The same class`,`Fields, helper methods`],
[`(none) package-private`,`+ every class in the same package`,`Implementation classes inside a feature package`],
[`protected`,`+ subclasses in other packages`,`Extension points of a class designed to be extended`],
[`public`,`+ everyone (in exported packages, with modules)`,`The API other code is meant to use`],
]},
code:`package com.shop.model;

public class Product {                         // public: usable from any package
    private final String sku;                  // private: only Product can touch it
    private long pricePaise;
    String category;                           // package-private: classes in com.shop.model only
    protected int stock;                       // protected: package + subclasses elsewhere

    public Product(String sku, long pricePaise) {
        this.sku = sku;
        setPrice(pricePaise);
    }

    public long price() { return pricePaise; }          // read access through a method

    public void setPrice(long pricePaise) {              // the class enforces its own rule
        if (pricePaise < 0) throw new IllegalArgumentException("Price can't be negative");
        this.pricePaise = pricePaise;
    }

    private String normalise(String s) { return s.trim().toUpperCase(); }   // internal helper
}`,
more:[{cap:`The protected surprise`,lang:`java`,src:`package com.shop.digital;
import com.shop.model.Product;

public class Ebook extends Product {
    public Ebook(String sku) { super(sku, 49900); }

    void restock(Ebook other, Product plain) {
        this.stock = 100;      // OK: inherited, accessed through this subclass
        other.stock = 5;       // OK: through an Ebook reference
        // plain.stock = 5;    // compile error: a different package may only use protected members
        //                        through its own subclass type, not through any Product
    }
}`}],
pro:`Java 9 modules add a layer above all of this: a public class is only visible outside its module if its package is exported in module-info.java. Interfaces are public by design: their abstract, default and static methods are implicitly public, and since Java 9 they can have private helper methods. Reflection can bypass access checks with setAccessible(true), but strong encapsulation of the JDK (Java 16+) blocks that for JDK internals.`,
trap:`Making fields public "to save writing getters". Every caller can then put the object into an invalid state, and you can never add validation later without breaking them.`,
iq:[[`What is the difference between protected and package-private?`,`Package-private members are visible only within the same package. protected adds subclasses in other packages, which can use the member through inheritance (via this or their own subclass type).`],
[`Can an overriding method reduce visibility?`,`No. It may keep or widen it (protected to public, for example), because code using the parent type must still be able to call the method.`]],
quiz:[`A field has no access modifier. Who can access it?`,[`Only its class`,`Classes in the same package`,`Subclasses anywhere`,`Everyone`],1,`No modifier means package-private: visible to classes in the same package.`]},

{id:`forkjoin`,diagram:`fork-join`,t:`Fork/Join framework and parallel streams`,lvl:`A`,min:16,
eli5:`To count all the books in a huge library, split the job: you take the left half, a friend takes the right half, and each of you splits again until every person has one shelf. Then you add the counts back up.`,
body:`The **Fork/Join framework** (Java 7) runs divide-and-conquer work on all CPU cores:
- Write a **RecursiveTask<V>** (returns a value) or **RecursiveAction** (no value) with a **compute()** method.
- If the task is small enough (below a **threshold**), compute it directly. Otherwise **split** it, **fork()** one half, compute the other, and **join()** the results.
- A **ForkJoinPool** runs the tasks. Each worker has its own queue, and idle workers **steal** tasks from busy ones, so all cores stay busy.

**Parallel streams** use the same machinery: list.parallelStream() or stream.parallel() splits the source and processes the pieces in the shared **ForkJoinPool.commonPool()** (one worker fewer than the number of cores).

Parallel isn't automatically faster. It helps for **large**, **CPU-bound** work on sources that split cheaply (arrays, ArrayList, IntStream.range) with **independent, stateless** operations. It hurts for small inputs, LinkedList or I/O sources, blocking calls and anything that shares mutable state.`,
code:`class SumTask extends RecursiveTask<Long> {
    private static final int THRESHOLD = 10_000;
    private final long[] numbers;
    private final int from, to;

    SumTask(long[] numbers, int from, int to) {
        this.numbers = numbers; this.from = from; this.to = to;
    }

    @Override
    protected Long compute() {
        if (to - from <= THRESHOLD) {                 // small enough: just loop
            long sum = 0;
            for (int i = from; i < to; i++) sum += numbers[i];
            return sum;
        }
        int mid = (from + to) >>> 1;
        SumTask left = new SumTask(numbers, from, mid);
        SumTask right = new SumTask(numbers, mid, to);
        left.fork();                                  // run the left half asynchronously
        long rightSum = right.compute();              // do the right half in this thread
        return left.join() + rightSum;                // wait for (or help with) the left half
    }
}

long[] data = LongStream.rangeClosed(1, 10_000_000).toArray();
long total = ForkJoinPool.commonPool().invoke(new SumTask(data, 0, data.length));   // 50000005000000
long same = LongStream.rangeClosed(1, 10_000_000).parallel().sum();                  // same result`,
more:[{cap:`Parallel stream pitfalls`,lang:`java`,src:`List<Integer> results = new ArrayList<>();
IntStream.range(0, 1_000).parallel().forEach(results::add);   // WRONG: ArrayList isn't thread-safe
List<Integer> safe = IntStream.range(0, 1_000).parallel().boxed().toList();   // let the stream collect

orders.parallelStream().map(o -> callPaymentApi(o)).toList();   // blocking calls clog the shared common pool
names.parallelStream().findFirst();     // order-preserving: slower than findAny() in parallel`}],
pro:`Measure before parallelising, ideally with JMH, because splitting, scheduling and merging have real costs. Order matters: findFirst, forEachOrdered and limit force ordering work that findAny, forEach and unordered() avoid. Since every parallel stream in the JVM shares the common pool, one slow or blocking task can starve all the others; for blocking I/O use virtual threads or a dedicated executor instead.`,
trap:`Adding .parallel() to make code faster without measuring. For small collections or blocking work it's usually slower, and with shared mutable state it's wrong.`,
iq:[[`What is work stealing in ForkJoinPool?`,`Each worker thread keeps a deque of tasks. It takes its own work from one end, and idle workers steal tasks from the other end of busy workers' deques, which balances load without central coordination.`],
[`When should you not use a parallel stream?`,`For small data, for sources that split poorly (LinkedList, I/O), for blocking operations, when operations have side effects on shared state, or when order-dependent operations dominate.`]],
quiz:[`Which pool runs parallel streams by default?`,[`A new thread per element`,`ForkJoinPool.commonPool()`,`Executors.newCachedThreadPool()`,`The main thread only`],1,`Parallel streams use the shared common ForkJoinPool.`]},

{id:`serialization`,diagram:`serialization-flow`,t:`Serialization: Serializable, transient and safer alternatives`,lvl:`I`,min:16,
eli5:`Serialization is packing a toy into a box with instructions so it can be posted and rebuilt somewhere else. transient marks the parts you deliberately leave out of the box.`,
body:`**Serialization** turns an object into bytes (to save to a file or send over a network); **deserialization** turns the bytes back into an object.
- A class opts in by implementing the marker interface **Serializable**.
- **ObjectOutputStream.writeObject()** writes the object and everything it references; **ObjectInputStream.readObject()** rebuilds it.
- **transient** fields are skipped (passwords, caches, connections) and come back as default values. **static** fields aren't serialized either.
- **serialVersionUID** identifies the class version. If the stored ID doesn't match the class, deserialization fails with **InvalidClassException**, so declare it explicitly.
- The class's own constructors **don't run** during deserialization.

Java serialization is now considered **risky and legacy**: deserializing untrusted bytes can run attacker-controlled code ("gadget chains"). For new code prefer **JSON** (Jackson), Protocol Buffers or another explicit format. If you must use it, install a deserialization filter (**ObjectInputFilter**).`,
code:`record Address(String city, String pin) implements Serializable {}

class User implements Serializable {
    @Serial private static final long serialVersionUID = 1L;   // @Serial: Java 14+

    private final String email;
    private final Address address;                    // must be Serializable too
    private transient String sessionToken;            // never written

    User(String email, Address address, String token) {
        this.email = email; this.address = address; this.sessionToken = token;
    }
}

User asha = new User("asha@example.com", new Address("Pune", "411001"), "secret-123");

try (var out = new ObjectOutputStream(new FileOutputStream("user.bin"))) {
    out.writeObject(asha);
}

try (var in = new ObjectInputStream(new FileInputStream("user.bin"))) {
    in.setObjectInputFilter(ObjectInputFilter.Config.createFilter("com.shop.*;java.base/*;!*"));   // allow-list
    User copy = (User) in.readObject();               // sessionToken is null in the copy
}`,
pro:`Records serialize more safely than ordinary classes: deserialization goes through the canonical constructor, so its validation runs. Externalizable gives full manual control. In distributed systems, a stable, versioned schema (JSON with explicit fields, Avro, Protobuf) avoids the tight coupling of Java serialization, where renaming a private field can break stored data.`,
trap:`Deserializing data from users, files or the network with a plain ObjectInputStream. That has been the root cause of many remote-code-execution vulnerabilities.`,
iq:[[`What does transient do?`,`It excludes a field from Java serialization; after deserialization the field holds its default value (null, 0 or false).`],
[`Why declare serialVersionUID?`,`Without it, the JVM computes one from the class structure, so harmless changes (adding a method) can make previously serialized data unreadable. An explicit value keeps compatible versions working.`]],
quiz:[`Which field is NOT written by ObjectOutputStream?`,[`private String name`,`transient String token`,`final int id`,`List<String> tags`],1,`transient fields are skipped (as are static fields).`]},

{id:`reflection`,diagram:`reflection-map`,t:`Reflection: how frameworks read your classes`,lvl:`A`,min:16,
eli5:`Reflection is a program reading its own blueprint while it runs: "what fields does this class have, what methods, what labels are stuck on them?", and then using them.`,
body:`**Reflection** lets code inspect and use classes at run time, without knowing them at compile time.
- Get a **Class** object: obj.getClass(), Order.class or Class.forName("com.shop.Order").
- Inspect it: **getDeclaredFields()**, **getDeclaredMethods()**, **getDeclaredConstructors()**, **getAnnotation()**, getSuperclass(), isRecord().
- Use it: **field.get/set**, **method.invoke**, **constructor.newInstance**. Private members need **setAccessible(true)**.

This is how frameworks work without you writing glue code: Spring creates and injects beans, JUnit finds @Test methods, Jackson maps JSON to fields, Hibernate reads @Entity classes, and validation reads @NotBlank.

In your own application code, prefer normal method calls: reflection is slower, skips compile-time checks, breaks with refactoring and can bypass encapsulation.`,
code:`@Retention(RetentionPolicy.RUNTIME)          // keep the annotation available at run time
@Target(ElementType.FIELD)
@interface NotBlank {}

record Signup(@NotBlank String name, @NotBlank String email, String referralCode) {}

static List<String> validate(Object target) throws IllegalAccessException {
    List<String> errors = new ArrayList<>();
    for (Field field : target.getClass().getDeclaredFields()) {
        if (field.isAnnotationPresent(NotBlank.class)) {
            field.setAccessible(true);                    // fields of a record are private
            Object value = field.get(target);
            if (value == null || value.toString().isBlank()) {
                errors.add(field.getName() + " must not be blank");
            }
        }
    }
    return errors;
}

System.out.println(validate(new Signup("Asha", " ", null)));   // [email must not be blank]`,
more:[{cap:`Calling a method by name, and creating an object without new`,lang:`java`,src:`Class<?> type = Class.forName("java.util.ArrayList");
Object list = type.getDeclaredConstructor().newInstance();       // like new ArrayList<>()
Method add = type.getMethod("add", Object.class);
add.invoke(list, "hello");
System.out.println(list);                                        // [hello]`}],
pro:`For annotations to be visible to reflection they need @Retention(RUNTIME); the default (CLASS) keeps them in the .class file but not at run time. Since Java 16 the JDK's internals are strongly encapsulated, so setAccessible(true) on JDK private members throws InaccessibleObjectException unless the module is explicitly opened. MethodHandles (java.lang.invoke) are a faster, safer alternative for dynamic calls, and frameworks increasingly generate code at build time instead of reflecting at startup (for faster startup and native images).`,
trap:`Using reflection to reach private internals of libraries. It breaks on upgrades and is blocked for JDK classes by strong encapsulation.`,
iq:[[`How does Spring use reflection?`,`It scans for annotated classes, creates beans through their constructors, injects dependencies, reads annotations such as @Transactional and @GetMapping, and creates proxies, all using reflection (plus bytecode generation).`],
[`Why must an annotation have @Retention(RUNTIME) to be read by reflection?`,`Annotations with SOURCE retention are discarded by the compiler and CLASS retention ones are not loaded at run time; only RUNTIME annotations are available through getAnnotation().`]],
quiz:[`Which call reads a private field's value via reflection?`,[`field.invoke(obj)`,`field.setAccessible(true); field.get(obj)`,`obj.getField()`,`Class.forName(field)`],1,`Make it accessible, then call get() with the target object.`]},

{id:`modern-features`,diagram:`java-timeline`,t:`Java 10 to 25: the language features that matter`,lvl:`I`,min:25,
eli5:`Java gets a new release every six months. Most add small conveniences; every two years a long-term-support release bundles them up. This lesson is the highlights reel.`,
body:`Modern Java reads very differently from Java 8. The features you'll use most, in order:
- **var** (10): local type inference, var list = new ArrayList<String>();
- **HTTP client** (11): java.net.http.HttpClient for HTTP/1.1 and HTTP/2.
- **Switch expressions** (14): case X -> value; a switch that returns a value, with no fall-through.
- **Text blocks** (15): multi-line strings between triple quotes, for JSON and SQL.
- **Records** (16): immutable data classes in one line.
- **Pattern matching for instanceof** (16): if (o instanceof String s) ...
- **Sealed classes and interfaces** (17): a closed set of subtypes the compiler knows about.
- **Pattern matching for switch and record patterns** (21): switch over types and deconstruct records.
- **Virtual threads** (21): millions of cheap threads for blocking I/O.
- **Sequenced collections** (21): getFirst(), getLast(), reversed() on lists, deques and ordered sets and maps.
- **Unnamed variables** (22): _ for values you don't need.
- **Stream gatherers** (24): custom intermediate stream operations.
- **Java 25**: compact source files with an instance main method (void main()), scoped values, flexible constructor bodies and module import declarations.

The long-term-support releases (11, 17, 21, 25) are what most companies run. The example below combines several of these features.`,
code:`sealed interface Payment permits Card, Upi, Wallet {}            // Java 17: closed hierarchy
record Card(String last4, long amountPaise) implements Payment {}  // Java 16: records
record Upi(String vpa, long amountPaise) implements Payment {}
record Wallet(String provider, long amountPaise) implements Payment {}

static String describe(Payment p) {
    return switch (p) {                                            // Java 21: pattern matching for switch
        case Card(var last4, var amount) -> "Card ****" + last4 + ": " + amount / 100;   // record patterns
        case Upi(String vpa, long amount) when amount > 100_000_00 -> "Large UPI payment from " + vpa;
        case Upi u -> "UPI " + u.vpa();
        case Wallet(var provider, _) -> "Wallet: " + provider;    // Java 22: unnamed pattern
    };                                                             // no default: the compiler knows every case
}

var receipt = """
        {
          "status": "paid",
          "summary": "%s"
        }
        """.formatted(describe(new Card("4242", 249900)));         // Java 15: text blocks`,
more:[{cap:`Java 25: a complete program in a compact source file (run it with: java Hello.java)`,lang:`java`,src:`void main() {
    String name = IO.readln("Your name? ");
    IO.println("Hello, " + name + "!");
}`}],
pro:`Upgrade paths usually go LTS to LTS: the biggest jumps are 8 to 11 (modules, removed Java EE packages) and anything to 21 (virtual threads change how you size thread pools). Preview features need --enable-preview and can change between releases, so keep them out of production code. Use the "Java versions" pages on this site for a release-by-release list.`,
trap:`Using var everywhere, including where the type isn't obvious (var data = service.load();). Use it when the right-hand side makes the type clear.`,
iq:[[`What do sealed classes add to pattern matching?`,`Because the compiler knows every permitted subtype, a switch over a sealed type can be exhaustive without a default branch, and adding a new subtype makes every incomplete switch a compile error.`],
[`Which recent Java versions are LTS releases?`,`Java 11, 17, 21 and 25 (and Java 8 before them). Most companies standardise on one of these.`]],
quiz:[`Which Java version made virtual threads a standard feature?`,[`Java 17`,`Java 19`,`Java 21`,`Java 25`],2,`Virtual threads were finalised in Java 21 (JEP 444).`]},

{id:`structural`,diagram:`decorator-wrapping`,t:`Design patterns: Adapter, Decorator, Proxy, Facade and Composite`,lvl:`I`,min:16,
eli5:`Structural patterns are about how objects fit together: a travel plug adapter (Adapter), a phone case that adds grip (Decorator), a receptionist who decides who sees the doctor (Proxy), a single help desk for a whole hospital (Facade), and folders inside folders (Composite).`,
body:`**Structural patterns** combine objects into larger structures while keeping them flexible:
- **Adapter**: makes an existing class fit the interface your code expects. InputStreamReader adapts bytes to characters; Arrays.asList adapts an array to a List.
- **Decorator**: wraps an object of the **same interface** to add behaviour: buffering, logging, caching. new BufferedReader(new FileReader(...)) is a decorator chain.
- **Proxy**: stands in for an object to **control access**: lazy loading (Hibernate's lazy relations), security checks, transactions. Spring's @Transactional works through a proxy.
- **Facade**: one simple entry point in front of a complicated subsystem. An OrderFacade.placeOrder() that coordinates inventory, payment and email; SLF4J is a facade over logging libraries.
- **Composite**: treat a single object and a group of objects the same way: a folder and a file both have size(), and a folder's size is the sum of its children.

All of them rely on **composition and interfaces**, which is why they show up everywhere in frameworks.`,
code:`interface Notifier { void send(String to, String message); }

class EmailNotifier implements Notifier {
    public void send(String to, String message) { System.out.println("Email to " + to + ": " + message); }
}

// Decorator: same interface, wraps another Notifier, adds one behaviour
class RetryingNotifier implements Notifier {
    private final Notifier inner;
    RetryingNotifier(Notifier inner) { this.inner = inner; }
    public void send(String to, String message) {
        for (int attempt = 1; ; attempt++) {
            try { inner.send(to, message); return; }
            catch (RuntimeException e) { if (attempt == 3) throw e; }
        }
    }
}

// Adapter: makes a third-party SMS client look like a Notifier
class SmsAdapter implements Notifier {
    private final ThirdPartySmsClient client;
    SmsAdapter(ThirdPartySmsClient client) { this.client = client; }
    public void send(String to, String message) { client.dispatchText(new SmsRequest(to, message)); }
}

Notifier notifier = new RetryingNotifier(new EmailNotifier());   // stack decorators freely
notifier.send("asha@example.com", "Your course is ready");`,
more:[{cap:`Composite: one interface for leaves and groups`,lang:`java`,src:`sealed interface Node permits FileNode, Folder { long size(); }
record FileNode(String name, long size) implements Node {}
record Folder(String name, List<Node> children) implements Node {
    public long size() { return children.stream().mapToLong(Node::size).sum(); }   // recursion
}

Node project = new Folder("src", List.of(new FileNode("App.java", 1200),
        new Folder("model", List.of(new FileNode("User.java", 800)))));
System.out.println(project.size());   // 2000`}],
pro:`Decorator and Proxy look identical in code (both wrap an object with the same interface); the difference is intent. A decorator adds features the caller asks for; a proxy controls access, often invisibly, as Spring's proxies do. That invisibility is also why calling a @Transactional method from inside the same class skips the transaction: the call never goes through the proxy.`,
trap:`Calling a @Transactional (or @Cacheable, @Async) method from another method of the same bean and expecting the annotation to work. The internal call bypasses the proxy.`,
iq:[[`Decorator vs Proxy?`,`Both wrap an object behind the same interface. A decorator adds behaviour (buffering, logging) chosen by the caller; a proxy controls access to the real object (lazy loading, security, transactions), usually without the caller knowing.`],
[`Give a JDK example of the Adapter pattern.`,`InputStreamReader adapts an InputStream (bytes) to a Reader (characters); Arrays.asList adapts an array to the List interface.`]],
quiz:[`new BufferedReader(new FileReader("a.txt")) is an example of which pattern?`,[`Singleton`,`Decorator`,`Factory`,`Observer`],1,`BufferedReader wraps another Reader to add buffering: a decorator.`]},

{id:`reactive`,diagram:`reactive-flow`,t:`Reactive Spring: WebFlux, Mono and Flux`,lvl:`A`,min:17,
eli5:`A normal waiter takes one order and stands at the kitchen until it's ready. A reactive waiter drops off the order and serves other tables; when the kitchen rings the bell, they bring the food. Fewer waiters handle far more tables.`,
body:`**Reactive programming** handles data as asynchronous streams and never blocks a thread while waiting for I/O.
- **Reactive Streams** defines Publisher, Subscriber and Subscription (also in the JDK as java.util.concurrent.Flow). Subscribers request items with **request(n)**: that's **backpressure**.
- **Project Reactor** provides **Mono** (0 or 1 item) and **Flux** (0 to many), with operators such as map, filter, flatMap and zip.
- **Nothing happens until something subscribes.** Building a chain only describes the work.
- **Spring WebFlux** is the reactive web framework: controllers return Mono or Flux, it runs on a small number of event-loop threads (Netty), and **WebClient** is its non-blocking HTTP client. **R2DBC** provides reactive database access.

When to use it: very high concurrency, streaming data (server-sent events), or gateways that mostly wait on other services. Since **Java 21**, virtual threads let ordinary blocking Spring MVC code scale to similar concurrency with simpler code, so for typical CRUD services Spring MVC remains the default choice.`,
code:`@RestController
@RequestMapping("/api/courses")
class CourseController {
    private final CourseRepository repo;        // a ReactiveCrudRepository (R2DBC)
    private final WebClient reviews;

    CourseController(CourseRepository repo, WebClient.Builder builder) {
        this.repo = repo;
        this.reviews = builder.baseUrl("https://reviews.internal").build();
    }

    @GetMapping
    Flux<Course> all() {
        return repo.findAll().filter(Course::published);       // streamed, not loaded all at once
    }

    @GetMapping("/{id}")
    Mono<CourseView> one(@PathVariable long id) {
        Mono<Course> course = repo.findById(id);
        Mono<Double> rating = reviews.get().uri("/ratings/{id}", id)
                .retrieve().bodyToMono(Double.class)
                .onErrorReturn(0.0);                            // degrade gracefully
        return Mono.zip(course, rating, CourseView::new);       // both calls run concurrently
    }
}`,
pro:`Never block inside a reactive pipeline: calling block(), a JDBC driver or Thread.sleep on an event-loop thread stalls every request that thread serves. Debugging is harder because stack traces show the framework, not your call chain (Reactor's checkpoint() and Hooks help). Reactive code pays off when the whole path is non-blocking, from the controller through the HTTP client to the database driver.`,
trap:`Mixing blocking calls (JDBC, RestTemplate, block()) into WebFlux code. It throws away the benefit and can freeze the server under load.`,
iq:[[`What is the difference between Mono and Flux?`,`Mono emits at most one item (or an error); Flux emits zero to many items. Both are lazy publishers that do nothing until subscribed.`],
[`What is backpressure?`,`A subscriber signals how many items it can process (request(n)), so a fast producer doesn't overwhelm a slow consumer.`]],
quiz:[`What happens when you build a Flux chain but nobody subscribes?`,[`It runs once`,`Nothing runs`,`It runs on a background thread`,`It throws an exception`],1,`Reactive pipelines are lazy: subscription triggers the work.`]},
];
