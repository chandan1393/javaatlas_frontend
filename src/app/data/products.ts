/**
 * Version histories for the Java ecosystem, shown at /versions/<product>.
 *
 * Feature codes (first character, then "|", then text; add "|h" at the end to mark a headline feature):
 *   n = new, i = improved, b = baseline or breaking change, d = deprecated, r = removed
 * Dates are 'YYYY-MM-DD', 'YYYY-MM' or 'YYYY' (use the precision you're sure of).
 * status: 'latest' (newest release line), 'supported', 'ended' (open source support over), 'planned'.
 * When a product ships a new version: add an entry at the top and move 'latest' to it.
 */
export type ProductStatus = 'latest' | 'supported' | 'ended' | 'planned' | 'past';

export interface ProductVersion {
  v: string;
  date: string;
  status: ProductStatus;
  /** Lowest Java version it runs on, e.g. '17'. */
  java?: string;
  /** Java EE or Jakarta EE generation, e.g. 'Jakarta EE 11'. */
  ee?: string;
  /** Release train name (Spring Data), e.g. '2026.0' or 'Kay'. */
  train?: string;
  /** Versions it ships with (Spring Boot), shown as chips. */
  bundles?: [string, string][];
  note?: string;
  f: string[];
}

export interface Product {
  id: string;
  name: string;
  short: string;
  /** Two letters for the logo tile. */
  mark: string;
  /** Brand gradient. */
  c1: string;
  c2: string;
  tagline: string;
  intro: string;
  cadence: string;
  support: string;
  site: string;
  versions: ProductVersion[];
}

