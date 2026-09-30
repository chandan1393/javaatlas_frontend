import { Lesson, Stage } from '../core/models';

/**
 * Lessons added to existing stages, plus two new stages (HashMap internals, Collections compared).
 * ContentService inserts them; see EXTRA_LESSONS and EXTRA_STAGES at the bottom.
 */

// ---------------------------------------------------------------------------------------------
// Object-oriented programming, in practice
// ---------------------------------------------------------------------------------------------
const OOP_PRACTICE: Lesson[] = [
{id:`overloading-vs-overriding`,t:`Method overloading vs overriding`,lvl:`B`,min:8,
eli5:`Overloading is one word with different meanings depending on what follows it: "print a number", "print a photo". Overriding is a child rewriting a recipe it inherited from its parent, in its own way.`,
body:`Two features share a name but work at different times:
- **Overloading**: several methods with the **same name but different parameter lists** in one class. The compiler picks one at **compile time**, from the declared types of the arguments. This is compile-time polymorphism.
- **Overriding**: a subclass gives its own version of an **inherited** method with the **same signature**. The JVM picks the version at **run time**, from the object's actual class. This is runtime polymorphism.

Overloading is about convenience (one name, many ways to call it). Overriding is about behaviour (each subclass does the job its own way), and it's what makes polymorphism work.`,
vs:{a:`Overloading`,b:`Overriding`,rows:[
[`Where`,`Same class (or inherited methods)`,`Subclass redefines a parent method`],
[`Method name`,`Same`,`Same`],
[`Parameters`,`Must differ (number, types or order)`,`Must be identical`],
[`Return type`,`Can be anything`,`Same type or a subtype (covariant)`],
[`Access modifier`,`Any`,`Same or wider (never narrower)`],
[`Checked exceptions`,`Any`,`Same, narrower or none (never broader)`],
[`static / private / final methods`,`Can be overloaded`,`Can't be overridden (static ones are hidden)`],
[`Chosen`,`At compile time, by declared argument types`,`At run time, by the object's class`],
[`Annotation`,`None`,`[[@Override]] (always add it)`],
]},
code:`class Notifier {
    void send(String message) { System.out.println("Sending: " + message); }
    void send(String message, int retries) { System.out.println("Sending " + message + " with " + retries + " retries"); }  // overload
    void send(List<String> messages) { messages.forEach(this::send); }                                                   // overload
}

class SmsNotifier extends Notifier {
    @Override
    void send(String message) {                        // override: same signature, new behaviour
        System.out.println("SMS: " + message.substring(0, Math.min(160, message.length())));
    }
}

Notifier n = new SmsNotifier();
n.send("Your course is ready");        // SMS: Your course is ready  (override chosen at run time)
n.send("Your course is ready", 3);     // overload chosen at compile time`,
more:[{cap:`The classic trap: overloads are chosen by the declared type`,lang:`java`,src:`static void greet(Object o) { System.out.println("object"); }
static void greet(String s) { System.out.println("string"); }

Object o = "hello";
greet(o);            // prints "object": the declared type is Object
greet("hello");      // prints "string"`}],
pro:`Overload resolution happens in phases: exact match first, then widening ([[int]] to [[long]]), then boxing ([[int]] to [[Integer]]), then varargs. Mixing overloads with boxing and varargs makes calls hard to read, so keep overloads clearly different. The most famous overriding bug is [[public boolean equals(Point p)]]: it overloads [[equals(Object)]] instead of overriding it, so [[HashSet]] and [[HashMap]] never call it. [[@Override]] turns that mistake into a compile error.`,
trap:`Writing equals(MyType other) instead of equals(Object other). It compiles, but it's an overload, so collections ignore it.`,
iq:[[`Can you overload a method by changing only the return type?`,`No. The compiler chooses an overload from the arguments, so two methods that differ only in return type are a compile error.`],
[`Can a static method be overridden?`,`No. A static method with the same signature in a subclass hides the parent's; which one runs depends on the reference type, not the object.`]],
quiz:[`Object o = "hi"; with greet(Object) and greet(String) defined, what does greet(o) call?`,[`greet(String)`,`greet(Object)`,`It doesn't compile`,`It depends on the JVM`],1,`Overloads are chosen at compile time from the declared type, and o is declared as Object.`]},

{id:`parent-reference`,lab:`memory:upcasting`,t:`What happens when a child object is assigned to a parent reference?`,lvl:`I`,min:16,
eli5:`A universal TV remote (the parent reference) controlling a smart TV (the child object): you only get the buttons the remote has, but when you press Power, the smart TV turns on in its own way.`,
body:`[[Animal a = new Dog();]] creates a **Dog object** and stores a reference to it in a variable of type **Animal**. Two types are now involved, and each decides something different:
- The **reference type** (Animal) decides **what you can call**. The compiler only allows methods and fields declared in Animal.
- The **object type** (Dog) decides **which implementation runs** for instance methods. [[a.sound()]] runs Dog's override. This is **dynamic dispatch**, the heart of polymorphism.
- **Fields and static methods are not polymorphic.** They're resolved by the reference type, so [[a.name]] reads Animal's field even when Dog declares its own.

Going up (child to parent, **upcasting**) is automatic and always safe. Going down (**downcasting**) needs an explicit cast and is checked at run time: if the object isn't really that type, you get [[ClassCastException]]. Check first with [[instanceof]], which since Java 16 also does the cast for you.

Why this matters: it lets you write code against a general type ([[List]], [[PaymentGateway]]) and plug in any implementation later.`,
code:`class Animal {
    String name = "animal";
    void sound() { System.out.println("..."); }
    static String kind() { return "Animal"; }
}

class Dog extends Animal {
    String name = "dog";                            // hides Animal.name (avoid this in real code)
    @Override void sound() { System.out.println("Woof"); }
    static String kind() { return "Dog"; }          // hides, doesn't override
    void fetch() { System.out.println("Fetching!"); }
}

Animal a = new Dog();              // upcast: implicit and always safe
a.sound();                         // Woof    object type decides (dynamic dispatch)
System.out.println(a.name);        // animal  fields: reference type decides
System.out.println(Animal.kind()); // Animal  static: resolved by type, never by object
// a.fetch();                      // compile error: Animal has no fetch()

if (a instanceof Dog d) {          // Java 16: check and cast in one step
    d.fetch();                     // Fetching!
}

Animal plain = new Animal();
Dog oops = (Dog) plain;            // compiles, but throws ClassCastException at run time`,
more:[{cap:`What actually happens inside the JVM`,lang:`text`,src:`Animal a = new Dog();
  1. new Dog()  -> the heap gets ONE object with Dog's class pointer and BOTH name fields
  2. a          -> a reference (address) typed as Animal; the object itself is unchanged
a.sound()
  3. javac emits  invokevirtual Animal.sound()   (checked against the reference type)
  4. the JVM looks up sound() in the object's class (Dog) -> runs Dog.sound()
     (the JIT often inlines it when only one implementation is loaded)`}],
pro:`Casting never changes the object, only how you're allowed to see it. That's why downcasting can fail: the compiler trusts you, the JVM checks. A subtle consequence of dynamic dispatch: if a **parent constructor calls an overridable method**, the child's override runs before the child's fields are initialised, so it sees [[null]] and [[0]]. Never call overridable methods from constructors.`,
trap:`Calling an overridable method from a constructor. The override runs before the subclass has initialised its fields.`,
iq:[[`Animal a = new Dog(); which decides the method that runs, the reference or the object?`,`The object, for instance methods (dynamic dispatch). The reference type decides what you're allowed to call, and it also decides fields, static methods and which overload is chosen.`],
[`Upcasting vs downcasting?`,`Upcasting (child to parent) is implicit and always safe. Downcasting (parent to child) needs an explicit cast, is checked at run time and throws ClassCastException if the object isn't that type; check with instanceof first.`]],
quiz:[`Animal a = new Dog(); both classes declare a field called name. What does a.name read?`,[`Dog's name`,`Animal's name`,`It doesn't compile`,`Whichever was set last`],1,`Fields aren't polymorphic: they're resolved by the reference type, Animal.`]},

{id:`interface-vs-abstract`,t:`Interface vs abstract class: when should I use which?`,lvl:`I`,min:9,
eli5:`An interface is a job description ("can drive a car"): anyone who can do it may apply. An abstract class is a half-built house: related houses share the foundation and walls, and each finishes the rooms its own way.`,
body:`Since Java 8, interfaces can have **default** and **static** methods, so the two look alike. Decide by what you need.

**Choose an interface when**
- You're defining a **capability or contract**: [[Comparable]], [[Runnable]], [[PaymentGateway]], [[NotificationSender]].
- **Unrelated** classes should share it (a Course and a User can both be Exportable).
- You want to stay flexible: a class can implement **many** interfaces but extend only one class.
- You want easy **swapping and mocking** (Spring injects interfaces; tests pass fakes).
- You want **lambdas**: only interfaces can be functional.

**Choose an abstract class when**
- Related classes share **state** (fields) and real code.
- You need **constructors**, **protected** members or controlled initialisation.
- You want a fixed algorithm with steps that subclasses fill in (the **Template Method** pattern).

**Often both**: an interface for the contract plus an abstract base class that implements the boring parts. The JDK does this with [[List]] and [[AbstractList]].

A quick test: if you'd describe it with "can …" or "is able to …", make an interface. If you'd say "is a kind of … and shares …", consider an abstract class.`,
vs:{a:`Interface`,b:`Abstract class`,rows:[
[`Purpose`,`A contract: what a type can do`,`A partial implementation: shared state and code`],
[`Instance fields`,`No (only constants)`,`Yes`],
[`Constructors`,`No`,`Yes (called via [[super(...)]])`],
[`Methods`,`abstract, default, static, private (Java 9)`,`Any: abstract and concrete`],
[`Access modifiers`,`Methods are public (or private helpers)`,`Any: public, protected, package-private, private`],
[`Inheritance`,`A class can implement many`,`A class can extend only one`],
[`Lambdas`,`Yes, if it has one abstract method`,`No`],
[`Adding a method later`,`Add a default method: nothing breaks`,`Add a concrete method: nothing breaks`],
[`Typical examples`,`[[Comparable]], [[List]], [[Runnable]]`,`[[AbstractList]], [[HttpServlet]], [[InputStream]]`],
]},
code:`// Interface: a capability; any class can have it
public interface PaymentGateway {
    PaymentResult charge(String orderId, long amountPaise);

    default boolean supportsUpi() { return false; }          // Java 8: evolve without breaking implementations
}

public class RazorpayGateway implements PaymentGateway {
    public PaymentResult charge(String orderId, long amountPaise) { /* call Razorpay */ return PaymentResult.ok(); }
    @Override public boolean supportsUpi() { return true; }
}

// Abstract class: shared state + a fixed algorithm (Template Method)
public abstract class ReportGenerator {
    private final Clock clock;                                // shared state
    protected ReportGenerator(Clock clock) { this.clock = clock; }

    public final String generate() {                          // the steps can't be reordered
        return header() + "\\n" + body() + "\\nGenerated " + LocalDate.now(clock);
    }
    protected String header() { return "JavaAtlas report"; }  // a default step
    protected abstract String body();                         // subclasses must fill this in
}

public class SalesReport extends ReportGenerator {
    public SalesReport(Clock clock) { super(clock); }
    @Override protected String body() { return "Revenue: ₹29,980"; }
}`,
pro:`Default methods exist so libraries can evolve: Java 8 added [[stream()]] to [[Collection]] and [[sort()]] to [[List]] without breaking every implementation ever written. They can't hold state, though, so if you catch yourself wishing an interface had a field, you want an abstract class (or composition). Since Java 17, **sealed** interfaces and classes can also restrict who implements them, which is great for fixed sets of types such as payment results.`,
trap:`Creating an abstract "BaseService" just to share a few helper methods. Every service is then stuck with one parent forever; use composition or a small helper class instead.`,
iq:[[`Can an interface have a constructor or instance fields?`,`No. It can have constants (public static final), abstract, default, static and private methods, but no constructors and no instance state.`],
[`When would you still choose an abstract class over an interface with default methods?`,`When subclasses need shared state (fields), a constructor, protected or package-private members, or a final template method that fixes the order of steps.`]],
quiz:[`Which one can declare instance fields?`,[`Interface`,`Abstract class`,`Both`,`Neither`],1,`Interfaces can only declare constants; abstract classes can hold normal instance fields.`]},

{id:`composition-vs-inheritance`,t:`Why prefer composition over inheritance?`,lvl:`I`,min:9,
eli5:`Inheritance says a car IS a vehicle. Composition says a car HAS an engine, and because the engine is a separate part, you can swap it for an electric motor without rebuilding the car.`,
body:`There are two ways to reuse code:
- **Inheritance (IS-A)**: [[class Car extends Vehicle]]. The child gets the parent's code, but is **tightly bound** to it.
- **Composition (HAS-A)**: [[class Car { private final Engine engine; }]]. The class **holds other objects** and forwards work to them.

Why composition usually wins:
1. **The fragile base class problem.** A child depends on how the parent works inside. When the parent changes (or calls its own methods in unexpected ways), children break, as the example below shows.
2. **You inherit everything**, even methods that make no sense for the child. The JDK's own [[Stack extends Vector]] lets you insert into the middle of a stack.
3. **Only one parent.** Inheritance uses up your one [[extends]]; composition lets you combine many parts.
4. **Flexibility at run time.** Parts can be swapped (a different [[PaymentGateway]], a fake in tests); a parent class is fixed at compile time.

Use inheritance when the child truly **is a special kind** of the parent and the parent was **designed for extension** (framework base classes, exception hierarchies, sealed type hierarchies). Otherwise, compose.`,
code:`// Inheritance: looks right, counts wrong
class CountingSet<E> extends HashSet<E> {
    int added = 0;

    @Override public boolean add(E e) { added++; return super.add(e); }

    @Override public boolean addAll(Collection<? extends E> c) {
        added += c.size();
        return super.addAll(c);            // HashSet.addAll() calls add() for each element...
    }
}

CountingSet<String> set = new CountingSet<>();
set.addAll(List.of("a", "b", "c"));
System.out.println(set.added);             // 6, not 3: every element was counted twice`,
more:[{cap:`The same idea with composition: correct, and immune to HashSet's internals`,lang:`java`,src:`class CountingSet<E> {
    private final Set<E> set = new HashSet<>();   // HAS-A: we use a set, we aren't one
    private int added = 0;

    public boolean add(E e) { added++; return set.add(e); }

    public boolean addAll(Collection<? extends E> c) {
        added += c.size();
        return set.addAll(c);                     // whatever HashSet does inside can't affect our count
    }

    public boolean contains(Object o) { return set.contains(o); }
    public int added() { return added; }
}`},{cap:`Composition in everyday Spring code`,lang:`java`,src:`@Service
class OrderService {
    private final PaymentGateway payments;   // swap Razorpay for another gateway, or a fake in tests
    private final Notifier notifier;

    OrderService(PaymentGateway payments, Notifier notifier) {   // constructor injection = composition
        this.payments = payments;
        this.notifier = notifier;
    }
}`}],
pro:`This example comes from Joshua Bloch's Effective Java (item "Favor composition over inheritance"). Many design patterns are composition in disguise: **Strategy** (swap an algorithm object), **Decorator** ([[new BufferedReader(new InputStreamReader(in))]] wraps behaviour around another object) and **Delegation**. A good default is to make classes [[final]] unless you deliberately design and document them for extension.`,
trap:`Extending a class just to reuse a few of its methods. You inherit its whole public API and every future change to its internals.`,
iq:[[`Why prefer composition over inheritance?`,`Inheritance couples the child to the parent's implementation (the fragile base class problem), exposes every inherited method, uses up the single superclass and is fixed at compile time. Composition keeps classes loosely coupled, lets you swap and combine parts and is easy to test.`],
[`When is inheritance the right choice?`,`When the child really is a specialised kind of the parent (IS-A holds everywhere the parent is used) and the parent is designed for extension, for example framework base classes, exception hierarchies or sealed hierarchies.`]],
quiz:[`CountingSet extends HashSet and counts in both add() and addAll(). After addAll(List.of("a","b","c")), what is the count?`,[`3`,`6`,`0`,`It throws`],1,`HashSet's addAll() calls add() for each element, so each one is counted twice. Composition avoids this.`]},

{id:`relationships`,t:`IS-A and HAS-A: association, aggregation and composition`,lvl:`I`,min:16,
eli5:`A teacher and a student know each other (association). A department has teachers, who can leave and join another department (aggregation). A house has rooms, and the rooms don't exist without the house (composition).`,
body:`Objects relate to each other in two basic ways:
- **IS-A**: inheritance or implementation. A Dog IS-A Animal; an ArrayList IS-A List.
- **HAS-A**: one object holds a reference to another. HAS-A comes in three strengths, from loose to tight:

1. **Association**: objects know or use each other, and each lives independently. A Doctor treats Patients; a Student attends Courses. It can be one-to-one, one-to-many or many-to-many.
2. **Aggregation**: a whole–part association where the **parts can exist on their own** and may be shared. A Department has Employees; close the department and the employees still exist.
3. **Composition**: a strong whole–part relationship. The part **belongs to exactly one whole** and **lives and dies with it**. An Order has OrderLines; delete the order and its lines are gone.

In Java all three look like fields. The difference is **ownership and lifecycle**: who creates the part, whether it can be shared, and what happens to it when the whole goes away.`,
code:`// Association: uses another object; no ownership
class Doctor {
    Prescription treat(Patient patient) { return new Prescription(patient.id(), "Rest"); }
}

// Aggregation: holds parts that exist independently (created elsewhere, can move on)
class Department {
    private final List<Employee> employees = new ArrayList<>();
    void hire(Employee e) { employees.add(e); }          // the employee existed before
    void letGo(Employee e) { employees.remove(e); }        // and keeps existing after
}

// Composition: creates and owns its parts; they die with it
class Order {
    private final List<OrderLine> lines = new ArrayList<>();
    void addItem(String sku, int qty) { lines.add(new OrderLine(sku, qty)); }   // created inside
    List<OrderLine> lines() { return List.copyOf(lines); }                      // never hand out the internals
}
record OrderLine(String sku, int qty) {}`,
more:[{cap:`The same distinction in JPA`,lang:`java`,src:`@Entity
class Order {
    // Composition: lines are saved and deleted with the order
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderLine> lines = new ArrayList<>();
}

@Entity
class Department {
    // Aggregation: employees outlive the department, so no cascading delete
    @OneToMany(mappedBy = "department")
    private List<Employee> employees = new ArrayList<>();
}`}],
pro:`In UML, association is a plain line, aggregation a hollow diamond on the whole's side and composition a filled diamond. Composition is also an encapsulation tool: because the Order owns its lines, it should never return its internal list (return a copy or an unmodifiable view), or outside code could change the order behind its back.`,
trap:`Calling every HAS-A relationship "composition". Ask who owns the part's lifecycle: if the part can outlive or be shared by the whole, it's aggregation.`,
iq:[[`Aggregation vs composition?`,`Both are whole–part HAS-A relationships. In aggregation the part can exist independently and be shared (Department–Employee); in composition the part belongs to one whole and is created and destroyed with it (Order–OrderLine).`],
[`How do IS-A and HAS-A map to Java code?`,`IS-A is extends or implements. HAS-A is a field that references another object; whether it's association, aggregation or composition depends on ownership and lifecycle.`]],
quiz:[`An Order creates its OrderLines, and they're deleted when the order is deleted. What relationship is this?`,[`Association`,`Aggregation`,`Composition`,`Inheritance`],2,`The lines belong to exactly one order and share its lifecycle: that's composition.`]},
];

