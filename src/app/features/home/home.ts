import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { STAGES, Stage } from '../../core/data/stages';
import { ConsoleService } from '../../core/services/console.service';
import { PortfolioService } from '../../core/services/portfolio.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { CountUp } from '../../shared/components/count-up';

interface LogLine {
  time: string;
  level: 'INFO' | 'WARN' | 'OK';
  text: string;
}

interface Edge {
  from: string;
  to: string;
  d: string;
}

/** Edges of the site DAG: runs fan out to artifacts and lineage, which join at monitor. */
const EDGES: [string, string][] = [
  ['source', 'runs'],
  ['runs', 'artifacts'],
  ['runs', 'lineage'],
  ['artifacts', 'monitor'],
  ['lineage', 'monitor'],
  ['monitor', 'query'],
];

@Component({
  selector: 'app-home',
  imports: [RouterLink, RevealDirective, CountUp],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly portfolio = inject(PortfolioService);
  protected readonly console = inject(ConsoleService);
  protected readonly profile = this.portfolio.profile;
  protected readonly education = this.portfolio.education;
  protected readonly stages = STAGES;

  private readonly current = this.portfolio.runs.find((r) => r.lane === 'industry' && !r.end);
  protected readonly currentRole = this.current ? `${this.current.role} @ ${this.current.org}` : '';

  /** One-line stat shown on each DAG node. */
  protected readonly stageStats: Record<string, string> = {
    source: `B.Sc. CS · GPA ${this.education.gpa}`,
    runs: `${this.portfolio.runs.filter((r) => r.lane === 'industry').length} internships · ${this.portfolio.runs.filter((r) => r.lane === 'leadership').length} leadership`,
    artifacts: `${this.portfolio.artifacts.length} projects`,
    lineage: `${this.portfolio.skills.length} skills traced`,
    monitor: '10,000+ students reached',
    query: '5 tables · live SQL',
  };

  // ----- streaming log -----
  private readonly log = this.buildLog();
  protected readonly visibleLines = signal(0);
  protected readonly lines = computed(() => this.log.slice(0, this.visibleLines()));
  protected readonly logDone = computed(() => this.visibleLines() >= this.log.length);

  // ----- DAG edges, measured from the rendered nodes -----
  private readonly graph = viewChild.required<ElementRef<HTMLElement>>('graph');
  private readonly nodes = viewChildren<ElementRef<HTMLElement>>('node');
  protected readonly edges = signal<Edge[]>([]);
  protected readonly viewBox = signal('0 0 100 100');
  protected readonly hovered = signal<string | null>(null);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        this.visibleLines.set(this.log.length);
      } else {
        const timer = setInterval(() => {
          this.visibleLines.update((n) => n + 1);
          if (this.logDone()) clearInterval(timer);
        }, 230);
        destroyRef.onDestroy(() => clearInterval(timer));
      }

      const observer = new ResizeObserver(() => this.measure());
      observer.observe(this.graph().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected isLit(edge: Edge): boolean {
    const h = this.hovered();
    return !!h && (edge.from === h || edge.to === h);
  }

  protected stat(stage: Stage): string {
    return this.stageStats[stage.key];
  }

  private measure(): void {
    const container = this.graph().nativeElement;
    const box = container.getBoundingClientRect();
    const rects = new Map(
      this.nodes().map((n) => [n.nativeElement.dataset['key'] ?? '', n.nativeElement.getBoundingClientRect()]),
    );

    const edges: Edge[] = [];
    for (const [from, to] of EDGES) {
      const a = rects.get(from);
      const b = rects.get(to);
      if (!a || !b) continue;
      const horizontal = b.left >= a.right - 2;
      let d: string;
      if (horizontal) {
        const x1 = a.right - box.left;
        const y1 = a.top + a.height / 2 - box.top;
        const x2 = b.left - box.left;
        const y2 = b.top + b.height / 2 - box.top;
        const mid = (x1 + x2) / 2;
        d = `M${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
      } else {
        const x1 = a.left + a.width / 2 - box.left;
        const y1 = a.bottom - box.top;
        const x2 = b.left + b.width / 2 - box.left;
        const y2 = b.top - box.top;
        const mid = (y1 + y2) / 2;
        d = `M${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
      }
      edges.push({ from, to, d });
    }
    this.viewBox.set(`0 0 ${box.width} ${box.height}`);
    this.edges.set(edges);
  }

  private buildLog(): LogLine[] {
    const p = this.portfolio;
    const industry = p.runs.filter((r) => r.lane === 'industry').reverse();
    const lines: Omit<LogLine, 'time'>[] = [
      { level: 'INFO', text: `dag=anas_almehmadi  schedule=@continuous  start=${p.education.start}` },
      { level: 'INFO', text: `ingest  source=umm_al_qura_university  degree=bsc_cs  gpa=${p.education.gpa}` },
      ...industry.map((r): Omit<LogLine, 'time'> => ({
        level: r.end ? 'INFO' : 'WARN',
        text: `task ${r.id.padEnd(11)} ${r.end ? 'success' : 'running'}  (${p.runDuration(r)})`,
      })),
      { level: 'INFO', text: `load  artifacts=${p.artifacts.length}  skills=${p.skills.length}  certs=${p.certifications.length}` },
      { level: 'INFO', text: 'lead  manar=10k+ students  majors_campaign=7k+ students' },
      { level: 'OK', text: 'pipeline healthy · serving on :80' },
    ];
    return lines.map((l, i) => ({ ...l, time: `00:0${Math.floor(i / 4)}.${String((i * 173) % 1000).padStart(3, '0')}` }));
  }
}
