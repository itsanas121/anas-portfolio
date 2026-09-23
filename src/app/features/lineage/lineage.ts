import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LineageNode, Skill, SkillCategory } from '../../core/models/portfolio.models';
import { PortfolioService } from '../../core/services/portfolio.service';
import { SectionHeader } from '../../shared/components/section-header';
import { RevealDirective } from '../../shared/directives/reveal.directive';

type Focus = { type: 'skill' | 'node'; id: string } | null;

interface Link {
  skill: string;
  node: string;
  category: SkillCategory;
  d: string;
}

const NODE_GROUPS: { kind: LineageNode['kind']; label: string }[] = [
  { kind: 'run', label: 'Experience' },
  { kind: 'artifact', label: 'Projects' },
  { kind: 'cert', label: 'Certifications' },
];

@Component({
  selector: 'app-lineage',
  imports: [RouterLink, SectionHeader, RevealDirective],
  templateUrl: './lineage.html',
  styleUrl: './lineage.css',
})
export class Lineage {
  /** Optional `?skill=` query parameter, e.g. from a skill chip elsewhere on the site. */
  readonly skill = input<string>();

  protected readonly portfolio = inject(PortfolioService);
  private readonly router = inject(Router);

  protected readonly nodes = this.portfolio.lineageNodes();
  protected readonly usage = this.portfolio.skillUsage();
  protected readonly groups = NODE_GROUPS.map((g) => ({ ...g, nodes: this.nodes.filter((n) => n.kind === g.kind) }));
  protected readonly categories = (Object.keys(this.portfolio.categoryLabels) as SkillCategory[]).map((key) => ({
    key,
    label: this.portfolio.categoryLabels[key],
    skills: this.portfolio.skills.filter((s) => s.category === key),
  }));

  /** Clicked selection; seeded from the query parameter. */
  protected readonly selected = linkedSignal<Focus>(() => {
    const id = this.skill();
    return id && this.portfolio.skill(id) ? { type: 'skill', id } : null;
  });
  protected readonly hovered = signal<Focus>(null);
  protected readonly focus = computed(() => this.hovered() ?? this.selected());

  protected readonly activeSkills = computed(() => {
    const f = this.focus();
    if (!f) return null;
    if (f.type === 'skill') return new Set([f.id]);
    return new Set(this.nodes.find((n) => n.id === f.id)?.skills ?? []);
  });

  protected readonly activeNodes = computed(() => {
    const f = this.focus();
    if (!f) return null;
    if (f.type === 'node') return new Set([f.id]);
    return new Set(this.nodes.filter((n) => n.skills.includes(f.id)).map((n) => n.id));
  });

  /** Plain-language readout of the current focus. */
  protected readonly readout = computed(() => {
    const f = this.focus();
    if (!f) return null;
    if (f.type === 'skill') {
      const consumers = this.nodes.filter((n) => n.skills.includes(f.id));
      return {
        query: `SELECT consumer FROM lineage WHERE skill = '${this.portfolio.skillName(f.id)}'`,
        items: consumers.map((n) => n.label),
        empty: 'Toolbox and coursework only, not yet used in a listed role or project.',
      };
    }
    const node = this.nodes.find((n) => n.id === f.id)!;
    return {
      query: `SELECT skill FROM lineage WHERE consumer = '${node.label}'`,
      items: node.skills.map((s) => this.portfolio.skillName(s)),
      empty: '',
    };
  });

  // ----- measured SVG links -----
  private readonly canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private readonly skillEls = viewChildren<ElementRef<HTMLElement>>('skillEl');
  private readonly nodeEls = viewChildren<ElementRef<HTMLElement>>('nodeEl');
  protected readonly links = signal<Link[]>([]);
  protected readonly viewBox = signal('0 0 100 100');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new ResizeObserver(() => this.measure());
      observer.observe(this.canvas().nativeElement);
      document.fonts?.ready.then(() => this.measure());
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected isLinkActive(link: Link): boolean {
    const f = this.focus();
    if (!f) return false;
    return f.type === 'skill' ? link.skill === f.id : link.node === f.id;
  }

  protected toggle(focus: NonNullable<Focus>): void {
    const current = this.selected();
    const same = current?.type === focus.type && current.id === focus.id;
    this.selected.set(same ? null : focus);
    this.router.navigate([], {
      queryParams: { skill: !same && focus.type === 'skill' ? focus.id : null },
      replaceUrl: true,
    });
  }

  protected skillState(s: Skill): string {
    const active = this.activeSkills();
    if (!active) return '';
    return active.has(s.id) ? 'on' : 'off';
  }

  protected nodeState(n: LineageNode): string {
    const active = this.activeNodes();
    if (!active) return '';
    return active.has(n.id) ? 'on' : 'off';
  }

  private measure(): void {
    const box = this.canvas().nativeElement.getBoundingClientRect();
    const skillRects = new Map(this.skillEls().map((e) => [e.nativeElement.dataset['id'] ?? '', e.nativeElement.getBoundingClientRect()]));
    const nodeRects = new Map(this.nodeEls().map((e) => [e.nativeElement.dataset['id'] ?? '', e.nativeElement.getBoundingClientRect()]));

    const links: Link[] = [];
    for (const node of this.nodes) {
      const b = nodeRects.get(node.id);
      if (!b) continue;
      for (const skillId of node.skills) {
        const a = skillRects.get(skillId);
        if (!a) continue;
        const x1 = a.right - box.left + 6;
        const y1 = a.top + a.height / 2 - box.top;
        const x2 = b.left - box.left - 6;
        const y2 = b.top + b.height / 2 - box.top;
        const mid = (x1 + x2) / 2;
        links.push({
          skill: skillId,
          node: node.id,
          category: this.portfolio.skill(skillId)?.category ?? 'platform',
          d: `M${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`,
        });
      }
    }
    this.viewBox.set(`0 0 ${box.width} ${box.height}`);
    this.links.set(links);
  }
}
