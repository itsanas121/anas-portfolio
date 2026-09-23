import { Component, computed, inject, signal } from '@angular/core';
import { Run, RunLane, YearMonth } from '../../core/models/portfolio.models';
import { PortfolioService, formatYearMonth, monthsBetween } from '../../core/services/portfolio.service';
import { SectionHeader } from '../../shared/components/section-header';
import { SkillChip } from '../../shared/components/skill-chip';
import { RevealDirective } from '../../shared/directives/reveal.directive';

interface Bar {
  run: Run;
  left: number;
  width: number;
  /** Planned-but-not-yet-run portion, e.g. the rest of the degree. */
  queuedWidth: number;
}

const LANES: { key: RunLane; label: string }[] = [
  { key: 'industry', label: 'Industry' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'education', label: 'Education' },
];

@Component({
  selector: 'app-runs',
  imports: [SectionHeader, SkillChip, RevealDirective],
  templateUrl: './runs.html',
  styleUrl: './runs.css',
})
export class Runs {
  protected readonly portfolio = inject(PortfolioService);
  protected readonly lanes = LANES;

  private readonly rangeStart: YearMonth = '2023-08';
  private readonly rangeEnd: YearMonth = this.portfolio.education.expectedEnd;
  private readonly totalMonths = monthsBetween(this.rangeStart, this.rangeEnd) + 1;

  protected readonly selectedId = signal(
    this.portfolio.runs.find((r) => r.lane === 'industry' && !r.end)?.id ?? this.portfolio.runs[0].id,
  );
  protected readonly selected = computed(() => this.portfolio.run(this.selectedId())!);

  protected readonly barsByLane = computed(() => {
    const map = new Map<RunLane, Bar[]>();
    for (const lane of LANES) {
      map.set(lane.key, this.portfolio.runs.filter((r) => r.lane === lane.key).map((r) => this.toBar(r)));
    }
    return map;
  });

  protected readonly years = computed(() => {
    const first = Number(this.rangeStart.slice(0, 4)) + 1;
    const last = Number(this.rangeEnd.slice(0, 4));
    const ticks: { label: number; left: number }[] = [];
    for (let y = first; y <= last; y++) {
      ticks.push({ label: y, left: this.offset(`${y}-01`) });
    }
    return ticks;
  });

  protected readonly nowLeft = this.offset(this.portfolio.now) + 100 / this.totalMonths / 2;
  protected readonly nowLabel = formatYearMonth(this.portfolio.now);

  protected readonly industryCount = this.portfolio.runs.filter((r) => r.lane === 'industry').length;

  protected select(id: string): void {
    this.selectedId.set(id);
  }

  /** Arrow keys move between tasks, like a list. */
  protected onBarKey(event: KeyboardEvent, id: string): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const ids = LANES.flatMap((l) => (this.barsByLane().get(l.key) ?? []).map((b) => b.run.id));
    const next = ids[(ids.indexOf(id) + (event.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length];
    this.select(next);
    document.getElementById(`bar-${next}`)?.focus();
  }

  private offset(ym: YearMonth): number {
    return (monthsBetween(this.rangeStart, ym) / this.totalMonths) * 100;
  }

  private toBar(run: Run): Bar {
    const start = run.start < this.rangeStart ? this.rangeStart : run.start;
    const end = this.portfolio.runEnd(run);
    const months = monthsBetween(start, end) + 1;
    const queued = run.expectedEnd && !run.end ? Math.max(0, monthsBetween(end, run.expectedEnd)) : 0;
    return {
      run,
      left: this.offset(start),
      width: (months / this.totalMonths) * 100,
      queuedWidth: (queued / this.totalMonths) * 100,
    };
  }
}