export const PRODUCTS: Product[] = [
  {
    id: 'spring',
    name: 'Spring Framework',
    short: 'Spring',
    mark: 'Sf',
    c1: '#6DB33F',
    c2: '#2E7D32',
    tagline: 'Dependency injection, AOP, transactions, Spring MVC and WebFlux.',
    intro:
      'Spring Framework is the foundation everything else in Spring builds on: the IoC container, AOP, transactions, JDBC support, Spring MVC and WebFlux. A new generation arrives every few years, and minor releases usually ship in November.',
    cadence: 'A minor release most Novembers',
    support: 'Each minor line gets open source updates for a limited time, with longer commercial support available.',
    site: 'https://spring.io/projects/spring-framework',
    versions: [
      { v: '7.1', date: '2026-11', status: 'planned', note: 'Expected in November 2026, following Spring’s yearly cadence.', f: [] },
      {
        v: '7.0',
        date: '2025-11-13',
        status: 'latest',
        java: '17',
        ee: 'Jakarta EE 11',
        f: [
          'n|API versioning for Spring MVC and WebFlux endpoints|h',
          'n|Built-in resilience: @Retryable, @ConcurrencyLimit and @EnableResilientMethods, moved in from spring-retry|h',
          'n|JSpecify null-safety annotations across the framework|h',
          'n|HTTP interface client groups and a registry for many @HttpExchange clients',
          'i|Jackson 3 support',
          'i|Uses the Java 24+ Class-File API for reading bytecode when available',
          'b|Jakarta EE 11 baseline (Servlet 6.1, Jakarta Persistence 3.2) and Kotlin 2.2',
        ],
      },
      {
        v: '6.2',
        date: '2024-11-14',
        status: 'past',
        java: '17',
        ee: 'Jakarta EE 9–10',
        f: [
          'n|@MockitoBean and @MockitoSpyBean test annotations (replacing Spring Boot’s @MockBean)|h',
          'n|@TestBean for overriding beans in tests',
          'n|MockMvcTester for AssertJ-style web tests',
          'n|Background bean initialization and @Fallback beans',
          'i|The final 6.x line',
        ],
      },
      {
        v: '6.1',
        date: '2023-11-16',
        status: 'past',
        java: '17',
        ee: 'Jakarta EE 9–10',
        f: [
          'n|RestClient: a modern synchronous HTTP client|h',
          'n|JdbcClient: a fluent JDBC API|h',
          'n|Virtual thread support for task executors and schedulers|h',
          'n|CRaC checkpoint and restore support',
          'i|Java 21 support',
        ],
      },
      {
        v: '6.0',
        date: '2022-11-16',
        status: 'past',
        java: '17',
        ee: 'Jakarta EE 9–10',
        f: [
          'b|Java 17 baseline and the jakarta.* namespace|h',
          'n|Ahead-of-time processing and GraalVM native image support|h',
          'n|HTTP interface clients with @HttpExchange',
          'n|RFC 7807 ProblemDetail error responses',
          'n|Micrometer Observation for metrics and tracing',
          'r|Removed old remoting technologies such as HTTP Invoker',
        ],
      },
      {
        v: '5.3',
        date: '2020-10-27',
        status: 'past',
        java: '8',
        ee: 'Java EE 7–8',
        f: ['i|The long-maintained final 5.x line, running on Java 8 through Java 21|h', 'i|Support for newer Java releases and R2DBC refinements'],
      },
      {
        v: '5.2',
        date: '2019-09-30',
        status: 'past',
        java: '8',
        ee: 'Java EE 7–8',
        f: [
          'n|@Configuration(proxyBeanMethods = false) for faster startup|h',
          'n|RSocket messaging support',
          'n|Kotlin coroutines support',
          'n|Reactive transaction management (R2DBC)',
        ],
      },
      { v: '5.1', date: '2018-09-21', status: 'past', java: '8', ee: 'Java EE 7–8', f: ['i|Java 11 support', 'n|spring-jcl logging bridge'] },
      {
        v: '5.0',
        date: '2017-09-28',
        status: 'past',
        java: '8',
        ee: 'Java EE 7',
        f: [
          'b|Java 8 baseline|h',
          'n|Spring WebFlux: a reactive web framework on Project Reactor|h',
          'n|Kotlin support',
          'n|Functional bean registration and router functions',
          'n|JUnit 5 support in the TestContext framework',
        ],
      },
      {
        v: '4.3',
        date: '2016-06-10',
        status: 'past',
        java: '6',
        f: ['n|Composed annotations such as @GetMapping and @PostMapping|h', 'n|Implicit constructor injection for single-constructor beans|h', 'i|The final 4.x line'],
      },
      {
        v: '4.2',
        date: '2015-07-31',
        status: 'past',
        java: '6',
        f: ['n|@EventListener for annotation-driven events', 'n|CORS support with @CrossOrigin', 'n|@AliasFor for annotation attribute aliases', 'n|HTTP streaming and server-sent events in MVC'],
      },
      { v: '4.1', date: '2014-09-04', status: 'past', java: '6', f: ['n|@JmsListener for annotation-driven JMS', 'n|JCache (JSR-107) annotations'] },
      {
        v: '4.0',
        date: '2013-12-12',
        status: 'past',
        java: '6',
        f: [
          'n|Java 8 support, including lambdas|h',
          'n|@Conditional beans, the basis of Spring Boot auto-configuration|h',
          'n|WebSocket and STOMP messaging',
          'n|@RestController',
          'n|Generics as autowiring qualifiers',
        ],
      },
      { v: '3.2', date: '2012-12-13', status: 'past', java: '5', f: ['n|Asynchronous request processing in Spring MVC', 'n|Spring MVC Test framework', 'i|Java 7 support'] },
      {
        v: '3.1',
        date: '2011-12-13',
        status: 'past',
        java: '5',
        f: ['n|Environment profiles with @Profile|h', 'n|Cache abstraction with @Cacheable|h', 'n|@Enable… annotations for Java configuration', 'n|Code-based Servlet 3 configuration'],
      },
      {
        v: '3.0',
        date: '2009-12-16',
        status: 'past',
        java: '5',
        f: [
          'n|Java-based configuration with @Configuration and @Bean|h',
          'n|Spring Expression Language (SpEL)',
          'n|REST support in Spring MVC with @PathVariable',
          'n|@Async and @Scheduled',
          'b|Java 5 baseline',
        ],
      },
      {
        v: '2.5',
        date: '2007-11-19',
        status: 'past',
        f: ['n|Annotation-driven configuration: @Autowired and component scanning|h', 'n|Annotated MVC controllers with @Controller and @RequestMapping|h', 'n|The TestContext framework'],
      },
      { v: '2.0', date: '2006-10-03', status: 'past', f: ['n|XML namespaces for shorter configuration', 'n|@AspectJ-style aspects', 'n|Request and session bean scopes', 'n|JPA support'] },
      { v: '1.2', date: '2005-05', status: 'past', f: ['n|@Transactional (Java 5 annotations)', 'n|JMX support'] },
      {
        v: '1.0',
        date: '2004-03-24',
        status: 'past',
        f: ['n|The IoC container and dependency injection|h', 'n|AOP framework', 'n|JDBC abstraction and declarative transactions', 'n|Spring MVC'],
      },
    ],
  },
  {
    id: 'spring-boot',
    name: 'Spring Boot',
    short: 'Boot',
    mark: 'Sb',
    c1: '#10B981',
    c2: '#0F766E',
    tagline: 'Auto-configuration, starters, embedded servers and production-ready features.',
    intro:
      'Spring Boot takes Spring Framework and makes it quick to start and easy to run: auto-configuration, starter dependencies, embedded servers and the Actuator. New minor versions ship every May and November, each pinning tested versions of the whole ecosystem.',
    cadence: 'A minor release every May and November',
    support: 'Each minor version gets about a year of free support; check spring.io for exact dates before planning upgrades.',
    site: 'https://spring.io/projects/spring-boot',
    versions: [
      { v: '4.2', date: '2026-11', status: 'planned', note: 'Expected in November 2026.', f: [] },
      {
        v: '4.1',
        date: '2026-06-10',
        status: 'latest',
        java: '17',
        ee: 'Jakarta EE 11',
        bundles: [
          ['Spring Framework', '7.0'],
          ['Spring Data', '2026.0'],
          ['Spring Security', '7.1'],
          ['Hibernate', '7.4'],
        ],
        f: [
          'n|Spring gRPC support|h',
          'n|HTTP client SSRF protection with InetAddressFilter|h',
          'i|More Jackson 3 configuration properties and customization options',
          'i|Observability updates, including OpenTelemetry',
          'n|File rotation support for Log4j',
          'd|Apache Derby support deprecated after the Derby project retired',
          'r|The deprecated layertools jar mode was removed',
        ],
      },
      {
        v: '4.0',
        date: '2025-11-20',
        status: 'supported',
        java: '17',
        ee: 'Jakarta EE 11',
        bundles: [
          ['Spring Framework', '7.0'],
          ['Spring Data', '2025.1'],
          ['Hibernate', '7.1 → 7.2'],
        ],
        f: [
          'b|Spring Framework 7 and Jakarta EE 11 (Servlet 6.1, Jakarta Persistence 3.2)|h',
          'b|Modular auto-configuration: smaller, focused modules and starters|h',
          'n|Jackson 3 by default',
          'n|API versioning and HTTP service clients from Spring Framework 7',
          'n|JSpecify null-safety',
          'i|Java 25 support',
        ],
      },
      {
        v: '3.5',
        date: '2025-05-22',
        status: 'past',
        java: '17',
        ee: 'Jakarta EE 10',
        bundles: [
          ['Spring Framework', '6.2'],
          ['Spring Data', '2025.0'],
          ['Hibernate', '6.6'],
        ],
        f: ['i|The final 3.x line, and the usual stepping stone before moving to Spring Boot 4|h', 'i|Structured logging and observability refinements'],
      },
      {
        v: '3.4',
        date: '2024-11-21',
        status: 'past',
        java: '17',
        ee: 'Jakarta EE 10',
        bundles: [
          ['Spring Framework', '6.2'],
          ['Spring Data', '2024.1'],
          ['Hibernate', '6.6'],
        ],
        f: [
          'n|Structured logging in JSON (ECS, GELF, Logstash)|h',
          'n|Support for Spring Framework 6.2’s @MockitoBean',
          'i|Docker Compose and Testcontainers improvements',
          'i|Virtual threads used by more components',
        ],
      },
      {
        v: '3.3',
        date: '2024-05-23',
        status: 'past',
        java: '17',
        ee: 'Jakarta EE 10',
        bundles: [
          ['Spring Framework', '6.1'],
          ['Spring Data', '2024.0'],
          ['Hibernate', '6.5'],
        ],
        f: ['n|Class Data Sharing (CDS) support for faster startup|h', 'n|SBOM actuator endpoint', 'i|Observability improvements'],
      },
      {
        v: '3.2',
        date: '2023-11-23',
        status: 'past',
        java: '17',
        ee: 'Jakarta EE 10',
        bundles: [
          ['Spring Framework', '6.1'],
          ['Spring Data', '2023.1'],
          ['Hibernate', '6.3 → 6.4'],
        ],
        f: ['n|Virtual threads with spring.threads.virtual.enabled|h', 'n|RestClient and JdbcClient support', 'n|CRaC checkpoint and restore', 'i|Java 21 support'],
      },
      {
        v: '3.1',
        date: '2023-05-18',
        status: 'past',
        java: '17',
        ee: 'Jakarta EE 10',
        bundles: [
          ['Spring Framework', '6.0'],
          ['Spring Data', '2023.0'],
          ['Hibernate', '6.2'],
        ],
        f: ['n|Docker Compose support for local development|h', 'n|Testcontainers service connections with @ServiceConnection|h', 'n|SSL bundles'],
      },
      {
        v: '3.0',
        date: '2022-11-24',
        status: 'past',
        java: '17',
        ee: 'Jakarta EE 10',
        bundles: [
          ['Spring Framework', '6.0'],
          ['Spring Data', '2022.0'],
          ['Hibernate', '6.1'],
        ],
        f: [
          'b|Java 17 baseline and Jakarta EE 10 (jakarta.* packages)|h',
          'n|GraalVM native images|h',
          'n|Micrometer Observation and tracing, replacing Spring Cloud Sleuth',
          'n|ProblemDetail error responses',
        ],
      },
      {
        v: '2.7',
        date: '2022-05-19',
        status: 'past',
        java: '8',
        ee: 'Java EE 8',
        bundles: [
          ['Spring Framework', '5.3'],
          ['Spring Data', '2021.2'],
          ['Hibernate', '5.6'],
        ],
        f: ['n|Spring for GraphQL support', 'n|New AutoConfiguration.imports registration file', 'i|The final 2.x line, and the stepping stone to 3.0|h'],
      },
      {
        v: '2.6',
        date: '2021-11-17',
        status: 'past',
        java: '8',
        ee: 'Java EE 8',
        bundles: [
          ['Spring Framework', '5.3'],
          ['Spring Data', '2021.1'],
          ['Hibernate', '5.6'],
        ],
        f: ['b|Circular bean references are prohibited by default|h', 'i|Java 17 support', 'n|SameSite cookie configuration'],
      },
      {
        v: '2.5',
        date: '2021-05-20',
        status: 'past',
        java: '8',
        ee: 'Java EE 8',
        bundles: [
          ['Spring Framework', '5.3'],
          ['Spring Data', '2021.0'],
          ['Hibernate', '5.4'],
        ],
        f: ['b|New SQL script initialization with spring.sql.init.*', 'i|Java 16 support'],
      },
      {
        v: '2.4',
        date: '2020-11-12',
        status: 'past',
        java: '8',
        ee: 'Java EE 8',
        bundles: [
          ['Spring Framework', '5.3'],
          ['Spring Data', '2020.0'],
          ['Hibernate', '5.4'],
        ],
        f: ['n|spring.config.import and a new config file processing model|h', 'n|Profile groups', 'i|Version numbers drop the .RELEASE suffix'],
      },
      {
        v: '2.3',
        date: '2020-05-15',
        status: 'past',
        java: '8',
        ee: 'Java EE 8',
        bundles: [
          ['Spring Framework', '5.2'],
          ['Spring Data', 'Neumann'],
          ['Hibernate', '5.4'],
        ],
        f: ['n|Liveness and readiness probes for Kubernetes|h', 'n|Graceful shutdown', 'n|Docker images with buildpacks and layered jars'],
      },
      {
        v: '2.2',
        date: '2019-10-16',
        status: 'past',
        java: '8',
        ee: 'Java EE 8',
        bundles: [
          ['Spring Framework', '5.2'],
          ['Spring Data', 'Moore'],
          ['Hibernate', '5.4'],
        ],
        f: ['n|Lazy initialization option', 'n|JUnit 5 as the default', 'n|@ConfigurationPropertiesScan and constructor binding'],
      },
      {
        v: '2.1',
        date: '2018-10-30',
        status: 'past',
        java: '8',
        ee: 'Java EE 8',
        bundles: [
          ['Spring Framework', '5.1'],
          ['Spring Data', 'Lovelace'],
          ['Hibernate', '5.3'],
        ],
        f: ['i|Java 11 support', 'b|Bean definition overriding disabled by default'],
      },
      {
        v: '2.0',
        date: '2018-03-01',
        status: 'past',
        java: '8',
        ee: 'Java EE 8',
        bundles: [
          ['Spring Framework', '5.0'],
          ['Spring Data', 'Kay'],
          ['Hibernate', '5.2'],
        ],
        f: ['b|Spring Framework 5 and a Java 8 baseline|h', 'n|Reactive web apps with WebFlux|h', 'n|Micrometer metrics', 'n|HikariCP as the default connection pool', 'i|Actuator rebuilt'],
      },
      {
        v: '1.5',
        date: '2017-01-30',
        status: 'past',
        java: '7',
        ee: 'Java EE 7',
        bundles: [
          ['Spring Framework', '4.3'],
          ['Spring Data', 'Ingalls'],
          ['Hibernate', '5.0'],
        ],
        f: ['n|Apache Kafka support', 'i|Actuator endpoints secured by default', 'i|The final 1.x line'],
      },
      { v: '1.4', date: '2016-07-28', status: 'past', java: '6', f: ['n|Test slices such as @WebMvcTest and @DataJpaTest|h', 'n|@MockBean'] },
      { v: '1.3', date: '2015-11-16', status: 'past', java: '6', f: ['n|DevTools with automatic restart|h', 'n|Cache auto-configuration', 'n|Fully executable jars'] },
      { v: '1.2', date: '2014-12-11', status: 'past', java: '6', f: ['n|The @SpringBootApplication annotation|h', 'i|Servlet 3.1 and Tomcat 8'] },
      {
        v: '1.0',
        date: '2014-04-01',
        status: 'past',
        java: '6',
        f: ['n|Auto-configuration|h', 'n|Starter dependencies', 'n|Embedded Tomcat and Jetty', 'n|Actuator health checks and metrics'],
      },
    ],
  },
  {
    id: 'spring-data-jpa',
    name: 'Spring Data JPA',
    short: 'Data JPA',
    mark: 'Sd',
    c1: '#84CC16',
    c2: '#15803D',
    tagline: 'Repositories for JPA: write an interface, get the queries.',
    intro:
      'Spring Data JPA turns repository interfaces into working data access code: CRUD, paging, derived queries from method names, and @Query. It ships in Spring Data release trains, which follow Spring Boot twice a year.',
    cadence: 'Release trains in May and November, alongside Spring Boot',
    support: 'Status below follows the Spring Data project’s release-train support table.',
    site: 'https://spring.io/projects/spring-data-jpa',
    versions: [
      { v: '4.2', date: '2026-11', status: 'planned', train: '2026.1', note: 'Planned for November 2026.', f: [] },
      {
        v: '4.1',
        date: '2026-06-09',
        status: 'latest',
        train: '2026.0',
        java: '17',
        ee: 'Jakarta EE 11',
        f: ['n|Type-safe property paths: refer to properties with method references instead of strings|h', 'i|Built on Hibernate 7.4'],
      },
      {
        v: '4.0',
        date: '2025-11',
        status: 'supported',
        train: '2025.1',
        java: '17',
        ee: 'Jakarta EE 11',
        f: [
          'n|Ahead-of-time repositories: query method code generated at build time|h',
          'n|Vector search methods',
          'b|Jakarta Persistence 3.2, Hibernate 7 and Spring Framework 7|h',
          'i|Stronger use of JPQL for derived queries',
          'r|ListenableFuture support removed',
        ],
      },
      { v: '3.5', date: '2025-05', status: 'supported', train: '2025.0', java: '17', ee: 'Jakarta EE 10', f: ['i|The final 3.x line, paired with Spring Boot 3.5'] },
      { v: '3.4', date: '2024-11', status: 'ended', train: '2024.1', java: '17', ee: 'Jakarta EE 10', f: ['n|Value expressions in queries, combining SpEL and property placeholders'] },
      { v: '3.3', date: '2024-05', status: 'ended', train: '2024.0', java: '17', ee: 'Jakarta EE 10', f: ['n|PagedModel for stable JSON output of Page results'] },
      { v: '3.2', date: '2023-11', status: 'ended', train: '2023.1 Vaughan', java: '17', ee: 'Jakarta EE 10', f: ['n|Limit as a query method parameter', 'i|Java 21 support'] },
      {
        v: '3.1',
        date: '2023-05',
        status: 'ended',
        train: '2023.0 Ullman',
        java: '17',
        ee: 'Jakarta EE 10',
        f: ['n|Scroll API: offset and keyset scrolling with Window results|h', 'n|A JPQL parser for safer query rewriting'],
      },
      {
        v: '3.0',
        date: '2022-11',
        status: 'ended',
        train: '2022.0 Turing',
        java: '17',
        ee: 'Jakarta EE 10',
        f: ['b|Jakarta Persistence, Hibernate 6 and a Java 17 baseline|h', 'n|ListCrudRepository and ListPagingAndSortingRepository return List', 'n|AOT and native image support'],
      },
      { v: '2.7', date: '2022-05', status: 'ended', train: '2021.2 Raj', java: '8', ee: 'Java EE 8', f: ['n|getReferenceById, replacing getOne and getById|h'] },
      { v: '2.5', date: '2021-04', status: 'ended', train: '2021.0 Pascal', java: '8', ee: 'Java EE 8', f: ['n|getById replaces the confusingly named getOne'] },
      { v: '2.4', date: '2020-10', status: 'ended', train: '2020.0 Ockham', java: '8', ee: 'Java EE 8', f: ['i|Release trains switch to calendar names such as 2020.0'] },
      {
        v: '2.0',
        date: '2017-10',
        status: 'ended',
        train: 'Kay',
        java: '8',
        ee: 'Java EE 7',
        f: [
          'b|CrudRepository methods renamed: findById returns Optional, plus saveAll and deleteById|h',
          'b|Java 8 and Spring Framework 5 baseline',
          'n|Composable repository fragments',
          'n|Kotlin support',
        ],
      },
      { v: '1.10', date: '2016-04', status: 'ended', train: 'Hopper', java: '6', f: ['n|Projections: return interfaces or DTOs from queries|h', 'n|Query by Example|h'] },
      { v: '1.8', date: '2015-03', status: 'ended', train: 'Fowler', java: '6', f: ['n|Java 8 Optional and Stream return types'] },
      {
        v: '1.0',
        date: '2011-07',
        status: 'ended',
        java: '6',
        f: [
          'n|JpaRepository with CRUD, paging and sorting|h',
          'n|Derived queries from method names such as findByLastname|h',
          'n|@Query for JPQL and native SQL',
          'n|Specifications for dynamic queries',
        ],
      },
    ],
  },
  {
    id: 'jpa',
    name: 'Jakarta Persistence (JPA)',
    short: 'JPA',
    mark: 'Jp',
    c1: '#8B5CF6',
    c2: '#4F46E5',
    tagline: 'The standard Java API for object-relational mapping.',
    intro:
      'JPA is the specification; Hibernate, EclipseLink and OpenJPA implement it, and Spring Data JPA builds on it. It began as part of Java EE 5, moved to the Eclipse Foundation as Jakarta Persistence, and changed its package from javax.persistence to jakarta.persistence in version 3.0.',
    cadence: 'A new version with each Jakarta EE platform release',
    support: 'Specifications don’t expire; what matters is which version your framework and implementation support.',
    site: 'https://jakarta.ee/specifications/persistence/',
    versions: [
      { v: '4.0', date: '2027', status: 'planned', ee: 'Jakarta EE 12', note: 'In development for Jakarta EE 12.', f: [] },
      {
        v: '3.2',
        date: '2024',
        status: 'latest',
        java: '17',
        ee: 'Jakarta EE 11',
        f: [
          'n|Java records as embeddable types|h',
          'n|Programmatic setup with PersistenceConfiguration, no persistence.xml needed|h',
          'n|runInTransaction and callInTransaction on EntityManagerFactory',
          'n|JPQL set operations: UNION, INTERSECT and EXCEPT',
          'n|New JPQL functions and syntax: ||, LEFT, RIGHT, REPLACE, CAST, id(), version(), NULLS FIRST/LAST',
          'n|java.time.Instant and Year supported; @EnumeratedValue for custom enum values',
          'n|SchemaManager API and typed FindOption, LockOption and RefreshOption',
          'd|java.util.Date, Calendar and @Temporal deprecated',
        ],
      },
      {
        v: '3.1',
        date: '2022-04',
        status: 'past',
        java: '11',
        ee: 'Jakarta EE 10',
        f: [
          'n|UUID as a basic type and GenerationType.UUID for ids|h',
          'n|New JPQL and Criteria functions: CEILING, EXP, FLOOR, LN, POWER, ROUND, SIGN, EXTRACT, LOCAL DATE/TIME',
          'b|Java SE 11 baseline',
        ],
      },
      {
        v: '3.0',
        date: '2020-11',
        status: 'past',
        java: '8',
        ee: 'Jakarta EE 9',
        f: ['b|Package renamed from javax.persistence to jakarta.persistence|h', 'i|No new features: this release only changed the namespace'],
      },
      {
        v: '2.2',
        date: '2017-07',
        status: 'past',
        java: '8',
        ee: 'Java EE 8',
        note: 'Re-released as Jakarta Persistence 2.2 for Jakarta EE 8 in 2019, still with javax packages.',
        f: ['n|java.time types such as LocalDate and LocalDateTime supported|h', 'n|Stream results with getResultStream()', 'n|Repeatable annotations', 'n|CDI injection into AttributeConverters'],
      },
      {
        v: '2.1',
        date: '2013-05',
        status: 'past',
        java: '7',
        ee: 'Java EE 7',
        f: [
          'n|AttributeConverter and @Convert|h',
          'n|Entity graphs for fetch planning|h',
          'n|Stored procedure queries',
          'n|Bulk update and delete with the Criteria API',
          'n|Schema generation from entity mappings',
        ],
      },
      {
        v: '2.0',
        date: '2009-12',
        status: 'past',
        java: '6',
        ee: 'Java EE 6',
        f: [
          'n|The Criteria API and the metamodel|h',
          'n|@ElementCollection for collections of values',
          'n|orphanRemoval and @OrderColumn',
          'n|Pessimistic locking',
          'n|Bean Validation integration and a standard second-level cache API',
        ],
      },
      {
        v: '1.0',
        date: '2006-05',
        status: 'past',
        java: '5',
        ee: 'Java EE 5',
        f: ['n|Annotation-based entity mapping: @Entity, @Id and relationships|h', 'n|EntityManager and the persistence context', 'n|The JPQL query language'],
      },
    ],
  },
  {
    id: 'hibernate',
    name: 'Hibernate ORM',
    short: 'Hibernate',
    mark: 'Hb',
    c1: '#C09B4E',
    c2: '#59666C',
    tagline: 'The most widely used JPA implementation, and Spring Boot’s default.',
    intro:
      'Hibernate ORM implements Jakarta Persistence and adds features beyond the standard: filters, soft delete, multi-tenancy, a type-safe query generator and fine-grained performance tuning. Spring Boot uses it by default for JPA.',
    cadence: 'Several minor releases a year',
    support: 'Only the newest minor lines get regular fixes; older lines move to limited support quickly.',
    site: 'https://hibernate.org/orm/',
    versions: [
      { v: '7.4', date: '2026', status: 'latest', java: '17', ee: 'Jakarta EE 11', f: ['i|The current release line, used by Spring Data JPA 4.1 and Spring Boot 4.1'] },
      { v: '7.3', date: '2026', status: 'past', java: '17', ee: 'Jakarta EE 11', f: ['i|Release line from early 2026'] },
      { v: '7.2', date: '2025-12', status: 'past', java: '17', ee: 'Jakarta EE 11', f: ['i|Adopted by Spring Boot 4.0.1 when 7.1 moved to limited support'] },
      { v: '7.1', date: '2025', status: 'past', java: '17', ee: 'Jakarta EE 11', f: ['i|Shipped with Spring Boot 4.0.0'] },
      {
        v: '7.0',
        date: '2025-05',
        status: 'past',
        java: '17',
        ee: 'Jakarta EE 11',
        f: [
          'b|Jakarta Persistence 3.2 and a Java 17 baseline|h',
          'i|Relicensed under the Apache License 2.0|h',
          'n|Type-safe Restriction and Range APIs for building queries in code',
          'i|Jakarta Validation 3.1 through Hibernate Validator 9',
        ],
      },
      {
        v: '6.6',
        date: '2024-08',
        status: 'past',
        java: '11',
        ee: 'Jakarta EE 10',
        f: ['n|A Jakarta Data 1.0 implementation|h', 'n|@ConcreteProxy for polymorphic lazy associations', 'n|Embeddable inheritance'],
      },
      { v: '6.5', date: '2024-04', status: 'past', java: '11', ee: 'Jakarta EE 10', f: ['n|Key-based (keyset) pagination'] },
      { v: '6.4', date: '2023-11', status: 'past', java: '11', ee: 'Jakarta EE 10', f: ['n|@SoftDelete for soft-deleting rows|h', 'n|Array functions in HQL'] },
      { v: '6.3', date: '2023', status: 'past', java: '11', ee: 'Jakarta EE 10', f: ['n|The metamodel generator can create type-safe query and finder methods (@HQL, @Find)'] },
      { v: '6.2', date: '2023', status: 'past', java: '11', ee: 'Jakarta EE 10', f: ['b|Jakarta Persistence 3.1', 'n|Java records as embeddables'] },
      {
        v: '6.0',
        date: '2022-03',
        status: 'past',
        java: '11',
        ee: 'Jakarta EE 9',
        f: [
          'b|Jakarta Persistence 3.0 (jakarta.* packages) and a Java 11 baseline|h',
          'n|New semantic query model (SQM) behind HQL and Criteria|h',
          'n|Reads JDBC results by position for speed',
          'n|JSON mapping with @JdbcTypeCode(SqlTypes.JSON)',
        ],
      },
      { v: '5.6', date: '2021', status: 'past', java: '8', ee: 'Java EE 8', f: ['i|The final 5.x line, also published as hibernate-core-jakarta for Jakarta EE 9'] },
      { v: '5.3', date: '2018', status: 'past', java: '8', ee: 'Java EE 8', f: ['n|JPA 2.2 support'] },
      {
        v: '5.2',
        date: '2016-06',
        status: 'past',
        java: '8',
        ee: 'Java EE 7',
        f: ['b|Java 8 baseline, with java.time and Optional support in the core|h', 'i|hibernate-entitymanager merged into hibernate-core', 'n|Stream query results'],
      },
      { v: '5.0', date: '2015-08', status: 'past', java: '6', ee: 'Java EE 7', f: ['n|New bootstrap API', 'i|Improved bytecode enhancement'] },
      { v: '4.3', date: '2013-12', status: 'past', java: '6', ee: 'Java EE 7', f: ['n|JPA 2.1 support'] },
      { v: '4.0', date: '2011-12', status: 'past', java: '6', ee: 'Java EE 6', f: ['n|Multi-tenancy support|h', 'n|Service registry bootstrapping'] },
      { v: '3.5', date: '2010-03', status: 'past', java: '5', ee: 'Java EE 6', f: ['n|JPA 2.0 support|h', 'i|Annotations and EntityManager merged into the core distribution'] },
      { v: '3.0', date: '2005-03', status: 'past', java: '1.4', f: ['n|Filters and a reworked HQL engine'] },
      { v: '1.0', date: '2002', status: 'past', f: ['n|First release: an open-source alternative to EJB 2 entity beans|h'] },
    ],
  },
];

