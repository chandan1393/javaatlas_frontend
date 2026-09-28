import { Lang } from './models';

/*
 * Small text helpers. Everything returned here is HTML built from escaped text,
 * so it is safe to bind with [innerHTML].
 */

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c] ?? c);

const CODE_RE = /\[\[(.+?)\]\](?!\])/g;

/** Strips lesson markup: [[code]] and **bold**. */
export function plain(s: string | undefined): string {
  return String(s ?? '').replace(CODE_RE, '$1').replace(/\*\*(.+?)\*\*/g, '$1');
}

export function words(s: string | undefined): number {
  return plain(s).split(/\s+/).filter(Boolean).length;
}

function inline(s: string, ai: boolean): string {
  let r = s.replace(CODE_RE, '<code>$1</code>');
  if (ai) r = r.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  return r.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Lesson markup to HTML: blank lines separate paragraphs, "- " lines are bullets,
 * "1. " lines are numbered. With ai=true it also accepts `code`, "* " bullets and # headings.
 */
export function md(src: string | undefined, ai = false): string {
  if (!src) return '';
  const lines = esc(String(src).trim()).split('\n');
  let html = '';
  let para: string[] = [];
  let list: string[] | null = null;
  let ltype: 'ul' | 'ol' | null = null;
  const flushP = () => {
    if (para.length) {
      html += '<p>' + inline(para.join(' '), ai) + '</p>';
      para = [];
    }
  };
  const flushL = () => {
    if (list && ltype) {
      html += `<${ltype}>` + list.map((x) => '<li>' + inline(x, ai) + '</li>').join('') + `</${ltype}>`;
    }
    list = null;
  };
  for (const raw of lines) {
    const l = raw.trim();
    let m: RegExpMatchArray | null;
    if (!l) {
      flushP();
      flushL();
      continue;
    }
    if (ai && ((m = l.match(/^#{1,4}\s+(.*)$/)) || (m = l.match(/^\*\*([^*]+)\*\*:?$/)))) {
      // A "## Heading" line, or a line that is entirely bold, becomes a heading.
      flushP();
      flushL();
      html += '<p class="md-h"><strong>' + inline(m[1], ai) + '</strong></p>';
      continue;
    }
    if ((m = l.match(ai ? /^[-*] (.*)$/ : /^- (.*)$/))) {
      flushP();
      if (ltype !== 'ul') flushL();
      ltype = 'ul';
      (list ??= []).push(m[1]);
      continue;
    }
    if ((m = l.match(/^\d+\. (.*)$/))) {
      flushP();
      if (ltype !== 'ol') flushL();
      ltype = 'ol';
      (list ??= []).push(m[1]);
      continue;
    }
    flushL();
    para.push(l);
  }
  flushP();
  flushL();
  return html;
}

const KW = new Set(
  'abstract assert boolean break byte case catch char class continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var record sealed permits yield true false null when module'.split(' '),
);
const span = (c: string, t: string) => `<span class="t${c}">${esc(t)}</span>`;

function hlJava(src: string): string {
  const re =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("""[\s\S]*?"""|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(@[A-Za-z_][\w.]*)|(\b\d[\d_]*(?:\.\d+)?[LlFfDd]?\b)|([A-Za-z_$][\w$]*)|([\s\S])/g;
  let out = '';
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m[1]) out += span('c', m[1]);
    else if (m[2]) out += span('s', m[2]);
    else if (m[3]) out += span('a', m[3]);
    else if (m[4]) out += span('n', m[4]);
    else if (m[5]) {
      const w = m[5];
      out += KW.has(w) ? span('k', w) : /^[A-Z]\w*[a-z]\w*$/.test(w) ? span('t', w) : esc(w);
    } else out += esc(m[6]);
  }
  return out;
}

function hlOther(src: string, lang: Lang): string {
  return src
    .split('\n')
    .map((line) => {
      if (lang === 'text') return esc(line);
      if (/^\s*#/.test(line)) return span('c', line);
      let code = line;
      let com = '';
      const ci = line.search(/\s#\s/);
      if (ci >= 0) {
        code = line.slice(0, ci);
        com = line.slice(ci);
      }
      let h = esc(code);
      if (lang === 'yaml') h = h.replace(/^(\s*-?\s*)([\w.\-/]+)(:)/, (_a, a, b, c) => `${a}<span class="tk">${b}</span>${c}`);
      else if (lang === 'dockerfile')
        h = h
          .replace(/^(\s*)(FROM|RUN|COPY|WORKDIR|EXPOSE|ENTRYPOINT|CMD|USER|ENV|ARG)\b/, (_a, a, b) => `${a}<span class="tk">${b}</span>`)
          .replace(/ AS /, ' <span class="tk">AS</span> ');
      else if (lang === 'bash')
        h = h.replace(/^(\s*)(java|javac|jshell|jcmd|\.\/mvnw|mvn|docker|kubectl)\b/, (_a, a, b) => `${a}<span class="tk">${b}</span>`);
      h = h.replace(/(&quot;.*?&quot;)/g, '<span class="ts">$1</span>');
      return h + (com ? span('c', com) : '');
    })
    .join('\n');
}

/** Syntax highlighting for code blocks. */
export function highlight(src: string, lang: Lang = 'java'): string {
  return lang === 'java' ? hlJava(src) : hlOther(src, lang);
}

export const LANG_NAMES: Record<Lang, string> = {
  java: 'Java',
  yaml: 'YAML',
  bash: 'Terminal',
  dockerfile: 'Dockerfile',
  text: 'Plain text',
};

const FENCE_LANGS: Record<string, Lang> = {
  yml: 'yaml', yaml: 'yaml', bash: 'bash', sh: 'bash', shell: 'bash', dockerfile: 'dockerfile',
  text: 'text', txt: 'text', properties: 'text', sql: 'text', xml: 'text', json: 'text',
};

/** Renders an AI answer: markdown-ish text with ``` fenced code. */
export function aiToHtml(t: string): string {
  const parts = String(t ?? '').split('```');
  let out = '';
  parts.forEach((p, i) => {
    if (i % 2) {
      const nl = p.indexOf('\n');
      let lang = nl >= 0 ? p.slice(0, nl).trim().toLowerCase() : '';
      let src = nl >= 0 ? p.slice(nl + 1) : p;
      if (!/^[a-z]*$/.test(lang)) {
        lang = '';
        src = p;
      }
      out += '<pre><code>' + highlight(src.replace(/\n$/, ''), FENCE_LANGS[lang] ?? 'java') + '</code></pre>';
    } else out += md(p, true);
  });
  return out || '<p>…</p>';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2023-09-19" -> "Sep 2023" (or "19 Sep 2023" with long=true). */
export function fmtDate(d: string, long = false): string {
  const [y, m, day] = String(d).split('-').map(Number);
  if (!m) return String(y);
  return (long && day ? day + ' ' : '') + MONTHS[m - 1] + ' ' + y;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function listJoin(a: string[]): string {
  return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
}

/** Lower-cases the first letter unless the text has other capitals (keeps "HTTP/3", "Foreign Function..."). */
export function softCase(t: string): string {
  return /^[A-Z][^A-Z]*$/.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
}

export const inr = (n: number) => '₹' + Number(n).toLocaleString('en-IN');

/** Course descriptions and lecture text use the same format as AI answers. */
export const richText = aiToHtml;

/** Dates from the API may be ISO strings or epoch seconds. */
export function toDate(v: string | number | null | undefined): Date | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return new Date(v < 1e12 ? v * 1000 : v);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export function fmtWhen(v: string | number | null | undefined): string {
  const d = toDate(v);
  return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export const priceText = (inrAmount: number) => (inrAmount > 0 ? inr(inrAmount) : 'Free');
export const paiseText = (paise: number) => (paise > 0 ? '₹' + (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : 'Free');

export function hoursText(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function slugify(t: string): string {
  return t.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
