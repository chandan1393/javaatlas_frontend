/* Feature codes: first letter = type (l language, a API, j JVM/GC, t tools, s security, x removed/restricted).
   Second letter = status (p preview, i incubator, e experimental), optional number = round.
   Suffix |H = headline feature, |h = notable feature. */
import { EcoEntry, VersionEntry } from '../core/models';

export const VERSIONS: VersionEntry[] = [
{v:`1.0`,n:1.0,date:`1996-01-23`,name:`JDK 1.0`,f:[
 `l|Classes, interfaces, exceptions and garbage collection`,
 `a|Core libraries: java.lang, java.io, java.util, java.net`,
 `a|Threads and the synchronized keyword`,
 `a|AWT user interfaces and browser applets`]},
{v:`1.1`,n:1.1,date:`1997-02-19`,name:`JDK 1.1`,f:[
 `l|Inner, nested and anonymous classes`,
 `a|JDBC database connectivity`,
 `a|Reflection API`,
 `a|Object serialization`,
 `a|RMI for remote method calls`,
 `a|JavaBeans component model`]},
{v:`1.2`,n:1.2,date:`1998-12-08`,name:`J2SE 1.2`,aka:`Playground`,f:[
 `a|Collections Framework: List, Set, Map|h`,
 `a|Swing user interface toolkit`,
 `j|JIT compiler included by default`,
 `l|strictfp keyword`,
 `s|Fine-grained security policies and permissions`]},
{v:`1.3`,n:1.3,date:`2000-05-08`,name:`J2SE 1.3`,aka:`Kestrel`,f:[
 `j|HotSpot JVM becomes the default`,
 `a|Dynamic proxies (java.lang.reflect.Proxy)`,
 `a|JNDI naming and directory API`,
 `a|Java Sound API`]},
{v:`1.4`,n:1.4,date:`2002-02-06`,name:`J2SE 1.4`,aka:`Merlin`,f:[
 `l|assert keyword`,
 `a|Regular expressions (java.util.regex)`,
 `a|NIO: buffers, channels and non-blocking I/O`,
 `a|Exception chaining with getCause()`,
 `a|Logging API (java.util.logging)`,
 `a|XML parsing (JAXP) built in`,
 `s|JCE, JSSE and JAAS security bundled`]},
{v:`5`,n:5,date:`2004-09-30`,name:`J2SE 5.0`,aka:`Tiger`,f:[
 `l|Generics|H`,
 `l|Annotations`,
 `l|Enums`,
 `l|Autoboxing and unboxing`,
 `l|Varargs`,
 `l|Enhanced for-each loop`,
 `l|Static imports`,
 `a|java.util.concurrent: executors, ConcurrentHashMap, locks, atomics`,
 `a|StringBuilder`,
 `a|Scanner and printf-style formatting`,
 `j|Revised Java Memory Model (JSR 133)`],
 sig:`List<String> names = new ArrayList<String>();
for (String n : names) {
    System.out.printf("Hello %s%n", n);
}`},
{v:`6`,n:6,date:`2006-12-11`,name:`Java SE 6`,aka:`Mustang`,f:[
 `a|Scripting API (JSR 223) with a JavaScript engine`,
 `a|Compiler API (javax.tools)`,
 `a|JDBC 4.0 with automatic driver loading`,
 `a|Pluggable annotation processing (JSR 269)`,
 `l|@Override allowed on interface method implementations`,
 `a|JAX-WS and JAXB bundled for web services and XML binding`,
 `j|Major JVM and startup performance improvements`]},
{v:`7`,n:7,date:`2011-07-28`,name:`Java SE 7`,aka:`Dolphin`,f:[
 `l|try-with-resources|H`,
 `l|Diamond operator <>`,
 `l|Strings in switch`,
 `l|Multi-catch: one catch block for several exception types`,
 `l|Binary literals and underscores in numbers (1_000_000)`,
 `a|NIO.2: Path, Files and WatchService`,
 `a|Fork/Join framework`,
 `a|Objects utility class`,
 `j|invokedynamic bytecode for dynamic languages`,
 `j|G1 garbage collector supported (7u4)`],
 sig:`try (BufferedReader r = Files.newBufferedReader(path)) {
    return r.readLine();
}   // r is closed automatically`},
{v:`8`,n:8,date:`2014-03-18`,name:`Java SE 8`,lts:true,f:[
 `l|Lambda expressions|H`,
 `l|Method references (String::length)`,
 `l|Default and static methods in interfaces`,
 `a|Stream API|H`,
 `a|Optional`,
 `a|java.time date and time API|h`,
 `a|CompletableFuture`,
 `a|Base64, StringJoiner and String.join`,
 `l|Repeating and type annotations`,
 `a|Nashorn JavaScript engine`,
 `j|PermGen removed, replaced by Metaspace`],
 sig:`names.stream()
     .filter(n -> n.startsWith("A"))
     .map(String::toUpperCase)
     .forEach(System.out::println);`},
{v:`9`,n:9,date:`2017-09-21`,name:`Java SE 9`,f:[
 `l|Module system (module-info.java)|h`,
 `t|JShell interactive REPL|h`,
 `a|Collection factories: List.of, Set.of, Map.of|h`,
 `l|Private methods in interfaces`,
 `l|try-with-resources on effectively final variables`,
 `a|Stream takeWhile, dropWhile and ofNullable`,
 `a|Optional.ifPresentOrElse, or and stream`,
 `a|ProcessHandle API`,
 `a|Reactive Streams Flow API`,
 `j|G1 becomes the default garbage collector`,
 `j|Compact strings: Latin-1 text stored in one byte per char`,
 `t|Multi-release JAR files`,
 `ai|HTTP/2 client`],
 sig:`List<String> langs = List.of("Java", "Kotlin", "Scala");
Map<String, Integer> ports = Map.of("http", 80, "https", 443);`},
{v:`10`,n:10,date:`2018-03-20`,name:`Java SE 10`,f:[
 `l|var for local variables|H`,
 `a|List.copyOf, Set.copyOf and Map.copyOf`,
 `a|Optional.orElseThrow()`,
 `a|Collectors.toUnmodifiableList and friends`,
 `j|Parallel full GC for G1`,
 `j|Application class-data sharing`,
 `t|Time-based releases every six months begin`],
 sig:`var lessonsByCourse = new HashMap<String, List<Lesson>>();`},
{v:`11`,n:11,date:`2018-09-25`,name:`Java SE 11`,lts:true,f:[
 `a|Standard HTTP Client (java.net.http)|h`,
 `a|String isBlank, lines, strip and repeat`,
 `a|Files.readString and writeString`,
 `l|var in lambda parameters`,
 `t|Run a single source file directly: java Hello.java|h`,
 `a|Optional.isEmpty and Predicate.not`,
 `s|TLS 1.3`,
 `j|Epsilon no-op garbage collector`,
 `je|ZGC low-pause garbage collector`,
 `t|Flight Recorder open-sourced`,
 `x|Java EE and CORBA modules removed (JAXB, JAX-WS)`,
 `x|Applets and Java Web Start dropped from Oracle JDK`],
 sig:`var client = HttpClient.newHttpClient();
var req = HttpRequest.newBuilder(URI.create("https://api.example.com/courses")).build();
String body = client.send(req, HttpResponse.BodyHandlers.ofString()).body();`},
{v:`12`,n:12,date:`2019-03-19`,name:`Java SE 12`,f:[
 `lp|Switch expressions`,
 `je|Shenandoah low-pause garbage collector`,
 `a|String.indent and transform`,
 `a|Collectors.teeing`,
 `a|Files.mismatch`,
 `a|Compact number formatting (1K, 2M)`,
 `j|Default CDS archives for faster startup`]},
{v:`13`,n:13,date:`2019-09-17`,name:`Java SE 13`,f:[
 `lp|Text blocks`,
 `lp2|Switch expressions with yield`,
 `j|Dynamic CDS archives`,
 `j|ZGC returns unused memory to the OS`,
 `a|Legacy Socket API reimplemented`]},
{v:`14`,n:14,date:`2020-03-17`,name:`Java SE 14`,f:[
 `l|Switch expressions|H`,
 `j|Helpful NullPointerException messages|h`,
 `lp|Records`,
 `lp|Pattern matching for instanceof`,
 `lp2|Text blocks`,
 `ti|jpackage installer tool`,
 `t|JFR event streaming`,
 `x|CMS garbage collector removed`,
 `x|Pack200 tools removed`],
 sig:`String kind = switch (day) {
    case SATURDAY, SUNDAY -> "Weekend";
    default -> "Weekday";
};`},
{v:`15`,n:15,date:`2020-09-15`,name:`Java SE 15`,f:[
 `l|Text blocks|H`,
 `a|Hidden classes for frameworks`,
 `j|ZGC ready for production`,
 `j|Shenandoah ready for production`,
 `s|EdDSA signatures`,
 `lp|Sealed classes`,
 `lp2|Records`,
 `lp2|Pattern matching for instanceof`,
 `x|Nashorn JavaScript engine removed`,
 `x|Biased locking disabled and deprecated`],
 sig:`String sql = """
    SELECT id, title
    FROM course
    WHERE level = ?
    """;`},
{v:`16`,n:16,date:`2021-03-16`,name:`Java SE 16`,f:[
 `l|Records|H`,
 `l|Pattern matching for instanceof|h`,
 `a|Stream.toList()`,
 `a|Stream.mapMulti`,
 `t|jpackage installer tool`,
 `a|Unix-domain socket channels`,
 `j|Elastic Metaspace`,
 `ai|Vector API`,
 `ai|Foreign linker API`,
 `x|JDK internals strongly encapsulated by default`,
 `t|OpenJDK moves to Git and GitHub`],
 sig:`record Point(int x, int y) {}

if (obj instanceof Point p) {
    System.out.println(p.x());
}`},
{v:`17`,n:17,date:`2021-09-14`,name:`Java SE 17`,lts:true,f:[
 `l|Sealed classes|H`,
 `a|New random number generator API (RandomGenerator)`,
 `l|Always-strict floating point`,
 `j|macOS on Apple Silicon (AArch64) port`,
 `s|Context-specific deserialization filters`,
 `lp|Pattern matching for switch`,
 `ai2|Vector API`,
 `x|Strong encapsulation of JDK internals, no opt-out flag`,
 `x|Security Manager deprecated for removal`,
 `x|RMI Activation removed`,
 `x|Applet API deprecated for removal`,
 `x|Experimental AOT and Graal JIT compilers removed`],
 sig:`sealed interface Payment permits Upi, Card {}
record Upi(String vpa) implements Payment {}
record Card(String last4) implements Payment {}`},
{v:`18`,n:18,date:`2022-03-22`,name:`Java SE 18`,f:[
 `a|UTF-8 is the default charset everywhere|h`,
 `t|Simple web server (jwebserver)`,
 `t|Code snippets in Javadoc (@snippet)`,
 `j|Core reflection reimplemented with method handles`,
 `a|Internet-address resolution SPI`,
 `lp2|Pattern matching for switch`,
 `ai3|Vector API`,
 `x|Finalization deprecated for removal`]},
{v:`19`,n:19,date:`2022-09-20`,name:`Java SE 19`,f:[
 `ap|Virtual threads`,
 `lp|Record patterns`,
 `lp3|Pattern matching for switch`,
 `ap|Foreign Function and Memory API`,
 `ai|Structured concurrency`,
 `ai4|Vector API`,
 `j|Linux on RISC-V port`]},
{v:`20`,n:20,date:`2023-03-21`,name:`Java SE 20`,f:[
 `ai|Scoped values`,
 `lp2|Record patterns`,
 `lp4|Pattern matching for switch`,
 `ap2|Virtual threads`,
 `ap2|Foreign Function and Memory API`,
 `ai2|Structured concurrency`,
 `ai5|Vector API`]},
{v:`21`,n:21,date:`2023-09-19`,name:`Java SE 21`,lts:true,f:[
 `a|Virtual threads|H`,
 `l|Pattern matching for switch|H`,
 `l|Record patterns|h`,
 `a|Sequenced collections: getFirst, getLast, reversed|h`,
 `j|Generational ZGC`,
 `s|Key encapsulation mechanism API`,
 `lp|Unnamed patterns and variables`,
 `lp|Unnamed classes and instance main methods`,
 `lp|String templates (later withdrawn)`,
 `ap|Structured concurrency`,
 `ap|Scoped values`,
 `ap3|Foreign Function and Memory API`,
 `ai6|Vector API`,
 `x|Windows 32-bit x86 port deprecated for removal`,
 `x|Warnings when agents are loaded dynamically`],
 sig:`try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    requests.forEach(r -> executor.submit(() -> handle(r)));
}`},
{v:`22`,n:22,date:`2024-03-19`,name:`Java SE 22`,f:[
 `a|Foreign Function and Memory API|h`,
 `l|Unnamed variables and patterns (_)|h`,
 `t|Launch multi-file source programs`,
 `j|Region pinning for G1`,
 `lp|Statements before super(...)`,
 `ap|Class-File API`,
 `ap|Stream gatherers`,
 `lp2|String templates`,
 `lp2|Implicitly declared classes and instance main methods`,
 `ap2|Structured concurrency`,
 `ap2|Scoped values`,
 `ai7|Vector API`],
 sig:`try {
    Integer.parseInt(input);
    return true;
} catch (NumberFormatException _) {   // unnamed variable
    return false;
}`},
{v:`23`,n:23,date:`2024-09-17`,name:`Java SE 23`,f:[
 `t|Markdown documentation comments (///)|h`,
 `j|ZGC uses generational mode by default`,
 `lp|Primitive types in patterns, instanceof and switch`,
 `lp|Module import declarations`,
 `lp2|Flexible constructor bodies`,
 `ap2|Stream gatherers`,
 `ap2|Class-File API`,
 `lp3|Implicitly declared classes and instance main methods`,
 `ap3|Structured concurrency`,
 `ap3|Scoped values`,
 `ai8|Vector API`,
 `x|String templates withdrawn`,
 `x|sun.misc.Unsafe memory-access methods deprecated for removal`]},
{v:`24`,n:24,date:`2025-03-18`,name:`Java SE 24`,f:[
 `a|Stream gatherers: custom intermediate operations|h`,
 `a|Class-File API`,
 `j|Virtual threads no longer pinned by synchronized|h`,
 `j|Ahead-of-time class loading and linking (Project Leyden)`,
 `s|Quantum-resistant ML-KEM and ML-DSA algorithms`,
 `j|Late barrier expansion for G1`,
 `je|Compact object headers`,
 `je|Generational Shenandoah`,
 `sp|Key derivation function API`,
 `lp2|Primitive types in patterns, instanceof and switch`,
 `lp2|Module import declarations`,
 `lp3|Flexible constructor bodies`,
 `lp4|Simple source files and instance main methods`,
 `ap4|Structured concurrency`,
 `ap4|Scoped values`,
 `ai9|Vector API`,
 `x|Security Manager permanently disabled`,
 `x|Windows 32-bit x86 port removed`,
 `x|Non-generational ZGC mode removed`,
 `x|Warnings on sun.misc.Unsafe memory-access methods`],
 sig:`List<List<Integer>> batches = Stream.of(1, 2, 3, 4, 5, 6, 7)
    .gather(Gatherers.windowFixed(3))
    .toList();   // [[1, 2, 3], [4, 5, 6], [7]]`},
{v:`25`,n:25,date:`2025-09-16`,name:`Java SE 25`,lts:true,f:[
 `l|Compact source files and instance main methods|H`,
 `l|Module import declarations (import module java.base)|h`,
 `l|Flexible constructor bodies: code before super(...)|h`,
 `a|Scoped values`,
 `s|Key derivation function API`,
 `j|Compact object headers`,
 `j|Generational Shenandoah`,
 `j|AOT command-line ergonomics and method profiling for faster warm-up`,
 `t|JFR cooperative sampling, method timing and tracing`,
 `te|JFR CPU-time profiling on Linux`,
 `ap|Stable values`,
 `sp|PEM encodings of cryptographic objects`,
 `ap5|Structured concurrency`,
 `lp3|Primitive types in patterns, instanceof and switch`,
 `ai10|Vector API`,
 `x|32-bit x86 port removed`],
 sig:`void main() {
    String name = IO.readln("Your name: ");
    IO.println("Hello, " + name);
}`},
{v:`26`,n:26,date:`2026-03-17`,name:`Java SE 26`,f:[
 `a|HTTP/3 in the HTTP Client API|h`,
 `j|Ahead-of-time object caching works with any GC, including ZGC`,
 `j|G1 throughput improved by reducing synchronization`,
 `x|Warnings when deep reflection mutates final fields`,
 `x|Applet API removed`,
 `ap2|Lazy constants (formerly stable values)`,
 `sp2|PEM encodings of cryptographic objects`,
 `ap6|Structured concurrency`,
 `lp4|Primitive types in patterns, instanceof and switch`,
 `ai11|Vector API`]},
{v:`27`,n:27,date:`2026-09-15`,name:`Java SE 27`,f:[
 `j|G1 is the default garbage collector in every environment|h`,
 `j|Compact object headers on by default`,
 `s|Post-quantum hybrid key exchange for TLS 1.3|h`,
 `t|JFR redacts sensitive data in-process`,
 `ap3|Lazy constants`,
 `ap7|Structured concurrency`,
 `sp3|PEM encodings of cryptographic objects`,
 `lp5|Primitive types in patterns, instanceof and switch`,
 `ai12|Vector API`]},
{v:`28`,n:28,date:`2027-03`,name:`JDK 28`,planned:true,f:[
 `lp|Value objects (Project Valhalla)`,
 `ai|Simple JSON API`,
 `jp|Strict field initialization in the JVM`,
 `j|Shenandoah uses generational mode by default`,
 `s|PEM encodings of cryptographic objects, final (proposed)`,
 `x|macOS x64 port deprecated for removal`]}
];

