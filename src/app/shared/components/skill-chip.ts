import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortfolioService } from '../../core/services/portfolio.service';

/** A skill tag, colored by category, that deep-links into the lineage graph. */
@Component({
  selector: 'app-skill-chip',
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="['/lineage']"
      [queryParams]="{ skill: skillId() }"
      [style.--c]="'var(--cat-' + (skill()?.category ?? 'platform') + ')'"
      [attr.aria-label]="'See where ' + name() + ' is used'"
    >
      <i></i>{{ name() }}
    </a>
  `,
  styles: `
    a {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 26px;
      padding: 0 10px;
      border: 1px solid var(--line-strong);
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-soft);
      white-space: nowrap;
      transition: border-color 0.2s, color 0.2s, background 0.2s;
    }
    a:hover {
      border-color: var(--c);
      color: var(--text);
      background: color-mix(in srgb, var(--c) 8%, transparent);
    }
    i {
      width: 6px;
      height: 6px;
      border-radius: 2px;
      background: var(--c);
    }
  `,
})
export class SkillChip {
  readonly skillId = input.required<string>();

  private readonly portfolio = inject(PortfolioService);
  protected readonly skill = computed(() => this.portfolio.skill(this.skillId()));
  protected readonly name = computed(() => this.skill()?.name ?? this.skillId());
}
