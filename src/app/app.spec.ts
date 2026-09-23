import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { QueryEngineService, QueryResult } from './core/services/query-engine.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render every pipeline stage in the navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.rail .label'),
      (el) => el.textContent?.trim(),
    );
    expect(labels).toEqual(['source', 'runs', 'artifacts', 'lineage', 'monitor', 'query']);
  });
});

describe('QueryEngineService', () => {
  let engine: QueryEngineService;

  beforeEach(() => {
    engine = TestBed.inject(QueryEngineService);
  });

  it('filters, orders and projects columns', () => {
    const result = engine.execute(
      "SELECT org FROM experience WHERE lane = 'industry' ORDER BY start DESC LIMIT 2",
    ) as QueryResult;
    expect(result.kind).toBe('table');
    expect(result.columns).toEqual(['org']);
    expect(result.rows.map((r) => r['org'])).toEqual(['Saudi AZM', 'ITQAN Quality for Business Solutions']);
  });

  it('matches array columns when any element matches', () => {
    const result = engine.execute("SELECT slug FROM projects WHERE stack = 'airflow'") as QueryResult;
    expect(result.rows.map((r) => r['slug'])).toEqual(['mcc-pipeline']);
  });

  it('supports COUNT(*) and LIKE', () => {
    const result = engine.execute("SELECT COUNT(*) FROM certifications WHERE issuer LIKE '%a%'") as QueryResult;
    expect(result.columns).toEqual(['count']);
    expect(Number(result.rows[0]['count'])).toBeGreaterThan(0);
  });

  it('reports unknown tables and columns like Postgres', () => {
    expect(engine.execute('SELECT * FROM salaries')).toMatchObject({
      kind: 'error',
      message: 'relation "salaries" does not exist',
    });
    expect(engine.execute('SELECT height FROM skills')).toMatchObject({
      kind: 'error',
      message: 'column "height" does not exist',
    });
  });
});
