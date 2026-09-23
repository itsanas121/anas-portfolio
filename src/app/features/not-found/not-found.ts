import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { STAGES } from '../../core/data/stages';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <p class="code mono">404</p>
    <p class="err mono">ERROR: relation "{{ path }}" does not exist</p>
    <h1 class="display">This path isn't in the <em>pipeline.</em></h1>
    <p class="hint mono">HINT: try one of these stages</p>
    <ul>
      @for (s of stages; track s.key) {
        <li>
          <a [routerLink]="s.route" class="mono"><span>{{ s.index }}</span> {{ s.label }} <i>· {{ s.plain }}</i></a>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
      min-height: 60vh;
    }
    .code {
      font-size: 0.75rem;
      color: var(--amber);
    }
    .err {
      margin-top: 10px;
      color: var(--rose);
      word-break: break-all;
    }
    h1 {
      margin-top: 24px;
      font-size: clamp(2.6rem, 7vw, 5rem);
      max-width: 14ch;
    }
    em {
      color: var(--amber);
    }
    .hint {
      margin-top: 36px;
      color: var(--muted);
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 14px 0 0;
      padding: 0;
      list-style: none;
    }
    a {
      display: inline-flex;
      gap: 8px;
      padding: 8px 14px;
      border: 1px solid var(--line-strong);
      border-radius: 999px;
      transition: border-color 0.2s;
    }
    a:hover {
      border-color: var(--amber);
    }
    a span {
      color: var(--amber);
    }
    i {
      font-style: normal;
      color: var(--muted);
    }
  `,
})
export class NotFound {
  protected readonly stages = STAGES;
  protected readonly path = inject(Router).url.split(/[?#]/)[0].replace(/^\//, '');
}
