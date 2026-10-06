import { Component, computed, signal } from '@angular/core';
import bcrypt from 'bcryptjs';

async function sha256Hex(text: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return 'unavailable';
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function duration(seconds: number): string {
  if (seconds < 1) return 'under a second';
  if (seconds < 120) return `${Math.round(seconds)} seconds`;
  if (seconds < 7200) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 172800) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 63072000) return `${Math.round(seconds / 86400)} days`;
  return `${Math.round(seconds / 31536000)} years`;
}

/** Storing passwords safely: real BCrypt hashing (salt + cost) next to plain SHA-256. */
@Component({
  selector: 'app-password-lab',
  template: `
    <section class="hml pw" aria-labelledby="pw-h">
      <header class="hml-head">
        <div>
          <h2 id="pw-h">Password lab</h2>
          <p class="muted">Real BCrypt, running in your browser: the same algorithm Spring Security’s BCryptPasswordEncoder uses.</p>
        </div>
      </header>

      <div class="hml-controls">
        <label>password <input class="field" [value]="password()" (input)="password.set($any($event.target).value)" maxlength="72" spellcheck="false" /></label>
        <label>cost (log rounds)
          <select class="field" [value]="cost()" (change)="cost.set(+$any($event.target).value)">
            @for (c of costs; track c) { <option [value]="c" [selected]="c === cost()">{{ c }} ({{ 2 ** c }} rounds)</option> }
          </select>
        </label>
        <button type="button" class="btn btn-primary btn-sm" (click)="hash()" [disabled]="busy()">{{ busy() ? 'Hashing…' : 'encoder.encode(password)' }}</button>
      </div>

      @if (hashes().length) {
        <span class="ml-label">Stored in the database</span>
        <div class="pw-hashes">
          @for (h of hashes(); track h.value) {
            <div class="pw-hash">
              <code><span class="v">{{ h.value.slice(0, 4) }}</span><span class="c">{{ h.value.slice(4, 7) }}</span><span class="s">{{ h.value.slice(7, 29) }}</span><span class="d">{{ h.value.slice(29) }}</span></code>
              <small>cost {{ h.cost }} · {{ h.ms }} ms</small>
            </div>
          }
        </div>
        <p class="pw-legend"><span class="v">$2b$</span> algorithm version · <span class="c">10$</span> cost · <span class="s">22 characters of random salt</span> · <span class="d">31 characters of hash</span></p>
      }

      @if (hashes().length) {
        <div class="hml-controls">
          <label>login attempt <input class="field" [value]="attempt()" (input)="attempt.set($any($event.target).value)" spellcheck="false" /></label>
          <button type="button" class="btn btn-ghost btn-sm" (click)="check()" [disabled]="busy()">encoder.matches(attempt, storedHash)</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="sha()">Compare with plain SHA-256</button>
        </div>
      }

      @if (shaOut().length) {
        <div class="pw-sha">
          <span class="ml-label">SHA-256 of "{{ password() }}", computed twice</span>
          @for (s of shaOut(); track $index) { <code>{{ s }}</code> }
          <p>Identical every time, and computed in nanoseconds. Attackers precompute hashes of billions of common passwords (rainbow tables) and simply look yours up. Fast hashes are exactly wrong for passwords.</p>
        </div>
      }

      @if (attack(); as a) {
        <dl class="hml-stats pw-attack">
          <div><dt>BCrypt guesses / second (this device)</dt><dd>{{ a.bcryptRate }}</dd></div>
          <div><dt>10 million common passwords: BCrypt</dt><dd>{{ a.bcryptTime }}</dd></div>
          <div><dt>Same list against SHA-256 on a GPU</dt><dd>{{ a.shaTime }}</dd></div>
        </dl>
      }

      <p class="ml-note" [class.hitnote]="tone() === 'hit'" [class.missnote]="tone() === 'miss'" aria-live="polite">{{ note() }}</p>
    </section>
  `,
})
export class PasswordLabComponent {
  protected readonly costs = [4, 6, 8, 10, 11, 12];
  protected readonly password = signal('password123');
  protected readonly attempt = signal('password124');
  protected readonly cost = signal(10);
  protected readonly busy = signal(false);
  protected readonly hashes = signal<{ value: string; cost: number; ms: number }[]>([]);
  protected readonly shaOut = signal<string[]>([]);
  protected readonly note = signal('Hash the password, then hash it again: compare the two results.');
  protected readonly tone = signal<'hit' | 'miss' | ''>('');

  protected readonly attack = computed(() => {
    const last = this.hashes()[this.hashes().length - 1];
    if (!last) return null;
    const perSecond = 1000 / Math.max(1, last.ms);
    return {
      bcryptRate: perSecond >= 10 ? Math.round(perSecond).toLocaleString('en-IN') : perSecond.toFixed(1),
      bcryptTime: duration(10_000_000 / perSecond),
      shaTime: duration(10_000_000 / 10_000_000_000),
    };
  });

  protected async hash(): Promise<void> {
    this.busy.set(true);
    const started = performance.now();
    const value = await bcrypt.hash(this.password(), this.cost());
    const ms = Math.round(performance.now() - started);
    const first = this.hashes().length === 0;
    this.hashes.update((h) => [...h.slice(-2), { value, cost: this.cost(), ms }]);
    this.busy.set(false);
    this.tone.set('hit');
    this.note.set(first
      ? `Hashed in ${ms} ms. The salt is random, generated for this hash and stored inside it. Now press encode again.`
      : `A completely different hash for the same password: every hash gets its own random salt, so two users with the same password never share a hash, and precomputed tables are useless. Each +1 in cost doubles the work.`);
  }

  protected async check(): Promise<void> {
    const last = this.hashes()[this.hashes().length - 1];
    if (!last) return;
    this.busy.set(true);
    const ok = await bcrypt.compare(this.attempt(), last.value);
    this.busy.set(false);
    this.tone.set(ok ? 'hit' : 'miss');
    this.note.set(ok
      ? 'Match: matches() reads the cost and salt from the stored hash, hashes the attempt the same way and compares. The real password is never stored or decrypted; hashing is one-way.'
      : `No match: "${this.attempt()}" hashes to something different. Even a one-character difference produces a completely different hash.`);
  }

  protected async sha(): Promise<void> {
    const a = await sha256Hex(this.password());
    const b = await sha256Hex(this.password());
    this.shaOut.set([a, b]);
    this.tone.set('miss');
    this.note.set('Plain SHA-256: same input, same output, and extremely fast. Fine for checksums, wrong for passwords. Use BCrypt, Argon2 or PBKDF2, which are salted and deliberately slow.');
  }
}