/** Which versions work together, by Spring Boot version (the versions Boot manages for you). */
export interface CompatRow {
  boot: string;
  framework: string;
  java: string;
  ee: string;
  hibernate: string;
  jpa: string;
  data: string;
}

export const COMPAT: CompatRow[] = [
  { boot: '4.1', framework: '7.0', java: '17', ee: 'Jakarta EE 11', hibernate: '7.4', jpa: '3.2', data: '2026.0 (JPA 4.1)' },
  { boot: '4.0', framework: '7.0', java: '17', ee: 'Jakarta EE 11', hibernate: '7.1 → 7.2', jpa: '3.2', data: '2025.1 (JPA 4.0)' },
  { boot: '3.5', framework: '6.2', java: '17', ee: 'Jakarta EE 10', hibernate: '6.6', jpa: '3.1', data: '2025.0 (JPA 3.5)' },
  { boot: '3.4', framework: '6.2', java: '17', ee: 'Jakarta EE 10', hibernate: '6.6', jpa: '3.1', data: '2024.1 (JPA 3.4)' },
  { boot: '3.3', framework: '6.1', java: '17', ee: 'Jakarta EE 10', hibernate: '6.5', jpa: '3.1', data: '2024.0 (JPA 3.3)' },
  { boot: '3.2', framework: '6.1', java: '17', ee: 'Jakarta EE 10', hibernate: '6.3 → 6.4', jpa: '3.1', data: '2023.1 (JPA 3.2)' },
  { boot: '3.1', framework: '6.0', java: '17', ee: 'Jakarta EE 10', hibernate: '6.2', jpa: '3.1', data: '2023.0 (JPA 3.1)' },
  { boot: '3.0', framework: '6.0', java: '17', ee: 'Jakarta EE 10', hibernate: '6.1', jpa: '3.1', data: '2022.0 (JPA 3.0)' },
  { boot: '2.7', framework: '5.3', java: '8', ee: 'Java EE 8 (javax)', hibernate: '5.6', jpa: '2.2', data: '2021.2 (JPA 2.7)' },
  { boot: '2.6', framework: '5.3', java: '8', ee: 'Java EE 8 (javax)', hibernate: '5.6', jpa: '2.2', data: '2021.1 (JPA 2.6)' },
  { boot: '2.5', framework: '5.3', java: '8', ee: 'Java EE 8 (javax)', hibernate: '5.4', jpa: '2.2', data: '2021.0 (JPA 2.5)' },
  { boot: '2.4', framework: '5.3', java: '8', ee: 'Java EE 8 (javax)', hibernate: '5.4', jpa: '2.2', data: '2020.0 (JPA 2.4)' },
  { boot: '2.3', framework: '5.2', java: '8', ee: 'Java EE 8 (javax)', hibernate: '5.4', jpa: '2.2', data: 'Neumann (JPA 2.3)' },
  { boot: '2.2', framework: '5.2', java: '8', ee: 'Java EE 8 (javax)', hibernate: '5.4', jpa: '2.2', data: 'Moore (JPA 2.2)' },
  { boot: '2.1', framework: '5.1', java: '8', ee: 'Java EE 8 (javax)', hibernate: '5.3', jpa: '2.2', data: 'Lovelace (JPA 2.1)' },
  { boot: '2.0', framework: '5.0', java: '8', ee: 'Java EE 8 (javax)', hibernate: '5.2', jpa: '2.2', data: 'Kay (JPA 2.0)' },
  { boot: '1.5', framework: '4.3', java: '7', ee: 'Java EE 7 (javax)', hibernate: '5.0', jpa: '2.1', data: 'Ingalls (JPA 1.11)' },
];
