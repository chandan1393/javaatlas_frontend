import { Stage } from '../core/models';

/** Stages 7-9: Spring Core and MVC, Spring Boot, microservices. */
export const STAGES_C: Stage[] = [
{id:`spring`,title:`Spring Core and Spring MVC`,level:`I`,blurb:`Dependency injection, bean scopes and lifecycle, AOP, and how a request flows through Spring MVC.`,lessons:[
{id:`ioc`,diagram:`spring-ioc`,t:`IoC and dependency injection`,lvl:`I`,min:17,
eli5:`Instead of a chef growing their own vegetables, a supplier delivers them. The chef just says "I need tomatoes". That's dependency injection, and the Spring container is the supplier.`,
body:`**Inversion of Control** means objects don't create their own dependencies; a container creates them and wires them together. **Dependency Injection** is how Spring does it.

The **ApplicationContext** reads your configuration, creates **beans** (the objects it manages) and injects them wherever they're needed.

Injection styles:
- **Constructor injection** (recommended): dependencies are explicit, can be [[final]], and tests are easy. With a single constructor, [[@Autowired]] is optional.
- **Setter injection**: for optional dependencies.
- **Field injection** ([[@Autowired]] on a field): avoid it. It hides dependencies and needs reflection to test.

Register beans with stereotype annotations ([[@Component]], [[@Service]], [[@Repository]], [[@Controller]]) found by component scanning, or with [[@Bean]] methods inside a [[@Configuration]] class.`,
code:`public interface PaymentGateway { String charge(long paise); }

@Component
@Primary                                        // the default when several exist
class RazorpayGateway implements PaymentGateway {
    public String charge(long paise) { return "rzp_" + paise; }
}

@Component("stripe")
class StripeGateway implements PaymentGateway {
    public String charge(long paise) { return "str_" + paise; }
}

@Service
public class CheckoutService {
    private final PaymentGateway gateway;       // final and explicit

    public CheckoutService(PaymentGateway gateway) {   // constructor injection
        this.gateway = gateway;
    }
}

@Configuration
class AppConfig {
    @Bean
    Clock clock() { return Clock.systemUTC(); } // a third-party object as a bean
}`,
pro:`Spring resolves a dependency by type first, then by [[@Qualifier]] or [[@Primary]], then by parameter name. Constructor injection also exposes circular dependencies at startup; Spring Boot 2.6+ forbids circular references by default. Spring 6 and Boot 3 can compute the bean graph at build time (AOT processing), which GraalVM native images rely on.`,
trap:`Two beans of the same type with no @Primary or @Qualifier. Startup fails with NoUniqueBeanDefinitionException.`,
iq:[[`Why is constructor injection preferred?`,`Dependencies are explicit and can be final, the object is never half-built, unit tests can create it with plain new, and circular dependencies fail fast at startup.`],
[`@Component vs @Bean?`,`@Component marks your own class for component scanning. @Bean is a method in a @Configuration class that returns an object; use it for third-party classes or when creating the object needs logic.`]],
quiz:[`Which injection style does the Spring team recommend for required dependencies?`,[`Field`,`Setter`,`Constructor`,`Static`],2,`Constructor injection makes required dependencies explicit and final.`]},

{id:`beans`,diagram:`bean-lifecycle`,t:`Bean scopes and lifecycle`,lvl:`I`,min:17,
eli5:`A singleton bean is the office printer everyone shares. A prototype bean is a paper cup: you get a fresh one every time you ask.`,
body:`**Scopes**:
- [[singleton]] (the default): one instance per container. It must be stateless or thread-safe.
- [[prototype]]: a new instance every time one is requested.
- Web scopes: [[request]], [[session]] and [[application]].

The **lifecycle** of a bean:
1. Instantiate it (call the constructor).
2. Inject its dependencies.
3. Run [[BeanPostProcessor]] hooks, where annotations like [[@Autowired]] are processed.
4. Call init callbacks: [[@PostConstruct]], [[afterPropertiesSet()]] or [[@Bean(initMethod = ...)]].
5. Wrap it in a proxy if needed (for [[@Transactional]], [[@Async]] and other aspects).
6. Use it.
7. On shutdown, call [[@PreDestroy]] (not called for prototype beans).`,
code:`@Component
public class CourseCache {
    private final Map<Long, Course> cache = new ConcurrentHashMap<>();   // thread-safe
    private final CourseRepository repo;

    public CourseCache(CourseRepository repo) { this.repo = repo; }

    @PostConstruct
    void warmUp() {                                   // runs after injection
        repo.findTop20ByOrderByRatingDesc().forEach(c -> cache.put(c.getId(), c));
    }

    @PreDestroy
    void shutdown() { cache.clear(); }
}

@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
class ReportBuilder {
    private final List<String> lines = new ArrayList<>();
}`,
pro:`Injecting a prototype bean into a singleton gives you **one** prototype instance forever, because injection happens only once. Inject an [[ObjectProvider<ReportBuilder>]] and call [[getObject()]] each time, or use a [[@Lookup]] method. [[@PostConstruct]] and [[@PreDestroy]] come from [[jakarta.annotation]] in Spring 6+.`,
trap:`Storing per-user data in a field of a singleton @Service. Every request shares it, so users see each other's data.`,
iq:[[`Is a singleton bean thread-safe?`,`Not automatically. Spring creates one instance that all threads share; it's safe only if it's stateless or its state is thread-safe.`],
[`What happens when you inject a prototype bean into a singleton?`,`The prototype is created once at injection time and reused. For a new instance per use, inject an ObjectProvider or use @Lookup method injection.`]],
quiz:[`What is the default Spring bean scope?`,[`prototype`,`request`,`singleton`,`session`],2,`One shared instance per ApplicationContext.`]},

{id:`aop`,t:`Aspect-oriented programming`,lvl:`A`,min:17,
eli5:`AOP is a security guard for every door. You don't add a guard to each room's code; you declare "check badges at all doors" once.`,
body:`**AOP** handles **cross-cutting concerns** such as logging, security, transactions, metrics and caching in one place, instead of scattering them across every method.

Vocabulary:
- **Aspect**: the class holding the cross-cutting logic ([[@Aspect]]).
- **Advice**: what runs and when: [[@Before]], [[@AfterReturning]], [[@AfterThrowing]], [[@After]], [[@Around]].
- **Pointcut**: where it applies, such as [[execution(* com.app.service..*(..))]] or [[@annotation(...)]].
- **Join point**: a method execution being intercepted.

You already use AOP every day: [[@Transactional]], [[@Cacheable]], [[@Async]] and [[@PreAuthorize]] are all aspects.`,
code:`@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogTime {}

@Aspect
@Component
public class TimingAspect {
    private static final Logger log = LoggerFactory.getLogger(TimingAspect.class);

    @Around("@annotation(com.javaatlas.LogTime)")
    public Object time(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        try {
            return pjp.proceed();                         // call the real method
        } finally {
            long ms = (System.nanoTime() - start) / 1_000_000;
            log.info("{} took {} ms", pjp.getSignature().toShortString(), ms);
        }
    }
}

@Service
class ReportService {
    @LogTime
    public Report monthly() { /* ... */ return new Report(); }
}`,
pro:`Spring AOP is **proxy-based**: JDK dynamic proxies for interfaces, CGLIB subclass proxies otherwise (Spring Boot's default). So it only intercepts **calls that come through the proxy**, never self-invocation, and it can't advise [[final]] methods or classes. Full AspectJ weaving at compile or load time removes these limits but is rarely needed.`,
trap:`Expecting an aspect to run when a method is called from inside the same class. That call bypasses the proxy.`,
iq:[[`How does Spring implement AOP?`,`With runtime proxies: JDK dynamic proxies when the bean implements an interface, CGLIB subclass proxies otherwise. The proxy runs the advice around calls to the target object.`],
[`Which advice type can change the return value or skip the method?`,`@Around, because it decides whether and when to call proceed() and returns the result.`]],
quiz:[`Which of these is a cross-cutting concern?`,[`Calculating GST on an invoice`,`Logging how long methods take`,`Rendering a product page`,`Mapping one entity`],1,`It applies across many unrelated classes.`]},

{id:`mvc`,diagram:`spring-mvc-request`,t:`Spring MVC request flow`,lvl:`I`,min:17,
eli5:`DispatcherServlet is a hotel receptionist. Every guest (request) comes to the front desk first and is sent to the right room (controller).`,
body:`Every HTTP request goes through one **front controller**, the [[DispatcherServlet]]:

1. Servlet filters run first (security, CORS, logging).
2. [[DispatcherServlet]] asks a **HandlerMapping** which controller method matches the URL and HTTP method.
3. Interceptors' [[preHandle]] methods run.
4. A **HandlerAdapter** calls the method, resolving arguments such as [[@PathVariable]], [[@RequestParam]] and [[@RequestBody]] (converted from JSON by **HttpMessageConverters**).
5. The return value is written as JSON ([[@RestController]]) or resolved to a view by a **ViewResolver** (for example Thymeleaf).
6. Exceptions go to [[@ExceptionHandler]] methods and [[@ControllerAdvice]] classes.

[[@RestController]] is [[@Controller]] plus [[@ResponseBody]].`,
code:`@RestController
@RequestMapping("/api/v1/courses")
public class CourseController {
    private final CourseService service;
    public CourseController(CourseService service) { this.service = service; }

    @GetMapping
    public Page<CourseDto> list(@RequestParam(defaultValue = "0") int page,
                                @RequestParam(required = false) Level level) {
        return service.search(level, PageRequest.of(page, 20));
    }

    @GetMapping("/{slug}")
    public CourseDto get(@PathVariable String slug) {
        return service.bySlug(slug);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CourseDto create(@Valid @RequestBody CreateCourse cmd) {
        return service.create(cmd);
    }
}`,
pro:`Filters live at the servlet level, before Spring MVC; interceptors live inside Spring MVC and can see which handler was chosen. Spring Framework 7 adds first-class **API versioning**, selected by header, path or query parameter through a [[version]] attribute on the mapping annotations. Spring MVC is blocking (thread per request, which virtual threads now make cheap); **WebFlux** is the reactive, non-blocking alternative.`,
trap:`Returning JPA entities directly from controllers. Lazy associations trigger N+1 queries or LazyInitializationException during JSON serialization, and you leak internal fields. Return DTOs instead.`,
iq:[[`Explain the Spring MVC request flow.`,`Request, filters, DispatcherServlet, HandlerMapping finds the controller method, interceptors, HandlerAdapter resolves arguments and invokes it, the return value is converted by an HttpMessageConverter (or a view is resolved), then the response. Exceptions go to @ControllerAdvice.`],
[`@Controller vs @RestController?`,`@RestController adds @ResponseBody to every method, so return values are serialized into the response body (usually JSON) instead of being treated as view names.`]],
quiz:[`Which component converts a Java object to JSON in Spring MVC?`,[`ViewResolver`,`HandlerMapping`,`HttpMessageConverter`,`DispatcherServlet`],2,`A Jackson-based HttpMessageConverter serializes @ResponseBody return values.`]}
]},

{id:`boot`,title:`Spring Boot`,level:`I`,blurb:`Auto-configuration, configuration and profiles, Spring Data JPA, REST APIs, security and testing.`,lessons:[
{id:`boot`,t:`Auto-configuration and starters`,lvl:`B`,min:17,
eli5:`Plain Spring is buying furniture parts and assembling everything yourself. Spring Boot is a furnished flat: sensible defaults are already in place, and you change only what you don't like.`,
body:`Spring Boot is Spring with opinions:
- **Starters**: one dependency pulls in a tested set of libraries ([[spring-boot-starter-web]], [[spring-boot-starter-data-jpa]], [[-security]], [[-validation]], [[-actuator]]).
- **Auto-configuration**: if a library is on the classpath and you haven't defined the bean yourself, Boot configures it for you, for example a DataSource from your [[spring.datasource.*]] properties.
- **Embedded server**: Tomcat by default, so you run the app with [[java -jar app.jar]].
- **Externalized configuration** and **Actuator** for running in production.

[[@SpringBootApplication]] combines [[@Configuration]], [[@EnableAutoConfiguration]] and [[@ComponentScan]] of the main class's package and everything below it.

Versions: Boot 3 (2022) requires Java 17 and the jakarta packages. Boot 4.0 (November 2025, on Spring Framework 7) splits auto-configuration into smaller modules and moves to Jackson 3. Boot 4.1 (June 2026) adds Spring gRPC support.`,
code:`@SpringBootApplication
public class JavaAtlasApplication {
    public static void main(String[] args) {
        SpringApplication.run(JavaAtlasApplication.class, args);
    }
}

// How auto-configuration decides, simplified
@AutoConfiguration
@ConditionalOnClass(DataSource.class)
public class MyDataSourceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean            // your own bean always wins
    DataSource dataSource(DataSourceProperties props) {
        return props.initializeDataSourceBuilder().build();
    }
}`,
pro:`Auto-configuration classes are listed in [[META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports]] and guarded by [[@Conditional...]] annotations. Start the app with [[--debug]], or check Actuator's [[conditions]] endpoint, to see which ones matched and why. Exclude one with [[@SpringBootApplication(exclude = ...)]].`,
trap:`Putting the main class in a sub-package such as com.app.config. Component scanning covers only that package and below, so controllers in com.app.web are never found.`,
iq:[[`What does @SpringBootApplication do?`,`It combines @Configuration, @EnableAutoConfiguration and @ComponentScan, starting from the main class's package.`],
[`How does auto-configuration work?`,`Boot loads candidate configuration classes from AutoConfiguration.imports. Each one applies only if its @Conditional checks pass (class on the classpath, property set, bean missing), so beans you define yourself take precedence.`]],
quiz:[`You define your own DataSource bean. Which one is used?`,[`Boot's auto-configured one`,`Yours, because of @ConditionalOnMissingBean`,`Both are created`,`Startup fails`],1,`Auto-configuration backs off when you define the bean yourself.`]},

{id:`config`,t:`Configuration, profiles and properties`,lvl:`I`,min:17,
eli5:`Profiles are outfits. The same person (your app) wears a raincoat in "dev" and a suit in "prod", without changing who they are.`,
body:`Boot reads configuration from many sources. From highest priority to lowest: command-line arguments, environment variables, [[application-{profile}.yml]], [[application.yml]], then built-in defaults.

- **Profiles**: [[spring.profiles.active=prod]] loads [[application-prod.yml]] on top of the base file. Mark beans with [[@Profile("dev")]].
- **Type-safe config**: [[@ConfigurationProperties]] binds a whole prefix to a record or class, with validation.
- [[@Value("\${...}")]] injects a single value.
- Environment variables map automatically: [[SPRING_DATASOURCE_URL]] becomes [[spring.datasource.url]].

Never commit secrets. Inject them from environment variables, Vault or your cloud's secret manager.`,
code:`# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/javaatlas
    username: app
    password: \${DB_PASSWORD}          # read from the environment
  jpa:
    open-in-view: false
  threads:
    virtual:
      enabled: true                   # Boot 3.2+ on Java 21+

app:
  payments:
    provider: razorpay
    timeout: 5s
    max-retries: 3
---
spring:
  config:
    activate:
      on-profile: prod
logging:
  level:
    root: warn`,lang:`yaml`,
more:[{cap:`Bind it type-safely`,src:`@ConfigurationProperties(prefix = "app.payments")
@Validated
public record PaymentProps(@NotBlank String provider,
                           Duration timeout,
                           @Min(0) int maxRetries) {}

@SpringBootApplication
@ConfigurationPropertiesScan
public class JavaAtlasApplication { /* ... */ }`}],
pro:`Relaxed binding maps kebab-case properties ([[app.payments.max-retries]]), camelCase Java names ([[maxRetries]]) and environment variables ([[APP_PAYMENTS_MAXRETRIES]]) to the same value. [[Duration]] and [[DataSize]] fields accept values like [[5s]] or [[10MB]]. In Kubernetes, pass configuration through environment variables from ConfigMaps and Secrets, or use [[spring.config.import=configtree:/etc/config/]].`,
trap:`Hard-coding environment-specific URLs and passwords in application.yml and committing them to Git.`,
iq:[[`@Value vs @ConfigurationProperties?`,`@Value injects single values and supports SpEL. @ConfigurationProperties binds a whole prefix to a typed object with relaxed binding, validation and IDE hints, which suits groups of related settings.`],
[`How do profiles work?`,`Active profiles (spring.profiles.active) load application-{profile} files over the base configuration and enable beans annotated with @Profile for those profiles.`]],
quiz:[`Which source has the highest priority?`,[`application.yml`,`application-prod.yml`,`An environment variable`,`A command-line argument`],3,`Command-line arguments override everything else in this list.`]},

{id:`datajpa`,t:`Spring Data JPA repositories`,lvl:`I`,min:17,
eli5:`You describe what you want in the method name, like findByCityAndAgeGreaterThan, and Spring writes the query for you. It's ordering from a menu instead of cooking.`,
body:`Extend [[JpaRepository<Entity, Id>]] and you get CRUD, paging and sorting with **no implementation class**.

Ways to query:
- **Derived queries** from method names: [[findByEmail]], [[countByLevel]], [[existsBySlug]], [[findTop5ByOrderByRatingDesc]].
- [[@Query]] with JPQL, or native SQL with [[nativeQuery = true]].
- **Projections**: interfaces or records that return only some columns.
- **Paging**: [[Pageable]] in, [[Page<T>]] or [[Slice<T>]] out.
- [[@Modifying]] for bulk updates and deletes.
- **Specifications** or Querydsl for dynamic filters.

**Auditing** ([[@CreatedDate]], [[@LastModifiedBy]]) fills in timestamps and users automatically once you add [[@EnableJpaAuditing]].`,
code:`public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findBySlug(String slug);

    List<Course> findTop5ByLevelOrderByRatingDesc(Level level);

    Page<CourseCard> findByTitleContainingIgnoreCase(String q, Pageable pageable);   // projection

    @Query("select c from Course c where c.price <= :max and c.published = true")
    List<Course> affordable(@Param("max") BigDecimal max);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("update Course c set c.published = false where c.updatedAt < :cutoff")
    int unpublishStale(@Param("cutoff") Instant cutoff);
}

public interface CourseCard {          // interface projection
    String getTitle();
    BigDecimal getPrice();
}

Page<CourseCard> page = repo.findByTitleContainingIgnoreCase(
        "spring", PageRequest.of(0, 20, Sort.by("rating").descending()));`,
pro:`[[save()]] on an entity with an assigned (not generated) id calls [[merge]], which runs a SELECT first; implement [[Persistable]] or use generated ids. [[deleteAll()]] loads every entity and deletes them one by one, so prefer [[deleteAllInBatch()]] or a [[@Modifying]] query. [[Page]] runs an extra COUNT query; use [[Slice]] for infinite scrolling.`,
trap:`Running a @Modifying query outside a transaction (it fails with TransactionRequiredException), or trusting entities loaded before a bulk update. Bulk updates bypass the persistence context, so use clearAutomatically = true.`,
iq:[[`How does Spring Data create repository implementations?`,`At startup it creates a proxy for each repository interface. SimpleJpaRepository provides the CRUD methods, and query methods are parsed from method names or @Query annotations into JPQL.`],
[`Page vs Slice?`,`A Page includes the total count (an extra COUNT query) and total pages. A Slice only knows whether there is a next slice, which is cheaper for infinite scrolling.`]],
quiz:[`Which method name is a valid derived query?`,[`getAllCoursesPlease`,`findByLevelAndPriceLessThan`,`selectCourseWhereLevel`,`queryLevel`],1,`find…By, then property names joined with keywords such as And and LessThan.`]},

{id:`rest`,diagram:`layered-architecture`,t:`REST APIs, validation and error handling`,lvl:`I`,min:17,
eli5:`Validation is the bouncer checking IDs at the door. The global error handler is one polite receptionist who explains every problem in the same clear format.`,
body:`Good REST APIs use nouns and HTTP verbs: [[GET /courses]], [[POST /courses]], [[PUT /courses/{id}]], [[PATCH]] and [[DELETE]], with the right status codes (201 Created, 400, 404, 409 Conflict, 422).

**Validation** with Jakarta Bean Validation ([[spring-boot-starter-validation]]): annotate DTO fields ([[@NotBlank]], [[@Email]], [[@Size]], [[@Positive]]) and add [[@Valid]] to the controller parameter.

**Global error handling** with [[@RestControllerAdvice]] maps exceptions to responses. Spring 6+ supports **Problem Details** (RFC 9457) through [[ProblemDetail]], a standard JSON error format.

Calling other APIs: [[RestClient]] (Spring 6.1) for blocking calls, declarative **HTTP interface clients**, or [[WebClient]] for reactive code.`,
code:`public record CreateCourse(
        @NotBlank @Size(max = 150) String title,
        @NotNull Level level,
        @PositiveOrZero BigDecimal price) {}

@RestControllerAdvice
public class ApiErrors {

    @ExceptionHandler(NotFoundException.class)
    ProblemDetail notFound(NotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Resource not found");
        return pd;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail invalid(MethodArgumentNotValidException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setTitle("Validation failed");
        pd.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .toList());
        return pd;
    }
}`,
pro:`Make [[PUT]] and [[DELETE]] idempotent, and accept an **Idempotency-Key** header on payment [[POST]]s so retries never charge twice. Version your API from day one (a [[/v1]] path or a header; Spring 7 has built-in API versioning). Add springdoc-openapi to get OpenAPI docs and Swagger UI for free.`,
trap:`Forgetting @Valid on the @RequestBody parameter. The annotations on the DTO are then silently ignored.`,
iq:[[`PUT vs PATCH?`,`PUT replaces the whole resource and is idempotent. PATCH applies a partial update; whether it's idempotent depends on the patch format.`],
[`How do you handle exceptions globally in Spring Boot?`,`With a @RestControllerAdvice class whose @ExceptionHandler methods map exception types to responses, ideally returning ProblemDetail for a consistent format.`]],
quiz:[`Which status code means a resource was created?`,[`200`,`201`,`204`,`202`],1,`201 Created, usually with a Location header pointing to the new resource.`]},

{id:`security`,diagram:`security-filter-chain`,t:`Spring Security and JWT`,lvl:`A`,min:17,
eli5:`Authentication asks "who are you?" and checks your ID card. Authorization asks "what may you do?": your ticket says balcony, not backstage. A JWT is a signed wristband, so you don't show your ID at every door.`,
body:`Spring Security is a chain of **servlet filters** in front of your application.

- **Authentication** verifies identity: username and password, OAuth2 login, or a JWT.
- **Authorization** checks permissions per URL ([[requestMatchers]]) or per method ([[@PreAuthorize]]).
- **Passwords** must always be hashed with [[BCryptPasswordEncoder]] (or Argon2), never stored as plain text.

For stateless REST APIs, the client sends [[Authorization: Bearer <token>]]. Configure the app as an **OAuth2 resource server**, which checks the token's signature, expiry and claims. Keycloak, Auth0 or Spring Authorization Server can issue the tokens.

This matches how a learning site like this one works: browsing is public ([[permitAll]]), and only checkout and my-courses endpoints need a token.`,
code:`@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())                 // stateless API using bearer tokens
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/v1/lessons/**", "/api/v1/courses/**").permitAll()
                .requestMatchers("/api/v1/checkout/**", "/api/v1/me/**").authenticated()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().denyAll())
            .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
}

@PreAuthorize("hasRole('ADMIN') or #userId == authentication.name")
public Invoice invoice(String userId, Long orderId) { /* ... */ return null; }`,
pro:`Important filters, in order: CORS, CSRF, authentication (for example [[BearerTokenAuthenticationFilter]]), [[ExceptionTranslationFilter]], then [[AuthorizationFilter]]. The authenticated user lives in the [[SecurityContextHolder]]. A JWT can't be revoked before it expires, so keep access tokens short-lived (5 to 15 minutes) with refresh tokens, and never put secrets in the payload: it's only Base64-encoded, not encrypted.`,
trap:`Storing JWTs in localStorage, where any XSS bug can read them. For browser apps prefer HttpOnly, Secure, SameSite cookies, and then keep CSRF protection on.`,
iq:[[`Authentication vs authorization?`,`Authentication establishes who the user is. Authorization decides what that authenticated user may access.`],
[`How is a JWT validated?`,`The server verifies the signature with the issuer's public key (often fetched from a JWKS endpoint), then checks the exp, nbf, issuer and audience claims. No database lookup is needed, which is what makes it stateless.`]],
quiz:[`Which should you use to store passwords?`,[`Base64`,`MD5`,`BCrypt`,`AES with a hard-coded key`],2,`BCrypt is a slow, salted, adaptive hash designed specifically for passwords.`]},

{id:`testing`,t:`Testing Spring Boot apps`,lvl:`I`,min:17,
eli5:`Unit tests check each brick. Integration tests check the wall. Testcontainers builds a real mini-database just for the test, then throws it away.`,
body:`The testing pyramid, from many fast tests to a few slow ones:
- **Unit tests**: plain JUnit 5 and Mockito, no Spring context. Constructor injection makes these easy.
- **Slice tests** load a single layer: [[@WebMvcTest]] (controllers with MockMvc), [[@DataJpaTest]] (repositories with a test database), [[@JsonTest]].
- **Integration tests**: [[@SpringBootTest]] loads the whole application context.

**Testcontainers** starts real PostgreSQL, Kafka or Redis in Docker for your tests. With [[@ServiceConnection]] (Boot 3.1+), no manual URL wiring is needed.

Replace a bean in the Spring context with a mock using [[@MockitoBean]] (Spring 6.2+; it replaces the deprecated [[@MockBean]]).`,
code:`@WebMvcTest(CourseController.class)
class CourseControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean CourseService service;

    @Test
    void returnsCourse() throws Exception {
        when(service.bySlug("spring-boot"))
            .thenReturn(new CourseDto("Spring Boot", 42, Plan.PRO));

        mvc.perform(get("/api/v1/courses/spring-boot"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.title").value("Spring Boot"));
    }
}

@SpringBootTest
@Testcontainers
class EnrollmentIT {
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:17");

    @Autowired EnrollmentService service;

    @Test
    void enrollsStudent() { /* real database, real transactions */ }
}`,
pro:`Spring caches application contexts between tests that share the same configuration. Every different set of [[@MockitoBean]]s or properties creates a new context and slows the suite, so prefer slices and shared base classes, and start the database container once per JVM (a static field). H2 standing in for PostgreSQL hides dialect differences; Testcontainers catches them.`,
trap:`Using @SpringBootTest for everything. Loading the full context makes the suite slow; most tests should be unit or slice tests.`,
iq:[[`@SpringBootTest vs @WebMvcTest?`,`@SpringBootTest loads the full application context for integration tests. @WebMvcTest loads only the web layer for the given controllers, with MockMvc; services must be mocked.`],
[`Why use Testcontainers instead of H2?`,`It runs the same database engine as production, so SQL dialect, constraints, JSON types and migrations behave exactly the same.`]],
quiz:[`Which annotation tests only JPA repositories?`,[`@WebMvcTest`,`@DataJpaTest`,`@RestClientTest`,`@JsonTest`],1,`It sets up JPA, repositories and a test database, and rolls back each test.`]},

{id:`caching`,t:`Caching with Spring and Redis`,lvl:`I`,min:17,
eli5:`A cache is a notepad on your desk: instead of walking to the library (the database) every time someone asks the same question, you jot the answer down and read it from the notepad.`,
body:`Caching stores the results of expensive calls so repeated requests are fast.

Spring's cache support works with annotations:
- [[@EnableCaching]] on a configuration class.
- [[@Cacheable("courses")]]: return the cached value if there is one; otherwise run the method and cache the result.
- [[@CacheEvict("courses")]]: remove stale entries when the data changes.
- [[@CachePut]]: always run the method and update the cache.

Pick a store:
- **Caffeine**: in memory, very fast, one copy per instance. Great for a single server or rarely changing data.
- **Redis**: shared by every instance and survives restarts. The usual choice once you run several servers.

Always set a **time-to-live** and a size limit. The hard parts are invalidation (when data changes) and keeping instances consistent.`,
code:`@Configuration
@EnableCaching
class CacheConfig {}

@Service
public class CourseService {
    private final CourseRepository repo;
    public CourseService(CourseRepository repo) { this.repo = repo; }

    @Cacheable(value = "course", key = "#slug")
    public CourseDto bySlug(String slug) {                // hits the database only on a cache miss
        return repo.findBySlug(slug).map(CourseDto::from).orElseThrow();
    }

    @CacheEvict(value = "course", key = "#cmd.slug()")
    public void update(UpdateCourse cmd) {                // keeps the cache fresh
        // ... save the changes
    }
}`,
more:[{cap:`application.yml with Redis (add spring-boot-starter-data-redis)`,lang:`yaml`,src:`spring:
  cache:
    type: redis
    redis:
      time-to-live: 10m
  data:
    redis:
      host: localhost
      port: 6379`}],
pro:`Like [[@Transactional]], caching works through a proxy, so calling a cached method from the same class skips the cache. Values stored in Redis must be serialisable; JSON serialisers survive redeployments better than Java serialisation. Watch out for **cache stampedes**: when a hot key expires, many requests hit the database at once; [[@Cacheable(sync = true)]] or early refresh helps.`,
trap:`Caching without expiry or eviction. Users see stale prices for hours, and memory grows until the app slows down.`,
iq:[[`@Cacheable vs @CachePut?`,`@Cacheable skips the method when a cached value exists. @CachePut always runs the method and stores the result, which is used to refresh the cache.`],
[`Local cache vs Redis?`,`A local cache such as Caffeine is fastest but separate per instance, so instances can disagree. Redis is shared and survives restarts, at the cost of a network hop.`]],
quiz:[`Which annotation removes an entry from the cache?`,[`@Cacheable`,`@CachePut`,`@CacheEvict`,`@EnableCaching`],2,`@CacheEvict deletes one key, or everything with allEntries = true.`]},

{id:`scheduling`,t:`Scheduled and background tasks`,lvl:`I`,min:17,
eli5:`@Scheduled is an alarm clock for your code: run this every night at 2 a.m. @Async is handing a task to a helper so you can keep serving customers.`,
body:`**Scheduling** runs methods on a timer:
- Turn it on with [[@EnableScheduling]].
- [[@Scheduled(fixedRate = 60000)]]: every minute, measured from each start.
- [[@Scheduled(fixedDelay = …)]]: waits a fixed time after each run finishes.
- [[@Scheduled(cron = "0 0 2 * * *", zone = "Asia/Kolkata")]]: at 2:00 every day. Spring cron has six fields and starts with seconds.

**@Async** runs a method on a background thread and returns immediately ([[void]] or [[CompletableFuture]]):
- Turn it on with [[@EnableAsync]], and configure a bounded thread pool or virtual threads.
- Use it for slow side work: emails, reports, webhook calls.

When you run several instances, every instance runs every schedule. Use a lock (ShedLock) or a dedicated worker so a nightly job runs once, not once per server.`,
code:`@Configuration
@EnableScheduling
@EnableAsync
class JobsConfig {}

@Component
public class Jobs {
    private static final Logger log = LoggerFactory.getLogger(Jobs.class);
    private final OrderRepository orders;
    Jobs(OrderRepository orders) { this.orders = orders; }

    @Scheduled(cron = "0 0 2 * * *", zone = "Asia/Kolkata")      // every day at 2:00 IST
    public void expireAbandonedOrders() {
        int n = orders.expireOlderThan(Instant.now().minus(Duration.ofDays(1)));
        log.info("Expired {} abandoned orders", n);
    }

    @Scheduled(fixedDelay = 30_000)                                 // 30 s after the last run ends
    public void retryFailedWebhooks() { /* ... */ }
}

@Service
class Mailer {
    @Async
    public CompletableFuture<Void> sendReceipt(String email) {     // runs on a background thread
        // ... slow SMTP call
        return CompletableFuture.completedFuture(null);
    }
}`,
pro:`By default all [[@Scheduled]] methods share one thread, so a slow job delays the others; raise [[spring.task.scheduling.pool.size]] or turn on virtual threads. Exceptions in [[@Async void]] methods are only logged; return a [[CompletableFuture]] or configure an [[AsyncUncaughtExceptionHandler]]. For work that must never be lost (payments, important emails), use a queue or a jobs table rather than in-memory async calls.`,
trap:`Running a scheduled job on every instance after scaling out. Add a distributed lock such as ShedLock, or run jobs in a single worker.`,
iq:[[`fixedRate vs fixedDelay?`,`fixedRate schedules each run a fixed time after the previous start. fixedDelay waits a fixed time after the previous run finishes.`],
[`Why might @Async not work?`,`The method is called from the same class (so there's no proxy), it isn't public, @EnableAsync is missing, or the object isn't a Spring bean.`]],
quiz:[`How many fields does a Spring cron expression have?`,[`5`,`6`,`7`,`4`],1,`Second, minute, hour, day of month, month and day of week.`]}
]},

{id:`micro`,title:`Microservices`,level:`A`,blurb:`Service boundaries, gateways and discovery, messaging, resilience, sagas and deployment.`,lessons:[
{id:`ms`,diagram:`microservices-architecture`,t:`Monolith vs microservices`,lvl:`I`,
eli5:`A monolith is one big restaurant kitchen. Microservices are a food court: each stall cooks one thing, has its own staff and fridge, and can open or close on its own.`,
body:`A **monolith** is one deployable application. A **microservice architecture** splits a system into small services, each owning one **business capability** and **its own database**, and each deployed independently.

Benefits: independent deploys and scaling, team autonomy, fault isolation, and freedom to pick technology per service.

Costs: network calls fail, data consistency gets harder, and you need service discovery, tracing, CI/CD for many services, and real operations maturity.

Practical advice: start with a **modular monolith** with clear module boundaries (for example using **Spring Modulith**). Extract a service when a module has a real reason to stand alone: different scaling needs, release pace or team ownership.

Split by business capability (catalog, orders, payments, notifications), not by technical layer.`,
code:`A typical learning-platform split

catalog-service     courses, lessons, search           PostgreSQL
order-service       carts, orders, invoices            PostgreSQL
payment-service     Razorpay or Stripe, refunds        PostgreSQL
user-service        profiles, enrollments              PostgreSQL
notification-svc    email, SMS, push                   consumes Kafka events
api-gateway         routing, token checks, rate limits`,lang:`text`,
pro:`Conway's law: systems end up mirroring the communication structure of the teams that build them. A **distributed monolith** (services that must be deployed together, or that share one database) has all the costs of microservices and none of the benefits. If one small team owns everything, microservices rarely pay off.`,
trap:`Sharing one database between services. They become coupled through the schema, so you can't change or deploy one without the others.`,
iq:[[`When would you not use microservices?`,`With a small team, an early product whose domain boundaries are still unclear, or without mature DevOps (CI/CD, monitoring, containers). A modular monolith is usually faster and cheaper then.`],
[`Why a database per service?`,`It keeps services loosely coupled: each owns its schema and can change or scale it independently. Other services reach its data only through its API or its events.`]],
quiz:[`What's the best first step for a new product with a small team?`,[`Twenty microservices`,`A modular monolith`,`One service per table`,`A serverless function for everything`],1,`Get the boundaries right first, then extract services when there's a reason.`]},

{id:`gateway`,t:`API gateway and service discovery`,lvl:`I`,min:17,
eli5:`The API gateway is a mall's main entrance with a security desk and a directory. Service discovery is a live directory that always knows which shop is on which floor today.`,
body:`An **API gateway** such as Spring Cloud Gateway is the single entry point for clients. It handles routing, authentication (validating JWTs), rate limiting, CORS, request logging and sometimes response aggregation.

**Service discovery** matters because instances start, stop and move, so hard-coded URLs break.
- **Client-side discovery**: services register in **Eureka** (or Consul), and callers look them up and load-balance with Spring Cloud LoadBalancer.
- **Platform discovery**: on **Kubernetes**, a Service gives a stable DNS name such as [[http://order-service]] and load-balances for you, so Eureka is usually unnecessary.

**Centralized configuration** comes from Spring Cloud Config or Kubernetes ConfigMaps.`,
code:`@Configuration
class GatewayRoutes {

    @Bean
    RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("catalog", r -> r.path("/api/v1/courses/**", "/api/v1/lessons/**")
                .uri("lb://catalog-service"))                 // resolved through discovery
            .route("orders", r -> r.path("/api/v1/orders/**")
                .filters(f -> f.addRequestHeader("X-Gateway", "javaatlas")
                               .retry(3))
                .uri("lb://order-service"))
            .build();
    }
}`,
pro:`Keep the gateway thin: routing and cross-cutting concerns only, never business logic, or it becomes a new monolith. The **Backend for Frontend** pattern gives web and mobile clients separate gateways tuned to their needs. Rate limiting usually uses Redis-backed token buckets. Health endpoints ([[/actuator/health/liveness]] and [[/actuator/health/readiness]]) let Kubernetes send traffic only to ready instances.`,
trap:`Calling other services by the hard-coded IP or hostname of one instance. Use discovery names or Kubernetes Service DNS instead.`,
iq:[[`What does an API gateway do?`,`It's a single entry point that routes requests to services and handles cross-cutting concerns: authentication, rate limiting, CORS, TLS termination, logging and sometimes response aggregation.`],
[`Client-side vs server-side discovery?`,`Client-side: the caller asks a registry such as Eureka and picks an instance itself. Server-side: the caller hits a stable address (a load balancer or Kubernetes Service) that forwards to healthy instances.`]],
quiz:[`On Kubernetes, what usually replaces Eureka?`,[`ZooKeeper`,`Kubernetes Services and DNS`,`Spring Batch`,`Hystrix`],1,`Services provide stable names and built-in load balancing.`]},

{id:`comm`,t:`Sync vs async communication (REST and Kafka)`,lvl:`A`,min:17,
eli5:`A phone call is synchronous: both people must be available, and you wait for an answer. A WhatsApp message is asynchronous: you send it and carry on, and they reply when they can.`,
body:`**Synchronous** calls (REST or gRPC) make the caller wait for the response. They're simple but couple availability: if payment-service is down, checkout fails. Use them for queries that need an immediate answer.

**Asynchronous** messaging (Kafka, RabbitMQ): a service publishes an **event** such as [[OrderPlaced]] and moves on, and interested services consume it in their own time. You get loose coupling, natural buffering, and new consumers can be added without touching the producer.

Spring options:
- HTTP: [[RestClient]], declarative **HTTP interface** clients ([[@HttpExchange]]), or OpenFeign.
- gRPC: Spring gRPC, auto-configured since Boot 4.1.
- Messaging: [[KafkaTemplate]] with [[@KafkaListener]], or Spring Cloud Stream.

Kafka basics: **topics** are split into **partitions**; messages with the same key go to the same partition and stay in order; **consumer groups** share partitions between instances for scaling.`,
code:`// Declarative HTTP client (Spring 6+)
@HttpExchange("/api/v1/users")
public interface UserClient {
    @GetExchange("/{id}")
    UserDto get(@PathVariable String id);
}

// Publish an event after saving the order
@Service
public class OrderService {
    private final KafkaTemplate<String, OrderPlaced> kafka;
    OrderService(KafkaTemplate<String, OrderPlaced> kafka) { this.kafka = kafka; }

    public void place(Order order) {
        // ... save the order in this service's own database
        kafka.send("orders.placed", order.id().toString(),
                   new OrderPlaced(order.id(), order.userId(), order.totalPaise()));
    }
}

// Another service reacts independently
@Component
class EnrollmentListener {
    @KafkaListener(topics = "orders.placed", groupId = "enrollment-service")
    void on(OrderPlaced event) {
        enrollmentService.grantAccess(event.userId(), event.orderId());
    }
}`,
pro:`Saving to the database and then publishing to Kafka is a **dual write**: a crash between the two loses the event. The **transactional outbox** pattern writes the event to an outbox table in the same database transaction, and a relay (Debezium change data capture, or a poller) publishes it. Kafka delivers **at least once**, so consumers must be **idempotent**, for example by de-duplicating on the event id.`,
trap:`Long chains of synchronous calls (A calls B calls C calls D). Latencies add up, and one slow service drags everything down. Prefer events, or keep a local copy of the data you need.`,
iq:[[`When would you choose Kafka over REST between services?`,`When the caller doesn't need an immediate answer, several services react to the same fact, you need buffering for traffic spikes, or you want services decoupled in time and availability.`],
[`How does Kafka guarantee ordering?`,`Only within a partition. Messages with the same key go to the same partition, so order is kept per key, for example per order id.`]],
quiz:[`What makes a Kafka consumer safe against duplicate delivery?`,[`Auto-commit`,`Idempotent processing`,`More partitions`,`Switching to REST`],1,`At-least-once delivery means duplicates will happen, so processing must tolerate them.`]},

{id:`resilience`,t:`Resilience: timeouts, retries and circuit breakers`,lvl:`A`,min:17,
eli5:`A circuit breaker at home cuts the power when something shorts, so the whole house doesn't burn. In software it stops calling a failing service for a while and uses a backup answer instead.`,
body:`In distributed systems, failure is normal. Protect every remote call:

- **Timeouts**: never wait forever. Set connect and read timeouts on every client.
- **Retries** with exponential backoff and jitter, for temporary errors only, and only for idempotent operations.
- **Circuit breaker**: after too many failures it **opens** and fails fast; after a wait it goes **half-open** to test; success **closes** it again.
- **Bulkhead**: limit concurrent calls so one slow dependency can't use up every thread.
- **Rate limiters** and **fallbacks** (a cached or default response).

The usual tool is **Resilience4j** (Netflix Hystrix is retired). Spring Framework 7 adds built-in [[@Retryable]] and [[@ConcurrencyLimit]], so spring-retry is no longer needed for simple cases.`,
code:`@Service
public class RecommendationClient {
    private final RestClient http;

    RecommendationClient(RestClient.Builder builder) {
        this.http = builder.baseUrl("http://recommendation-service").build();
    }

    @CircuitBreaker(name = "recs", fallbackMethod = "popular")
    @Retry(name = "recs")
    public List<CourseCard> forUser(String userId) {
        return http.get().uri("/users/{id}/recs", userId)
                   .retrieve()
                   .body(new ParameterizedTypeReference<List<CourseCard>>() {});
    }

    private List<CourseCard> popular(String userId, Throwable t) {
        return cache.popularCourses();           // graceful fallback
    }
}`,
more:[{cap:`application.yml`,lang:`yaml`,src:`resilience4j:
  circuitbreaker:
    instances:
      recs:
        sliding-window-size: 20
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
  retry:
    instances:
      recs:
        max-attempts: 3
        wait-duration: 200ms
        enable-exponential-backoff: true`}],
pro:`Retries multiply load: three retries at each of three layers can mean up to 27 calls to the bottom service during an outage (a **retry storm**). Retry at one layer only, with backoff and a limit. In Resilience4j's default order the Retry wraps the CircuitBreaker, so every retry attempt is counted by the breaker.`,
trap:`Retrying non-idempotent operations such as "charge card" without an idempotency key. A timeout doesn't mean the charge failed; retrying may charge the customer twice.`,
iq:[[`Explain the circuit breaker states.`,`Closed: calls go through and failures are counted. Open: calls fail fast without reaching the service. Half-open: after a wait, a few trial calls decide whether to close again or reopen.`],
[`Why add jitter to retries?`,`Without randomness, many clients retry at exactly the same moments and hammer the recovering service in synchronized waves. Jitter spreads the retries out.`]],
quiz:[`What does an open circuit breaker do?`,[`Lets every call through`,`Fails fast without calling the service`,`Retries forever`,`Restarts the service`],1,`It short-circuits calls until the wait period ends.`]},

{id:`saga`,t:`Distributed data and the saga pattern`,lvl:`A`,
eli5:`Booking a trip: flight, hotel and taxi from three different companies. If the hotel is full, you cancel the flight you already booked. A saga is that chain of steps plus the "undo" steps.`,
body:`With a database per service you can't wrap several services in one ACID transaction, and two-phase commit (XA) doesn't scale well. A **saga** is a sequence of local transactions; if a step fails, **compensating transactions** undo the steps that already succeeded.

Two styles:
- **Choreography**: each service reacts to events and emits new ones. Simple for two to four steps, harder to follow as it grows.
- **Orchestration**: a central orchestrator tells each service what to do next and tracks the saga's state. Clearer for complex flows (tools include Temporal and Camunda, or a state machine you write).

Related patterns: the **transactional outbox** for reliable event publishing, **CQRS** for separate read models built from events, and **event sourcing**, which stores events as the source of truth.`,
code:`Course purchase saga (orchestrated)

1. order-service      create order           PENDING
2. payment-service    charge ₹1,999          ok: next step   failed: cancel order
3. user-service       grant course access    ok: next step   failed: refund, cancel order
4. notification-svc   send receipt           retried until it works, never compensated
5. order-service      mark order COMPLETED

Compensations run in reverse order: refund payment, then cancel order`,lang:`text`,
more:[{cap:`Orchestrator compensation handlers`,src:`public void on(PaymentFailed e) {
    orders.cancel(e.orderId(), "PAYMENT_FAILED");           // undo step 1
}

public void on(AccessGrantFailed e) {
    payments.refund(e.paymentId());                         // undo step 2
    orders.cancel(e.orderId(), "ACCESS_FAILED");            // undo step 1
}`}],
pro:`Sagas give **eventual consistency**, not isolation: other requests can see in-between states, such as an order that is still PENDING. Design for it with status fields (semantic locks), updates that can be applied in any order, and read-your-own-writes where users expect it. Compensations must be idempotent and must themselves be retried until they succeed.`,
trap:`Treating a compensating action like a database rollback. It's a new business operation, such as a refund or a cancellation email, that the customer may see.`,
iq:[[`What is the saga pattern?`,`A way to keep data consistent across services without distributed transactions: a series of local transactions, each publishing an event or command, with compensating transactions that undo completed steps when a later one fails.`],
[`Choreography vs orchestration?`,`Choreography: services react to each other's events with no central coordinator; loosely coupled, but the flow is implicit. Orchestration: a coordinator directs each step and holds the saga's state; explicit and easier to monitor.`]],
quiz:[`What undoes a completed saga step?`,[`A database rollback`,`A compensating transaction`,`Two-phase commit`,`A circuit breaker`],1,`Each step has a business-level undo action.`]},

{id:`deploy`,t:`Docker, Kubernetes and observability`,lvl:`I`,
eli5:`Docker packs your app with everything it needs into a lunchbox that works in any kitchen. Kubernetes is the canteen manager who decides how many lunchboxes to serve and replaces spoiled ones. Observability is the CCTV and the logbook.`,
body:`**Docker** packages the app and its runtime into an image. Spring Boot can build one without a Dockerfile: [[./mvnw spring-boot:build-image]] (Cloud Native Buildpacks).

**Kubernetes** runs containers in **Pods**, managed by **Deployments** (replicas and rolling updates), exposed by **Services**, configured with **ConfigMaps** and **Secrets**, and scaled by the **HorizontalPodAutoscaler**.

**Observability** has three pillars:
- **Logs**: structured JSON with trace ids. Spring Boot 3.4+ supports structured logging natively.
- **Metrics**: Micrometer, scraped by Prometheus, shown in Grafana.
- **Traces**: Micrometer Tracing or OpenTelemetry, sent to Zipkin, Jaeger or Tempo, to follow one request across services.

Actuator exposes [[/actuator/health]], [[/actuator/metrics]] and [[/actuator/prometheus]].`,
code:`# Dockerfile: multi-stage, small, non-root
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY . .
RUN ./mvnw -q package -DskipTests

FROM eclipse-temurin:25-jre
WORKDIR /app
RUN useradd -r app
USER app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]`,lang:`dockerfile`,
more:[{cap:`deployment.yaml (excerpt)`,lang:`yaml`,src:`spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: catalog
          image: ghcr.io/javaatlas/catalog:1.4.0
          resources:
            requests: { cpu: "250m", memory: "512Mi" }
            limits:   { memory: "768Mi" }
          readinessProbe:
            httpGet: { path: /actuator/health/readiness, port: 8080 }
          livenessProbe:
            httpGet: { path: /actuator/health/liveness, port: 8080 }`}],
pro:`Liveness answers "should I be restarted?"; readiness answers "can I take traffic?". Don't check the database in the liveness probe, or one database blip restarts every pod. Graceful shutdown, on by default since Spring Boot 3.4, lets in-flight requests finish during rolling updates. For fast startup and low memory, consider GraalVM native images or the ahead-of-time caches in Java 24+ (Project Leyden).`,
trap:`Building a large image with the full JDK and running it as root. Use a JRE base image, a multi-stage build, a non-root user, and pinned image versions.`,
iq:[[`Liveness vs readiness probe?`,`A failing liveness probe makes Kubernetes restart the container. A failing readiness probe removes the pod from the Service's endpoints without restarting it, for example during startup or temporary overload.`],
[`What is distributed tracing?`,`Passing a trace id (the W3C traceparent header) along every service call and recording timed spans, so one request's full path and latency breakdown can be seen across all services.`]],
quiz:[`Which probe failure causes a container restart?`,[`Readiness`,`Liveness`,`A successful startup probe`,`The Service`],1,`Liveness failures trigger restarts.`]},

{id:`cicd`,t:`CI/CD with GitHub Actions`,lvl:`I`,
eli5:`CI/CD is an automatic quality gate plus a delivery van: every time you push code, robots build it and run the tests, and if everything passes, they ship it.`,
body:`**Continuous integration** builds and tests every push and pull request, so problems surface in minutes instead of on release day. **Continuous delivery** packages the tested build and releases it automatically, or with one approval.

A typical pipeline for a Spring Boot service:
1. Check out the code and set up Java.
2. Build and run the tests ([[./mvnw verify]]), with Testcontainers for integration tests.
3. Run static analysis and dependency vulnerability checks.
4. Build a Docker image tagged with the commit SHA and push it to a registry.
5. Deploy to Railway, a VPS or Kubernetes, then run a quick smoke test.

Keep secrets such as registry tokens in the CI system's secret store, never in the repository. Protect the main branch so merges need a passing pipeline and a review.`,
code:`# .github/workflows/ci.yml
name: ci
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '25'
          cache: maven
      - run: ./mvnw -B verify                         # compile, unit and integration tests
      - name: Build and push the image
        if: github.ref == 'refs/heads/main'
        run: |
          echo "\${{ secrets.GHCR_TOKEN }}" | docker login ghcr.io -u \${{ github.actor }} --password-stdin
          docker build -t ghcr.io/\${{ github.repository }}:\${{ github.sha }} .
          docker push ghcr.io/\${{ github.repository }}:\${{ github.sha }}`,lang:`yaml`,
pro:`Fast pipelines get used: cache dependencies, run unit tests first and slower integration tests in parallel, and fail early. Tag images with the commit SHA instead of [[latest]], so you always know what's running and can roll back instantly. Database migrations (Flyway, Liquibase) should run during deployment and stay backward compatible for one release, so old and new versions can run side by side.`,
trap:`Deploying images tagged latest. You can't tell which code is running or roll back reliably; tag with the commit SHA.`,
iq:[[`CI vs CD?`,`CI automatically builds and tests every change to catch problems early. CD automatically packages tested builds and delivers them to an environment, with production releases either automatic or one click away.`],
[`How do you handle secrets in a pipeline?`,`Keep them in the CI provider's encrypted secrets or a vault, inject them as environment variables at run time, never commit them, and limit which branches or environments can use them.`]],
quiz:[`What should a production Docker image usually be tagged with?`,[`latest`,`The commit SHA or a version`,`The developer's name`,`dev`],1,`Immutable tags make deployments traceable and rollbacks reliable.`]}
]}
];