// ---------------------------------------------------------------------------------------------
// Concurrency: the advanced step after the basics and synchronization
// ---------------------------------------------------------------------------------------------
const EXECUTORS: Lesson =
{id:`executors`,lab:`threadpool:bounded`,t:`ExecutorService, ThreadPoolExecutor and Future`,lvl:`A`,min:8,
eli5:`Instead of hiring a new cook for every order, a restaurant keeps a team of cooks and an order board. The ExecutorService is the head chef: you hand over tasks, and it gives them to whichever cook is free.`,
body:`Creating a new thread for every task is slow (each platform thread is an OS thread with its own stack) and dangerous under load (thousands of threads can exhaust memory). An **ExecutorService** (Java 5) keeps a **pool** of reusable threads and a **queue** of waiting tasks.
- [[submit(task)]] accepts a [[Runnable]] or a [[Callable]] and returns a [[Future]]; [[execute(runnable)]] just runs it.
- Ready-made pools: [[Executors.newFixedThreadPool(n)]], [[newCachedThreadPool()]], [[newSingleThreadExecutor()]], [[newScheduledThreadPool(n)]], and since Java 21 [[newVirtualThreadPerTaskExecutor()]].
- Most of them are a **ThreadPoolExecutor** underneath: a core size, a maximum size, a work queue and a rejection policy. In production, configure it yourself so the queue is bounded.
- [[Future.get(timeout, unit)]] waits for a result; [[invokeAll]] runs a batch and waits for all of them.
- Always **shut the pool down**: [[shutdown()]] stops new tasks and lets running ones finish.`,
code:`// inside a method that declares: throws InterruptedException
ExecutorService pool = Executors.newFixedThreadPool(4);
try {
    Future<Integer> price = pool.submit(() -> fetchPrice("SPRING-101"));   // a Callable: returns a value
    Future<Integer> seats = pool.submit(() -> fetchSeats("SPRING-101"));   // both run at the same time

    System.out.println(price.get(2, TimeUnit.SECONDS) + " / " + seats.get(2, TimeUnit.SECONDS));
} catch (ExecutionException e) {
    log.error("A lookup failed", e.getCause());      // the task's own exception is the cause
} catch (TimeoutException e) {
    log.warn("A lookup took too long");
} finally {
    pool.shutdown();                                 // no new tasks; queued and running ones finish
}`,
more:[{cap:`A production-grade ThreadPoolExecutor`,lang:`java`,src:`AtomicInteger n = new AtomicInteger();
ThreadPoolExecutor pool = new ThreadPoolExecutor(
        4,                                          // core threads (kept even when idle)
        8,                                          // maximum threads
        60, TimeUnit.SECONDS,                       // extra threads die after 60 s idle
        new ArrayBlockingQueue<>(200),              // BOUNDED queue: back-pressure, not OutOfMemoryError
        r -> new Thread(r, "orders-" + n.incrementAndGet()),   // named threads: readable logs and dumps
        new ThreadPoolExecutor.CallerRunsPolicy()); // when full, the caller runs the task (slows producers)`}],
pro:`How a ThreadPoolExecutor handles a new task: (1) fewer than **core** threads running → start a new thread; (2) otherwise **queue** it; (3) queue full → start a thread up to **maximum**; (4) still full → **reject** it (the default [[AbortPolicy]] throws [[RejectedExecutionException]]). This is why [[newFixedThreadPool]] (an unbounded queue) never grows beyond its core size and can pile up tasks until memory runs out, and why [[newCachedThreadPool]] can create thousands of threads. Size pools by the work: about the number of cores for CPU-bound tasks, more for I/O-bound ones. Since Java 19 [[ExecutorService]] is [[AutoCloseable]], so try-with-resources shuts it down; in Spring, configure a [[ThreadPoolTaskExecutor]] for [[@Async]].`,
trap:`Forgetting shutdown(). The pool's worker threads aren't daemon threads, so the JVM never exits. Close behind: calling future.get() without a timeout, which can wait forever.`,
iq:[[`shutdown() vs shutdownNow()?`,`shutdown() stops accepting new tasks and lets queued and running tasks finish. shutdownNow() interrupts running tasks and returns the queued tasks that never started. Follow either with awaitTermination().`],
[`What does a ThreadPoolExecutor do when all core threads are busy?`,`It queues the task. Only when the queue is full does it add threads up to the maximum, and when that's also reached it applies the rejection policy.`]],
quiz:[`A newFixedThreadPool(4) receives 100 tasks at once. What happens?`,[`It creates 100 threads`,`It runs 4 at a time and queues the rest`,`It rejects 96 tasks`,`It throws OutOfMemoryError`],1,`Four threads work while the other tasks wait in the (unbounded) queue.`]};

