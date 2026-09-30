import { SubTopic } from '../core/models';

/** Subtopics for object-oriented programming and the core APIs. Keyed by lesson id. */
export const SUBTOPICS_B: Record<string, SubTopic[]> = {
  classes: [
    { id: 'class-object', t: 'Classes and objects', body: `A **class** is a blueprint; an **object** is one thing built from it. [[new]] creates the object on the heap and returns a reference to it. Several variables can point at the same object.`, code: `Car a = new Car("Nexon");
Car b = a;              // same object, two references
b.rename("Harrier");
System.out.println(a.name());   // Harrier` },
    { id: 'fields-methods', t: 'Fields and methods: state and behaviour', body: `Fields hold an object's **state**; methods define its **behaviour** and usually read or change that state. Keep fields private and expose meaningful methods ([[deposit]], [[withdraw]]) rather than raw setters.`, code: `public class Account {
    private long balancePaise;

    public void deposit(long paise) {
        if (paise <= 0) throw new IllegalArgumentException("amount must be positive");
        balancePaise += paise;
    }

    public long balance() { return balancePaise; }
}` },
    { id: 'constructors', t: 'Constructors and constructor chaining', body: `A constructor has the class name and no return type. If you write none, Java adds a no-argument one. Overload constructors for different ways to create an object, and chain them with [[this(...)]] so the logic lives in one place.`, code: `public class Course {
    private final String title;
    private final int priceInr;

    public Course(String title) {
        this(title, 0);                     // free by default
    }

    public Course(String title, int priceInr) {
        if (title == null || title.isBlank()) throw new IllegalArgumentException("title required");
        this.title = title;
        this.priceInr = priceInr;
    }
}` },
    { id: 'this-vs-super', t: 'Constructor chaining: this() vs super()', body: `- [[this(...)]] calls **another constructor of the same class**, so shared set-up code lives in one place.
- [[super(...)]] calls a **constructor of the parent class**, so the parent part of the object is built first.
- Either call must be the **first statement** in a constructor, so you can't use both in the same constructor.
- If you write neither, the compiler inserts [[super()]] for you. If the parent has no no-argument constructor, that fails to compile, and you must call [[super(args)]] yourself.
- Since Java 25, statements that don't touch [[this]] (such as validating arguments) may come before [[this(...)]] or [[super(...)]].`, code: `class Person {
    protected final String name;
    Person(String name) { this.name = name; }            // no no-arg constructor
}

class Employee extends Person {
    private final String dept;

    Employee(String name) {
        this(name, "General");                           // this(): reuse the other constructor
    }

    Employee(String name, String dept) {
        super(name);                                     // super(): build the Person part first
        this.dept = dept;
    }
}` },
    { id: 'this', t: 'The this keyword', body: `[[this]] is the current object. Use it to tell a field apart from a parameter with the same name, to pass the current object to another method, or to call another constructor ([[this(...)]]).` },
    { id: 'init-order', t: 'Initialisation order', body: `When an object is created: static fields and static blocks run once when the class first loads; then, for each object, field initialisers and instance blocks run in order, then the constructor body. With inheritance, the parent's part is built first.`, code: `class Demo {
    static { System.out.println("1. class loaded (once)"); }
    private int x = log("2. field initialiser");
    { System.out.println("3. instance block"); }
    Demo() { System.out.println("4. constructor"); }
    static int log(String s) { System.out.println(s); return 0; }
}` },
    { id: 'encapsulation', t: 'Encapsulation, getters and setters', body: `Hide fields ([[private]]) and control access through methods, so you can validate input and change the internals later without breaking callers. Don't add a setter for everything; many fields should be set once, in the constructor. For plain data carriers, use a **record**.` },
    { id: 'static-members', t: 'Static members vs instance members', body: `Static fields are shared by all objects of the class (a counter, a constant); instance fields belong to each object. See the lesson on static and final for the details and pitfalls.` },
  ],
  pillars: [
    { id: 'inheritance', t: 'Inheritance with extends', body: `A subclass **extends** a superclass, inheriting its fields and methods (an "is-a" relationship). A class can extend only one class. Call the parent's constructor with [[super(...)]]; it must be the first statement.`, code: `class Employee {
    protected final String name;
    Employee(String name) { this.name = name; }
    double pay() { return 50_000; }
}

class Manager extends Employee {
    Manager(String name) { super(name); }
    @Override double pay() { return super.pay() * 1.5; }
}` },
    { id: 'overriding', t: 'Method overriding rules', body: `An override has the same name and parameters. It may return a subtype (covariant return), can't reduce visibility, and can't throw broader checked exceptions. [[static]], [[private]] and [[final]] methods can't be overridden. Always add [[@Override]] so the compiler catches mistakes.` },
    { id: 'polymorphism', t: 'Polymorphism', body: `**Runtime** polymorphism: a parent-type variable can hold any subtype, and the JVM calls the object's own override (dynamic dispatch). **Compile-time** polymorphism is overloading. This is what lets you write code against an abstraction and plug in new types later.`, code: `List<Employee> staff = List.of(new Employee("Ravi"), new Manager("Asha"));
for (Employee e : staff) {
    System.out.println(e.name + ": " + e.pay());   // each object's own pay()
}` },
    { id: 'abstraction', t: 'Abstraction and abstract classes', body: `An **abstract class** can't be instantiated and may declare abstract methods that subclasses must implement, alongside shared fields and code. Use it when related classes share state and behaviour; use an interface when you only need a contract.`, code: `abstract class Shape {
    abstract double area();
    String describe() { return getClass().getSimpleName() + " of area " + area(); }
}

class Circle extends Shape {
    private final double r;
    Circle(double r) { this.r = r; }
    double area() { return Math.PI * r * r; }
}` },
    { id: 'casting-objects', t: 'Upcasting, downcasting and instanceof', body: `Upcasting (child to parent) is automatic. Downcasting needs a check, or it throws [[ClassCastException]]. Since Java 16, pattern matching for [[instanceof]] checks and casts in one step.`, code: `Employee e = new Manager("Asha");     // upcast
if (e instanceof Manager m) {         // check + cast (Java 16)
    System.out.println(m.name + " is a manager");
}`, min: 16 },
    { id: 'composition', t: 'Composition over inheritance', body: `Inheritance ties classes tightly: a change in the parent can break every child. **Composition** (a class holding other objects, "has-a") is usually more flexible: you can swap parts and combine behaviour freely. Inherit only when the child truly is a special kind of the parent.`, code: `class OrderService {
    private final PaymentGateway gateway;   // has-a: swap Razorpay for another gateway easily
    private final Notifier notifier;
    OrderService(PaymentGateway gateway, Notifier notifier) {
        this.gateway = gateway;
        this.notifier = notifier;
    }
}` },
  ],
  interfaces: [
    { id: 'basics', t: 'Interfaces as contracts', body: `An interface lists what a type can do, not how. A class can implement **many** interfaces. Interface fields are implicitly [[public static final]] constants, and methods are public.`, code: `interface Payable { long amountPaise(); }
interface Refundable { void refund(); }

class Order implements Payable, Refundable {
    public long amountPaise() { return 149_900; }
    public void refund() { /* ... */ }
}` },
    { id: 'default-static', t: 'Default, static and private methods', body: `Since Java 8, interfaces can have **default** methods (so new methods don't break existing implementations) and **static** helper methods. Java 9 added **private** methods to share code between defaults.`, code: `interface Discountable {
    long pricePaise();

    default long priceAfter(int percent) { return round(pricePaise() * (100 - percent) / 100.0); }

    static Discountable of(long paise) { return () -> paise; }

    private long round(double v) { return Math.round(v); }
}` },
    { id: 'diamond', t: 'When two defaults clash', body: `If a class inherits the same default method from two interfaces, it must override it and can pick one with [[Interface.super.method()]]. A method from a superclass always wins over an interface default.`, code: `interface A { default String hi() { return "A"; } }
interface B { default String hi() { return "B"; } }

class C implements A, B {
    @Override public String hi() { return A.super.hi() + B.super.hi(); }
}` },
    { id: 'functional', t: 'Functional interfaces', body: `An interface with exactly one abstract method is **functional** and can be implemented with a lambda. [[@FunctionalInterface]] makes the compiler enforce that. [[Runnable]], [[Comparator]] and everything in [[java.util.function]] are functional interfaces.` },
    { id: 'abstract-vs-interface', t: 'Abstract class or interface?', body: `- **Interface**: a capability many unrelated classes can share; no instance state; a class can implement several.
- **Abstract class**: shared state and code for closely related classes; constructors; a class can extend only one.

Default to interfaces for APIs and dependencies (they're easy to mock and swap); reach for an abstract class to share implementation between siblings.` },
    { id: 'sealed', t: 'Sealed interfaces (Java 17)', body: `A **sealed** interface lists exactly which types may implement it, so switches over it can be checked for completeness. Great for modelling a fixed set of cases, such as payment results.`, code: `sealed interface PaymentResult permits Paid, Failed, Pending {}
record Paid(String paymentId) implements PaymentResult {}
record Failed(String reason) implements PaymentResult {}
record Pending() implements PaymentResult {}`, min: 17 },
  ],
  object: [
    { id: 'object-methods', t: 'The methods every object has', body: `Every class extends [[Object]], inheriting [[equals]], [[hashCode]], [[toString]], [[getClass]], [[clone]], [[wait]] and [[notify]]. [[finalize]] is deprecated for removal; use try-with-resources or a [[Cleaner]] to release resources.` },
    { id: 'equals-contract', t: 'The equals contract', body: `[[equals]] must be reflexive ([[a.equals(a)]]), symmetric, transitive, consistent, and return [[false]] for [[null]]. Compare the fields that define identity, and use [[getClass()]] or a final class to keep symmetry with subclasses.`, code: `@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Point p)) return false;
    return x == p.x && y == p.y;
}` },
    { id: 'hashcode-contract', t: 'The hashCode contract', body: `Objects that are [[equals]] **must** have the same [[hashCode]], or [[HashMap]] and [[HashSet]] will lose them. Unequal objects may share a hash, but fewer collisions is faster. [[Objects.hash]] combines fields for you.`, code: `@Override
public int hashCode() {
    return Objects.hash(x, y);
}` },
    { id: 'tostring', t: 'A useful toString', body: `The default [[toString]] prints the class name and a hash ([[Point@1b6d3586]]). Override it with the fields that help debugging and logs, but never include passwords or tokens.` },
    { id: 'cloning', t: 'Copying objects: clone vs copy constructors', body: `[[clone()]] needs the [[Cloneable]] marker interface, makes a **shallow** copy by default (nested objects are shared) and is awkward to get right. Prefer a copy constructor or a static factory, and copy nested mutable objects yourself (a deep copy).`, code: `public class Cart {
    private final List<String> items;
    public Cart(List<String> items) { this.items = new ArrayList<>(items); }
    public Cart(Cart other) { this(other.items); }   // copy constructor (deep enough here)
}` },
    { id: 'records', t: 'Records do it for you', body: `A [[record]] generates [[equals]], [[hashCode]] and [[toString]] from its components, correctly. For immutable data, a record is the simplest way to follow the Object contract.`, code: `record Point(int x, int y) {}
new Point(1, 2).equals(new Point(1, 2));   // true
new Point(1, 2).toString();                 // "Point[x=1, y=2]"`, min: 16 },
  ],
  exceptions: [
    { id: 'hierarchy', t: 'The exception hierarchy', body: `Everything thrown extends [[Throwable]]:
- [[Error]]: serious JVM problems such as [[OutOfMemoryError]] and [[StackOverflowError]]. Don't catch these.
- [[Exception]]: problems a program can handle.
- [[RuntimeException]] (a subclass of [[Exception]]): programming errors such as [[NullPointerException]], [[IllegalArgumentException]] and [[IndexOutOfBoundsException]].` },
    { id: 'checked-unchecked', t: 'Checked vs unchecked exceptions', body: `**Checked** exceptions ([[IOException]], [[SQLException]]) must be caught or declared with [[throws]]; the compiler enforces it. **Unchecked** exceptions ([[RuntimeException]] and its subclasses) don't have to be. Use checked exceptions for recoverable situations the caller must think about; use unchecked for bugs and invalid arguments. Modern frameworks such as Spring mostly use unchecked exceptions.` },
    { id: 'try-catch-finally', t: 'try, catch and finally', body: `Code that may fail goes in [[try]]. Each [[catch]] handles one kind of exception; put the most specific first. [[finally]] runs whether or not an exception happened (unless the JVM exits), which makes it the classic place for clean-up.`, code: `try {
    int n = Integer.parseInt(input);
    System.out.println(100 / n);
} catch (NumberFormatException e) {
    System.out.println("Please enter a number");
} catch (ArithmeticException e) {
    System.out.println("Can't divide by zero");
} finally {
    System.out.println("Done");
}` },
    { id: 'multi-catch', t: 'Multi-catch', body: `Since Java 7 one [[catch]] can handle several unrelated exception types with the same code. The types can't be subclasses of each other.`, code: `try {
    loadConfig();
} catch (IOException | IllegalStateException e) {
    log.error("Couldn't load config", e);
}` },
    { id: 'try-with-resources', t: 'try-with-resources', body: `Anything that implements [[AutoCloseable]] (files, streams, connections) can be declared in the [[try]] header; Java closes it automatically, in reverse order, even if an exception is thrown. If closing also fails, that exception is attached as **suppressed** instead of hiding the original.`, code: `try (var in = Files.newBufferedReader(path);
     var out = Files.newBufferedWriter(copy)) {
    in.transferTo(out);
} // both closed here, out first, then in

// Java 9+: an existing effectively final resource
BufferedReader reader = Files.newBufferedReader(path);
try (reader) { System.out.println(reader.readLine()); }` },
    { id: 'throw-throws', t: 'throw and throws', body: `[[throw]] raises an exception object right now. [[throws]] in a method signature declares checked exceptions the method may pass on to its caller.`, code: `public Course find(String slug) throws CourseNotFoundException {
    return repo.findBySlug(slug)
               .orElseThrow(() -> new CourseNotFoundException(slug));
}

void setAge(int age) {
    if (age < 0) throw new IllegalArgumentException("age can't be negative: " + age);
}` },
    { id: 'custom', t: 'Custom exceptions', body: `Create your own exception when callers need to handle a specific situation, or when you want a clear name in logs. Extend [[RuntimeException]] (unchecked) or [[Exception]] (checked), pass a helpful message, and add fields for context.`, code: `public class InsufficientBalanceException extends RuntimeException {
    private final long shortByPaise;

    public InsufficientBalanceException(long shortByPaise) {
        super("Balance is short by " + shortByPaise / 100.0 + " rupees");
        this.shortByPaise = shortByPaise;
    }

    public long shortByPaise() { return shortByPaise; }
}` },
    { id: 'chaining', t: 'Exception chaining (keeping the cause)', body: `When you translate a low-level exception into a higher-level one, pass the original as the **cause**. The stack trace then shows both, and nothing is lost for debugging.`, code: `try {
    return jdbc.query(sql);
} catch (SQLException e) {
    throw new DataAccessException("Couldn't load orders for user " + userId, e);   // e is the cause
}` },
    { id: 'best-practices', t: 'Best practices', body: `- Never swallow exceptions with an empty [[catch]]; at least log them.
- Catch the most specific type you can handle; avoid [[catch (Exception e)]] except at the top level.
- Don't use exceptions for normal control flow; they're slow and hide intent.
- Validate early: [[Objects.requireNonNull]], argument checks at the start of methods.
- Log an exception once, where it's handled, not at every layer.
- Include context in messages (ids, values), but never secrets.` },
    { id: 'finally-pitfalls', t: 'finally pitfalls', body: `A [[return]] inside [[finally]] silently replaces any exception or earlier return value, and an exception thrown in [[finally]] hides the original one. Keep [[finally]] for clean-up only, or better, use try-with-resources.`, code: `static int broken() {
    try {
        throw new IllegalStateException("real problem");
    } finally {
        return 0;     // the exception disappears: never do this
    }
}` },
    { id: 'lambdas', t: 'Checked exceptions in lambdas and streams', body: `Standard functional interfaces don't allow checked exceptions, so a lambda that calls, say, [[Files.readString]] won't compile as is. Handle the exception inside the lambda, or wrap it in an unchecked exception such as [[UncheckedIOException]].`, code: `List<String> contents = paths.stream()
    .map(p -> {
        try {
            return Files.readString(p);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    })
    .toList();`, min: 16 },
    { id: 'spring', t: 'Handling exceptions globally in Spring Boot', body: `In a REST API, don't wrap every controller method in try-catch. A [[@RestControllerAdvice]] class turns exceptions into consistent JSON error responses ([[ProblemDetail]], RFC 9457) in one place. The REST API lesson shows the full setup.`, code: `@RestControllerAdvice
class ApiErrors {
    @ExceptionHandler(CourseNotFoundException.class)
    ProblemDetail notFound(CourseNotFoundException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }
}` },
  ],
  collections: [
    { id: 'hierarchy', t: 'The collections hierarchy', body: `[[Iterable]] → [[Collection]] → [[List]], [[Set]] and [[Queue]]/[[Deque]]. [[Map]] is separate because it holds key-value pairs. Program against the interfaces ([[List<String> names = new ArrayList<>()]]) so you can change the implementation later.` },
    { id: 'overview', t: 'List, Set, Queue and Map at a glance', body: `- **List**: ordered, allows duplicates, access by index ([[ArrayList]], [[LinkedList]]).
- **Set**: no duplicates ([[HashSet]], [[LinkedHashSet]], [[TreeSet]]).
- **Queue/Deque**: process in order, FIFO or LIFO ([[ArrayDeque]], [[PriorityQueue]]).
- **Map**: keys to values, unique keys ([[HashMap]], [[LinkedHashMap]], [[TreeMap]]).` },
    { id: 'choosing', t: 'Choosing the right collection', body: `- Need order and index access → [[ArrayList]]
- Need to check "seen before?" quickly → [[HashSet]]
- Need unique items in insertion order → [[LinkedHashSet]]
- Need sorted items or range queries → [[TreeSet]] / [[TreeMap]]
- Need a stack or queue → [[ArrayDeque]]
- Need "smallest next" → [[PriorityQueue]]
- Need lookups by key → [[HashMap]]
- Shared between threads → [[ConcurrentHashMap]], [[CopyOnWriteArrayList]]` },
    { id: 'iterator', t: 'Iterators and fail-fast behaviour', body: `An [[Iterator]] walks a collection with [[hasNext]] and [[next]], and can [[remove]] the current element safely. Changing the collection any other way during iteration throws [[ConcurrentModificationException]] (fail-fast). [[removeIf]] is the simplest safe removal.`, code: `Iterator<Order> it = orders.iterator();
while (it.hasNext()) {
    if (it.next().isCancelled()) it.remove();   // safe
}
orders.removeIf(Order::isCancelled);            // simpler` },
    { id: 'immutable', t: 'Immutable and unmodifiable collections', body: `[[List.of]], [[Set.of]] and [[Map.of]] (Java 9) create unmodifiable collections that reject [[null]]. [[List.copyOf]] makes an unmodifiable copy. [[Collections.unmodifiableList]] is only a read-only **view**: changes to the original still show through.`, code: `List<String> fixed = List.of("a", "b");
// fixed.add("c");              // UnsupportedOperationException
List<String> copy = List.copyOf(mutable);   // independent snapshot`, min: 10 },
    { id: 'utility', t: 'The Collections utility class', body: `[[java.util.Collections]] has handy static methods: [[sort]], [[reverse]], [[shuffle]], [[max]], [[min]], [[frequency]], [[nCopies]], [[emptyList]], [[swap]] and [[synchronizedList]].`, code: `Collections.sort(names);
Collections.reverse(names);
int twos = Collections.frequency(List.of(2, 3, 2), 2);   // 2
List<String> blanks = Collections.nCopies(3, "");` },
    { id: 'sequenced', t: 'Sequenced collections (Java 21)', body: `Lists, deques, [[LinkedHashSet]], [[TreeSet]], [[LinkedHashMap]] and [[TreeMap]] now share [[getFirst()]], [[getLast()]], [[addFirst()]], [[removeLast()]] and [[reversed()]], instead of each having its own way.`, code: `List<String> steps = new ArrayList<>(List.of("plan", "build", "ship"));
steps.getFirst();       // "plan"
steps.getLast();        // "ship"
steps.reversed();       // [ship, build, plan] (a view)`, min: 21 },
  ],
  generics: [
    { id: 'why', t: 'Why generics', body: `Generics let the compiler check types for you. Without them, a list holds [[Object]] and every read needs a cast that can fail at run time. With them, mistakes become compile errors.`, code: `List<String> names = new ArrayList<>();
names.add("Asha");
// names.add(42);          // compile error
String first = names.get(0);   // no cast needed` },
    { id: 'generic-class', t: 'Generic classes', body: `Declare type parameters in angle brackets. The diamond operator [[<>]] lets the compiler infer them when you create an object.`, code: `public class Box<T> {
    private final T value;
    public Box(T value) { this.value = value; }
    public T get() { return value; }
}

Box<Integer> b = new Box<>(42);
record Pair<A, B>(A first, B second) {}` },
    { id: 'generic-method', t: 'Generic methods', body: `A method can have its own type parameter, declared before the return type. The compiler usually infers it from the arguments.`, code: `static <T> T firstOrDefault(List<T> list, T fallback) {
    return list.isEmpty() ? fallback : list.get(0);
}
String s = firstOrDefault(List.of("a"), "none");` },
    { id: 'bounded', t: 'Bounded type parameters', body: `[[<T extends Number>]] limits [[T]] to [[Number]] and its subtypes, so you can call [[Number]] methods on it. Several bounds are joined with [[&]].`, code: `static <T extends Comparable<T>> T max(List<T> items) {
    T best = items.get(0);
    for (T item : items) if (item.compareTo(best) > 0) best = item;
    return best;
}` },
    { id: 'wildcards', t: 'Wildcards and PECS', body: `- [[List<? extends Number>]]: you can **read** Numbers from it (a producer), but not add.
- [[List<? super Integer>]]: you can **add** Integers to it (a consumer).
- [[List<?>]]: any type, read as [[Object]].

Remember **PECS**: Producer Extends, Consumer Super.`, code: `static double sum(List<? extends Number> nums) {
    double total = 0;
    for (Number n : nums) total += n.doubleValue();
    return total;
}
static void fill(List<? super Integer> out) { out.add(1); out.add(2); }

sum(List.of(1, 2.5, 3L));      // works for Integer, Double, Long` },
    { id: 'erasure', t: 'Type erasure and its limits', body: `Generic types exist only at compile time; the compiler **erases** them to their bounds. So at run time you can't do [[new T()]], [[instanceof List<String>]] or create a [[new T[10]]] array, and [[List<String>]] and [[List<Integer>]] are the same class.` },
    { id: 'raw', t: 'Raw types', body: `Using a generic class without type arguments ([[List list = new ArrayList();]]) is a **raw type**, kept only for pre-Java 5 code. It turns off type checking and produces warnings; never use it in new code.` },
  ],
  io: [
    { id: 'streams', t: 'Byte streams vs character streams', body: `[[InputStream]]/[[OutputStream]] move raw bytes (images, zip files). [[Reader]]/[[Writer]] move characters and handle encoding (text). Always choose the encoding for text; UTF-8 is the default since Java 18.` },
    { id: 'buffering', t: 'Buffered reading and writing', body: `Reading one byte or character at a time is slow. Buffered readers and writers read and write in large chunks. [[Files.newBufferedReader]] and [[Files.newBufferedWriter]] give you buffered UTF-8 by default.`, code: `try (BufferedReader in = Files.newBufferedReader(Path.of("app.log"))) {
    String line;
    while ((line = in.readLine()) != null) {
        if (line.contains("ERROR")) System.out.println(line);
    }
}` },
    { id: 'files-api', t: 'Path and Files essentials', body: `[[Files]] covers the everyday operations: [[exists]], [[createDirectories]], [[copy]], [[move]], [[delete]], [[size]], [[getLastModifiedTime]] and [[isDirectory]]. Options such as [[REPLACE_EXISTING]] control behaviour.`, code: `Path src = Path.of("report.pdf");
Path dest = Path.of("archive", "2026", "report.pdf");
Files.createDirectories(dest.getParent());
Files.copy(src, dest, StandardCopyOption.REPLACE_EXISTING);
long bytes = Files.size(dest);
Files.deleteIfExists(src);` },
    { id: 'serialization', t: 'Java serialization', body: `A class that implements [[Serializable]] can be written to bytes with [[ObjectOutputStream]] and read back with [[ObjectInputStream]]. Mark fields to skip as [[transient]], and declare a [[serialVersionUID]]. Deserialising untrusted data is a well-known security risk, so for storage and APIs prefer JSON (Jackson) or another explicit format.`, code: `record Draft(String title, String body) implements Serializable {
    private static final long serialVersionUID = 1L;
}

try (var out = new ObjectOutputStream(Files.newOutputStream(Path.of("draft.bin")))) {
    out.writeObject(new Draft("Hello", "World"));
}`, min: 16 },
    { id: 'walk-watch', t: 'Walking folders and watching for changes', body: `[[Files.walk]] visits a folder tree lazily and [[Files.find]] filters while walking. A [[WatchService]] tells you when files are created, changed or deleted in a folder.`, code: `try (Stream<Path> files = Files.find(Path.of("src"), 10, (p, attr) -> p.toString().endsWith(".java"))) {
    System.out.println(files.count() + " Java files");
}` },
    { id: 'resources', t: 'Reading files from the classpath', body: `Files packaged inside your JAR (under [[src/main/resources]]) aren't normal files on disk. Read them as resources with [[getResourceAsStream]].`, code: `try (InputStream in = App.class.getResourceAsStream("/templates/welcome.txt")) {
    String text = new String(in.readAllBytes(), StandardCharsets.UTF_8);
}` },
  ],
  datetime: [
    { id: 'local', t: 'LocalDate, LocalTime and LocalDateTime', body: `"Local" types have no time zone: a birthday, an office opening time, a timetable. They're immutable; methods such as [[plusDays]] return a new value.`, code: `LocalDate today = LocalDate.now();
LocalDate due = today.plusDays(7);
LocalDate diwali = LocalDate.of(2026, 11, 8);
LocalTime opens = LocalTime.of(9, 30);
LocalDateTime meeting = LocalDateTime.of(diwali, opens);
boolean late = today.isAfter(due);` },
    { id: 'zoned', t: 'Instant, ZonedDateTime and time zones', body: `[[Instant]] is a point on the global timeline (UTC), ideal for storing when something happened. [[ZonedDateTime]] adds a zone such as [[Asia/Kolkata]] for display and calendar logic. Store instants; convert to the user's zone when showing them.`, code: `Instant paidAt = Instant.now();
ZonedDateTime inIndia = paidAt.atZone(ZoneId.of("Asia/Kolkata"));
ZonedDateTime inLondon = inIndia.withZoneSameInstant(ZoneId.of("Europe/London"));` },
    { id: 'duration-period', t: 'Duration vs Period', body: `[[Duration]] measures time-based amounts (hours, minutes, seconds); [[Period]] measures date-based amounts (years, months, days). [[ChronoUnit.X.between]] counts units between two values.`, code: `Duration call = Duration.ofMinutes(95);           // PT1H35M
Period age = Period.between(LocalDate.of(1995, 5, 10), LocalDate.now());
long days = ChronoUnit.DAYS.between(start, end);` },
    { id: 'format', t: 'Formatting and parsing', body: `[[DateTimeFormatter]] converts between dates and text. It's immutable and thread-safe, unlike the old [[SimpleDateFormat]]. Pattern letters are case-sensitive: [[MM]] is month, [[mm]] is minutes.`, code: `DateTimeFormatter f = DateTimeFormatter.ofPattern("dd-MM-yyyy");
String text = LocalDate.of(2026, 9, 26).format(f);    // "26-09-2026"
LocalDate parsed = LocalDate.parse("01-10-2026", f);
String iso = LocalDate.now().toString();              // ISO: 2026-09-26` },
    { id: 'dst', t: 'Daylight saving and zone rules', body: `India doesn't use daylight saving, but many countries do, which creates missing and repeated local times. Always convert through a [[ZoneId]] and let java.time apply the rules, instead of adding fixed hour offsets.` },
    { id: 'legacy', t: 'The old Date and Calendar classes', body: `[[java.util.Date]], [[Calendar]] and [[SimpleDateFormat]] are mutable, confusing (months start at 0) and not thread-safe. Use java.time in new code, and convert at the edges when an old API needs them.`, code: `Date legacy = Date.from(Instant.now());
Instant back = legacy.toInstant();` },
    { id: 'clock', t: 'Testing time with Clock', body: `Code that calls [[LocalDate.now()]] directly is hard to test. Inject a [[Clock]] and use [[LocalDate.now(clock)]]; tests pass a fixed clock.`, code: `class Billing {
    private final Clock clock;
    Billing(Clock clock) { this.clock = clock; }
    boolean isOverdue(LocalDate due) { return LocalDate.now(clock).isAfter(due); }
}
// test: new Billing(Clock.fixed(Instant.parse("2026-10-01T00:00:00Z"), ZoneOffset.UTC))` },
  ],
};
