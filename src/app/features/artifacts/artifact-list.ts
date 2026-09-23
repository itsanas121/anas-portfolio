import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArtifactKind } from '../../core/models/portfolio.models';
import { PortfolioService } from '../../core/services/portfolio.service';
import { ArtifactGlyph } from '../../shared/components/artifact-glyph';
import { SectionHeader } from '../../shared/components/section-header';
import { RevealDirective } from '../../shared/directives/reveal.directive';

type Filter = 'all' | ArtifactKind;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'data', label: 'Data' },
  { key: 'backend', label: 'Backend' },
  { key: 'platform', label: 'Platform' },
  { key: 'leadership', label: 'Leadership' },
];

@Component({
  selector: 'app-artifact-list',
  imports: [RouterLink, ArtifactGlyph, SectionHeader, RevealDirective],
  templateUrl: './artifact-list.html',
  styleUrl: './artifact-list.css',
})
export class ArtifactList {
  private readonly portfolio = inject(PortfolioService);
  protected readonly filters = FILTERS;
  protected readonly filter = signal<Filter>('all');
  protected readonly search = signal('');

  protected readonly results = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.portfolio.artifacts.filter((a) => {
      if (this.filter() !== 'all' && a.kind !== this.filter()) return false;
      if (!term) return true;
      const haystack = [a.title, a.tagline, a.context, ...a.stack.map((s) => this.portfolio.skillName(s))]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  });

  protected count(kind: Filter): number {
    return kind === 'all'
      ? this.portfolio.artifacts.length
      : this.portfolio.artifacts.filter((a) => a.kind === kind).length;
  }

  protected skillName(id: string): string {
    return this.portfolio.skillName(id);
  }
}