// ---------------------------------------------------------------------------------------------
// HashMap internals: a 13-part series (numbers in comments are what real Java prints)
// ---------------------------------------------------------------------------------------------
const HASHMAP_SERIES: Lesson[] = [
{id:`hm-hashing`,t:`HashMap internals 1: What is hashing?`,lvl:`I`,lab:`hashmap:basic`,
eli5:`Hashing turns a key into a number that tells you where to put it, like a library that shelves every book by a number worked out from its title. To find a book, you work out the number and walk straight to that shelf instead of searching them all.`,
body:`A **hash function** turns any key into a fixed-size number, its **hash code**. The same key always gives the same number, so instead of *searching* for a key you can *calculate* where it must be.
- Every Java object has [[hashCode()]], which returns an [[int]] (about 4.3 billion possible values).
- [[String.hashCode()]] is calculated from the characters: s[0]·31^(n−1) + s[1]·31^(n−2) + … + s[n−1], letting the [[int]] overflow.
- Different keys **can** share a hash code. There are endless possible strings but only 2^32 [[int]] values, so this is unavoidable. It's called a **collision** (part 5).
- A good hash function spreads keys evenly, which is what makes lookups **O(1) on average**: calculate, then jump. In a plain list you'd check up to every element (O(n)).

Try it in the lab below: type a key and watch its hash code being worked out.`,
code:`System.out.println("java".hashCode());              // 3254818
System.out.println("Java".hashCode());              // 2301506   (one letter changed: a very different number)
System.out.println("Aa".hashCode());                // 2112
System.out.println("BB".hashCode());                // 2112      different strings, same hash code!
System.out.println(Integer.valueOf(42).hashCode()); // 42        an Integer's hash is its value`,
pro:`[[String]] caches its hash code in a field the first time it's calculated; that's safe because strings are immutable. 31 is used because it's an odd prime and [[31 * h]] can be computed as [[(h << 5) - h]]. Hash codes aren't unique IDs, and [[Object]]'s default hash code can differ between runs, so never store them in a database.`,
trap:`Assuming that equal hash codes mean equal objects. "Aa" and "BB" prove they don't.`,
iq:[[`Is hashCode() unique for every object?`,`No. It returns an int, so there are only 2^32 values for endless possible objects; different objects can share a hash code (a collision). Only the reverse is guaranteed: equal objects must have equal hash codes.`],
[`Why is HashMap lookup O(1) on average?`,`Because the key's hash code is turned directly into an array index, so HashMap jumps to one small bucket instead of scanning all entries.`]],
quiz:[`"Aa".hashCode() is 2112. What is "BB".hashCode()?`,[`2112`,`2176`,`4224`,`It depends on the JVM`],0,`Both are 2112: a classic example of two different strings with the same hash code.`]},

{id:`hm-buckets`,t:`HashMap internals 2: What is a bucket?`,lvl:`I`,lab:`hashmap:fruits`,
eli5:`A HashMap is a row of numbered lockers, called buckets. The hash code picks the locker. All entries whose hash points to the same locker share it.`,
body:`Inside, a HashMap is an **array** (the "table"), and each slot of that array is a **bucket**. A bucket holds zero or more entries, each a small [[Node]] object with four fields: [[hash]], [[key]], [[value]] and [[next]].
- The table starts with **16 buckets**, created on the first [[put]].
- A hash code can be any of billions of values, so HashMap turns it into an index: [[index = hash & (n − 1)]]. With 16 buckets that keeps only the lowest **4 bits**, giving an index from 0 to 15.
- This trick only works because the number of buckets is always a **power of two**: n − 1 is then all ones in binary (15 = 1111), so [[&]] works like a very fast [[% n]].
- First, HashMap **spreads** the hash with [[h ^ (h >>> 16)]], mixing the high 16 bits into the low 16. Otherwise keys that differ only in their high bits would all land in the same bucket.`,
code:`static int spread(Object key) {
    int h = key.hashCode();
    return h ^ (h >>> 16);                   // exactly what HashMap.hash() does
}

static int bucketOf(Object key, int buckets) {
    return spread(key) & (buckets - 1);      // buckets is always a power of two
}

System.out.println(bucketOf("java", 16));    // 3
System.out.println(bucketOf("mango", 16));   // 15
System.out.println(bucketOf("book", 16));    // 7
System.out.println(bucketOf("cat", 16));     // 7   same bucket as "book"`,
pro:`A null key is allowed once: HashMap gives it hash 0, so it always lives in bucket 0. Each [[Node]] costs about 32 bytes on a typical 64-bit JVM, plus the key and value objects themselves, so a HashMap of a million small entries uses tens of megabytes.`,
trap:`Thinking a HashMap stores its entries in order. Where an entry goes depends only on its hash, so iteration order looks random and can change when the map grows.`,
iq:[[`Why is HashMap's capacity always a power of two?`,`So the bucket index can be computed with hash & (n − 1), a single fast bit operation equivalent to hash % n, and so resizing can split each bucket cheaply.`],
[`What does h ^ (h >>> 16) do?`,`It mixes the high 16 bits of the hash code into the low 16 bits, because only the low bits pick the bucket. Keys whose hash codes differ only in their high bits then still spread across buckets.`]],
quiz:[`With 16 buckets, which bits of the (spread) hash choose the bucket?`,[`The highest 4`,`The lowest 4`,`All 32`,`A random 4`],1,`hash & 15 keeps just the lowest 4 bits (15 is 1111 in binary).`]},

{id:`hm-put`,t:`HashMap internals 3: How put() works`,lvl:`I`,lab:`hashmap:fruits`,
eli5:`To put something in a locker: work out the locker number, open it, and check whether something with the same label is already inside. Same label: swap the contents. New label: add it to the back.`,
body:`What [[put(key, value)]] does in Java 8 and later:
1. **Hash the key**: [[hash = spread(key.hashCode())]]. A [[null]] key gets hash 0.
2. **Create the table** if this is the first put (16 buckets).
3. **Find the bucket**: [[index = hash & (n − 1)]]. If it's empty, a new node goes there, and put is nearly done.
4. Otherwise **walk the bucket**. For each node: if [[node.hash == hash]] and the keys are equal ([[==]] or [[equals()]]), it's the **same key**: replace the value and return the old one.
5. No match: **append a new node at the tail** of the bucket. If the bucket already held 8 nodes, it's turned into a tree (part 11).
6. **Increase size.** If size is now greater than the threshold (capacity × load factor, 12 at first), **resize** (part 9).
7. Return the previous value, or [[null]] if the key was new.`,
code:`Map<String, Integer> stock = new HashMap<>();

System.out.println(stock.put("pen", 10));   // null   new key
System.out.println(stock.put("pen", 12));   // 10     same key: value replaced, old value returned
System.out.println(stock.get("pen"));       // 12
System.out.println(stock.size());           // 1      still one entry

stock.put(null, 0);                         // one null key is allowed; it lives in bucket 0
stock.putIfAbsent("pen", 99);               // does nothing: "pen" is already there`,
pro:`Comparing the stored [[int]] hash first is cheap and rules out most non-matches before the (possibly expensive) [[equals()]] call; that's another reason equal objects must have equal hash codes. [[putIfAbsent]], [[computeIfAbsent]] and [[merge]] do "check, then put" in a single bucket walk instead of two separate calls. Every structural change also increments [[modCount]], which is how iterators detect changes (see "Fail-fast vs fail-safe").`,
trap:`Thinking put() with an existing key adds a second entry. It replaces the value and returns the old one.`,
iq:[[`What does HashMap.put() return?`,`The previous value for that key, or null if the key was new (or was mapped to null).`],
[`How does put() decide whether a key already exists?`,`It walks the bucket and treats a node as the same key when the stored hash is equal and the keys are the same object or equals() returns true.`]],
quiz:[`After put("pen", 10), what does put("pen", 12) return?`,[`null`,`10`,`12`,`true`],1,`put() returns the value it replaced.`]},

{id:`hm-get`,t:`HashMap internals 4: How get() works`,lvl:`I`,lab:`hashmap:fruits`,
eli5:`To find something, work out the locker number again, open that one locker and read the labels until you find yours. You never open the other lockers.`,
body:`[[get(key)]] repeats the first steps of [[put]]:
1. **Hash the key** the same way: [[spread(key.hashCode())]].
2. **Find the bucket**: [[hash & (n − 1)]].
3. **Check the first node**: same hash and equal key? Return its value. This is the common case.
4. Otherwise **walk the rest of the bucket** (a list, or a tree search for big buckets), comparing the hash first and then [[equals()]].
5. Nothing matched: return [[null]].

**Speed:** on average a bucket holds one entry or none, so get is O(1). A crowded bucket costs O(n) as a list, or O(log n) once it's a tree (Java 8+).

**The null problem:** [[get]] returns [[null]] both when the key is missing and when the key is mapped to [[null]]. Use [[containsKey]] or [[getOrDefault]] when that difference matters.`,
code:`Map<String, Integer> stock = new HashMap<>(Map.of("pen", 12, "book", 3));

stock.get("pen");                     // 12
stock.get("pencil");                  // null   missing
stock.getOrDefault("pencil", 0);      // 0

stock.put("eraser", null);
stock.get("eraser");                  // null   present, but mapped to null!
stock.containsKey("eraser");          // true   so this is how you tell them apart`,
pro:`[[get]] recalculates the hash of the key you pass in. If that differs from the hash stored when the entry was put (because the key object changed, or [[hashCode()]] is inconsistent), the lookup goes to the wrong bucket or fails the hash check, and the entry becomes unreachable. Part 13 shows this happening.`,
trap:`Using get(key) == null to mean "the key isn't there". It's also null when the key maps to null.`,
iq:[[`What is the time complexity of HashMap.get()?`,`O(1) on average. In the worst case it's O(n) when many keys share one bucket as a list, improved to O(log n) in Java 8+ once the bucket becomes a tree.`],
[`How do you tell a missing key from a key mapped to null?`,`containsKey(key) returns true only if the key is present; getOrDefault(key, fallback) returns the fallback only if it's missing.`]],
quiz:[`map.put("x", null); what does map.containsKey("x") return?`,[`true`,`false`,`It throws`,`null`],0,`The key is present; only its value is null.`]},

{id:`hm-collision`,t:`HashMap internals 5: Collisions`,lvl:`I`,lab:`hashmap:collision`,
eli5:`Two people are given the same locker. That's a collision. It isn't an error, it happens all the time; they just have to share, and the locker gets a bit slower to search.`,
body:`A **collision** is when two different keys land in the **same bucket**. There are two ways it happens:
1. **Same hash code**: "Aa" and "BB" both have hash code 2112, so they always share a bucket, whatever the table size.
2. **Different hash codes, same index**: billions of possible hash codes are squeezed into a few buckets using only the low bits. "book" (3029737) and "cat" (98262) have very different hash codes, yet both end up in bucket 7 of 16.

Collisions are **normal and expected**; HashMap is built to handle them (part 6). What matters is keeping buckets short, which depends on:
- a **good [[hashCode()]]** that spreads keys evenly, and
- **resizing** before the table gets too full (parts 7 and 9). After a resize to 32 buckets, "book" stays in bucket 7 and "cat" moves to 23.`,
code:`// Different hash codes, same bucket (16 buckets)
System.out.println("book".hashCode());   // 3029737
System.out.println("cat".hashCode());    // 98262
// bucketOf("book", 16) == 7 and bucketOf("cat", 16) == 7   (see part 2)

// A terrible hashCode: every key collides
class BadKey {
    final String id;
    BadKey(String id) { this.id = id; }
    @Override public int hashCode() { return 42; }                  // legal, but ruins performance
    @Override public boolean equals(Object o) { return o instanceof BadKey b && b.id.equals(id); }
}`,
pro:`With a constant hash code every entry shares one bucket, so HashMap degrades into a list (O(n) per lookup) or, in Java 8+, a tree (O(log n)). Attackers have used deliberately colliding keys (for example crafted HTTP parameter names) to slow servers down; this "hash flooding" is one reason Java 8 added tree buckets.`,
trap:`Treating collisions as a bug to eliminate. They can't be avoided; a good hashCode() and resizing just keep them rare.`,
iq:[[`What is a hash collision in HashMap?`,`When two different keys map to the same bucket, either because their hash codes are equal or because different hash codes give the same index after hash & (n − 1).`],
[`What happens to HashMap performance if hashCode() always returns the same value?`,`Every key lands in one bucket, so lookups degrade from O(1) to O(n), or O(log n) in Java 8+ once the bucket becomes a tree.`]],
quiz:[`"book" and "cat" have different hash codes but share bucket 7 of 16. Is that a collision?`,[`Yes`,`No, only equal hash codes count`,`Only after a resize`,`Only in Java 7`],0,`Any two keys in the same bucket collide, whatever their full hash codes are.`]},

{id:`hm-collision-resolution`,t:`HashMap internals 6: How collisions are resolved`,lvl:`I`,lab:`hashmap:collision`,
eli5:`When two people share a locker, they tie their bags together in a chain. To find your bag, you pull the chain and read each tag until you find yours.`,
body:`HashMap resolves collisions with **separate chaining**: each bucket holds a **linked list** of nodes, joined by their [[next]] field.
- A new key in an occupied bucket is **linked at the tail** of the list (Java 8+).
- Lookups walk the chain, comparing the stored hash first and then [[equals()]].
- If a chain grows too long (more than 8 nodes, in a table of at least 64 buckets), Java 8+ converts that bucket into a **red-black tree** (part 11).

The other common strategy is **open addressing**: on a collision, try another slot in the array itself, for example the next one ("linear probing"). Java's [[IdentityHashMap]] and [[ThreadLocal]]'s internal map work this way. Chaining handles high load and deletions more gracefully, which is why HashMap uses it.

Below is a tiny HashMap with chaining, the whole idea in about 25 lines.`,
code:`class MiniHashMap<K, V> {
    static final class Node<K, V> {
        final int hash; final K key; V value; Node<K, V> next;
        Node(int hash, K key, V value) { this.hash = hash; this.key = key; this.value = value; }
    }

    @SuppressWarnings("unchecked")
    private final Node<K, V>[] table = (Node<K, V>[]) new Node[16];   // no resizing, to keep it short

    public V put(K key, V value) {
        int h = key.hashCode() ^ (key.hashCode() >>> 16);
        int i = h & (table.length - 1);
        Node<K, V> last = null;
        for (Node<K, V> n = table[i]; n != null; n = n.next) {
            if (n.hash == h && n.key.equals(key)) { V old = n.value; n.value = value; return old; }  // same key
            last = n;
        }
        Node<K, V> node = new Node<>(h, key, value);
        if (last == null) table[i] = node; else last.next = node;     // collision: chain at the tail
        return null;
    }

    public V get(K key) {
        int h = key.hashCode() ^ (key.hashCode() >>> 16);
        for (Node<K, V> n = table[h & (table.length - 1)]; n != null; n = n.next) {
            if (n.hash == h && n.key.equals(key)) return n.value;
        }
        return null;
    }
}`,
pro:`Chaining keeps working even when the table is over-full, and removing an entry is just unlinking a node. Open addressing needs "tombstones" for deletions and degrades sharply as the table fills, but it's more cache-friendly, which is why some high-performance libraries prefer it.`,
trap:`Believing a bucket holds only one entry. A bucket is a chain (or tree) that can hold many.`,
iq:[[`How does HashMap handle collisions?`,`Separate chaining: each bucket holds a linked list of nodes, new nodes are added at the tail, and lookups compare hash then equals(). In Java 8+, long chains in large tables become red-black trees.`],
[`What is open addressing?`,`A collision strategy where colliding entries are stored in other slots of the array itself (for example the next free one) instead of in a chain. IdentityHashMap uses it.`]],
quiz:[`Which technique does java.util.HashMap use to resolve collisions?`,[`Linear probing`,`Separate chaining`,`Cuckoo hashing`,`Double hashing`],1,`Each bucket holds a chain of nodes (and a tree when it gets long).`]},

{id:`hm-load-factor`,t:`HashMap internals 7: Load factor`,lvl:`I`,lab:`hashmap:fruits`,
eli5:`The load factor is how full the lockers may get before you build a bigger room. At 0.75, once three quarters of the lockers' worth of bags have arrived, you move to a room with twice as many lockers.`,
body:`The **load factor** decides how full the table may get before it grows:
- **threshold = capacity × load factor**. With the defaults, 16 × 0.75 = **12**.
- When size becomes greater than the threshold (the **13th** entry), the table doubles to 32 buckets, and the new threshold is 24.

The trade-off:
- **Lower** (for example 0.5): fewer collisions and faster lookups, but more memory and more frequent resizes.
- **Higher** (for example 1.0): less memory, but longer chains and slower lookups.
- **0.75** is the balance. The JDK source notes that with the default load factor and a reasonable hash, the chance of any bucket reaching 8 entries is about 0.00000006.

You can pass a load factor to the constructor, but the default is right for almost every program.`,
code:`Map<String, Integer> a = new HashMap<>();              // capacity 16, load factor 0.75 -> threshold 12
Map<String, Integer> b = new HashMap<>(16, 0.5f);      // resizes after 8 entries: faster lookups, more memory
Map<String, Integer> c = new HashMap<>(16, 1.0f);      // resizes after 16 entries: less memory, longer chains

for (int i = 1; i <= 13; i++) {
    a.put("key" + i, i);                               // the 13th put makes size 13 > 12 -> resize to 32
}`,
pro:`The 0.00000006 figure comes from modelling bucket sizes with a Poisson distribution (average 0.5 entries per bucket at load factor 0.75). It's also why tree buckets are rare in practice: they mostly appear with bad hash codes or deliberate attacks.`,
trap:`Raising the load factor to "save memory" in a performance-critical map. Longer chains make every get() and put() slower.`,
iq:[[`What is the load factor of a HashMap?`,`The fraction of capacity that may be filled before the table is resized. Resizing happens when size exceeds capacity × load factor; the default is 0.75.`],
[`Why is the default load factor 0.75?`,`It balances memory against lookup speed: at 0.75 the average bucket holds about 0.5 entries, so chains stay very short without wasting much space.`]],
quiz:[`With the default capacity and load factor, which put() triggers the first resize?`,[`The 12th`,`The 13th`,`The 16th`,`The 17th`],1,`The threshold is 16 × 0.75 = 12; the resize happens when size becomes 13.`]},

{id:`hm-capacity`,t:`HashMap internals 8: Initial capacity`,lvl:`I`,min:19,lab:`hashmap:capacity`,
eli5:`If you know 100 guests are coming, book a big enough room from the start instead of moving everyone to bigger rooms three times during the party.`,
body:`**Capacity** is the number of buckets. The default is 16.
- You can ask for more: [[new HashMap<>(100)]]. HashMap **rounds up to the next power of two**: 10 becomes 16, 17 becomes 32, 100 becomes 128.
- The table is **created on the first put**, so an empty HashMap costs almost nothing.
- **Presizing** avoids repeated resizes when you know roughly how many entries are coming. The catch is that the argument is a capacity, not an entry count: [[new HashMap<>(1000)]] gets 1024 buckets but a threshold of 768, so it still resizes at entry 769.
- Java 19 added [[HashMap.newHashMap(int)]], which takes the number of entries and does the maths for you. On older versions use [[new HashMap<>((int) (n / 0.75f) + 1)]].`,
code:`Map<String, Integer> a = new HashMap<>(100);      // 128 buckets (rounded up to a power of two)

// You expect 1000 entries:
Map<String, Integer> wrong = new HashMap<>(1000);            // 1024 buckets, threshold 768: resizes at 769
Map<String, Integer> right = HashMap.newHashMap(1000);       // Java 19+: sized so 1000 entries never resize
Map<String, Integer> older = new HashMap<>((int) (1000 / 0.75f) + 1);   // the same idea before Java 19`,
pro:`The rounding is done by a small bit-twiddling method, [[tableSizeFor]], which finds the next power of two by smearing the highest set bit to the right. [[HashSet]], [[LinkedHashMap]] and [[LinkedHashSet]] have the same constructor behaviour, and Java 19 added matching [[newHashSet]], [[newLinkedHashMap]] and [[newLinkedHashSet]] factory methods.`,
trap:`Writing new HashMap<>(n) for n expected entries and assuming it will never resize.`,
iq:[[`What capacity does new HashMap<>(100) get?`,`128: HashMap rounds any requested capacity up to the next power of two.`],
[`How do you create a HashMap that holds n entries without resizing?`,`In Java 19+ use HashMap.newHashMap(n); before that, pass a capacity of at least n / 0.75, for example (int) (n / 0.75f) + 1.`]],
quiz:[`What capacity does new HashMap<>(100) actually use?`,[`100`,`128`,`133`,`256`],1,`Capacities are rounded up to the next power of two.`]},

{id:`hm-resize`,t:`HashMap internals 9: Resize and rehash`,lvl:`A`,lab:`hashmap:resize`,
eli5:`When the room gets too full, you move to a room with twice as many lockers. Thanks to a clever numbering trick, every bag either stays in the locker with the same number or moves exactly one "old room" further along.`,
body:`When size goes over the threshold, HashMap **doubles** the table (16 → 32 → 64 …) and moves every entry into the new array.

Java 8+ does this cleverly:
- It **reuses the stored hash** of each node; nothing is recalculated.
- Doubling the table means the index uses **one more bit** of the hash. That bit is [[hash & oldCapacity]]:
  - bit is 0: the entry **stays** at index i;
  - bit is 1: the entry **moves** to index **i + oldCapacity**.
- Each bucket is therefore split into a "lo" list and a "hi" list, and the **order of entries is preserved**.

Example with 16 → 32 buckets: "book" (bucket 7) stays at 7, "cat" (also bucket 7) moves to 23, and "java" moves from 3 to 19.

Costs to remember: a resize is **O(n)**, a pause proportional to the map size, so presize big maps (part 8). The table **never shrinks**, even if you remove most entries.`,
code:`int oldCap = 16;
for (String key : List.of("book", "cat", "java")) {
    int h = key.hashCode() ^ (key.hashCode() >>> 16);
    int before = h & (oldCap - 1);
    int after = h & (2 * oldCap - 1);
    boolean moves = (h & oldCap) != 0;                // the one extra bit decides
    System.out.println(key + ": " + before + " -> " + after + (moves ? "  (moved by +16)" : "  (stayed)"));
}
// book: 7 -> 7   (stayed)
// cat:  7 -> 23  (moved by +16)
// java: 3 -> 19  (moved by +16)`,
pro:`Because entries only ever go to i or i + oldCapacity, and order is kept, the resize is simple and has no risk of loops. Java 7 was different: it recalculated every index and reversed each list while moving, which could corrupt a bucket into a cycle under concurrent use (part 12). [[ConcurrentHashMap]] resizes cooperatively: other threads that touch the map help move buckets.`,
trap:`Removing most entries from a huge HashMap and expecting memory to be released. The table never shrinks; copy the survivors into a new map instead.`,
iq:[[`What happens during a HashMap resize in Java 8+?`,`The table doubles and every entry is moved. Using the stored hash, each entry either stays at index i or moves to i + oldCapacity, depending on the bit hash & oldCapacity; each bucket's order is preserved.`],
[`Does a HashMap shrink when entries are removed?`,`No. The table only grows; to reclaim memory you have to create a new, smaller map.`]],
quiz:[`During a resize from 16 to 32 buckets, where can an entry in bucket 5 go?`,[`Any bucket`,`5 or 21`,`5 or 10`,`Always 21`],1,`It stays at i or moves to i + oldCapacity (5 + 16 = 21).`]},

{id:`hm-equals-hashcode`,t:`HashMap internals 10: equals() and hashCode()`,lvl:`I`,min:16,lab:`hashmap:collision`,
eli5:`hashCode() tells HashMap which locker to open; equals() tells it which bag in that locker is yours. If they disagree about who you are, HashMap either opens the wrong locker or doesn't recognise your bag.`,
body:`HashMap depends on two methods of the key:
- [[hashCode()]] chooses the **bucket**.
- [[equals()]] finds the exact **key inside** the bucket.

The contract: **objects that are equal must have equal hash codes.** Equal hash codes don't have to mean equal objects.

Break it and HashMap misbehaves:
- **equals() without hashCode()**: two "equal" keys usually get different (identity) hash codes, so they land in different buckets. You get duplicate keys, and [[get()]] with an equal-but-different object returns [[null]].
- **hashCode() without equals()**: equal keys reach the same bucket, but [[equals()]] still compares identity, so you still get duplicates.
- **Correct**: override **both**, using the **same fields**. Let your IDE generate them, use [[Objects.hash]], or use a **record**, which does it for you.`,
code:`class Point {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    @Override public boolean equals(Object o) {
        return o instanceof Point p && p.x == x && p.y == y;
    }
    // no hashCode(): the contract is broken
}

Map<Point, String> labels = new HashMap<>();
labels.put(new Point(1, 2), "start");
System.out.println(labels.get(new Point(1, 2)));   // null (almost always): different bucket

record Pt(int x, int y) {}                          // equals() and hashCode() generated from x and y
Map<Pt, String> ok = new HashMap<>();
ok.put(new Pt(1, 2), "start");
System.out.println(ok.get(new Pt(1, 2)));           // start`,
pro:`Use only fields that don't change while the object is a key (part 13), and make [[equals()]] and [[hashCode()]] agree exactly. [[Objects.hash]] is convenient but creates a small array on each call; for very hot keys, write [[31 * Integer.hashCode(x) + Integer.hashCode(y)]] or cache the hash in an immutable class, as [[String]] does.`,
trap:`Overriding equals() and forgetting hashCode(). The code compiles and passes simple tests, then HashMap and HashSet silently misbehave.`,
iq:[[`What is the equals/hashCode contract?`,`If a.equals(b) is true, a.hashCode() must equal b.hashCode(). The reverse isn't required; equal hash codes can belong to unequal objects. hashCode must also stay the same while the fields used by equals don't change.`],
[`What happens if you override equals() but not hashCode() for a HashMap key?`,`Equal keys usually get different identity hash codes, land in different buckets, and HashMap stores duplicates and can't find entries using an equal but different object.`]],
quiz:[`Point overrides equals() but not hashCode(). map.put(new Point(1,2), "a"); what does map.get(new Point(1,2)) usually return?`,[`"a"`,`null`,`It throws`,`An empty string`],1,`The new Point has a different identity hash code, so HashMap looks in a different bucket.`]},

{id:`hm-treeify`,t:`HashMap internals 11: Treeification (Java 8+)`,lvl:`A`,min:16,lab:`hashmap:treeify`,
eli5:`When one locker gets so crowded that pulling the whole chain takes ages, HashMap reorganises that locker like a phone book, sorted so it can jump to the right bag in a few steps.`,
body:`A long chain is slow: finding a key in a bucket of n nodes takes O(n). Java 8 fixed the worst case by turning crowded buckets into **red-black trees**, which take O(log n).

The rules, straight from the JDK source:
- **TREEIFY_THRESHOLD = 8.** When a new node is added to a bucket that **already holds 8 nodes**, the bucket is treeified.
- **MIN_TREEIFY_CAPACITY = 64.** If the table has **fewer than 64 buckets**, HashMap **resizes instead**, because spreading entries over more buckets usually fixes the crowding.
- **UNTREEIFY_THRESHOLD = 6.** When a resize splits a tree bucket and a half ends up with 6 or fewer nodes, it goes back to a list. The gap between 6 and 8 stops buckets flip-flopping.

How the tree orders keys: by hash first. Keys with equal hashes are ordered with [[compareTo()]] if they're [[Comparable]] and of the same class, otherwise by a tie-breaker. So [[Comparable]] keys such as [[String]] get the most benefit.

With a decent [[hashCode()]], trees almost never appear. They're a safety net against bad hash codes and attacks.`,
code:`// 16 different strings with the SAME hash code (each built from "Aa"/"BB" blocks)
List<String> keys = List.of("");
for (int i = 0; i < 4; i++) {
    keys = keys.stream().flatMap(k -> Stream.of(k + "Aa", k + "BB")).toList();
}
System.out.println(keys.stream().map(String::hashCode).distinct().toList());   // [-540425984]

Map<String, Integer> map = new HashMap<>(64);    // at least 64 buckets, so no "resize instead"
for (String k : keys) map.put(k, k.length());    // the 9th put finds 8 nodes in the bucket: treeify
System.out.println(map.get("BBAaBBAa"));         // 8   found by a tree search, not a list walk`,
pro:`Tree nodes are roughly twice the size of normal nodes, which is why the thresholds are high. Treeification is also why deliberately colliding keys can't freeze a Java 8+ server the way they could with older HashMaps. In the lab below, try "Treeify demo" with a small table first: you'll see it resize to 32 and 64 before the bucket finally becomes a tree.`,
trap:`Saying "a bucket becomes a tree at 8 entries". It only happens when adding to a bucket that already has 8 nodes, and only if the table has at least 64 buckets; otherwise HashMap resizes.`,
iq:[[`When does a HashMap bucket become a red-black tree?`,`In Java 8+, when a node is added to a bucket that already contains 8 (TREEIFY_THRESHOLD) and the table has at least 64 buckets (MIN_TREEIFY_CAPACITY). With a smaller table, HashMap resizes instead.`],
[`Why does HashMap use a tree and not always a list?`,`To cap the worst case. A bucket with many colliding keys costs O(n) as a list but O(log n) as a tree, which protects against bad hash codes and hash-flooding attacks.`]],
quiz:[`A bucket holds 8 colliding keys and the table has 16 buckets. What happens when a 9th colliding key is added?`,[`The bucket becomes a tree`,`The table resizes to 32`,`The key is rejected`,`Nothing special`],1,`Below 64 buckets HashMap resizes instead of treeifying.`]},

{id:`hm-java7-vs-java8`,t:`HashMap internals 12: Java 7 vs Java 8+`,lvl:`A`,lab:`hashmap:collision`,
eli5:`Java 8 remodelled the locker room: new bags go at the back of a chain instead of the front, crowded lockers become sorted shelves, and moving to a bigger room keeps every chain in order.`,
body:`HashMap was largely rewritten in Java 8. The differences show up in interviews and explain old production incidents:
- **Buckets**: Java 7 used linked lists only; Java 8 uses lists that become red-black trees when crowded.
- **Insertion**: Java 7 added new nodes at the **head** of a list; Java 8 adds them at the **tail**.
- **Resizing**: Java 7 recalculated every index and **reversed** each list while moving it; Java 8 splits each bucket into lo and hi lists and **keeps the order**.
- **Hash spreading**: Java 7 mixed bits with several shifts and XORs; Java 8 does a single [[h ^ (h >>> 16)]], because trees now handle the bad cases.
- **The infinite loop**: in Java 7, two threads resizing at once could link a bucket into a **cycle**, and a later [[get()]] would spin at 100% CPU forever. Java 8's order-preserving resize avoids that cycle, but HashMap is **still not thread-safe**: concurrent writes lose updates and can corrupt the map. Use [[ConcurrentHashMap]].`,
old:`// Java 7: new entries go to the HEAD of the bucket
void addEntry(int hash, K key, V value, int bucketIndex) {
    Entry<K, V> first = table[bucketIndex];
    table[bucketIndex] = new Entry<>(hash, key, value, first);
}`,
neu:`// Java 8+: new nodes go to the TAIL (inside putVal)
for (int binCount = 0; ; ++binCount) {
    if ((e = p.next) == null) {
        p.next = newNode(hash, key, value, null);
        if (binCount >= TREEIFY_THRESHOLD - 1) treeifyBin(tab, hash);
        break;
    }
    p = e;
}`,
oldLabel:`Java 7`,newLabel:`Java 8+`,
code:`// Still true in Java 8+: HashMap is NOT thread-safe
Map<Integer, Integer> map = new HashMap<>();
Thread t1 = new Thread(() -> { for (int i = 0; i < 50_000; i++) map.put(i, i); });
Thread t2 = new Thread(() -> { for (int i = 50_000; i < 100_000; i++) map.put(i, i); });
t1.start(); t2.start();
t1.join(); t2.join();
System.out.println(map.size());   // often less than 100000: updates were lost

Map<Integer, Integer> safe = new ConcurrentHashMap<>();   // the fix`,
pro:`Java 8 also added the Map default methods that make HashMap pleasant to use: [[getOrDefault]], [[putIfAbsent]], [[computeIfAbsent]], [[computeIfPresent]], [[compute]], [[merge]], [[forEach]] and [[replaceAll]]. Some Java 7 updates also briefly had an optional "alternative hashing" for String keys, which was removed in Java 8 once tree buckets made it unnecessary.`,
trap:`Believing Java 8 made HashMap thread-safe because the infinite-loop bug is gone. Concurrent writes still lose data.`,
iq:[[`Name three differences between HashMap in Java 7 and Java 8.`,`Java 8 turns crowded buckets into red-black trees, inserts new nodes at the tail instead of the head, and resizes by splitting buckets while preserving order (Java 7 recalculated indexes and reversed lists). It also simplified hash spreading.`],
[`Why could a Java 7 HashMap hang a thread?`,`Concurrent resizes with head insertion could link a bucket's nodes into a cycle; a later get() on that bucket would loop forever.`]],
quiz:[`Where does Java 7's HashMap insert a new node in a bucket?`,[`At the head`,`At the tail`,`In sorted order`,`In a new bucket`],0,`Java 7 inserted at the head; Java 8+ appends at the tail.`]},

{id:`hm-mutable-keys`,t:`HashMap internals 13: Why mutable keys are dangerous`,lvl:`I`,min:16,lab:`hashmap:mutable`,
eli5:`You put your bag in the locker for "Asha, blue jacket". Later you change into a red jacket and go looking in the "red jacket" locker. Your bag is still sitting in the blue one, but nobody will ever find it again.`,
body:`When you [[put]] a key, HashMap stores it in the bucket chosen by its hash code **at that moment**, and remembers that hash. If the fields used by [[hashCode()]] and [[equals()]] change afterwards:
- [[get(key)]] calculates the **new** hash and looks in a **different bucket**, returning [[null]] even though the entry is still inside.
- Even if it happened to look in the right bucket, the stored hash no longer matches.
- [[containsKey]] is [[false]], [[remove]] does nothing, but [[size()]] and iteration still show the entry: a **stranded entry** and a memory leak.

The rules:
- Use **immutable keys**: [[String]], [[Integer]], enums, records with immutable fields.
- Never change fields used in [[equals()]]/[[hashCode()]] while an object is a key (or a [[HashSet]] element).
- If you must change it: **remove, change, then put back**.`,
code:`class User {
    private String email;
    User(String email) { this.email = email; }
    void setEmail(String email) { this.email = email; }
    @Override public boolean equals(Object o) { return o instanceof User u && u.email.equals(email); }
    @Override public int hashCode() { return email.hashCode(); }
}

Map<User, String> roles = new HashMap<>();
User asha = new User("asha@old.com");
roles.put(asha, "ADMIN");                     // stored in bucket 4 (of 16)

asha.setEmail("asha@new.com");                // the key changes while it's inside the map

System.out.println(roles.get(asha));          // null   get() now looks in bucket 11
System.out.println(roles.containsKey(asha));  // false
System.out.println(roles.size());             // 1      the entry is still there, stranded
roles.remove(asha);                           // removes nothing`,
pro:`The same trap hits [[HashSet]] (its elements are the keys of an internal HashMap) and [[TreeMap]]/[[TreeSet]] if fields used by [[compareTo()]] change. Records are only shallowly immutable: a record holding an [[ArrayList]] is still a dangerous key if the list changes. JPA entities are a classic case: an [[equals()]]/[[hashCode()]] based on a generated id changes when the entity is first saved, which is why Hibernate's documentation recommends a stable business key.`,
trap:`Using an object as a key and later updating a field that equals() and hashCode() depend on.`,
iq:[[`Why should HashMap keys be immutable?`,`HashMap places an entry by the key's hash code at insertion time. If the key changes, get() calculates a different hash and searches the wrong bucket, so the entry becomes unreachable while still using memory.`],
[`A key object must change. How do you do it safely?`,`Remove the entry, change the object, then put it back, so it's stored under its new hash code.`]],
quiz:[`A key's email (used in hashCode) changes after put(). What does get(sameObject) return?`,[`The value`,`null`,`It throws ConcurrentModificationException`,`The value, but slower`],1,`get() computes the new hash and looks in the wrong bucket, so it returns null.`]},
];

