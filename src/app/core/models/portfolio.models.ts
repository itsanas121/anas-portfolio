/** Year-month string, e.g. "2026-02". Sorts correctly as plain text. */
export type YearMonth = `${number}-${string}`;

export type SkillCategory = 'language' | 'data-eng' | 'analytics' | 'backend' | 'ai' | 'platform';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
}

export interface Link {
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  fullName: string;
  arabicName: string;
  headline: string;
  location: string;
  summary: string;
  email: string;
  links: {
    github: string;
    linkedin: string;
    dockerHub: string;
  };
  languages: string[];
}

export type RunLane = 'industry' | 'leadership' | 'education';

/** An experience entry, rendered as one task in the career "DAG run". */
export interface Run {
  id: string;
  lane: RunLane;
  role: string;
  org: string;
  orgNote?: string;
  start: YearMonth;
  /** Omitted while the run is still going. */
  end?: YearMonth;
  /** Planned end for runs that have not finished yet (e.g. graduation). */
  expectedEnd?: YearMonth;
  location: string;
  summary: string;
  logs: string[];
  stack: string[];
  metrics?: Metric[];
  links?: Link[];
}

export type ArtifactKind = 'data' | 'backend' | 'platform' | 'leadership';

export type ArtifactGlyph = 'pipeline' | 'dashboard' | 'bars' | 'map' | 'gantt' | 'container' | 'compass';

export interface Artifact {
  slug: string;
  title: string;
  tagline: string;
  kind: ArtifactKind;
  glyph: ArtifactGlyph;
  period: string;
  year: number;
  context: string;
  role: string;
  why: string;
  highlights: string[];
  stack: string[];
  links: Link[];
  metrics?: Metric[];
}

export interface Metric {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  decimals?: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: number;
  stack: string[];
}

export interface Honor {
  title: string;
  issuer: string;
  year: number;
  detail: string;
  selected: number;
  nominees: number;
}

export interface Education {
  degree: string;
  school: string;
  start: YearMonth;
  expectedEnd: YearMonth;
  gpa: number;
  gpaScale: number;
  coursework: string[];
  activities: string[];
}

/** Any node that can consume a skill in the lineage graph. */
export interface LineageNode {
  id: string;
  kind: 'run' | 'artifact' | 'cert';
  label: string;
  sub: string;
  route: string[];
  skills: string[];
}
