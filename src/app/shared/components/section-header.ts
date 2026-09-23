import { Component, input } from '@angular/core';

/** Page heading: a stage index, a technical label, and a readable title. */
@Component({
  selector: 'app-section-header',
  template: `
    <p class="meta mono">
      <span class="index">{{ index() }}</span>
      <span class="sep">/</span>
      <span>{{ label() }}</span>
      <span class="plain">{{ plain() }}</span>
    </p>
    <h1 class="display">
      <ng-content />
    </h1>
    @if (lede()) {
      <p class="lede">{{ lede() }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: clamp(32px, 5vw, 56px);
    }
    .meta {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--muted);
      margin-bottom: 18px;
    }
    .index {
      color: var(--amber);
    }
    .sep {
      color: var(--dim);
    }
    .plain {
      margin-left: 4px;
      padding: 2px 8px;
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      font-size: 0.6875rem;
      color: var(--text-soft);
    }
    h1 {
      font-size: clamp(2.5rem, 6vw, 4.5rem);
      max-width: 16ch;
    }
    h1 ::ng-deep em {
      color: var(--amber);
    }
    .lede {
      margin-top: 18px;
      max-width: 60ch;
      color: var(--text-soft);
      font-size: 1.0625rem;
    }
  `,
})
export class SectionHeader {
  readonly index = input.required<string>();
  readonly label = input.required<string>();
  readonly plain = input.required<string>();
  readonly lede = input<string>();
}
