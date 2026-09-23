import { Injectable, inject } from '@angular/core';
import { PortfolioService } from './portfolio.service';

export type Cell = string | number | string[];
export type Row = Record<string, Cell>;

export interface QueryResult {
  kind: 'table';
  columns: string[];
  rows: Row[];
  elapsedMs: number;
}

export interface QueryError {
  kind: 'error';
  message: string;
  hint?: string;
}

export type QueryOutcome = QueryResult | QueryError;

interface Condition {
  column: string;
  op: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'like';
  value: string;
}

const SELECT_RE =
  /^select\s+(.+?)\s+from\s+([a-z_]+)(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+([a-z_]+)(?:\s+(asc|desc))?)?(?:\s+limit\s+(\d+))?\s*;?\s*$/i;
const CONDITION_RE = /^([a-z_]+)\s*(!=|>=|<=|=|>|<|\blike\b)\s*(.+)$/i;

/**
 * A deliberately small SQL dialect over the portfolio data.
 * Supports SELECT cols | * | COUNT(*) FROM t [WHERE a op b [AND ...]] [ORDER BY c [ASC|DESC]] [LIMIT n].
 * Array columns (like `stack`) match `=` when any element matches.
 */
@Injectable({ providedIn: 'root' })
export class QueryEngineService {
  private readonly portfolio = inject(PortfolioService);

  readonly tables: Record<string, () => Row[]> = {
    experience: () =>
      this.portfolio.runs.map((r) => ({
        id: r.id,
        role: r.role,
        org: r.org,
        lane: r.lane,
        start: r.start,
        end: r.end ?? 'present',
        location: r.location,
        stack: r.stack.map((s) => this.portfolio.skillName(s)),
      })),
    projects: () =>
      this.portfolio.artifacts.map((a) => ({
        slug: a.slug,
        title: a.title,
        kind: a.kind,
        year: a.year,
        context: a.context,
        stack: a.stack.map((s) => this.portfolio.skillName(s)),
      })),
    skills: () => {
      const usage = this.portfolio.skillUsage();
      return this.portfolio.skills.map((s) => ({
        name: s.name,
        category: s.category,
        used_in: usage.get(s.id) ?? 0,
      }));
    },
    certifications: () =>
      this.portfolio.certifications.map((c) => ({ name: c.name, issuer: c.issuer, year: c.year })),
    impact: () =>
      this.portfolio.impact.map((m) => ({
        metric: m.label,
        value: m.decimals ? m.value.toFixed(m.decimals) : `${m.value}${m.suffix ?? ''}`,
      })),
  };

  tableNames(): string[] {
    return Object.keys(this.tables);
  }

  columnsOf(table: string): string[] {
    const rows = this.tables[table]?.() ?? [];
    return rows.length ? Object.keys(rows[0]) : [];
  }

  execute(sql: string): QueryOutcome {
    const started = performance.now();
    const match = sql.trim().match(SELECT_RE);
    if (!match) {
      return {
        kind: 'error',
        message: 'syntax error: expected SELECT … FROM …',
        hint: "Try: SELECT role, org FROM experience WHERE lane = 'industry'",
      };
    }

    const [, rawColumns, rawTable, rawWhere, orderBy, direction, limit] = match;
    const table = rawTable.toLowerCase();
    const source = this.tables[table];
    if (!source) {
      return {
        kind: 'error',
        message: `relation "${table}" does not exist`,
        hint: `Available tables: ${this.tableNames().join(', ')}`,
      };
    }

    let rows = source();
    const known = this.columnsOf(table);

    const conditions = rawWhere ? this.parseWhere(rawWhere) : [];
    if ('kind' in conditions) return conditions;
    const unknownCondition = conditions.find((c) => !known.includes(c.column));
    if (unknownCondition) return this.unknownColumn(unknownCondition.column, table);
    rows = rows.filter((row) => conditions.every((c) => this.matches(row[c.column], c)));

    if (orderBy) {
      const col = orderBy.toLowerCase();
      if (!known.includes(col)) return this.unknownColumn(col, table);
      const sign = direction?.toLowerCase() === 'desc' ? -1 : 1;
      rows = [...rows].sort((a, b) => sign * this.compare(a[col], b[col]));
    }

    if (limit) rows = rows.slice(0, Number(limit));

    const columnSpec = rawColumns.trim().toLowerCase();
    if (/^count\(\s*\*\s*\)$/.test(columnSpec)) {
      return this.result(['count'], [{ count: rows.length }], started);
    }

    const columns = columnSpec === '*' ? known : columnSpec.split(',').map((c) => c.trim());
    const unknownColumn = columns.find((c) => !known.includes(c));
    if (unknownColumn) return this.unknownColumn(unknownColumn, table);

    const projected = rows.map((row) => Object.fromEntries(columns.map((c) => [c, row[c]])));
    return this.result(columns, projected, started);
  }

  private parseWhere(where: string): Condition[] | QueryError {
    const parts = where.split(/\s+and\s+/i);
    const conditions: Condition[] = [];
    for (const part of parts) {
      const m = part.trim().match(CONDITION_RE);
      if (!m) return { kind: 'error', message: `could not parse condition "${part.trim()}"` };
      conditions.push({
        column: m[1].toLowerCase(),
        op: m[2].toLowerCase() as Condition['op'],
        value: m[3].trim().replace(/^['"]|['"]$/g, ''),
      });
    }
    return conditions;
  }

  private matches(cell: Cell, { op, value }: Condition): boolean {
    if (Array.isArray(cell)) {
      const hit = cell.some((item) => this.matches(item, { column: '', op: op === '!=' ? '=' : op, value }));
      return op === '!=' ? !hit : hit;
    }
    if (op === 'like') {
      const escaped = value.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.');
      return new RegExp(`^${escaped}$`, 'i').test(String(cell));
    }
    const cmp = this.compare(cell, value);
    switch (op) {
      case '=': return cmp === 0;
      case '!=': return cmp !== 0;
      case '>': return cmp > 0;
      case '<': return cmp < 0;
      case '>=': return cmp >= 0;
      case '<=': return cmp <= 0;
    }
  }

  private compare(a: Cell, b: Cell): number {
    const x = Array.isArray(a) ? a.length : a;
    const y = Array.isArray(b) ? b.length : b;
    const nx = Number(x);
    const ny = Number(y);
    if (x !== '' && y !== '' && !Number.isNaN(nx) && !Number.isNaN(ny)) return nx - ny;
    return String(x).localeCompare(String(y), 'en', { sensitivity: 'base' });
  }

  private unknownColumn(column: string, table: string): QueryError {
    return {
      kind: 'error',
      message: `column "${column}" does not exist`,
      hint: `Columns of ${table}: ${this.columnsOf(table).join(', ')}`,
    };
  }

  private result(columns: string[], rows: Row[], started: number): QueryResult {
    return { kind: 'table', columns, rows, elapsedMs: performance.now() - started };
  }
}
