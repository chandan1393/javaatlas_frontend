import { Injectable } from '@angular/core';
import { PREREQS } from '../data/connections';
import { LearningPath, PATHS } from '../data/paths';
import { PRODUCTS } from '../data/products';
import { SUBTOPICS_A } from '../data/subtopics-a';
import { SUBTOPICS_B } from '../data/subtopics-b';
import { SUBTOPICS_C } from '../data/subtopics-c';
import { SUBTOPICS_D } from '../data/subtopics-d';
import { CURRICULUM } from '../data/curriculum';
import { ECO, VERSIONS } from '../data/versions';
import { fmtDate, ordinal, plain, words } from './markup';
import { Feature, FeatType, Lesson, Question, SearchHit, Stage, TYPE_NAMES, VersionEntry } from './models';

interface IndexEntry extends SearchHit {
  titleLc: string;
  hay: string;
}

function parseFeature(str: string, version: VersionEntry, index: number): Feature {
  const cut = str.indexOf('|');
  const code = str.slice(0, cut);
  let text = str.slice(cut + 1);
  let star = 0;
  if (text.endsWith('|H')) {
    star = 2;
    text = text.slice(0, -2);
  } else if (text.endsWith('|h')) {
    star = 1;
    text = text.slice(0, -2);
  }
  const type = code[0] as FeatType;
  const st = code[1] ?? '';
  const round = parseInt(code.slice(2), 10) || 0;
  const status = st === 'p' ? 'preview' : st === 'i' ? 'incubator' : st === 'e' ? 'experimental' : 'final';
  let tag = '';
  if (status === 'experimental') tag = 'Experimental';
  else if (status !== 'final') tag = round > 1 ? `${ordinal(round)} ${status}` : status[0].toUpperCase() + status.slice(1);
  return { id: `f-${version.v}-${index}`, type, status, tag, text, star, version };
}

/** All lessons and Java version data, plus lookups and search. */
@Injectable({ providedIn: 'root' })
export class ContentService {
  /** Learning order: basics, then algorithms, design and tools, then concurrency, data, Spring and microservices. */
  readonly stages: Stage[] = CURRICULUM;
  readonly paths: LearningPath[] = PATHS;
  readonly lessons: Lesson[] = this.stages.flatMap((s) => s.lessons);
  readonly versions: VersionEntry[] = VERSIONS;
  readonly eco = ECO;
  readonly released = VERSIONS.filter((v) => !v.planned);
  /** Versions a learner can choose as "My JDK". */
  readonly pickable = this.released.filter((v) => v.n >= 8).map((v) => v.n);
  readonly lts = this.released.filter((v) => v.lts).map((v) => v.n);
  readonly latestLts = Math.max(...this.lts);
  readonly latest = Math.max(...this.pickable);
  readonly questions: Question[];

  private readonly byId = new Map<string, Lesson>();
  private readonly stageOfLesson = new Map<Lesson, Stage>();
  private readonly featureMap = new Map<VersionEntry, Feature[]>();
  private readonly leads = new Map<string, Lesson[]>();
  private index: IndexEntry[] | null = null;

  constructor() {
    const subtopics = { ...SUBTOPICS_A, ...SUBTOPICS_B, ...SUBTOPICS_C, ...SUBTOPICS_D };
    for (const s of this.stages) {
      for (const l of s.lessons) {
        this.byId.set(l.id, l);
        this.stageOfLesson.set(l, s);
        if (subtopics[l.id]) l.subs = subtopics[l.id];
      }
    }
    for (const id of Object.keys(subtopics)) if (!this.byId.has(id)) console.warn(`subtopics: unknown lesson "${id}"`);
    for (const v of VERSIONS) this.featureMap.set(v, v.f.map((f, i) => parseFeature(f, v, i)));
    for (const l of this.lessons) {
      for (const pre of PREREQS[l.id] ?? []) {
        if (!this.byId.has(pre)) console.warn(`connections.ts: unknown lesson "${pre}" (in ${l.id})`);
        this.leads.set(pre, [...(this.leads.get(pre) ?? []), l]);
      }
    }
    for (const p of PATHS) for (const id of p.lessons) if (!this.byId.has(id)) console.warn(`paths.ts: unknown lesson "${id}" (in ${p.id})`);
    this.questions = this.lessons.flatMap((l) => (l.iq ?? []).map(([q, a], i) => ({ id: `${l.id}-${i}`, q, a, lesson: l })));
  }

  lesson(id: string | null | undefined): Lesson | undefined {
    return id ? this.byId.get(id) : undefined;
  }

  /** Estimated reading time in minutes. */
  minutes(l: Lesson): number {
    const subs = (l.subs ?? []).reduce((n, st) => n + words(st.body) + (st.code ? st.code.split('\n').length * 4 : 0), 0);
    return Math.max(3, Math.round((words(l.body) + words(l.pro) + words(l.eli5) + words(l.trap) + l.code.split('\n').length * 4 + subs) / 200));
  }

  /** Total number of subtopics across all lessons. */
  get subtopicCount(): number {
    return this.lessons.reduce((n, l) => n + (l.subs?.length ?? 0), 0);
  }

