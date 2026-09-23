import {
  Component,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Cell, QueryEngineService, QueryOutcome } from '../../core/services/query-engine.service';
import { PortfolioService } from '../../core/services/portfolio.service';
import { STAGES } from '../../core/data/stages';

type Entry =
  | { id: number; input: string; kind: 'query'; outcome: QueryOutcome }
  | { id: number; input: string; kind: 'text'; lines: string[]; tone?: 'ok' | 'warn' };

const EXAMPLES = [
  "SELECT role, org, start FROM experience WHERE lane = 'industry'",
  "SELECT title, year FROM projects WHERE stack = 'PostgreSQL'",
  'SELECT name, used_in FROM skills ORDER BY used_in DESC LIMIT 6',
  'SELECT * FROM certifications ORDER BY year DESC',
];

/** An interactive terminal that runs SQL-ish queries over the portfolio. */
@Component({
  selector: 'app-query-console',
  template: `
    <div class="chrome mono">
      <span class="lights"><i></i><i></i><i></i></span>
      <span class="title">psql · anas_portfolio</span>
      <span class="hint">↑↓ history · Tab complete</span>
    </div>

    <div class="screen mono" #screen (click)="focusInput()">
      <p class="banner">
        Connected to <b>anas_portfolio</b>. Type <b>help</b>, or pick a query below.
      </p>

      @for (entry of entries(); track entry.id) {
        <div class="entry" animate.enter="fade-up">
          <p class="prompt"><span class="ps1">anas=#</span> {{ entry.input }}</p>
          @if (entry.kind === 'text') {
            @for (line of entry.lines; track $index) {
              <p class="out" [class.ok]="entry.tone === 'ok'" [class.warn]="entry.tone === 'warn'">{{ line }}</p>
            }
          } @else if (entry.outcome.kind === 'error') {
            <p class="out err">ERROR: {{ entry.outcome.message }}</p>
            @if (entry.outcome.hint) {
              <p class="out dim">HINT: {{ entry.outcome.hint }}</p>
            }
          } @else {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    @for (col of entry.outcome.columns; track col) {
                      <th>{{ col }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of entry.outcome.rows; track $index) {
                    <tr>
                      @for (col of entry.outcome.columns; track col) {
                        <td>{{ cell(row[col]) }}</td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="out dim">
              ({{ entry.outcome.rows.length }} {{ entry.outcome.rows.length === 1 ? 'row' : 'rows' }})
              · {{ entry.outcome.elapsedMs.toFixed(2) }} ms
            </p>
          }
        </div>
      }

      <form class="input-line" (submit)="submit($event)">
        <label class="ps1" for="console-input-{{ uid }}">anas=#</label>
        <input
          #field
          id="console-input-{{ uid }}"
          autocomplete="off"
          spellcheck="false"
          (keydown)="onKey($event)"
          placeholder="SELECT * FROM projects"
        />
      </form>
    </div>

    <div class="examples">
      @for (q of examples; track q) {
        <button type="button" class="mono" (click)="run(q)">{{ q }}</button>
      }
    </div>
  `,
  styleUrl: './query-console.css',
  host: { '[class.compact]': 'compact()' },
})
export class QueryConsole {
  readonly compact = input(false);
  readonly navigated = output<void>();

  private readonly engine = inject(QueryEngineService);
  private readonly portfolio = inject(PortfolioService);
  private readonly router = inject(Router);

  private readonly screen = viewChild.required<ElementRef<HTMLElement>>('screen');
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  protected readonly uid = Math.random().toString(36).slice(2, 7);
  protected readonly examples = EXAMPLES;
  protected readonly entries = signal<Entry[]>([]);

  private history: string[] = [];
  private cursor = -1;
  private nextId = 0;

