import { SubTopic } from '../core/models';

/** Extra subtopics APPENDED to a lesson's existing ones (see ContentService). */
export const SUBTOPICS_EXTRA: Record<string, SubTopic[]> = {
  operators: [
    { id: 'bitwise', t: 'Bitwise and shift operators', body: `They work on the individual bits of integers:
- [[&]] AND, [[|]] OR, [[^]] XOR (exclusive or), [[~]] NOT (flips every bit).
- [[<<]] shifts left (multiplies by 2 per step), [[>>]] shifts right keeping the sign, [[>>>]] shifts right filling with zeros.

You'll meet them in flags and permissions, hashing (HashMap computes the bucket with [[hash & (n - 1)]]) and fast checks such as "is this number odd?".`, code: `int read = 1, write = 2, exec = 4;          // one bit per permission
int perms = read | write;                    // 3 (binary 011)
boolean canWrite = (perms & write) != 0;     // true
perms = perms & ~write;                      // remove write: 1

System.out.println(7 & 1);       // 1: odd
System.out.println(5 << 1);      // 10: times 2
System.out.println(-16 >> 2);    // -4: sign kept
System.out.println(-16 >>> 28);  // 15: zeros shifted in` },
    { id: 'compound', t: 'Compound assignment hides a cast', body: `[[x += y]] isn't exactly [[x = x + y]]: compound assignment casts the result back to the type of [[x]]. That makes some lines compile that look like they shouldn't, and can silently overflow.`, code: `byte b = 10;
b += 5;            // compiles: means b = (byte) (b + 5)
// b = b + 5;      // compile error: b + 5 is an int

byte big = 120;
big += 10;         // silently wraps to -126

char c = 'A';
c += 1;            // 'B'` },
  ],
  'static-final': [
    { id: 'final-finally-finalize', t: 'final vs finally vs finalize', body: `Three similar words, three unrelated features (a classic interview question):
- **final** is a keyword: a final variable can't be reassigned, a final method can't be overridden, a final class can't be extended.
- **finally** is a block after try/catch that always runs, used for clean-up (today usually replaced by try-with-resources).
- **finalize()** was a method the garbage collector might call before reclaiming an object. It's unpredictable, slow and **deprecated for removal** since Java 18; use try-with-resources or java.lang.ref.Cleaner instead.` },
  ],
  enums: [
    { id: 'enumset-enummap', t: 'EnumSet and EnumMap', body: `When the elements or keys are enum constants, use these specialised collections. Internally they're a bit set and an array indexed by the constant's ordinal, so they're extremely fast and compact, and they iterate in declaration order.`, code: `enum Day { MON, TUE, WED, THU, FRI, SAT, SUN }

EnumSet<Day> weekend = EnumSet.of(Day.SAT, Day.SUN);
EnumSet<Day> workdays = EnumSet.complementOf(weekend);      // MON..FRI
EnumSet<Day> midweek = EnumSet.range(Day.TUE, Day.THU);

EnumMap<Day, Integer> classes = new EnumMap<>(Day.class);
classes.put(Day.MON, 2);
classes.put(Day.WED, 1);
System.out.println(classes);   // {MON=2, WED=1}  always in declaration order` },
  ],
  collections: [
    { id: 'custom-iterable', t: 'Making your own class iterable', body: `Implement [[Iterable<T>]] (one method, [[iterator()]]) and your class works in for-each loops. The iterator keeps track of where it is with [[hasNext()]] and [[next()]].`, code: `record Range(int from, int to) implements Iterable<Integer> {
    @Override public Iterator<Integer> iterator() {
        return new Iterator<>() {
            private int next = from;
            @Override public boolean hasNext() { return next < to; }
            @Override public Integer next() {
                if (!hasNext()) throw new NoSuchElementException();
                return next++;
            }
        };
    }
}

for (int i : new Range(1, 4)) System.out.print(i + " ");   // 1 2 3` },
  ],
  maps: [
    { id: 'special-maps', t: 'Special maps: EnumMap, WeakHashMap and IdentityHashMap', body: `- **EnumMap**: enum keys, backed by an array. The fastest map when keys are enum constants.
- **WeakHashMap**: holds its keys weakly, so an entry disappears once nothing else references the key. Useful for caches attached to objects you don't own. (String literals and small Integers are never collected, so don't use them as keys.)
- **IdentityHashMap**: compares keys with [[==]] instead of [[equals()]]. Used for graph algorithms and serialization frameworks that track object identity.` },
  ],
  jvm: [
    { id: 'compact-source', t: 'Java 25: compact source files and instance main methods', body: `Since Java 25, a beginner's first program needs no class and no [[public static void main(String[] args)]]. A file with just a [[main]] method is a complete program, the [[IO]] class handles console input and output, and the [[java]] launcher runs the source file directly. As programs grow, they turn into normal classes.`, code: `// Hello.java   run with:  java Hello.java
void main() {
    String name = IO.readln("What's your name? ");
    IO.println("Hello, " + name + "!");
}`, min: 25 },
  ],
  vthreads: [
    { id: 'structured', t: 'Structured concurrency (preview in Java 25)', body: `**Structured concurrency** treats a group of related tasks as one unit: they start inside a scope, and the scope doesn't end until all of them finish. If one fails, the others are cancelled automatically, so no thread is left running in the background. It pairs naturally with virtual threads. In Java 25 it's a **preview** API (compile and run with [[--enable-preview]]), so it may still change.`, code: `Profile load(long userId) throws InterruptedException {
    try (var scope = StructuredTaskScope.open()) {                 // Java 25 preview API
        Subtask<User> user = scope.fork(() -> findUser(userId));        // each on its own virtual thread
        Subtask<List<Order>> orders = scope.fork(() -> findOrders(userId));
        scope.join();                     // waits for both; if one fails, the other is cancelled
        return new Profile(user.get(), orders.get());
    }
}`, min: 25 },
  ],
  maven: [
    { id: 'gradle', t: 'Gradle at a glance', body: `**Gradle** is the other major build tool. It uses the same Maven Central repositories and the same group:artifact:version coordinates, but describes builds in code (Kotlin or Groovy) instead of XML. It's the standard for Android, and Spring Initializr offers both. Always run it through the wrapper ([[./gradlew]]) so everyone uses the same version.`, code: `// build.gradle.kts
plugins {
    java
    id("org.springframework.boot") version "4.1.0"
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

// ./gradlew build     ./gradlew test     ./gradlew bootRun`, lang: 'text' },
  ],
  ioc: [
    { id: 'context-vs-factory', t: 'BeanFactory vs ApplicationContext', body: `**BeanFactory** is the basic container: it creates beans lazily, on request. **ApplicationContext** extends it with everything an application needs: it creates all singletons eagerly at startup (so misconfiguration fails fast), publishes events, resolves messages (i18n), loads resources and integrates AOP. You always use an ApplicationContext; Spring Boot creates it for you in [[SpringApplication.run()]].` },
    { id: 'stereotypes', t: 'Stereotype annotations and component scanning', body: `[[@Component]] marks any class as a bean. The stereotypes are specialisations that also document intent: [[@Service]] (business logic), [[@Repository]] (data access, and Spring translates database exceptions into DataAccessException), [[@Controller]]/[[@RestController]] (web). Component scanning finds them in the main class's package and below, which is why the main class belongs in the root package.` },
  ],
  beans: [
    { id: 'prototype-in-singleton', t: 'A prototype inside a singleton', body: `A singleton is created once, so a prototype injected into it is also created only once: every caller shares it. When you need a fresh instance each time, inject [[ObjectProvider<T>]] and call [[getObject()]], or use a method annotated with [[@Lookup]]. The scopes lab above shows this happening.`, code: `@Service
class CheckoutService {
    private final ObjectProvider<ShoppingCart> carts;            // not the cart itself
    CheckoutService(ObjectProvider<ShoppingCart> carts) { this.carts = carts; }

    Receipt checkout(List<Item> items) {
        ShoppingCart cart = carts.getObject();                     // a new prototype every call
        items.forEach(cart::add);
        return cart.pay();
    }
}` },
    { id: 'callbacks', t: 'Lifecycle callbacks', body: `Run code after a bean is fully set up with [[@PostConstruct]] (validate configuration, warm a cache) and before shutdown with [[@PreDestroy]] (close clients, stop threads). Alternatives: [[InitializingBean]]/[[DisposableBean]] interfaces, or [[@Bean(initMethod = "...", destroyMethod = "...")]] for classes you don't own. Prototype beans are never destroyed by the container: you clean them up yourself.` },
    { id: 'post-processors', t: 'BeanPostProcessor and BeanFactoryPostProcessor', body: `These are how Spring extends itself. A **BeanFactoryPostProcessor** changes bean *definitions* before any bean exists (resolving [[\${...}]] placeholders, for example). A **BeanPostProcessor** works on each bean *instance* before and after initialisation: it processes [[@Autowired]] and [[@Value]], and it is where proxies for [[@Transactional]], [[@Async]] and [[@Cacheable]] are created.` },
  ],
  aop: [
    { id: 'pointcuts', t: 'Pointcut expressions', body: `A pointcut selects the methods advice applies to:
- [[execution(* com.shop.service.*.*(..))]]: any method of any class in the service package.
- [[within(com.shop.web..*)]]: anything in the web package and its sub-packages.
- [[@annotation(com.shop.Audited)]]: methods annotated with your own [[@Audited]] annotation. This is the clearest option: the code shows exactly where the aspect applies.
- Combine them with [[&&]], [[||]] and [[!]], and name them with [[@Pointcut]] methods to reuse them.` },
    { id: 'around', t: '@Around advice: timing every service call', body: `[[@Around]] wraps the call: you decide whether and when to call [[proceed()]], and you can change arguments, the return value or exceptions. It's the most powerful advice, so use the simplest one that does the job.`, code: `@Aspect
@Component
class TimingAspect {
    private static final Logger log = LoggerFactory.getLogger(TimingAspect.class);

    @Around("execution(* com.shop.service..*(..))")
    Object time(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        try {
            return pjp.proceed();                                   // call the real method
        } finally {
            long ms = (System.nanoTime() - start) / 1_000_000;
            log.info("{} took {} ms", pjp.getSignature().toShortString(), ms);
        }
    }
}` },
    { id: 'aspect-order', t: 'When several aspects apply', body: `Aspects are applied in [[@Order]] order: the lowest value is the outermost wrapper (runs first on the way in, last on the way out). Ordering matters, for example a retry aspect should sit outside the transaction aspect so each retry gets a fresh transaction.` },
  ],
  mvc: [
    { id: 'filters-vs-interceptors', t: 'Filters vs interceptors', body: `**Servlet filters** run before the DispatcherServlet and see every request, including static files and errors; Spring Security is built from filters. **HandlerInterceptors** run inside Spring MVC, around controller methods, and know which handler was chosen ([[preHandle]], [[postHandle]], [[afterCompletion]]). Use a filter for low-level concerns (security, request IDs, compression) and an interceptor for MVC-aware ones (locale, per-controller auditing).` },
    { id: 'validation-errors', t: 'Validation and consistent errors', body: `Annotate request DTOs with Bean Validation constraints and add [[@Valid]] to the parameter; invalid input throws [[MethodArgumentNotValidException]]. Handle exceptions in one place with [[@RestControllerAdvice]] and return RFC 9457 [[ProblemDetail]] responses, so every error has the same shape.`, code: `record CreateCourse(@NotBlank String title, @Positive long pricePaise) {}

@PostMapping("/api/courses")
ResponseEntity<CourseView> create(@RequestBody @Valid CreateCourse body) { /* … */ }

@RestControllerAdvice
class ApiErrors {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail invalid(MethodArgumentNotValidException e) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Some fields are invalid");
        pd.setProperty("fields", e.getFieldErrors().stream()
                .collect(Collectors.toMap(FieldError::getField, f -> String.valueOf(f.getDefaultMessage()), (a, b) -> a)));
        return pd;
    }
}` },
  ],
  di: [
    { id: 'circular', lab: 'spring:circular', t: 'Circular dependencies', body: `If A needs B and B needs A, neither can be constructed first. Spring Boot (since 2.6) refuses to start rather than half-solving it. The cycle usually means the two classes share a responsibility that belongs in a third class, or that one of them should react to an event instead of calling the other. The lab shows the cycle being detected, and both ways out.` },
    { id: 'optional', t: 'Optional dependencies and collections', body: `Not every dependency must exist:
- [[Optional<Notifier>]] or [[ObjectProvider<Notifier>.getIfAvailable()]] when a bean may be missing.
- [[List<Validator>]] receives every matching bean (ordered by [[@Order]]); an empty list if there are none.
- [[ObjectProvider]] also defers lookup until you need it, which helps with expensive or scoped beans.` },
  ],
  security: [
    { id: 'defaults', t: 'What you get by adding the starter', body: `Adding [[spring-boot-starter-security]] immediately: requires authentication for every URL, generates a login page and a user with a random password (printed in the log), enables CSRF protection, adds security headers, protects against session fixation and provides logout. Every application then replaces the generated user and states its own rules in a [[SecurityFilterChain]] bean, as the next lessons show.` },
  ],
  'sec-authorization': [
    { id: 'idor', t: 'Object-level authorization (IDOR)', body: `**Insecure direct object reference**: the endpoint checks that you're logged in, but not that the object is yours, so changing an ID in the URL reveals someone else's data. It is consistently one of the most common API vulnerabilities. Scope every lookup to the current user.`, code: `// Vulnerable: any logged-in user can read any order by guessing IDs
@GetMapping("/api/orders/{id}")
Order get(@PathVariable long id) { return orders.findById(id).orElseThrow(); }

// Safe: the query itself is limited to the current user's orders
@GetMapping("/api/orders/{id}")
Order get(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
    return orders.findByIdAndOwnerEmail(id, jwt.getSubject())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));   // 404, not 403: don't confirm it exists
}` },
    { id: 'testing', t: 'Testing security rules', body: `Test your rules like any other behaviour. With [[spring-security-test]]: [[@WithMockUser(roles = "ADMIN")]] runs a test as a given user, and MockMvc request post-processors add a JWT ([[jwt()]]) or a CSRF token ([[csrf()]]).`, code: `@WebMvcTest(AdminController.class)
@Import(SecurityConfig.class)
class AdminControllerTest {
    @Autowired MockMvc mvc;

    @Test
    void anonymousGets401() throws Exception {
        mvc.perform(get("/api/admin/stats")).andExpect(status().isUnauthorized());
    }

    @Test
    void userGets403() throws Exception {
        mvc.perform(get("/api/admin/stats").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
           .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminGets200() throws Exception {
        mvc.perform(get("/api/admin/stats")).andExpect(status().isOk());
    }
}` },
  ],
  'sec-jwt': [
    { id: 'storage', t: 'Where should the browser keep tokens?', body: `- **localStorage / sessionStorage**: simple, but any JavaScript on the page can read them, so one XSS bug leaks every token.
- **Memory only** (a variable): XSS can still use the token while the page is open, but can't steal it permanently; lost on reload.
- **HttpOnly, Secure, SameSite cookie**: JavaScript can't read it, and the browser sends it automatically, which brings CSRF back into play (keep CSRF protection on).

A common robust setup: the access token in memory, the refresh token in an HttpOnly cookie restricted to the refresh endpoint. Or a backend-for-frontend that keeps all tokens on the server.` },
    { id: 'revocation', t: 'Logging out and revoking tokens', body: `A JWT stays valid until it expires, even after logout. Options, from simplest: keep access tokens short-lived and revoke the refresh token on logout; store a per-user **token version** in the database and put it in the token, so bumping it invalidates every existing token ("sign out everywhere"); or keep a denylist of token IDs ([[jti]]) until they expire. Checking the database on every request trades away some statelessness for control, which is often worth it for admin accounts.` },
  ],
  'sec-csrf-cors': [
    { id: 'cors', lab: 'diagram:cors-preflight', t: 'How a CORS preflight works', body: `For cross-origin requests that aren't "simple" (JSON bodies, an Authorization header, PUT or DELETE), the browser first sends an [[OPTIONS]] **preflight** asking what is allowed, and only then the real request. The response must carry [[Access-Control-Allow-Origin]] for the browser to hand it to the page. Step through it below.` },
    { id: 'headers', t: 'The security headers Spring adds', body: `- [[X-Content-Type-Options: nosniff]]: browsers must not guess content types.
- [[X-Frame-Options: DENY]]: your pages can't be framed (clickjacking).
- [[Cache-Control: no-cache, no-store]]: authenticated responses aren't cached.
- [[Strict-Transport-Security]] (HTTPS only): browsers use HTTPS for your site from now on.
- Not added by default, and worth adding: [[Content-Security-Policy]], which limits where scripts, styles and frames may come from and is your strongest defence against XSS.` },
  ],
};
