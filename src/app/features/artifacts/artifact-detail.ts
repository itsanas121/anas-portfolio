import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortfolioService } from '../../core/services/portfolio.service';
import { ArtifactGlyph } from '../../shared/components/artifact-glyph';
import { CountUp } from '../../shared/components/count-up';
import { SkillChip } from '../../shared/components/skill-chip';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-artifact-detail',
  imports: [RouterLink, ArtifactGlyph, CountUp, SkillChip, RevealDirective],
  templateUrl: './artifact-detail.html',
  styleUrl: './artifact-detail.css',
})
export class ArtifactDetail {
  /** Bound from the `:slug` route parameter. */
  readonly slug = input.required<string>();

  private readonly portfolio = inject(PortfolioService);

  protected readonly artifact = computed(() => this.portfolio.artifact(this.slug()));

  protected readonly neighbours = computed(() => {
    const list = this.portfolio.artifacts;
    const i = list.findIndex((a) => a.slug === this.slug());
    if (i < 0) return null;
    return {
      prev: list[(i - 1 + list.length) % list.length],
      next: list[(i + 1) % list.length],
      position: `${String(i + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`,
    };
  });
}

