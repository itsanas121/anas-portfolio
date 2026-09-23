import { Injectable } from '@angular/core';
import {
  ARTIFACTS,
  CERTIFICATIONS,
  EDUCATION,
  HONOR,
  IMPACT,
  MANAR_RESOURCES,
  PROFILE,
  RUNS,
  SKILL_CATEGORY_LABELS,
} from '../data/portfolio.data';
import { SKILLS } from '../data/portfolio.data';
import { Artifact, LineageNode, Run, Skill, YearMonth } from '../models/portfolio.models';

/** The month the site treats as "now" is derived from the visitor's clock. */
function currentYearMonth(): YearMonth {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthsBetween(start: YearMonth, end: YearMonth): number {
  const [sy, sm] = start.split('-').map(Number);
  const [ey, em] = end.split('-').map(Number);
  return (ey - sy) * 12 + (em - sm);
}

export function formatYearMonth(ym: YearMonth): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en', { month: 'short', year: 'numeric' });
}

export function formatDuration(months: number): string {
  const total = Math.max(1, months);
  const y = Math.floor(total / 12);
  const m = total % 12;
  return [y ? `${y} yr` : '', m ? `${m} mo` : ''].filter(Boolean).join(' ');
}

export type RunStatus = 'success' | 'running' | 'queued';

/** Read-only access to portfolio content plus a few derived views. */
@Injectable({ providedIn: 'root' })
export class PortfolioService {
  readonly profile = PROFILE;
  readonly runs = RUNS;
  readonly artifacts = ARTIFACTS;
  readonly skills = SKILLS;
  readonly certifications = CERTIFICATIONS;
  readonly honor = HONOR;
  readonly education = EDUCATION;
  readonly impact = IMPACT;
  readonly manarResources = MANAR_RESOURCES;
  readonly categoryLabels = SKILL_CATEGORY_LABELS;
  readonly now = currentYearMonth();

  private readonly skillIndex = new Map(SKILLS.map((s) => [s.id, s]));

  skill(id: string): Skill | undefined {
    return this.skillIndex.get(id);
  }

  skillName(id: string): string {
    return this.skillIndex.get(id)?.name ?? id;
  }

  artifact(slug: string): Artifact | undefined {
    return ARTIFACTS.find((a) => a.slug === slug);
  }

  run(id: string): Run | undefined {
    return RUNS.find((r) => r.id === id);
  }

  runEnd(run: Run): YearMonth {
    return run.end ?? this.now;
  }

  runStatus(run: Run): RunStatus {
    if (run.end) return 'success';
    return run.start > this.now ? 'queued' : 'running';
  }

  /** Inclusive month count, matching how LinkedIn reports durations. */
  runMonths(run: Run): number {
    return monthsBetween(run.start, this.runEnd(run)) + 1;
  }

  runDuration(run: Run): string {
    return formatDuration(this.runMonths(run));
  }

  runPeriod(run: Run): string {
    const end = run.end ? formatYearMonth(run.end) : 'Present';
    return `${formatYearMonth(run.start)} – ${end}`;
  }

  /** Every place a skill is applied, used by the lineage graph. */
  lineageNodes(): LineageNode[] {
    const runs: LineageNode[] = RUNS.filter((r) => r.stack.length).map((r) => ({
      id: `run:${r.id}`,
      kind: 'run',
      label: r.org,
      sub: r.role,
      route: ['/runs'],
      skills: r.stack,
    }));
    const artifacts: LineageNode[] = ARTIFACTS.filter((a) => a.stack.length).map((a) => ({
      id: `artifact:${a.slug}`,
      kind: 'artifact',
      label: a.title,
      sub: a.context,
      route: ['/artifacts', a.slug],
      skills: a.stack,
    }));
    const certs: LineageNode[] = CERTIFICATIONS.filter((c) => c.stack.length).map((c) => ({
      id: `cert:${c.id}`,
      kind: 'cert',
      label: c.name,
      sub: `${c.issuer} · ${c.year}`,
      route: ['/monitor'],
      skills: c.stack,
    }));
    return [...runs, ...artifacts, ...certs];
  }

  /** How many nodes use each skill. */
  skillUsage(): Map<string, number> {
    const usage = new Map<string, number>();
    for (const node of this.lineageNodes()) {
      for (const id of node.skills) usage.set(id, (usage.get(id) ?? 0) + 1);
    }
    return usage;
  }

  /** How many months of industry experience, counting the current run up to now. */
  industryMonths(): number {
    return RUNS.filter((r) => r.lane === 'industry').reduce((sum, r) => sum + this.runMonths(r), 0);
  }
}