  /** Lessons worth knowing before this one. */
  prereqs(l: Lesson): Lesson[] {
    return (PREREQS[l.id] ?? []).map((id) => this.byId.get(id)).filter((x): x is Lesson => !!x);
  }

  /** Lessons that build on this one. */
  leadsTo(l: Lesson): Lesson[] {
    return this.leads.get(l.id) ?? [];
  }

  path(id: string | null | undefined): LearningPath | undefined {
    return PATHS.find((p) => p.id === id);
  }

  pathLessons(p: LearningPath): Lesson[] {
    return p.lessons.map((id) => this.byId.get(id)).filter((x): x is Lesson => !!x);
  }

  pathsWith(l: Lesson): LearningPath[] {
    return PATHS.filter((p) => p.lessons.includes(l.id));
  }

  stageOf(l: Lesson): Stage {
    return this.stageOfLesson.get(l) ?? this.stages[0];
  }

  stageNo(s: Stage): number {
    return this.stages.indexOf(s) + 1;
  }

  indexOf(l: Lesson): number {
    return this.lessons.indexOf(l);
  }

  version(n: number): VersionEntry | undefined {
    return this.released.find((v) => v.n === n);
  }

  isLts(n: number): boolean {
    return this.lts.includes(n);
  }

  features(v: VersionEntry): Feature[] {
    return this.featureMap.get(v) ?? [];
  }

  /** Features added after version a, up to and including version b. */
  featuresBetween(a: number, b: number): Feature[] {
    return this.released.filter((v) => v.n > a && v.n <= b).flatMap((v) => this.features(v));
  }

  search(query: string): SearchHit[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const toks = q.split(/\s+/);
    return this.buildIndex()
      .map((it) => {
        if (!toks.every((t) => it.hay.includes(t) || it.titleLc.includes(t))) return null;
        let score = 0;
        if (it.titleLc.includes(q)) score += 10;
        if (it.titleLc.startsWith(q)) score += 6;
        for (const t of toks) if (it.titleLc.includes(t)) score += 3;
        if (it.kind === 'Lesson') score += 3;
        if (it.kind === 'Subtopic') score += 2;
        if (it.feature?.status === 'final') score += 1;
        return [score, it] as const;
      })
      .filter((x): x is readonly [number, IndexEntry] => x !== null)
      .sort((a, b) => b[0] - a[0])
      .slice(0, 24)
      .map(([, it]) => it);
  }

  private buildIndex(): IndexEntry[] {
    if (this.index) return this.index;
    const idx: IndexEntry[] = [];
    for (const l of this.lessons) {
      const s = this.stageOf(l);
      idx.push({
        kind: 'Lesson',
        title: l.t,
        sub: `Stage ${this.stageNo(s)}: ${s.title}`,
        link: ['/learn', l.id],
        titleLc: l.t.toLowerCase(),
        hay: ('lesson ' + l.t + ' ' + plain(l.body) + ' ' + (l.iq ?? []).map((x) => x[0]).join(' ')).toLowerCase(),
      });
      for (const st of l.subs ?? []) {
        idx.push({
          kind: 'Subtopic',
          title: st.t,
          sub: l.t,
          link: ['/learn', l.id],
          fragment: 'sub-' + st.id,
          titleLc: st.t.toLowerCase(),
          hay: ('subtopic ' + st.t + ' ' + l.t + ' ' + plain(st.body)).toLowerCase(),
        });
      }
    }
    for (const v of VERSIONS) {
      for (const f of this.features(v)) {
        idx.push({
          kind: 'Java ' + v.v,
          title: f.text,
          sub: (v.planned ? 'Planned for ' : 'Released ') + fmtDate(v.date) + (f.tag ? ', ' + f.tag.toLowerCase() : ''),
          link: ['/versions'],
          fragment: f.id,
          feature: f,
          titleLc: f.text.toLowerCase(),
          hay: ('java ' + v.v + ' ' + f.text + ' ' + TYPE_NAMES[f.type] + ' ' + f.tag).toLowerCase(),
        });
      }
    }
    for (const e of ECO) {
      idx.push({
        kind: e.track,
        title: e.t,
        sub: String(e.y),
        link: ['/versions'],
        fragment: 'timeline',
        eco: true,
        titleLc: e.t.toLowerCase(),
        hay: (e.track + ' ' + e.t + ' ' + e.p).toLowerCase(),
      });
    }
    for (const p of PRODUCTS) {
      for (const v of p.versions) {
        const feats = v.f.map((f) => f.slice(2).replace(/\|h$/, ''));
        idx.push({
          kind: `${p.short} ${v.v}`,
          title: feats[0] ?? `${p.name} ${v.v}`,
          sub: `${p.name} ${v.v}${v.status === 'planned' ? ' (planned)' : ''}`,
          link: ['/versions', p.id],
          fragment: `v-${v.v}`,
          eco: true,
          titleLc: `${p.name} ${v.v} ${feats[0] ?? ''}`.toLowerCase(),
          hay: `${p.name} ${p.short} ${v.v} ${feats.join(' ')}`.toLowerCase(),
        });
      }
    }
    return (this.index = idx);
  }
}