export const ECO: EcoEntry[] = [
{y:2004,track:`Spring`,t:`Spring Framework 1.0`,p:`IoC container with XML bean definitions, AOP and JDBC templates. A lighter alternative to EJB.`},
{y:2006,track:`JPA`,t:`JPA 1.0 (part of EJB 3.0)`,p:`A standard ORM API for Java, heavily inspired by Hibernate. Hibernate becomes a JPA provider.`},
{y:2006,track:`Spring`,t:`Spring 2.0`,p:`XML namespaces, AspectJ integration and @Transactional.`},
{y:2007,track:`Spring`,t:`Spring 2.5`,p:`Annotation-driven configuration arrives: @Autowired, @Component, @Controller.`},
{y:2009,track:`Spring`,t:`Spring 3.0`,p:`Java-based configuration with @Configuration and @Bean, SpEL, and REST support in Spring MVC.`},
{y:2009,track:`JPA`,t:`JPA 2.0`,p:`Criteria API, @ElementCollection, orphanRemoval and pessimistic locking.`},
{y:2013,track:`Spring`,t:`Spring 4.0`,p:`Java 8 support, @RestController and WebSocket.`},
{y:2013,track:`JPA`,t:`JPA 2.1`,p:`Entity graphs, attribute converters (@Convert), stored procedure queries and bulk criteria updates.`},
{y:2014,track:`Boot`,t:`Spring Boot 1.0`,p:`Auto-configuration, starters, embedded Tomcat and Actuator. Deploy with java -jar.`},
{y:2017,track:`Spring`,t:`Spring 5.0`,p:`WebFlux reactive stack, Kotlin support and functional web endpoints, on a Java 8 baseline.`},
{y:2017,track:`JPA`,t:`JPA 2.2`,p:`java.time support, Stream query results and repeatable annotations.`},
{y:2018,track:`Boot`,t:`Spring Boot 2.0`,p:`Built on Spring 5 with Micrometer metrics and HikariCP as the default connection pool.`},
{y:2020,track:`JPA`,t:`Jakarta Persistence 3.0`,p:`Same API, new home: javax.persistence becomes jakarta.persistence.`},
{y:2022,track:`Spring`,t:`Spring 6.0 and Spring Boot 3.0`,p:`Java 17 baseline, jakarta namespace, GraalVM native images and Micrometer Tracing.`},
{y:2022,track:`Hibernate`,t:`Hibernate 6.0`,p:`A new semantic query engine (SQM), better SQL generation, Jakarta Persistence 3.x.`},
{y:2022,track:`JPA`,t:`Jakarta Persistence 3.1`,p:`UUID as a basic type and generator, plus new JPQL functions such as CEILING, EXP and EXTRACT.`},
{y:2023,track:`Boot`,t:`Spring Boot 3.2`,p:`Virtual threads with one property, the new RestClient and JdbcClient.`},
{y:2024,track:`JPA`,t:`Jakarta Persistence 3.2`,p:`Java records as embeddables, UNION and INTERSECT in JPQL, and programmatic transaction helpers.`},
{y:2025,track:`Hibernate`,t:`Hibernate 7.0`,p:`Implements Jakarta Persistence 3.2, adds new type-safe query restrictions, and moves to the Apache License 2.0.`},
{y:2025,track:`Spring`,t:`Spring 7.0 and Spring Boot 4.0`,p:`Jakarta EE 11, Jackson 3, JSpecify null safety, built-in API versioning and retry support, and modular auto-configuration.`},
{y:2026,track:`Boot`,t:`Spring Boot 4.1`,p:`Spring gRPC auto-configuration, SSRF protection for HTTP clients and improved OpenTelemetry support.`}
];
