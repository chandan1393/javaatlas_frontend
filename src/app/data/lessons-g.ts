import { Lesson } from '../core/models';

/** Spring Core and Spring Security in depth. Their place in the course is set in data/curriculum.ts. */
export const SPRING_LESSONS: Lesson[] = [
// ============================================================================ Spring Core
{id:`di`,lab:`spring:qualifier`,t:`Dependency injection in depth: constructor, setter, field, @Qualifier and @Primary`,lvl:`I`,min:17,
eli5:`A chef doesn't grow their own tomatoes: the restaurant delivers them to the kitchen door, and the chef just says "I need tomatoes". If two suppliers deliver tomatoes, someone has to say which ones to use.`,
body:`Spring injects dependencies **by type**: a constructor parameter of type [[PaymentGateway]] gets the bean that implements it.
- **Constructor injection** (recommended): every dependency is visible in one place, fields can be [[final]], the object is never half-built, and tests can just call [[new]]. With a single constructor, [[@Autowired]] is optional.
- **Setter injection**: for genuinely optional dependencies that can change later.
- **Field injection** ([[@Autowired]] on a field): short, but it hides dependencies, prevents [[final]] and needs reflection in tests. Avoid it outside tests.

**When several beans match:**
- [[@Primary]] marks the default choice.
- [[@Qualifier("name")]] on the parameter picks one explicitly, and beats [[@Primary]].
- Ask for **all of them**: [[List<PaymentGateway>]] or [[Map<String, PaymentGateway>]] (keyed by bean name), which is a clean way to implement the Strategy pattern.

**Optional dependencies:** [[Optional<T>]], [[ObjectProvider<T>]] or [[@Autowired(required = false)]].

**Circular dependencies** (A needs B, B needs A) fail at startup in Spring Boot. Fix the design: extract the shared part into a third bean, or decouple with events. [[@Lazy]] works around it, but hides the problem.`,
code:`public interface PaymentGateway {
    PaymentResult charge(Order order);
}

@Component("razorpay")
class RazorpayGateway implements PaymentGateway { /* … */ }

@Component("stripe")
@Primary                                         // the default when nobody says otherwise
class StripeGateway implements PaymentGateway { /* … */ }

@Service
public class CheckoutService {
    private final PaymentGateway defaultGateway;
    private final PaymentGateway upiGateway;
    private final Map<String, PaymentGateway> gateways;

    public CheckoutService(PaymentGateway defaultGateway,                        // @Primary: stripe
                           @Qualifier("razorpay") PaymentGateway upiGateway,    // explicit choice
                           Map<String, PaymentGateway> gateways) {              // all of them, by bean name
        this.defaultGateway = defaultGateway;
        this.upiGateway = upiGateway;
        this.gateways = gateways;
    }

    public PaymentResult pay(Order order, String provider) {
        return gateways.getOrDefault(provider, defaultGateway).charge(order);  // Strategy pattern
    }
}`,
pro:`How Spring picks a candidate: match by type; if several match, a qualifier on the injection point decides, then [[@Primary]], then a bean whose name matches the parameter name; otherwise [[NoUniqueBeanDefinitionException]]. With Lombok, [[@RequiredArgsConstructor]] writes the constructor for final fields. Constructor injection also makes circular dependencies impossible to hide: they fail fast at startup instead of surfacing as subtle bugs.`,
trap:`Field injection with @Autowired: unit tests that call new get null dependencies and NullPointerExceptions, and the class can quietly grow ten dependencies without anyone noticing.`,
iq:[[`Why is constructor injection preferred?`,`Dependencies are explicit and required, fields can be final (immutable, thread-safe), objects are never partially initialised, tests can create the class with new, and circular dependencies fail at startup.`],
[`How do you fix NoUniqueBeanDefinitionException?`,`Mark one bean @Primary, add @Qualifier("beanName") at the injection point, inject a List or Map of all candidates, or rename the parameter to match a bean name.`]],
quiz:[`Two PaymentGateway beans: stripe is @Primary, and the constructor parameter has @Qualifier("razorpay"). Which is injected?`,[`stripe`,`razorpay`,`Startup fails`,`Both, as a list`],1,`A qualifier on the injection point takes precedence over @Primary.`]},

{id:`configuration`,t:`Java configuration: @Configuration, @Bean, @Import, @Profile and @Conditional`,lvl:`I`,min:17,
eli5:`Component scanning is staff showing up with name badges ("I'm the cook"). @Bean methods are the manager hiring specific people with specific instructions: needed when the person isn't yours to badge, like a contractor from another company.`,
body:`There are two ways to register beans:
- **Component scanning**: annotate your own classes with [[@Component]], [[@Service]], [[@Repository]] or [[@Controller]]. [[@SpringBootApplication]] scans the package of the main class and everything below it.
- **[[@Bean]] methods** in a [[@Configuration]] class: for classes you don't own (RestClient, ObjectMapper, a third-party SDK) or that need construction logic.

Important details:
- In a [[@Configuration]] class (**full mode**), Spring proxies the class so that one [[@Bean]] method calling another returns the **same singleton**. [[@Configuration(proxyBeanMethods = false)]] (**lite mode**, used by Spring Boot's own auto-configuration) skips that proxy: inject dependencies as method parameters instead of calling the methods.
- [[@Import]] pulls in other configuration classes; [[@ComponentScan]] customises scanning.
- [[@Profile("dev")]] registers a bean only when that profile is active.
- [[@Conditional]] and Spring Boot's [[@ConditionalOnProperty]], [[@ConditionalOnClass]] and [[@ConditionalOnMissingBean]] decide at startup whether a bean is registered. That is how **auto-configuration** works, and why defining your own bean replaces Boot's default.`,
code:`@Configuration
public class InfrastructureConfig {

    @Bean
    Clock clock() {
        return Clock.system(ZoneId.of("Asia/Kolkata"));      // inject Clock instead of calling now() directly
    }

    @Bean
    RestClient paymentsClient(RestClient.Builder builder, @Value("\${payments.url}") String url) {
        return builder.baseUrl(url).build();                 // a class we don't own: configure it here
    }

    @Bean
    @Profile("dev")
    DemoDataLoader demoData(CourseRepository courses) {      // only when the "dev" profile is active
        return new DemoDataLoader(courses);
    }

    @Bean
    @ConditionalOnProperty(name = "features.sms", havingValue = "true")
    Notifier smsNotifier(SmsClient client) {                 // only if features.sms=true
        return new SmsNotifier(client);
    }
}`,
more:[{cap:`Full vs lite mode`,lang:`java`,src:`@Configuration                                   // full mode: the class is proxied
class ReportsConfig {
    @Bean Clock clock() { return Clock.systemUTC(); }
    @Bean ReportService reports() {
        return new ReportService(clock());          // returns the SAME Clock bean, thanks to the proxy
    }
}

@Configuration(proxyBeanMethods = false)         // lite mode: faster startup, no proxy
class ReportsConfigLite {
    @Bean Clock clock() { return Clock.systemUTC(); }
    @Bean ReportService reports(Clock clock) {      // take it as a parameter; calling clock() would create a new one
        return new ReportService(clock);
    }
}`}],
pro:`Spring Boot's auto-configuration classes are listed in META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports and guarded by conditions. Run with --debug (or check the Actuator conditions endpoint) to see which ones matched and why. Most of them use @ConditionalOnMissingBean, so declaring your own bean of the same type quietly switches Boot's version off.`,
trap:`Calling one @Bean method from another in a lite-mode configuration (or a @Component class): you get a brand-new object instead of the singleton.`,
iq:[[`@Component vs @Bean?`,`@Component goes on your own class and is picked up by component scanning. @Bean goes on a factory method in a configuration class and is used for classes you can't annotate or that need custom construction.`],
[`How does Spring Boot let you override an auto-configured bean?`,`Auto-configured beans are usually guarded by @ConditionalOnMissingBean. If you define a bean of that type yourself, the condition fails and Boot's default isn't created.`]],
quiz:[`Which packages does @SpringBootApplication scan by default?`,[`The whole class path`,`Only the main class's package`,`The main class's package and all its sub-packages`,`Packages listed in application.properties`],2,`Component scanning starts at the package of the annotated class and includes everything below it.`]},

{id:`proxies`,lab:`proxy:self`,t:`How Spring proxies work: JDK dynamic proxies, CGLIB and the self-invocation trap`,lvl:`A`,min:17,
eli5:`When you call a company, a receptionist answers first: they note the call, check you're allowed through, then connect you. Spring puts a receptionist (a proxy) in front of your beans. If someone inside the company walks straight to a colleague's desk, the receptionist never sees it.`,
body:`[[@Transactional]], [[@Cacheable]], [[@Async]], [[@PreAuthorize]], [[@Retryable]] and your own aspects all work the same way: Spring injects a **proxy** instead of your object. The proxy runs extra logic (start a transaction, check the cache, check permissions), then calls your method.
- **JDK dynamic proxy**: implements your bean's interfaces. It can only be injected by an interface type.
- **CGLIB proxy**: a generated subclass that overrides your public methods. It works without interfaces, and Spring Boot uses it by default.

Because it's a proxy, some things can't work:
1. **Self-invocation**: [[this.otherMethod()]] calls the real object directly, skipping the proxy, so annotations on [[otherMethod]] are ignored.
2. **final and private methods** can't be overridden by CGLIB, so they can't be intercepted. Keep annotated methods public and non-final.
3. **Construction time**: inside a constructor or [[@PostConstruct]], calls on [[this]] aren't proxied either.

Fixes for self-invocation: move the method into another bean (best), use [[TransactionTemplate]] for programmatic transactions, or inject the bean into itself lazily (works, but is a smell).`,
code:`@Service
public class ReportService {

    @Transactional(readOnly = true)
    public Report build(long id) { /* several queries that should share one transaction */ }

    public List<Report> buildAll(List<Long> ids) {
        return ids.stream().map(this::build).toList();    // this.build(): NO transaction, the proxy is bypassed
    }
}

System.out.println(reportService.getClass().getSimpleName());   // ReportService$$SpringCGLIB$$0

// Fix: a programmatic transaction around the work
@Service
public class ReportService {
    private final TransactionTemplate tx;

    ReportService(PlatformTransactionManager transactionManager) {
        this.tx = new TransactionTemplate(transactionManager);
    }

    public List<Report> buildAll(List<Long> ids) {
        return tx.execute(status -> ids.stream().map(this::load).toList());
    }
}`,
pro:`CGLIB creates the proxy instance without calling your constructor, so the proxy's own fields are null; it holds a reference to the real target bean and delegates every intercepted call to it. Spring AOP is proxy-based and only intercepts method calls on beans. Full AspectJ weaving (at compile or load time) can intercept self-calls, constructors and field access, at the cost of a more complex build.`,
trap:`Annotating a private, final or internally called method with @Transactional (or @Async, @Cacheable) and assuming it works. It silently doesn't.`,
iq:[[`Why doesn't @Transactional work when a method is called from the same class?`,`Transactions are applied by the proxy around the bean. An internal call goes through this, the real object, so it never passes through the proxy and the TransactionInterceptor never runs.`],
[`JDK dynamic proxy vs CGLIB proxy?`,`A JDK proxy implements the bean's interfaces and can only be used through them. CGLIB generates a subclass and overrides methods, so it works for classes without interfaces but can't intercept final or private methods. Spring Boot uses CGLIB by default.`]],
quiz:[`Which proxy type does Spring Boot use by default?`,[`JDK dynamic proxies`,`CGLIB class-based proxies`,`AspectJ compile-time weaving`,`No proxies`],1,`Spring Boot sets proxyTargetClass = true, so it generates CGLIB subclass proxies.`]},

{id:`spring-events`,diagram:`event-flow`,t:`Application events: decoupling with @EventListener`,lvl:`I`,min:17,
eli5:`Instead of the shop owner personally phoning the warehouse, the accountant and the delivery team after every sale, they ring a bell. Whoever cares about sales listens for the bell. New teams can listen without the owner changing anything.`,
body:`Events let one part of the application announce that something happened without knowing who reacts:
- Publish with [[ApplicationEventPublisher.publishEvent(event)]]. An event can be any object; records are ideal.
- Listen with [[@EventListener]] on a method of any bean. The parameter type decides which events it receives.
- Listeners run **synchronously** by default: in the publisher's thread and transaction. If one throws, the exception reaches the publisher.
- [[@TransactionalEventListener]] runs **after the transaction commits** (by default), so emails and notifications never go out for rolled-back work.
- Add [[@Async]] (with [[@EnableAsync]]) to run a listener in the background.
- [[@Order]] controls the order; [[condition = "#event.amount > 10000"]] filters events.
- Spring publishes its own events too, such as [[ApplicationReadyEvent]] when the app has started.

Use events for side effects inside one application: emails, metrics, cache invalidation, audit logs. For communication between services, or when events must never be lost, use a message broker such as Kafka.`,
code:`public record OrderPlaced(long orderId, String email, long amountPaise) {}

@Service
class OrderService {
    private final OrderRepository orders;
    private final ApplicationEventPublisher events;
    OrderService(OrderRepository orders, ApplicationEventPublisher events) { this.orders = orders; this.events = events; }

    @Transactional
    public void place(Order order) {
        orders.save(order);
        events.publishEvent(new OrderPlaced(order.id(), order.email(), order.totalPaise()));
        // OrderService knows nothing about emails, metrics or loyalty points
    }
}

@Component
class ReceiptEmails {
    @Async
    @TransactionalEventListener                     // only after the order is committed, on another thread
    void send(OrderPlaced e) { mailer.sendReceipt(e.email(), e.orderId()); }
}

@Component
class SalesMetrics {
    @EventListener                                  // synchronous, inside the same transaction
    void count(OrderPlaced e) { metrics.counter("orders.placed").increment(); }
}`,
pro:`Events are in-memory: if the application crashes after the commit but before an async listener finishes, that work is lost. For must-not-lose side effects, use the transactional outbox pattern (write the event to a table in the same transaction and publish it afterwards) or Spring Modulith's event publication registry, which does that for you.`,
trap:`Sending emails from a plain @EventListener inside a transaction that later rolls back: the customer gets a receipt for an order that doesn't exist.`,
iq:[[`Are Spring application events asynchronous?`,`No. By default listeners run synchronously in the publisher's thread (and transaction). Add @Async with @EnableAsync to run them on another thread.`],
[`@EventListener vs @TransactionalEventListener?`,`@EventListener runs immediately when the event is published. @TransactionalEventListener is bound to the publisher's transaction and runs at a chosen phase, AFTER_COMMIT by default, so it only reacts to work that was actually saved.`]],
quiz:[`Which listener runs only if the publishing transaction commits?`,[`@EventListener`,`@TransactionalEventListener`,`@Async`,`@Order`],1,`@TransactionalEventListener defaults to the AFTER_COMMIT phase.`]},

// ============================================================================ Spring Security
{id:`sec-architecture`,lab:`security`,t:`Inside Spring Security: DelegatingFilterProxy, SecurityFilterChain and the SecurityContext`,lvl:`I`,min:17,
eli5:`An airport: before the gate, every passenger goes through a line of checkpoints (ticket, passport, security scan). Each checkpoint can wave you on or stop you. Spring Security is that line of checkpoints in front of your controllers.`,
body:`How a request gets secured:
1. The servlet container runs its filters. Spring Boot registers one called **DelegatingFilterProxy**, which hands the request to Spring's **FilterChainProxy**.
2. FilterChainProxy picks the **first SecurityFilterChain whose matcher matches** the request. You can define several, for example one for [[/api/**]] with JWT and one for the rest with form login, ordered with [[@Order]].
3. The chosen chain runs its filters in a fixed order: SecurityContextHolderFilter, HeaderWriterFilter, CorsFilter, CsrfFilter, LogoutFilter, the authentication filters, AnonymousAuthenticationFilter, ExceptionTranslationFilter and finally **AuthorizationFilter**.
4. Authentication filters store the logged-in user in the **SecurityContextHolder** (per request, per thread). Your code reads it from there.
5. **ExceptionTranslationFilter** turns security exceptions into responses: not logged in → **401** via the AuthenticationEntryPoint; logged in but not allowed → **403** via the AccessDeniedHandler.

The lab below sends real-world requests through this chain.`,
code:`@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    @Order(1)
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/api/**")                                  // this chain only handles /api/**
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))   // Bearer JWT
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(csrf -> csrf.disable())                                // tokens in headers, not cookies
            .build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain web(HttpSecurity http) throws Exception {
        return http                                                      // everything else: a classic web app
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/login", "/css/**").permitAll()
                .anyRequest().authenticated())
            .formLogin(Customizer.withDefaults())
            .build();
    }
}`,
more:[{cap:`Reading the current user`,lang:`java`,src:`@GetMapping("/api/me")
Profile me(@AuthenticationPrincipal Jwt jwt) {                  // injected from the SecurityContext
    return profiles.findByEmail(jwt.getSubject());
}

// Anywhere in the same request thread:
Authentication auth = SecurityContextHolder.getContext().getAuthentication();
String email = auth.getName();`}],
pro:`Set logging.level.org.springframework.security=TRACE to see, for every request, which chain was chosen and what each filter did. The SecurityContext lives in a ThreadLocal, so it doesn't follow your work onto other threads: use DelegatingSecurityContextExecutor (or Spring's context propagation) for @Async tasks that need the user.`,
trap:`Disabling CSRF on a chain that authenticates with session cookies, because a tutorial for token-based APIs did it.`,
iq:[[`Which component turns security exceptions into 401 and 403 responses?`,`ExceptionTranslationFilter: an AuthenticationException (or access denied for an anonymous user) goes to the AuthenticationEntryPoint (401); AccessDeniedException for an authenticated user goes to the AccessDeniedHandler (403).`],
[`How does Spring choose between several SecurityFilterChain beans?`,`FilterChainProxy checks them in @Order order and uses the first whose securityMatcher matches the request; only that one chain runs.`]],
quiz:[`A logged-in user without the required role calls an endpoint. What is the response?`,[`401 Unauthorized`,`403 Forbidden`,`404 Not Found`,`302 to the login page`],1,`They're authenticated but not authorized: AccessDeniedHandler returns 403.`]},

{id:`sec-authentication`,diagram:`auth-architecture`,t:`Authentication: UserDetailsService, AuthenticationManager and login`,lvl:`I`,min:17,
eli5:`At a hotel desk, you give your name and show ID. The receptionist looks you up in the guest list and checks the photo matches. Spring does the same: look up the user, check the password, hand over a key card (the Authentication).`,
body:`**Authentication** answers "who are you?". For username and password, the pieces are:
- **UserDetailsService**: your code. [[loadUserByUsername(email)]] fetches the user, their password **hash** and their roles from the database.
- **PasswordEncoder**: checks the submitted password against the stored hash ([[matches()]]).
- **DaoAuthenticationProvider** uses both; **AuthenticationManager** (usually ProviderManager) asks each provider in turn. Spring Boot wires this up for you once a UserDetailsService and a PasswordEncoder bean exist.
- On success, an **Authentication** with the user and their authorities goes into the SecurityContext (and, for session-based login, into the HTTP session).

Ways to log in: **form login** (classic web apps, session cookie), **HTTP Basic** (scripts and internal tools), a **custom JSON endpoint** that calls the AuthenticationManager and returns a token (single-page apps), **OAuth 2.0 / OIDC** ("Log in with Google"), and since Spring Security 6.4, **passkeys** and one-time tokens.

Good practice: the same error for a wrong email and a wrong password, account lockout or rate limiting, and a new session ID after login (Spring does this by default to prevent session fixation).`,
code:`@Service
class AppUserDetailsService implements UserDetailsService {
    private final UserRepository users;
    AppUserDetailsService(UserRepository users) { this.users = users; }

    @Override
    public UserDetails loadUserByUsername(String email) {
        AppUser u = users.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("No such user"));
        return User.withUsername(u.getEmail())
                .password(u.getPasswordHash())        // the BCrypt hash, never the real password
                .roles(u.getRole())                   // "USER" becomes the authority ROLE_USER
                .accountLocked(u.isLocked())
                .build();
    }
}

@Configuration
class PasswordConfig {
    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();   // stores {bcrypt}$2a$10$…
    }
}`,
more:[{cap:`A JSON login endpoint for a single-page app`,lang:`java`,src:`@Bean
AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();             // expose the one Spring Boot built
}

@PostMapping("/auth/login")
TokenResponse login(@RequestBody @Valid LoginRequest req) {
    Authentication auth = authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken.unauthenticated(req.email(), req.password()));
    return tokens.issueFor(auth);       // wrong password: BadCredentialsException, turned into 401
}`}],
pro:`By default DaoAuthenticationProvider reports a missing user as BadCredentialsException, so attackers can't tell which emails are registered; keep your own error messages just as vague. It also performs a dummy password check for unknown users so response times don't leak that information either.`,
trap:`Returning "No account with this email" on login or password reset. It tells attackers exactly which emails to target.`,
iq:[[`What does UserDetailsService do?`,`It loads a user by username (or email) and returns a UserDetails with the password hash, authorities and account status, which Spring uses to authenticate login attempts.`],
[`How does Spring Security check a password?`,`DaoAuthenticationProvider loads the UserDetails and calls PasswordEncoder.matches(rawPassword, storedHash), which hashes the attempt with the stored salt and cost and compares the results.`]],
quiz:[`Which interface do you implement to load users from your own database?`,[`AuthenticationProvider`,`UserDetailsService`,`SecurityFilterChain`,`PasswordEncoder`],1,`UserDetailsService.loadUserByUsername() is the hook for your user store.`]},

{id:`sec-passwords`,lab:`password`,t:`Storing passwords: hashing, salting and BCrypt`,lvl:`B`,min:17,
eli5:`Instead of keeping everyone's house key, you keep a mould of each key that can't be turned back into a key. When someone shows up, you press their key into a fresh mould and compare. Even if the moulds are stolen, nobody gets in.`,
body:`Never store passwords, or anything that can be turned back into them. Store a **hash** made with a **slow, salted** password-hashing algorithm:
- **Hash**: a one-way function. You can check a password against it, but not reverse it.
- **Salt**: random data added to each password before hashing, so the same password gives different hashes and precomputed tables are useless. BCrypt generates it and stores it inside the hash.
- **Slow on purpose**: a **cost factor** makes each hash take tens or hundreds of milliseconds. Unnoticeable at login, crippling for an attacker trying billions of guesses.

Use **BCrypt** (Spring's default), **Argon2** or **PBKDF2**. Never MD5, SHA-1 or plain SHA-256: they're designed to be fast.

In Spring, **DelegatingPasswordEncoder** prefixes each hash with its algorithm ([[{bcrypt}]]), so you can switch algorithms later and upgrade old hashes when users next log in. For password rules, length beats complexity: require 12 or more characters and reject passwords known from data breaches.`,
code:`@Service
class RegistrationService {
    private final PasswordEncoder encoder;
    private final UserRepository users;
    RegistrationService(PasswordEncoder encoder, UserRepository users) { this.encoder = encoder; this.users = users; }

    public void register(String email, String rawPassword) {
        if (rawPassword.length() < 12) throw new IllegalArgumentException("Use at least 12 characters");
        users.save(new AppUser(email, encoder.encode(rawPassword)));   // only the hash is stored
    }
}

PasswordEncoder bcrypt = new BCryptPasswordEncoder(12);           // cost 12: 2^12 rounds
String hash = bcrypt.encode("correct horse battery staple");     // $2a$12$<salt><hash>, different every time
bcrypt.matches("correct horse battery staple", hash);            // true
bcrypt.matches("correct horse battery stapel", hash);            // false`,
pro:`Tune the cost so one hash takes a noticeable fraction of a second on your production hardware, and revisit it as hardware gets faster. BCrypt only uses the first 72 bytes of a password; Argon2 has no such limit and resists GPU attacks better, which is why it's often recommended for new systems. Implement UserDetailsPasswordService and Spring will re-hash passwords with the current encoder automatically on successful login.`,
trap:`Hashing passwords with SHA-256 or MD5 "because it's a hash". They're fast by design: a GPU tries billions of guesses per second against them.`,
iq:[[`Why use BCrypt instead of SHA-256 for passwords?`,`BCrypt is deliberately slow (tunable cost) and salted, so each guess is expensive and identical passwords produce different hashes. SHA-256 is fast and unsalted by default, which makes brute force and rainbow tables practical.`],
[`What is a salt and where is it stored?`,`Random data combined with each password before hashing, so identical passwords hash differently and precomputed tables don't work. It isn't secret: BCrypt stores it inside the hash string.`]],
quiz:[`You hash the same password twice with BCrypt. The two hashes are…`,[`Identical`,`Different, because each has its own random salt`,`Different, because BCrypt is random and can't be verified`,`Identical except for the cost`],1,`Each hash gets a new random salt, yet both still verify against the password.`]},

{id:`sec-authorization`,t:`Authorization: URL rules, roles vs authorities and method security`,lvl:`I`,min:17,
eli5:`Getting into the building (authentication) is different from which rooms your key card opens (authorization). An intern and the CEO both get in; only one opens the server room.`,
body:`**Authorization** answers "are you allowed to do this?".

**URL rules** in [[authorizeHttpRequests]] are checked **in order, first match wins**, so put specific rules before general ones and finish with a catch-all such as [[anyRequest().authenticated()]] (deny by default).
- [[permitAll()]], [[authenticated()]], [[hasRole("ADMIN")]], [[hasAuthority("courses:write")]], [[hasAnyRole(...)]].

**Roles vs authorities**: both are just strings on the Authentication. A role is an authority with the [[ROLE_]] prefix: [[hasRole("ADMIN")]] checks for [[ROLE_ADMIN]]. JWT scopes become [[SCOPE_...]] authorities. Use roles for coarse groups and authorities for fine-grained permissions.

**Method security** ([[@EnableMethodSecurity]]) protects service methods, whatever entry point calls them:
- [[@PreAuthorize("hasRole('ADMIN')")]] before the method runs.
- SpEL can use parameters and the user: [[@PreAuthorize("#userId == authentication.name")]].
- [[@PostAuthorize("returnObject.owner == authentication.name")]] checks the result.
- Call your own bean: [[@PreAuthorize("@courseAccess.canEdit(#id, authentication)")]].

The most common real-world hole is **object-level access**: user A changing [[/api/orders/42]] to [[/api/orders/43]] and seeing user B's order. Always check ownership, not just the role.`,
code:`@Bean
SecurityFilterChain security(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.GET, "/api/courses/**").permitAll()      // specific rules first
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.POST, "/api/courses/**").hasAuthority("courses:write")
            .anyRequest().authenticated())                                      // deny anything unmatched to anonymous users
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .build();
}

@Service
@EnableMethodSecurity                       // usually on a @Configuration class
class OrderService {
    @PreAuthorize("hasRole('ADMIN') or @orders.isOwner(#orderId, authentication.name)")
    public Order find(long orderId) { return repo.findById(orderId).orElseThrow(); }

    @PreAuthorize("hasRole('ADMIN')")
    public void refund(long orderId) { /* … */ }
}`,
pro:`Method security is implemented with proxies, so the self-invocation trap applies: a @PreAuthorize method called from another method of the same bean isn't checked. Enforce ownership in the service layer (or in the query itself: findByIdAndOwnerEmail), not just in the controller, so every entry point (REST, GraphQL, scheduled jobs) gets the same rules.`,
trap:`Ordering rules from general to specific: .requestMatchers("/api/**").authenticated() before .requestMatchers("/api/admin/**").hasRole("ADMIN") means admin URLs only require login.`,
iq:[[`hasRole vs hasAuthority?`,`Both check the user's granted authorities. hasRole("ADMIN") adds the ROLE_ prefix and looks for ROLE_ADMIN; hasAuthority("ROLE_ADMIN") or hasAuthority("courses:write") match the exact string.`],
[`How do you make sure users can only access their own data?`,`Check ownership on every request: in the service layer with @PreAuthorize/@PostAuthorize using the current user, or by scoping queries to the user (findByIdAndOwnerId). Relying only on roles leaves object-level (IDOR) holes.`]],
quiz:[`The rules are: /api/** authenticated(), then /api/admin/** hasRole("ADMIN"). A normal user calls /api/admin/stats. What happens?`,[`403 Forbidden`,`200 OK: the first rule matched`,`401 Unauthorized`,`The rules are reordered automatically`],1,`First match wins: /api/** already matched, so the admin rule is never reached.`]},

{id:`sec-jwt`,lab:`jwt`,diagram:`jwt-refresh`,t:`JWT for stateless APIs: structure, signing, expiry and refresh tokens`,lvl:`A`,min:17,
eli5:`A JWT is a festival wristband: printed with your name and access level, and stamped with a hologram only the organiser can make. Guards don't need to phone the office; they check the hologram and the date.`,
body:`A **JSON Web Token** has three Base64URL parts, [[header.payload.signature]]:
- **Header**: the algorithm, such as [[HS256]] or [[RS256]].
- **Payload**: claims such as [[sub]] (who), [[iss]] (issuer), [[aud]] (audience), [[exp]] (expiry), [[iat]] (issued at), and roles or scopes. It is **encoded, not encrypted**: anyone can read it.
- **Signature**: proves the token was issued by someone holding the key and hasn't been changed.

**Signing**: **HS256** uses one shared secret (sign and verify with the same key), simple for a single API. **RS256/ES256** sign with a private key and verify with a public key, published as a **JWKS**, so many services can verify tokens without being able to create them.

**Stateless**: the API validates signature, issuer, audience and expiry locally, with no session and no database lookup. The flip side: a token can't easily be revoked before it expires. So:
- keep **access tokens short-lived** (5 to 15 minutes);
- use a **refresh token** (long-lived, stored server-side so it can be revoked, **rotated** on every use) to get new access tokens.

In Spring: [[oauth2ResourceServer(o -> o.jwt(...))]] validates incoming tokens; [[JwtEncoder]] issues them.`,
code:`@Configuration
class JwtConfig {
    @Bean
    JwtDecoder jwtDecoder(@Value("\${jwt.secret}") String secret) {        // 32+ random bytes, from an env variable
        SecretKey key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        return NimbusJwtDecoder.withSecretKey(key).build();
    }

    @Bean
    JwtEncoder jwtEncoder(@Value("\${jwt.secret}") String secret) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(secret.getBytes(StandardCharsets.UTF_8)));
    }
}

@Service
class TokenService {
    private final JwtEncoder encoder;
    TokenService(JwtEncoder encoder) { this.encoder = encoder; }

    String issueFor(Authentication auth) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("https://api.javaatlas.com")
                .subject(auth.getName())
                .issuedAt(now)
                .expiresAt(now.plus(15, ChronoUnit.MINUTES))              // short-lived
                .claim("roles", auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList())
                .build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}`,
more:[{cap:`Turning the roles claim into authorities`,lang:`java`,src:`@Bean
JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter roles = new JwtGrantedAuthoritiesConverter();
    roles.setAuthoritiesClaimName("roles");     // read authorities from "roles" instead of "scope"
    roles.setAuthorityPrefix("");               // the claim already contains ROLE_USER, ROLE_ADMIN
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(roles);
    return converter;
}`}],
pro:`Where the browser keeps tokens matters: localStorage is readable by any script on the page, so one XSS bug leaks every token. An HttpOnly, Secure, SameSite cookie can't be read by JavaScript (but then you need CSRF protection again). A common, robust pattern is a short-lived access token in memory plus a refresh token in an HttpOnly cookie, or a backend-for-frontend that keeps tokens server-side entirely.`,
trap:`Putting personal or secret data in the payload (it's only Base64URL-encoded), or issuing access tokens valid for days.`,
iq:[[`Why are JWTs hard to revoke, and how do you deal with it?`,`The API trusts any token with a valid signature until it expires, without checking a database. Mitigate with short-lived access tokens, server-side refresh tokens that can be revoked and are rotated on use, and, if needed, a denylist or per-user token version checked for sensitive operations.`],
[`HS256 vs RS256?`,`HS256 signs and verifies with one shared secret, so every verifier could also forge tokens. RS256 (or ES256) signs with a private key and verifies with a public key, so many services can validate tokens while only the issuer can create them.`]],
quiz:[`Can anyone read the claims inside a signed JWT?`,[`No, the signature encrypts them`,`Yes: the payload is only Base64URL-encoded`,`Only the server that issued it`,`Only with the refresh token`],1,`Signing protects integrity, not confidentiality. Use JWE if the contents must be secret.`]},

{id:`sec-oauth2`,diagram:`oauth-code-flow`,t:`OAuth 2.0 and OpenID Connect: social login, Keycloak and resource servers`,lvl:`A`,min:17,
eli5:`A valet key: you give the parking attendant a key that starts the car but can't open the boot. OAuth gives apps a limited key (a token) to act for you, instead of your actual password.`,
body:`**OAuth 2.0** is a standard for **delegated authorization**: an app gets a token to access resources on a user's behalf, without ever seeing the user's password. **OpenID Connect (OIDC)** adds **authentication** on top: an **ID token** (a JWT) that says who the user is.

The four roles: the **resource owner** (the user), the **client** (your app), the **authorization server** (Google, Microsoft, Okta, Keycloak, Spring Authorization Server) and the **resource server** (your API, which accepts the access tokens).

Which flow:
- **Authorization code with PKCE**: web apps, mobile apps and single-page apps. The standard choice.
- **Client credentials**: service-to-service calls with no user.
- **Device code**: TVs and CLIs.
- The old **implicit** and **password** grants are deprecated; don't use them.

In Spring Boot:
- **Login with an identity provider**: [[spring-boot-starter-oauth2-client]] plus [[.oauth2Login()]].
- **An API that accepts tokens**: [[spring-boot-starter-oauth2-resource-server]] plus an [[issuer-uri]]. Spring discovers the provider's public keys (JWKS) and validates every token.
- **Keycloak** is a popular self-hosted authorization server: users, roles, social login and MFA without writing them yourself.`,
code:`@Bean
SecurityFilterChain security(HttpSecurity http) throws Exception {
    return http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/", "/public/**").permitAll()
            .anyRequest().authenticated())
        .oauth2Login(Customizer.withDefaults())             // "Log in with Google" for the web app
        .build();
}

@GetMapping("/me")
Map<String, Object> me(@AuthenticationPrincipal OidcUser user) {
    return Map.of(
        "name", user.getFullName(),                     // claims from the ID token
        "email", user.getEmail(),
        "verified", user.getEmailVerified());
}`,
more:[{cap:`application.properties for both sides`,lang:`text`,src:`# The web app logs users in with Google (OAuth2 client / OIDC login)
spring.security.oauth2.client.registration.google.client-id=\${GOOGLE_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=\${GOOGLE_CLIENT_SECRET}
spring.security.oauth2.client.registration.google.scope=openid,email,profile

# The API accepts access tokens issued by Keycloak (resource server)
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://auth.javaatlas.com/realms/javaatlas`}],
pro:`A resource server must check more than the signature: the issuer (iss), the audience (aud: was this token meant for this API?) and expiry. Spring checks iss and exp from the issuer-uri; add an audience validator for aud. For single-page apps, the most secure setup is a backend-for-frontend: the server does the OAuth flow and keeps tokens, and the browser only holds an HttpOnly session cookie.`,
trap:`Treating an access token as proof of who the user is. Use the ID token (OIDC) for identity; access tokens are for calling APIs and may not even be readable by the client.`,
iq:[[`OAuth 2.0 vs OpenID Connect?`,`OAuth 2.0 is about authorization: getting access tokens to call APIs on a user's behalf. OpenID Connect is a layer on top that adds authentication: an ID token and a userinfo endpoint describing who the user is.`],
[`Which OAuth flow should a single-page app use?`,`The authorization code flow with PKCE, ideally run by a backend-for-frontend so tokens never reach the browser. The implicit flow is deprecated.`]],
quiz:[`What does PKCE protect against?`,[`Expired tokens`,`An intercepted authorization code being exchanged by someone else`,`SQL injection`,`Weak passwords`],1,`Only the app that created the code_verifier can redeem the code, so a stolen code is useless.`]},

{id:`sec-csrf-cors`,diagram:`csrf-attack`,t:`CSRF, CORS and security headers`,lvl:`I`,min:17,
eli5:`CSRF is a forged letter that arrives with your real signature because your pen signs anything automatically. CORS is the browser asking another building "may this visitor come in?" before letting a page talk to it.`,
body:`**CSRF (cross-site request forgery)**: browsers attach cookies to every request for a site, even when another site triggers it. If you authenticate with **cookies**, a malicious page can make your browser send authenticated requests.
- Spring Security enables CSRF protection by default: state-changing requests (POST, PUT, DELETE) must include a secret **CSRF token** that only your own pages know.
- Server-rendered forms (Thymeleaf) include it automatically. Single-page apps read it from an **XSRF-TOKEN** cookie and send it back as an **X-XSRF-TOKEN** header; Angular's HttpClient does this out of the box.
- **SameSite** cookies (Lax or Strict) add a second layer.
- APIs that authenticate with an [[Authorization]] header (no cookies) aren't vulnerable, which is the only good reason to disable CSRF.

**CORS (cross-origin resource sharing)**: a browser rule that stops a page from reading responses from another origin unless that origin allows it. It protects users; it is not an access control for your API (curl ignores it). Configure exact allowed origins; [[*]] can't be combined with credentials.

**Security headers**: Spring adds sensible ones by default (X-Content-Type-Options, X-Frame-Options, cache control for authenticated pages, and HSTS over HTTPS). Add a **Content-Security-Policy** to limit where scripts can load from.`,
code:`@Bean
SecurityFilterChain security(HttpSecurity http) throws Exception {
    return http
        .cors(Customizer.withDefaults())                             // uses the CorsConfigurationSource bean
        .csrf(csrf -> csrf
            .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())   // XSRF-TOKEN cookie for the SPA
            .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
        .headers(headers -> headers
            .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; frame-ancestors 'none'"))
            .frameOptions(frame -> frame.deny()))
        .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
        .formLogin(Customizer.withDefaults())
        .build();
}

@Bean
CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of("https://javaatlas.com"));         // exact origins, never "*" with credentials
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    cfg.setAllowedHeaders(List.of("Content-Type", "Authorization", "X-XSRF-TOKEN"));
    cfg.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", cfg);
    return source;
}`,
pro:`If your frontend and API live on different sites (for example *.vercel.app and *.up.railway.app), cookies marked SameSite=Strict or Lax won't be sent at all, and third-party cookie blocking makes SameSite=None unreliable. Putting both under one site (javaatlas.com and api.javaatlas.com) fixes it, which is exactly why this site's deployment uses its own domains.`,
trap:`Calling csrf().disable() on an app that logs users in with session cookies, or "fixing" a CORS error with allowedOrigins("*").`,
iq:[[`When is it safe to disable CSRF protection?`,`When the browser never sends credentials automatically: a stateless API authenticated with an Authorization header (bearer token) and no cookies. With cookie-based sessions, keep it on.`],
[`Is CORS a security feature for your API?`,`It protects users' browsers from malicious pages reading responses from other origins. It doesn't stop direct requests (curl, scripts, other servers), so the API must still authenticate and authorize every request.`]],
quiz:[`Which kind of authentication is vulnerable to CSRF?`,[`Bearer tokens in an Authorization header`,`Session cookies sent automatically by the browser`,`API keys in a header`,`Mutual TLS`],1,`CSRF abuses credentials the browser attaches automatically, such as cookies.`]},
];
