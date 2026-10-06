import { Component, computed, inject, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Stage = 'context' | 'cors' | 'csrf' | 'auth' | 'anon' | 'authz' | 'app';
type Status = 'pass' | 'skip' | 'fail' | 'answer';
interface Scenario {
  id: string;
  label: string;
  request: string;
  headers: string;
  steps: [Stage, Status, string][];
  context: string;
  status: number;
  body: string;
  /** Line of the configuration that decided, highlighted in the code panel. */
  rule: number;
}

const STAGES: { id: Stage; name: string; sub: string }[] = [
  { id: 'context', name: 'SecurityContext', sub: 'HolderFilter' },
  { id: 'cors', name: 'CORS', sub: 'CorsFilter' },
  { id: 'csrf', name: 'CSRF', sub: 'CsrfFilter' },
  { id: 'auth', name: 'Authentication', sub: 'Bearer / session' },
  { id: 'anon', name: 'Anonymous', sub: 'AnonymousAuth…' },
  { id: 'authz', name: 'Authorization', sub: 'AuthorizationFilter' },
  { id: 'app', name: 'Controller', sub: 'DispatcherServlet' },
];

const CONFIG = [
  '@Bean',
  'SecurityFilterChain security(HttpSecurity http) throws Exception {',
  '    return http',
  '        .cors(Customizer.withDefaults())               // allowed origin: https://javaatlas.com',
  '        .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"))   // token API: no cookies',
  '        .authorizeHttpRequests(auth -> auth',
  '            .requestMatchers(HttpMethod.GET, "/api/courses/**").permitAll()',
  '            .requestMatchers("/api/admin/**").hasRole("ADMIN")',
  '            .anyRequest().authenticated())',
  '        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))   // Bearer JWT',
  '        .formLogin(Customizer.withDefaults())          // session login for /account pages',
  '        .build();',
  '}',
];

const SCENARIOS: Scenario[] = [
  {
    id: 'public', label: 'Public page, no login', request: 'GET /api/courses', headers: 'no Authorization header',
    steps: [
      ['context', 'pass', 'No session, so the SecurityContext starts empty.'],
      ['cors', 'skip', 'Same-origin request: nothing for CORS to check.'],
      ['csrf', 'skip', 'GET is a safe method, and /api/** is excluded from CSRF anyway.'],
      ['auth', 'skip', 'No Bearer token and no login form: no authentication attempt.'],
      ['anon', 'pass', 'Nobody is logged in, so an AnonymousAuthenticationToken is placed in the context.'],
      ['authz', 'pass', 'Rule: GET /api/courses/** is permitAll(). Anonymous users are allowed.'],
      ['app', 'pass', 'The controller returns the course list.'],
    ],
    context: 'anonymousUser [ROLE_ANONYMOUS]', status: 200, body: '200 OK: the course list', rule: 6,
  },
  {
    id: 'no-token', label: 'Protected page, no token', request: 'GET /api/me', headers: 'no Authorization header',
    steps: [
      ['context', 'pass', 'Empty SecurityContext.'],
      ['cors', 'skip', 'Same origin.'],
      ['csrf', 'skip', 'Safe method.'],
      ['auth', 'skip', 'No credentials were sent.'],
      ['anon', 'pass', 'The user is anonymous.'],
      ['authz', 'fail', 'Rule: anyRequest().authenticated(). Anonymous isn’t authenticated, so access is denied. ExceptionTranslationFilter sees an anonymous user and calls the AuthenticationEntryPoint.'],
    ],
    context: 'anonymousUser [ROLE_ANONYMOUS]', status: 401, body: '401 Unauthorized, WWW-Authenticate: Bearer ("log in first")', rule: 8,
  },
  {
    id: 'user', label: 'Valid token (USER)', request: 'GET /api/me', headers: 'Authorization: Bearer eyJ… (role USER, not expired)',
    steps: [
      ['context', 'pass', 'Empty SecurityContext (stateless API: no session).'],
      ['cors', 'skip', 'Same origin.'],
      ['csrf', 'skip', 'Excluded for /api/**: the client sends a token header, not a cookie, so CSRF can’t happen.'],
      ['auth', 'pass', 'BearerTokenAuthenticationFilter decodes the JWT, verifies its signature with the public key, checks issuer and expiry, and turns its claims into authorities.'],
      ['anon', 'skip', 'Someone is authenticated, so the anonymous filter does nothing.'],
      ['authz', 'pass', 'Rule: anyRequest().authenticated(). asha is authenticated.'],
      ['app', 'pass', 'The controller can read the user from @AuthenticationPrincipal.'],
    ],
    context: 'asha@example.com [ROLE_USER]', status: 200, body: '200 OK: asha’s profile', rule: 8,
  },
  {
    id: 'wrong-role', label: 'USER calls an admin endpoint', request: 'GET /api/admin/stats', headers: 'Authorization: Bearer eyJ… (role USER)',
    steps: [
      ['context', 'pass', 'Empty SecurityContext.'],
      ['cors', 'skip', 'Same origin.'],
      ['csrf', 'skip', 'Excluded for /api/**.'],
      ['auth', 'pass', 'The token is valid: asha is authenticated with ROLE_USER.'],
      ['anon', 'skip', 'Already authenticated.'],
      ['authz', 'fail', 'Rule: /api/admin/** needs hasRole("ADMIN") (authority ROLE_ADMIN). asha only has ROLE_USER. ExceptionTranslationFilter sees an authenticated user, so it calls the AccessDeniedHandler.'],
    ],
    context: 'asha@example.com [ROLE_USER]', status: 403, body: '403 Forbidden ("we know who you are, and the answer is no")', rule: 7,
  },
  {
    id: 'admin', label: 'ADMIN calls an admin endpoint', request: 'GET /api/admin/stats', headers: 'Authorization: Bearer eyJ… (role ADMIN)',
    steps: [
      ['context', 'pass', 'Empty SecurityContext.'],
      ['cors', 'skip', 'Same origin.'],
      ['csrf', 'skip', 'Excluded for /api/**.'],
      ['auth', 'pass', 'The token is valid: ravi is authenticated with ROLE_ADMIN.'],
      ['anon', 'skip', 'Already authenticated.'],
      ['authz', 'pass', 'Rule: hasRole("ADMIN"). ravi has ROLE_ADMIN.'],
      ['app', 'pass', 'The admin controller runs.'],
    ],
    context: 'ravi@example.com [ROLE_ADMIN]', status: 200, body: '200 OK: the stats', rule: 7,
  },
  {
    id: 'expired', label: 'Expired token', request: 'GET /api/me', headers: 'Authorization: Bearer eyJ… (exp was 20 minutes ago)',
    steps: [
      ['context', 'pass', 'Empty SecurityContext.'],
      ['cors', 'skip', 'Same origin.'],
      ['csrf', 'skip', 'Excluded for /api/**.'],
      ['auth', 'fail', 'The signature is fine, but the exp claim is in the past: JwtValidationException ("Jwt expired"). The filter rejects the request immediately; authorization is never reached.'],
    ],
    context: '(nothing: authentication failed)', status: 401, body: '401 Unauthorized, error="invalid_token". The client should use its refresh token.', rule: 9,
  },
  {
    id: 'tampered', label: 'Tampered token (role edited)', request: 'GET /api/admin/stats', headers: 'Authorization: Bearer eyJ… (payload edited to role ADMIN)',
    steps: [
      ['context', 'pass', 'Empty SecurityContext.'],
      ['cors', 'skip', 'Same origin.'],
      ['csrf', 'skip', 'Excluded for /api/**.'],
      ['auth', 'fail', 'The payload was changed after signing, so the signature no longer matches. The token is rejected: an attacker can read a JWT, but can’t change it.'],
    ],
    context: '(nothing: authentication failed)', status: 401, body: '401 Unauthorized, error="invalid_token" (bad signature)', rule: 9,
  },
  {
    id: 'csrf-missing', label: 'Form POST without CSRF token', request: 'POST /account/email', headers: 'Cookie: JSESSIONID=… (logged in), no CSRF token',
    steps: [
      ['context', 'pass', 'The session holds a logged-in SecurityContext for asha.'],
      ['cors', 'skip', 'Same origin.'],
      ['csrf', 'fail', 'POST to a non-API URL with a session cookie needs a CSRF token, and none was sent. This is exactly what a forged request from another site looks like, so it is rejected.'],
    ],
    context: 'asha@example.com [ROLE_USER] (from the session)', status: 403, body: '403 Forbidden: invalid CSRF token', rule: 4,
  },
  {
    id: 'csrf-ok', label: 'Form POST with CSRF token', request: 'POST /account/email', headers: 'Cookie: JSESSIONID=…, _csrf=9f3c… (from the page’s form)',
    steps: [
      ['context', 'pass', 'The session holds a logged-in SecurityContext for asha.'],
      ['cors', 'skip', 'Same origin.'],
      ['csrf', 'pass', 'The token in the form matches the one stored for this session: the request really came from our own page.'],
      ['auth', 'skip', 'Already authenticated via the session.'],
      ['anon', 'skip', 'Already authenticated.'],
      ['authz', 'pass', 'Rule: anyRequest().authenticated().'],
      ['app', 'pass', 'The email is updated.'],
    ],
    context: 'asha@example.com [ROLE_USER] (from the session)', status: 200, body: '200 OK (or a redirect): email updated', rule: 8,
  },
  {
    id: 'cors-bad', label: 'Preflight from another site', request: 'OPTIONS /api/orders', headers: 'Origin: https://evil.example, Access-Control-Request-Method: POST',
    steps: [
      ['context', 'pass', 'Empty SecurityContext.'],
      ['cors', 'fail', 'A CORS preflight from https://evil.example. That origin isn’t in the allowed list, so CorsFilter rejects it. The browser will block the real request.'],
    ],
    context: '(not reached)', status: 403, body: '403 Invalid CORS request (no Access-Control-Allow-Origin header)', rule: 3,
  },
  {
    id: 'cors-ok', label: 'Preflight from our frontend', request: 'OPTIONS /api/orders', headers: 'Origin: https://javaatlas.com, Access-Control-Request-Method: POST',
    steps: [
      ['context', 'pass', 'Empty SecurityContext.'],
      ['cors', 'answer', 'The origin is allowed. CorsFilter answers the preflight itself with Access-Control-Allow-Origin, -Methods and -Headers. The chain stops here: the browser now sends the real POST.'],
    ],
    context: '(not needed for a preflight)', status: 200, body: '200 OK + Access-Control-Allow-Origin: https://javaatlas.com', rule: 3,
  },
];

/** Send requests through Spring Security's filter chain and watch which filter decides. */
@Component({
  selector: 'app-security-lab',
  template: `
    <section class="hml sec" aria-labelledby="sec-h">
      <header class="hml-head">
        <div>
          <h2 id="sec-h">Security filter chain lab</h2>
          <p class="muted">Pick a request and send it. Every request passes these filters in order before it can reach your controller.</p>
        </div>
      </header>

      <div class="sec-pick" role="group" aria-label="Requests">
        @for (s of scenarios; track s.id) {
          <button type="button" class="chip" [attr.aria-pressed]="sc().id === s.id" (click)="pick(s.id)">{{ s.label }}</button>
        }
      </div>

      <div class="sec-req">
        <code>{{ sc().request }}</code>
        <span>{{ sc().headers }}</span>
        <button type="button" class="btn btn-primary btn-sm" (click)="send()" [disabled]="sending()">Send request</button>
      </div>

      <ol class="sec-chain">
        @for (st of stages; track st.id) {
          <li class="sec-stage" [attr.data-status]="statusOf(st.id)" [class.now]="currentStage() === st.id">
            <b>{{ st.name }}</b>
            <small>{{ st.sub }}</small>
            <em>{{ label(statusOf(st.id)) }}</em>
          </li>
        }
      </ol>

      <div class="sec-out">
        <div><span class="ml-label">SecurityContext</span><code>{{ shown() >= authIndex() ? sc().context : '…' }}</code></div>
        <div><span class="ml-label">Response</span>
          @if (done()) {
            <b class="sec-code" [attr.data-code]="sc().status">{{ sc().body }}</b>
          } @else {
            <span class="muted">{{ shown() < 0 ? 'not sent yet' : 'in progress…' }}</span>
          }
        </div>
      </div>

      <p class="ml-note" [class.hitnote]="done() && sc().status < 400" [class.missnote]="done() && sc().status >= 400" aria-live="polite">{{ note() }}</p>

      <pre class="tl-code sec-config" aria-label="Security configuration">@for (line of config; track $index) {<span [class.cur]="done() && $index === sc().rule">{{ line }}</span>
}</pre>
    </section>
  `,
})
export class SecurityLabComponent implements OnDestroy {
  protected readonly scenarios = SCENARIOS;
  protected readonly stages = STAGES;
  protected readonly config = CONFIG;
  protected readonly sc = signal<Scenario>(SCENARIOS[0]);
  /** Index of the last revealed step (-1 = not sent). */
  protected readonly shown = signal(-1);
  protected readonly sending = signal(false);
  private timers: ReturnType<typeof setTimeout>[] = [];
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly done = computed(() => this.shown() >= this.sc().steps.length - 1);
  protected readonly currentStage = computed(() => (this.shown() >= 0 ? this.sc().steps[this.shown()][0] : null));
  protected readonly authIndex = computed(() => Math.max(0, this.sc().steps.findIndex(([s]) => s === 'auth' || s === 'anon' || s === 'csrf')));
  protected readonly note = computed(() => {
    const i = this.shown();
    if (i < 0) return 'Press "Send request".';
    const step = this.sc().steps[i];
    return step[2];
  });

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected pick(id: string): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.sending.set(false);
    this.sc.set(SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0]);
    this.shown.set(-1);
  }

  protected send(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    const n = this.sc().steps.length;
    if (!this.browser) {
      this.shown.set(n - 1);
      return;
    }
    this.sending.set(true);
    this.shown.set(-1);
    for (let i = 0; i < n; i++) {
      this.timers.push(
        setTimeout(() => {
          this.shown.set(i);
          if (i === n - 1) this.sending.set(false);
        }, 700 * (i + 1)),
      );
    }
  }

  protected statusOf(stage: Stage): Status | 'waiting' | 'unreached' {
    const steps = this.sc().steps;
    const i = steps.findIndex(([s]) => s === stage);
    if (i < 0) return this.done() ? 'unreached' : 'waiting';
    return i <= this.shown() ? steps[i][1] : 'waiting';
  }

  protected label(s: Status | 'waiting' | 'unreached'): string {
    return { pass: 'passed', skip: 'not involved', fail: 'STOPPED HERE', answer: 'answered', waiting: '', unreached: 'never reached' }[s];
  }
}