// ---------------------------------------------------------------------------------------------
// Collections compared: the classic "X vs Y" questions
// ---------------------------------------------------------------------------------------------
const COMPARED: Lesson[] = [
{id:`arraylist-vs-linkedlist`,lab:`array:arraylist`,t:`ArrayList vs LinkedList`,lvl:`I`,min:8,
eli5:`An ArrayList is a row of numbered seats: you can jump to seat 500 instantly, but adding a seat in the middle makes everyone after it shuffle along. A LinkedList is a treasure hunt: adding a clue anywhere is easy once you're standing there, but reaching clue 500 means following 499 clues first.`,
body:`Both implement [[List]]: they keep insertion order, allow duplicates and allow [[null]]. The difference is the data structure underneath:
- **ArrayList** is a **resizable array**. [[get(i)]] is instant (O(1)). Adding at the end is O(1) on average (it grows by 50% when full). Inserting or removing in the middle shifts the elements after it, which is O(n).
- **LinkedList** is a **doubly linked list** of nodes. [[get(i)]] walks from the nearer end (O(n)). Adding or removing at either end is O(1); in the middle it's O(1) only once you're already there with an iterator. It also implements [[Deque]].

**In practice, use ArrayList.** Modern CPUs are very fast at reading contiguous arrays and slow at chasing pointers, and every LinkedList node adds about 24 bytes of overhead. Even "insert in the middle" is often faster with ArrayList at realistic sizes. For queues and stacks, [[ArrayDeque]] beats LinkedList too.`,
vs:{a:`ArrayList`,b:`LinkedList`,rows:[
[`Structure`,`Resizable array`,`Doubly linked list of nodes`],
[`get(index)`,`O(1)`,`O(n)`],
[`Add at the end`,`O(1) on average`,`O(1)`],
[`Add or remove at the start`,`O(n): shifts everything`,`O(1)`],
[`Add or remove in the middle`,`O(n): shifts the rest`,`O(n) to reach the spot, O(1) to link`],
[`Memory per element`,`One reference (plus spare capacity)`,`A node with two extra pointers`],
[`Iteration`,`Very fast (cache-friendly)`,`Slower (pointer chasing)`],
[`Also implements`,`[[RandomAccess]]`,`[[Deque]]`],
[`Use it for`,`Almost everything`,`Rarely; prefer [[ArrayDeque]] for queues`],
]},
code:`List<String> names = new ArrayList<>(List.of("Asha", "Ravi", "Meera"));
names.get(2);                       // O(1): straight to the slot
names.add(1, "Kiran");              // shifts Ravi and Meera one place right

LinkedList<String> queue = new LinkedList<>(names);
queue.addFirst("Zoya");             // O(1)
queue.removeLast();                 // O(1)

// The LinkedList trap: indexed loops are O(n²)
for (int i = 0; i < queue.size(); i++) {
    System.out.println(queue.get(i));   // each get(i) walks the list again
}
for (String n : queue) System.out.println(n);   // use an iterator (for-each) instead: O(n)`,
pro:`ArrayList starts with an empty array and allocates 10 slots on the first add, then grows to about 1.5× each time it's full; [[ensureCapacity]] and [[trimToSize]] let you manage that. The [[RandomAccess]] marker interface tells algorithms such as [[Collections.binarySearch]] that indexed access is fast. LinkedList's own author, Joshua Bloch, has joked that he never uses it.`,
trap:`Looping over a LinkedList with get(i). Every call walks the list from an end, so the loop is O(n²).`,
iq:[[`ArrayList vs LinkedList: which is faster for random access and why?`,`ArrayList: it's backed by an array, so get(i) is O(1). LinkedList has to walk node by node, which is O(n).`],
[`When would you choose LinkedList?`,`Rarely: when you constantly add and remove at the ends or through an iterator in the middle of a large list. For queue or stack use, ArrayDeque is usually faster.`]],
quiz:[`What is the time complexity of get(i) on a LinkedList?`,[`O(1)`,`O(log n)`,`O(n)`,`O(n log n)`],2,`It has to walk from the nearer end of the list to position i.`]},

{id:`hashset-vs-treeset`,t:`HashSet vs TreeSet (and LinkedHashSet)`,lvl:`I`,min:8,
eli5:`A HashSet is a bag of name tags: very quick to check whether a name is in it, but in no particular order. A TreeSet is an alphabetical register: a little slower, but always sorted, and you can ask "who comes after Meera?".`,
body:`All three store **unique** elements. They differ in order, speed and how they decide what "the same" means:
- **HashSet**: backed by a [[HashMap]]. [[add]], [[contains]] and [[remove]] are O(1) on average. **No order.** Uniqueness uses [[hashCode()]] and [[equals()]]. One [[null]] is allowed.
- **LinkedHashSet**: a HashSet that also remembers **insertion order**. Nearly as fast; a little more memory.
- **TreeSet**: backed by a [[TreeMap]] (a red-black tree). Operations are O(log n). Always **sorted**, by natural order or a [[Comparator]], with navigation methods such as [[first]], [[last]], [[floor]], [[ceiling]], [[headSet]] and [[tailSet]]. Uniqueness uses **[[compareTo()]] (or the comparator), not equals()**. No [[null]] with natural ordering.

Choose HashSet for fast "have I seen this?" checks, LinkedHashSet to remove duplicates but keep order, and TreeSet when you need sorted output or range queries.`,
vs:{a:`HashSet`,b:`TreeSet`,rows:[
[`Backed by`,`[[HashMap]]`,`[[TreeMap]] (red-black tree)`],
[`Order`,`None`,`Sorted (natural or Comparator)`],
[`add / contains / remove`,`O(1) on average`,`O(log n)`],
[`Duplicates decided by`,`[[hashCode()]] + [[equals()]]`,`[[compareTo()]] or the Comparator`],
[`null`,`One allowed`,`Not with natural ordering (NullPointerException)`],
[`Extra methods`,`None`,`[[first]], [[last]], [[floor]], [[ceiling]], [[headSet]], [[tailSet]], [[descendingSet]]`],
[`Elements must`,`Have good [[equals()]]/[[hashCode()]]`,`Be [[Comparable]], or you supply a Comparator`],
[`Use it for`,`Fast membership checks`,`Sorted output, ranges, "next higher"`],
]},
code:`List<String> tags = List.of("java", "spring", "sql", "java", "docker", "kafka");

new HashSet<>(tags);         // [spring, java, kafka, sql, docker]   order comes from the hash codes
new LinkedHashSet<>(tags);   // [java, spring, sql, docker, kafka]   insertion order, duplicates removed
TreeSet<String> sorted = new TreeSet<>(tags);   // [docker, java, kafka, spring, sql]

sorted.first();              // docker
sorted.ceiling("k");         // kafka   the smallest element >= "k"
sorted.headSet("spring");    // [docker, java, kafka]`,
more:[{cap:`The TreeSet surprise: the comparator decides what's a duplicate`,lang:`java`,src:`Set<String> byLength = new TreeSet<>(Comparator.comparingInt(String::length));
byLength.addAll(List.of("cat", "dog", "lion"));
System.out.println(byLength);    // [cat, lion]   "dog" was dropped: same length as "cat" = "equal"`}],
pro:`A TreeSet with a comparator that's inconsistent with [[equals()]] breaks the [[Set]] contract in surprising ways, as above. Break ties with [[thenComparing]] (for example by length, then alphabetically). Since Java 21, TreeSet and LinkedHashSet also implement [[SequencedSet]] ([[getFirst()]], [[getLast()]], [[reversed()]]).`,
trap:`Using a TreeSet comparator that compares only one field. Elements with the same value in that field are treated as duplicates and silently dropped.`,
iq:[[`HashSet vs TreeSet?`,`HashSet is backed by HashMap: unordered, O(1) average operations, uses hashCode/equals, allows one null. TreeSet is backed by TreeMap: sorted, O(log n), uses compareTo or a Comparator, offers navigation methods and rejects null with natural ordering.`],
[`How do you remove duplicates from a list but keep the original order?`,`new ArrayList<>(new LinkedHashSet<>(list)), or list.stream().distinct().toList().`]],
quiz:[`Which set keeps elements in insertion order?`,[`HashSet`,`TreeSet`,`LinkedHashSet`,`EnumSet`],2,`LinkedHashSet maintains a linked list of entries in insertion order.`]},

{id:`hashmap-vs-hashtable`,t:`HashMap vs Hashtable`,lvl:`I`,min:8,
eli5:`Hashtable is an old shop with one checkout counter that serves one customer at a time, even if they only want to look. HashMap is the modern shop with no queue rules at all, great with one customer, chaos with many. For many customers, you want ConcurrentHashMap.`,
body:`[[Hashtable]] is from **Java 1.0**; [[HashMap]] arrived with the Collections framework in Java 1.2. Today Hashtable is **legacy**:
- **Every method is synchronized** on the whole table. One thread at a time, even for reads, so it's slow when several threads use it.
- **No null keys or values** ([[NullPointerException]]).
- It still offers old-style [[Enumeration]]s and extends the obsolete [[Dictionary]] class.
- It never gained HashMap's modern internals, such as tree buckets.

[[HashMap]] isn't synchronized, allows one null key and null values, and is the right choice in single-threaded code. When several threads share a map, use **[[ConcurrentHashMap]]**, never Hashtable: it's thread-safe and much faster under concurrency.`,
vs:{a:`HashMap`,b:`Hashtable`,rows:[
[`Introduced`,`Java 1.2 (Collections framework)`,`Java 1.0 (legacy)`],
[`Thread-safe`,`No`,`Yes: every method synchronized`],
[`Performance`,`Fast`,`Slow under contention (one lock for everything)`],
[`null keys / values`,`One null key, any number of null values`,`Neither: NullPointerException`],
[`Iteration`,`Fail-fast [[Iterator]]`,`[[Enumeration]] (not fail-fast) or fail-fast Iterator`],
[`Superclass`,`[[AbstractMap]]`,`[[Dictionary]] (obsolete)`],
[`Crowded buckets`,`List, then tree (Java 8+)`,`List only`],
[`Default capacity`,`16 (power of two)`,`11`],
[`Use today`,`Single-threaded code`,`Don't: use [[ConcurrentHashMap]]`],
]},
code:`Map<String, Integer> hm = new HashMap<>();
hm.put(null, 1);                     // fine
hm.put("a", null);                   // fine

Map<String, Integer> ht = new Hashtable<>();
// ht.put(null, 1);                  // NullPointerException
// ht.put("a", null);                // NullPointerException

// Even a synchronized map doesn't make "check then act" safe:
if (!ht.containsKey("visits")) {     // another thread can put() right here...
    ht.put("visits", 1);             // ...and this overwrites it
}
ht.putIfAbsent("visits", 1);         // one atomic call: correct`,
pro:`Synchronizing each method makes each call atomic, not a sequence of calls. That's why check-then-act code (containsKey then put, get then put) is still broken on Hashtable and [[Collections.synchronizedMap]]; use atomic methods such as [[putIfAbsent]], [[compute]] and [[merge]] on a ConcurrentHashMap instead.`,
trap:`Choosing Hashtable "for thread safety". It's slower than ConcurrentHashMap and still doesn't make multi-step operations safe.`,
iq:[[`HashMap vs Hashtable?`,`Hashtable is a Java 1.0 legacy class: synchronized on every method, no null keys or values, extends Dictionary. HashMap is unsynchronized, allows one null key and null values and has modern internals. For thread safety use ConcurrentHashMap instead of Hashtable.`],
[`Why doesn't Hashtable allow null?`,`It calls key.hashCode() and value checks directly, so a null throws NullPointerException; and in a concurrent map, a null result from get() would be ambiguous (missing or mapped to null).`]],
quiz:[`Which of these accepts a null key?`,[`Hashtable`,`HashMap`,`ConcurrentHashMap`,`None of them`],1,`HashMap allows one null key; Hashtable and ConcurrentHashMap throw NullPointerException.`]},

{id:`hashmap-vs-concurrenthashmap`,t:`HashMap vs ConcurrentHashMap`,lvl:`A`,min:8,
eli5:`A HashMap is a whiteboard anyone can scribble on at the same time, so words get mangled. A ConcurrentHashMap is a whiteboard split into many small squares, each with its own marker: people write in different squares at the same time, and only wait if they want the same square.`,
body:`[[HashMap]] is **not thread-safe**: concurrent writes can lose updates and corrupt its internals. [[ConcurrentHashMap]] is built for many threads:
- **Fine-grained locking.** In Java 8+, putting into an empty bucket uses a lock-free CAS operation; updating a non-empty bucket locks only that bucket (by synchronizing on its first node). Threads working on different buckets never wait for each other.
- **Lock-free reads.** [[get()]] doesn't lock.
- **Atomic compound operations**: [[putIfAbsent]], [[computeIfAbsent]], [[compute]], [[merge]] and [[replace]] do check-and-update as one step.
- **No null keys or values**, so [[get()]] returning [[null]] always means "absent".
- **Weakly consistent iterators**: no [[ConcurrentModificationException]]; they may or may not show changes made during iteration.
- Under concurrent updates, [[size()]] is an estimate; [[mappingCount()]] returns a [[long]].

Use HashMap inside one thread (or when the map is never changed after being published safely), and ConcurrentHashMap whenever several threads read and write it.`,
vs:{a:`HashMap`,b:`ConcurrentHashMap`,rows:[
[`Thread-safe`,`No`,`Yes`],
[`Locking`,`None`,`Per bucket (CAS + synchronized on the first node)`],
[`Reads`,`No locking (unsafe with writers)`,`Lock-free and safe`],
[`null keys / values`,`Allowed`,`Not allowed`],
[`Iterators`,`Fail-fast (throw CME)`,`Weakly consistent (never throw CME)`],
[`Atomic compound ops`,`Not atomic`,`[[putIfAbsent]], [[compute]], [[merge]] are atomic`],
[`size() with concurrent writes`,`Wrong or corrupted`,`An estimate ([[mappingCount()]] for long)`],
[`Speed in one thread`,`Slightly faster`,`Slightly slower`],
[`Java 7 design`,`n/a`,`16 "segments", each a small locked table`],
]},
code:`List<String> words = List.of("java", "spring", "java", "sql", "java", "spring");

Map<String, Integer> counts = new ConcurrentHashMap<>();
words.parallelStream().forEach(w -> counts.merge(w, 1, Integer::sum));   // atomic per key
System.out.println(counts);          // {spring=2, java=3, sql=1}  always correct

Map<String, Integer> broken = new HashMap<>();
words.parallelStream().forEach(w -> broken.merge(w, 1, Integer::sum));   // races: lost counts, corruption

// Lazily create shared objects exactly once per key:
Map<String, List<String>> byCourse = new ConcurrentHashMap<>();
byCourse.computeIfAbsent("spring", k -> new CopyOnWriteArrayList<>()).add("Asha");`,
pro:`Keep the functions you pass to [[computeIfAbsent]] and [[compute]] short, and never modify the same map from inside them: the bucket is locked while they run, so a slow function blocks other writers, and a recursive update can throw [[IllegalStateException]]. For counters under heavy contention, [[map.computeIfAbsent(k, x -> new LongAdder()).increment()]] scales even better than [[merge]].`,
trap:`Writing if (!map.containsKey(k)) map.put(k, v) on a ConcurrentHashMap. Each call is safe, but the pair isn't; use putIfAbsent or computeIfAbsent.`,
iq:[[`How does ConcurrentHashMap achieve thread safety in Java 8+?`,`It uses CAS to place the first node in an empty bucket and synchronizes on a bucket's first node for other updates, so only that bucket is locked. Reads are lock-free, and resizing is done cooperatively by the threads using the map.`],
[`Why doesn't ConcurrentHashMap allow null keys or values?`,`Because get() returning null would be ambiguous between "absent" and "mapped to null", and in a concurrent map you can't safely follow up with containsKey() to find out.`]],
quiz:[`Which is an atomic way to increment a counter in a ConcurrentHashMap?`,[`map.put(k, map.get(k) + 1)`,`map.merge(k, 1, Integer::sum)`,`if (map.containsKey(k)) map.put(k, map.get(k) + 1)`,`map.get(k) + 1`],1,`merge() reads and updates the key's value as one atomic step.`]},

{id:`hashmap-vs-linkedhashmap`,t:`HashMap vs LinkedHashMap`,lvl:`I`,min:8,
eli5:`A HashMap is a pile of index cards: easy to find any card, but in no order. A LinkedHashMap is the same pile with a string threaded through the cards in the order you added them (or the order you last used them), so you can walk them in that order.`,
body:`[[LinkedHashMap]] is a [[HashMap]] plus a **doubly linked list running through all its entries**. That list gives it a predictable iteration order:
- **Insertion order** (the default): entries come out in the order they were first put. Re-putting an existing key doesn't move it.
- **Access order** ([[new LinkedHashMap<>(16, 0.75f, true)]]): every [[get]] or [[put]] moves the entry to the end, so the first entry is always the **least recently used**. Combined with [[removeEldestEntry]], that's an **LRU cache** in a few lines.

Everything else is HashMap: O(1) operations, one null key, not thread-safe. It costs a little more memory (two extra pointers per entry) and is slightly slower to change.

Use LinkedHashMap when order matters: JSON output that should keep field order, "recently viewed" lists, caches. Use HashMap when it doesn't.`,
vs:{a:`HashMap`,b:`LinkedHashMap`,rows:[
[`Iteration order`,`Unpredictable (can change on resize)`,`Insertion order, or access order`],
[`Internals`,`Hash table`,`Hash table + doubly linked list through entries`],
[`get / put`,`O(1)`,`O(1), slightly more work`],
[`Memory`,`Less`,`Two extra pointers per entry`],
[`Iterating`,`Visits every bucket (proportional to capacity)`,`Follows the list (proportional to size)`],
[`LRU cache`,`No`,`Yes: access order + [[removeEldestEntry]]`],
[`Java 21 sequenced methods`,`No`,`[[firstEntry]], [[lastEntry]], [[pollFirstEntry]], [[putFirst]], [[reversed]]`],
[`Use it for`,`Order doesn't matter`,`Order matters, caches`],
]},
code:`Map<String, Integer> hash = new HashMap<>();
Map<String, Integer> linked = new LinkedHashMap<>();
for (String k : List.of("mango", "apple", "zebra")) { hash.put(k, 1); linked.put(k, 1); }
System.out.println(hash.keySet());     // [zebra, apple, mango]  order comes from the hash codes
System.out.println(linked.keySet());   // [mango, apple, zebra]  insertion order`,
more:[{cap:`An LRU cache in eight lines (LinkedHashMap is designed to be extended this way)`,lang:`java`,src:`class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int max;
    LruCache(int max) { super(16, 0.75f, true); this.max = max; }   // true = access order

    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > max;                                         // evict the least recently used
    }
}

LruCache<String, String> cache = new LruCache<>(2);
cache.put("a", "A"); cache.put("b", "B");
cache.get("a");                 // "a" is now the most recently used
cache.put("c", "C");            // evicts "b"
System.out.println(cache.keySet());   // [a, c]`}],
pro:`Iterating a HashMap walks every bucket, including empty ones, so a huge, mostly empty HashMap iterates slowly; a LinkedHashMap follows its list and only visits real entries. For caches in production, prefer a library such as Caffeine (size and time limits, statistics, concurrency), but the LinkedHashMap LRU is perfect for small, single-threaded caches and interviews.`,
trap:`Relying on a HashMap's iteration order. It depends on hash codes and capacity and can change when the map grows or between Java versions.`,
iq:[[`How does LinkedHashMap maintain order?`,`Each entry also has before and after pointers forming a doubly linked list, in insertion order by default or in access order when created with accessOrder = true.`],
[`How do you build an LRU cache with LinkedHashMap?`,`Create it with accessOrder = true and override removeEldestEntry() to return true when size() exceeds the limit.`]],
quiz:[`With accessOrder = true, what does get(key) do to the entry?`,[`Nothing`,`Moves it to the end (most recently used)`,`Moves it to the front`,`Removes it`],1,`In access order, every access moves the entry to the end of the list.`]},

{id:`comparable-vs-comparator`,t:`Comparable vs Comparator`,lvl:`I`,min:8,
eli5:`Comparable is a label a product is born with, its natural order (like a book's shelf number). Comparator is a sorting instruction you can write any time: by price, by rating, by newest, without touching the product.`,
body:`Both define how to order objects. The difference is **where** the ordering lives and **how many** you can have:
- **Comparable**: the class orders **itself** by implementing [[Comparable<T>]] and its [[compareTo(T other)]] method. That's the object's **natural order**, and there's only one. [[Collections.sort(list)]], [[TreeSet]] and [[TreeMap]] use it by default. [[String]], [[Integer]] and [[LocalDate]] are Comparable.
- **Comparator**: a **separate** object with a [[compare(a, b)]] method. You can have **as many as you like**, and you can sort classes you can't modify. Since Java 8 you rarely write one by hand: [[Comparator.comparing]], [[thenComparing]], [[reversed]], [[nullsFirst]] and [[comparingInt]] build them for you.

Rule of thumb: give a class a Comparable natural order only if there's one obvious way to order it (by id, by date). Use Comparators for everything else, such as the different sort options on a web page.`,
vs:{a:`Comparable`,b:`Comparator`,rows:[
[`Package`,`[[java.lang]]`,`[[java.util]]`],
[`Method`,`[[compareTo(T other)]]`,`[[compare(T a, T b)]]`],
[`Defined`,`Inside the class being sorted`,`Outside, as a separate object or lambda`],
[`How many orders`,`One (the natural order)`,`As many as you need`],
[`Need to change the class?`,`Yes`,`No: works for any class`],
[`Java 8 helpers`,`None`,`[[comparing]], [[thenComparing]], [[reversed]], [[nullsFirst]]`],
[`Used by`,`[[Collections.sort(list)]], [[TreeSet]], [[TreeMap]] by default`,`[[list.sort(cmp)]], [[new TreeSet<>(cmp)]], [[stream.sorted(cmp)]]`],
]},
code:`record Employee(int id, String name, double salary) implements Comparable<Employee> {
    @Override public int compareTo(Employee other) {
        return Integer.compare(id, other.id);          // natural order: by id
    }
}

List<Employee> staff = new ArrayList<>(List.of(
        new Employee(3, "Ravi", 90_000), new Employee(1, "Asha", 120_000), new Employee(2, "Meera", 90_000)));

Collections.sort(staff);                                // by id (Comparable)

staff.sort(Comparator.comparingDouble(Employee::salary).reversed()
        .thenComparing(Employee::name));                // salary high to low, then name (Comparator)`,
pro:`Never compare with subtraction ([[return a.age - b.age]]): it overflows for large values and gives wrong orders. Use [[Integer.compare]] or [[Comparator.comparingInt]]. Keep natural orders **consistent with equals()** (compareTo returns 0 exactly when equals is true), or sorted sets and maps will treat unequal objects as duplicates. The lesson "Sorting objects" covers more comparator techniques.`,
trap:`Implementing compareTo with subtraction. It works in tests with small numbers and fails in production with large ones.`,
iq:[[`Comparable vs Comparator?`,`Comparable is implemented by the class itself (compareTo) and defines its single natural order. Comparator is a separate object (compare) that can define any number of orderings, including for classes you can't change.`],
[`How do you sort by salary descending, then by name?`,`list.sort(Comparator.comparingDouble(Employee::salary).reversed().thenComparing(Employee::name)).`]],
quiz:[`Which interface would you use to sort a class from a library you can't change?`,[`Comparable`,`Comparator`,`Iterable`,`Cloneable`],1,`A Comparator is defined outside the class, so it works for any class.`]},

{id:`iterator-vs-listiterator`,t:`Iterator vs ListIterator`,lvl:`I`,min:8,
eli5:`An Iterator is a one-way escalator through a collection: forward only, and you can take things off as you pass. A ListIterator is a lift in a list: up and down, it knows which floor it's on, and you can swap or add things on the way.`,
body:`Both walk through elements and let you change the collection **safely while iterating**.
- **Iterator** works with **every** collection. Methods: [[hasNext()]], [[next()]], [[remove()]] and (Java 8) [[forEachRemaining()]]. Forward only.
- **ListIterator** extends Iterator and works only with **lists** ([[list.listIterator()]], or [[listIterator(index)]] to start in the middle). It adds:
  - **both directions**: [[hasPrevious()]] and [[previous()]];
  - **positions**: [[nextIndex()]] and [[previousIndex()]];
  - **changes**: [[set(e)]] replaces the last returned element, [[add(e)]] inserts at the current position.

Use a for-each loop to just read, an Iterator to remove while looping (or simply [[removeIf]]), and a ListIterator to replace, insert or walk backwards.`,
vs:{a:`Iterator`,b:`ListIterator`,rows:[
[`Works with`,`Any Collection`,`Lists only`],
[`Direction`,`Forward`,`Forward and backward`],
[`Start position`,`The beginning`,`Anywhere: [[listIterator(index)]]`],
[`Remove`,`[[remove()]]`,`[[remove()]]`],
[`Replace`,`No`,`[[set(e)]]`],
[`Insert`,`No`,`[[add(e)]]`],
[`Index`,`No`,`[[nextIndex()]], [[previousIndex()]]`],
]},
code:`List<String> names = new ArrayList<>(List.of("asha", "ravi", "meera"));

Iterator<String> it = names.iterator();
while (it.hasNext()) {
    if (it.next().startsWith("r")) it.remove();     // safe removal while iterating
}

ListIterator<String> li = names.listIterator();
while (li.hasNext()) {
    String n = li.next();
    li.set(n.substring(0, 1).toUpperCase() + n.substring(1));   // replace in place: Asha, Meera
    if (n.equals("asha")) li.add("Kiran");                      // insert after Asha
}
System.out.println(names);                          // [Asha, Kiran, Meera]

while (li.hasPrevious()) System.out.print(li.previous() + " ");   // Meera Kiran Asha`,
pro:`[[remove()]] and [[set()]] act on the element most recently returned by [[next()]] or [[previous()]]; calling them before [[next()]], twice in a row, or [[set()]] after [[add()]] throws [[IllegalStateException]]. Changing the list directly (not through the iterator) during iteration throws [[ConcurrentModificationException]] on the next step (see "Fail-fast vs fail-safe").`,
trap:`Calling list.remove(x) inside a for-each loop over the same list. Use iterator.remove() or list.removeIf(...).`,
iq:[[`Iterator vs ListIterator?`,`Iterator works on any collection and only moves forward, with remove(). ListIterator works on lists, moves both ways, knows the index and can also set() and add() elements.`],
[`How do you remove elements from a list while iterating?`,`Use iterator.remove() inside an explicit Iterator loop, or list.removeIf(predicate). Calling list.remove() inside a for-each loop throws ConcurrentModificationException.`]],
quiz:[`Which method is available on ListIterator but not on Iterator?`,[`next()`,`remove()`,`previous()`,`hasNext()`],2,`Only ListIterator can move backwards.`]},

{id:`fail-fast-vs-fail-safe`,t:`Fail-fast vs fail-safe iterators`,lvl:`I`,min:8,
eli5:`A fail-fast iterator is a strict librarian: if anyone rearranges the shelf while you're reading down it, she stops you immediately. A fail-safe iterator is a photocopy of the shelf list: you can read it in peace, but it won't show books added after the copy was made.`,
body:`What happens when a collection changes while you're iterating over it?
- **Fail-fast** iterators (ArrayList, HashMap, HashSet, LinkedList…) throw **[[ConcurrentModificationException]]** as soon as they notice the collection was **structurally modified** other than through the iterator itself. Each collection keeps a modification counter ([[modCount]]); the iterator compares it with the value it expected.
- **Fail-safe** iterators (the Javadoc calls them **snapshot** or **weakly consistent**) never throw:
  - [[CopyOnWriteArrayList]] iterates over a **snapshot** of the array taken when iteration began, so it never sees later changes.
  - [[ConcurrentHashMap]] and [[ConcurrentLinkedQueue]] iterators are **weakly consistent**: they reflect some changes made during iteration, and never fail.

Fail-fast behaviour is a **bug detector**, and the most common trigger is a single thread removing items inside a for-each loop. The fix is [[iterator.remove()]] or [[removeIf]].`,
vs:{a:`Fail-fast`,b:`Fail-safe (snapshot / weakly consistent)`,rows:[
[`Throws ConcurrentModificationException`,`Yes`,`Never`],
[`How it works`,`Checks [[modCount]] on each step`,`Iterates a snapshot, or tolerates concurrent changes`],
[`Sees changes made during iteration`,`No: it throws`,`Snapshot: never; weakly consistent: maybe`],
[`Examples`,`[[ArrayList]], [[HashMap]], [[HashSet]], [[LinkedList]]`,`[[CopyOnWriteArrayList]], [[ConcurrentHashMap]], [[ConcurrentLinkedQueue]]`],
[`Thread-safe`,`No`,`Yes`],
[`Extra cost`,`None`,`Copy-on-write copies the whole array on every write`],
[`Purpose`,`Detect bugs early`,`Allow changes while others iterate`],
]},
code:`List<String> names = new ArrayList<>(List.of("Asha", "Ravi", "Meera"));

for (String n : names) {
    if (n.startsWith("R")) names.remove(n);      // ConcurrentModificationException on the next step
}
names.removeIf(n -> n.startsWith("R"));          // the fix

List<String> listeners = new CopyOnWriteArrayList<>(List.of("email", "sms"));
for (String l : listeners) {
    listeners.add("push");                       // no exception: the loop sees the old snapshot
}
System.out.println(listeners);                   // [email, sms, push, push]`,
pro:`Fail-fast checking is "best effort": [[modCount]] isn't volatile, so with several threads the exception may never come; never use it as a thread-safety mechanism. "Fail-safe" is an interview term, not a Javadoc term; say "snapshot" for copy-on-write collections and "weakly consistent" for concurrent ones. Copy-on-write collections suit read-mostly data such as listener lists and configuration, not frequently updated lists.`,
trap:`Removing items inside a for-each loop over an ArrayList. It throws ConcurrentModificationException even with a single thread.`,
iq:[[`Fail-fast vs fail-safe iterators?`,`Fail-fast iterators (ArrayList, HashMap) throw ConcurrentModificationException when the collection is structurally modified outside the iterator, using a modCount check. Fail-safe (snapshot or weakly consistent) iterators of concurrent collections never throw: CopyOnWriteArrayList iterates a snapshot, ConcurrentHashMap tolerates concurrent changes.`],
[`Can ConcurrentModificationException happen with a single thread?`,`Yes, that's the most common case: modifying a collection directly (for example list.remove()) inside a for-each loop over it.`]],
quiz:[`You add to a CopyOnWriteArrayList inside a for-each loop over it. What happens?`,[`ConcurrentModificationException`,`An infinite loop`,`The loop finishes over the old snapshot`,`The new element is visited immediately`],2,`Copy-on-write iterators work on a snapshot taken when iteration began.`]},
];

export const EXTRA_STAGES: { after: string; stage: Stage }[] = [
  {
    after: 'core',
    stage: {
      id: 'hashmap-internals',
      title: 'HashMap internals',
      level: 'I',
      blurb: 'A 13-part deep dive with an interactive lab: hashing, buckets, put and get, collisions, load factor, resizing, treeification and the traps.',
      lessons: HASHMAP_SERIES,
    },
  },
  {
    after: 'hashmap-internals',
    stage: {
      id: 'collections-compared',
      title: 'Collections compared',
      level: 'I',
      blurb: 'The classic "X vs Y" questions side by side: lists, sets, maps, sorting, iterators and fail-fast behaviour.',
      lessons: COMPARED,
    },
  },
];

export const EXTRA_LESSONS: { stage: string; after: string; lessons: Lesson[] }[] = [
  { stage: 'oop', after: 'interfaces', lessons: OOP_PRACTICE },
  { stage: 'concurrency', after: 'sync', lessons: [EXECUTORS] },
];
