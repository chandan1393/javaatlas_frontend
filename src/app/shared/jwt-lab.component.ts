import { Component, computed, OnInit, signal } from '@angular/core';

const SERVER_SECRET = 'javaatlas-demo-secret-change-me-32+bytes!';

function b64url(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlText(text: string): string {
  return b64url(new TextEncoder().encode(text));
}
function fromB64url(part: string): string {
  try {
    const pad = part.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((part.length + 3) % 4);
    const bin = atob(pad);
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch {
    return '(not valid Base64URL)';
  }
}
async function hmac(secret: string, data: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return 'unavailable';
  const key = await subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(new Uint8Array(await subtle.sign('HMAC', key, new TextEncoder().encode(data))));
}

/** A JSON Web Token, signed and verified for real (HMAC-SHA256 in the browser). */
@Component({
  selector: 'app-jwt-lab',
  template: `
    <section class="hml jw" aria-labelledby="jw-h">
      <header class="hml-head">
        <div>
          <h2 id="jw-h">JWT lab</h2>
          <p class="muted">A JWT is three Base64URL parts: header.payload.signature. Anyone can read it; only the holder of the secret key can create a valid signature. This lab signs and verifies for real.</p>
        </div>
      </header>

      <div class="jw-grid">
        <div>
          <span class="ml-label">Payload (claims) the server puts in the token</span>
          <textarea class="field jw-payload" rows="7" spellcheck="false" [value]="payload()" (input)="payload.set($any($event.target).value)"></textarea>
          <div class="hml-controls">
            <button type="button" class="btn btn-primary btn-sm" (click)="sign()">Server: sign the token</button>
          </div>
        </div>
        <div>
          <span class="ml-label">The token (what the client stores and sends)</span>
          <p class="jw-token" aria-live="polite">
            @if (token()) {
              <span class="h">{{ parts()[0] }}</span>.<span class="p">{{ parts()[1] }}</span>.<span class="s">{{ parts()[2] }}</span>
            } @else {
              <span class="muted">Press "Server: sign the token".</span>
            }
          </p>
          @if (token()) {
            <span class="ml-label">Decoded by anyone (no key needed)</span>
            <pre class="tl-code jw-decoded">{{ decoded() }}</pre>
          }
        </div>
      </div>

      @if (token()) {
        <div class="hml-controls">
          <button type="button" class="btn btn-ghost btn-sm" (click)="tamperRole()">Attacker: change the role to ADMIN</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="forge()">Attacker: re-sign with a guessed secret</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="advance(10)">Time passes: +10 min</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="clock.set(0)">Reset the clock</button>
          <button type="button" class="btn btn-brand btn-sm" (click)="verify()">Server: verify the token</button>
        </div>
        <p class="muted jw-clock">Server clock: {{ clock() ? '+' + clock() + ' min' : 'now' }} · token expires {{ expiresIn() }}</p>
      }

      @if (result(); as r) {
        <ul class="jw-checks" aria-live="polite">
          <li [class.ok]="r.signature" [class.bad]="!r.signature">Signature: {{ r.signature ? 'matches (HMAC-SHA256 with the server secret)' : 'does NOT match: the token was changed or signed with another key' }}</li>
          <li [class.ok]="r.notExpired" [class.bad]="!r.notExpired">Expiry: {{ r.notExpired ? 'still valid' : 'expired: exp is in the past' }}</li>
          <li [class.ok]="r.signature && r.notExpired" [class.bad]="!(r.signature && r.notExpired)"><strong>{{ r.signature && r.notExpired ? 'Accepted: the request is authenticated as ' + r.sub + ' with roles ' + r.roles : 'Rejected with 401 Unauthorized' }}</strong></li>
        </ul>
      }
      <p class="ml-note">{{ note() }}</p>
    </section>
  `,
})
export class JwtLabComponent implements OnInit {
  protected readonly payload = signal('');
  protected readonly token = signal('');
  protected readonly clock = signal(0);
  protected readonly note = signal('The header {"alg":"HS256","typ":"JWT"} says how it is signed. Edit the payload if you like, then sign it.');
  protected readonly result = signal<{ signature: boolean; notExpired: boolean; sub: string; roles: string } | null>(null);
  private issuedAt = 0;

  protected readonly parts = computed(() => this.token().split('.'));
  protected readonly decoded = computed(() => {
    const [h, p] = this.parts();
    return `header:  ${fromB64url(h ?? '')}\npayload: ${fromB64url(p ?? '')}`;
  });
  protected readonly expiresIn = computed(() => {
    try {
      const exp = JSON.parse(fromB64url(this.parts()[1] ?? '')).exp as number;
      const now = Math.floor(Date.now() / 1000) + this.clock() * 60;
      const left = Math.round((exp - now) / 60);
      return left > 0 ? `in ${left} min` : `${-left} min ago`;
    } catch {
      return 'unknown';
    }
  });

  ngOnInit(): void {
    this.issuedAt = Math.floor(Date.now() / 1000);
    this.payload.set(JSON.stringify({ sub: 'asha@example.com', name: 'Asha', roles: ['USER'], iat: this.issuedAt, exp: this.issuedAt + 15 * 60 }, null, 2));
  }

  protected async sign(): Promise<void> {
    let claims: unknown;
    try {
      claims = JSON.parse(this.payload());
    } catch {
      this.note.set('The payload must be valid JSON.');
      return;
    }
    const header = b64urlText(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = b64urlText(JSON.stringify(claims));
    const sig = await hmac(SERVER_SECRET, `${header}.${body}`);
    this.token.set(`${header}.${body}.${sig}`);
    this.result.set(null);
    this.clock.set(0);
    this.note.set('Signed: signature = HMAC-SHA256(header + "." + payload, server secret). The payload is only encoded, NOT encrypted, so never put passwords or secrets in it.');
  }

  protected tamperRole(): void {
    const [h, p, s] = this.parts();
    try {
      const claims = JSON.parse(fromB64url(p));
      claims.roles = ['ADMIN'];
      this.token.set(`${h}.${b64urlText(JSON.stringify(claims))}.${s}`);
      this.result.set(null);
      this.note.set('The attacker decoded the payload, changed roles to ADMIN and encoded it again. Easy. But they kept the old signature, because they can’t compute a new one without the secret. Now verify it.');
    } catch {
      this.note.set('Sign a token first.');
    }
  }

  protected async forge(): Promise<void> {
    const [h, p] = this.parts();
    const claims = JSON.parse(fromB64url(p));
    claims.roles = ['ADMIN'];
    const body = b64urlText(JSON.stringify(claims));
    this.token.set(`${h}.${body}.${await hmac('password123', `${h}.${body}`)}`);
    this.result.set(null);
    this.note.set('The attacker signed an ADMIN token with a guessed secret ("password123"). It looks perfectly valid. Verify it: the server uses its own secret. (This is why HS256 secrets must be long and random, at least 256 bits.)');
  }

  protected advance(min: number): void {
    this.clock.update((c) => c + min);
    this.result.set(null);
    this.note.set(`Moved the server clock forward ${min} minutes. Access tokens are short-lived on purpose: a stolen token stops working soon. Verify it again.`);
  }

  protected async verify(): Promise<void> {
    const [h, p, s] = this.parts();
    const expected = await hmac(SERVER_SECRET, `${h}.${p}`);
    let claims: { sub?: string; roles?: string[]; exp?: number } = {};
    try {
      claims = JSON.parse(fromB64url(p));
    } catch {
      claims = {};
    }
    const now = Math.floor(Date.now() / 1000) + this.clock() * 60;
    const signature = expected === s;
    const notExpired = typeof claims.exp === 'number' && claims.exp > now;
    this.result.set({ signature, notExpired, sub: claims.sub ?? '?', roles: (claims.roles ?? []).join(', ') });
    this.note.set(signature
      ? notExpired
        ? 'The server recomputed the signature with its secret and got the same value, and the token hasn’t expired. In Spring this is what BearerTokenAuthenticationFilter does before your controller runs.'
        : 'The signature is genuine, but the token has expired. The client must get a new access token (usually with a refresh token).'
      : 'The server recomputed the signature from the header and payload it received and got a different value, so the token is rejected. Any change to the payload breaks the signature.');
  }
}