  constructor() {
    // Keep the newest output in view.
    afterRenderEffect(() => {
      this.entries();
      const el = this.screen().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
    // The drawer opens on a keypress, so put the cursor straight into the prompt.
    afterNextRender(() => {
      if (this.compact()) this.inputEl.focus();
    });
  }

  focusInput(): void {
    if (!window.getSelection()?.toString()) this.inputEl.focus({ preventScroll: true });
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.run(this.inputEl.value);
  }

  /** The input element is the source of truth for the draft query. */
  private get inputEl(): HTMLInputElement {
    return this.field().nativeElement;
  }

  run(raw: string): void {
    const input = raw.trim();
    this.inputEl.value = '';
    if (!input) return;
    this.history.unshift(input);
    this.cursor = -1;

    const [command, ...args] = input.replace(/;$/, '').split(/\s+/);
    const cmd = command.toLowerCase();

    switch (cmd) {
      case 'clear':
        this.entries.set([]);
        return;
      case 'help':
      case '\\?':
        return this.print(input, [
          'SELECT <cols | * | COUNT(*)> FROM <table> [WHERE col = value [AND ...]]',
          '       [ORDER BY col [ASC|DESC]] [LIMIT n]',
          "  operators: = != > < >= <= LIKE ('%' wildcard). Array columns match any item.",
          '',
          '\\dt | tables        list tables',
          '\\d <table>          describe a table',
          'open <page>         go to runs, artifacts, lineage, monitor, query, source',
          'whoami · contact · clear',
        ]);
      case 'tables':
      case '\\dt':
        return this.print(
          input,
          this.engine.tableNames().map((t) => `public | ${t.padEnd(15)} | ${this.engine.tables[t]().length} rows`),
        );
      case 'describe':
      case '\\d': {
        const table = (args[0] ?? '').toLowerCase();
        const cols = this.engine.columnsOf(table);
        if (!cols.length) return this.print(input, [`Did not find any relation named "${table}".`], 'warn');
        return this.print(input, [`Table "public.${table}"`, ...cols.map((c) => `  ${c}`)]);
      }
      case 'whoami': {
        const p = this.portfolio.profile;
        return this.print(input, [p.fullName, p.headline, p.location]);
      }
      case 'contact': {
        const p = this.portfolio.profile;
        return this.print(input, [`email   ${p.email}`, `github  ${p.links.github}`], 'ok');
      }
      case 'open':
      case 'goto':
      case 'cd': {
        const target = (args[0] ?? '').toLowerCase().replace(/^\//, '');
        const stage = STAGES.find((s) => s.key === target || s.plain.toLowerCase().startsWith(target));
        if (!stage || !target) {
          return this.print(input, [`unknown page. Try: ${STAGES.map((s) => s.key).join(', ')}`], 'warn');
        }
        this.print(input, [`→ ${stage.route}`], 'ok');
        this.router.navigateByUrl(stage.route);
        this.navigated.emit();
        return;
      }
      case 'sudo':
        return this.print(input, ['anas is not in the sudoers file. This incident will be reported… to Anas, who would love to hear from you.'], 'warn');
      default:
        this.entries.update((list) => [
          ...list,
          { id: this.nextId++, input, kind: 'query', outcome: this.engine.execute(input) },
        ]);
    }
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const step = event.key === 'ArrowUp' ? 1 : -1;
      this.cursor = Math.max(-1, Math.min(this.history.length - 1, this.cursor + step));
      this.inputEl.value = this.cursor === -1 ? '' : this.history[this.cursor];
    } else if (event.key === 'Tab') {
      const completed = this.complete(this.inputEl.value);
      if (completed !== this.inputEl.value) {
        event.preventDefault();
        this.inputEl.value = completed;
      }
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      this.entries.set([]);
    }
  }

  protected cell(value: Cell): string {
    return Array.isArray(value) ? value.join(', ') || '—' : String(value);
  }

  /** Completes the last word against keywords, tables and column names. */
  private complete(text: string): string {
    const m = text.match(/(\w*)$/);
    const partial = m?.[1] ?? '';
    if (!partial) return text;
    const table = text.match(/from\s+(\w+)/i)?.[1]?.toLowerCase() ?? '';
    const words = [
      'SELECT', 'FROM', 'WHERE', 'AND', 'ORDER', 'BY', 'LIMIT', 'LIKE', 'DESC', 'ASC',
      ...this.engine.tableNames(),
      ...this.engine.columnsOf(table),
    ];
    const hit = words.find((w) => w.toLowerCase().startsWith(partial.toLowerCase()) && w.length > partial.length);
    return hit ? text.slice(0, text.length - partial.length) + hit + ' ' : text;
  }

  private print(input: string, lines: string[], tone?: 'ok' | 'warn'): void {
    this.entries.update((list) => [...list, { id: this.nextId++, input, kind: 'text', lines, tone }]);
  }
}
