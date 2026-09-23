import { Component, inject } from '@angular/core';
import { PortfolioService } from '../../core/services/portfolio.service';
import { CountUp } from '../../shared/components/count-up';
import { SectionHeader } from '../../shared/components/section-header';
import { SkillChip } from '../../shared/components/skill-chip';
import { RevealDirective } from '../../shared/directives/reveal.directive';

interface ReachBar {
  label: string;
  sub: string;
  value: number;
}

@Component({
  selector: 'app-monitor',
  imports: [CountUp, SectionHeader, SkillChip, RevealDirective],
  templateUrl: './monitor.html',
  styleUrl: './monitor.css',
})
export class Monitor {
  protected readonly portfolio = inject(PortfolioService);
  protected readonly honor = this.portfolio.honor;

  /** 38 nominees, 7 selected; the first selected seat is Anas. */
  protected readonly seats = Array.from({ length: this.honor.nominees }, (_, i) => ({
    selected: i < this.honor.selected,
    me: i === 0,
  }));
  protected readonly selectionRate = Math.round((this.honor.selected / this.honor.nominees) * 100);

  protected readonly resources = this.portfolio.manarResources;
  protected readonly resourceTotal = this.resources.reduce((sum, r) => sum + r.value, 0);
  protected readonly resourceMax = Math.max(...this.resources.map((r) => r.value));

  protected readonly reach: ReachBar[] = [
    { label: 'Manar Initiative', sub: 'students reached', value: 10000 },
    { label: 'Majors Awareness Campaign', sub: 'students reached', value: 7000 },
    { label: 'Manar Initiative', sub: 'contributors led', value: 400 },
    { label: 'UQU Computing Club', sub: 'member team led', value: 350 },
    { label: 'Majors Awareness Campaign', sub: 'volunteers', value: 70 },
  ];

  /** Square-root scale so the team sizes remain visible next to 10k. */
  protected barWidth(value: number): number {
    return (Math.sqrt(value) / Math.sqrt(this.reach[0].value)) * 100;
  }
}
