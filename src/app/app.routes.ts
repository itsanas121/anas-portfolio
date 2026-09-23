import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { PortfolioService } from './core/services/portfolio.service';

/** Uses the project name as the page title. */
const artifactTitle: ResolveFn<string> = (route) => {
  const artifact = inject(PortfolioService).artifact(route.paramMap.get('slug') ?? '');
  return `${artifact?.title ?? 'Project'} · Anas Almehmadi`;
};

export const routes: Routes = [
  {
    path: '',
    title: 'Anas Almehmadi · Data & Backend',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'runs',
    title: 'Experience · Anas Almehmadi',
    loadComponent: () => import('./features/runs/runs').then((m) => m.Runs),
  },
  {
    path: 'artifacts',
    title: 'Projects · Anas Almehmadi',
    loadComponent: () => import('./features/artifacts/artifact-list').then((m) => m.ArtifactList),
  },
  {
    path: 'artifacts/:slug',
    title: artifactTitle,
    loadComponent: () => import('./features/artifacts/artifact-detail').then((m) => m.ArtifactDetail),
  },
  {
    path: 'lineage',
    title: 'Skills · Anas Almehmadi',
    loadComponent: () => import('./features/lineage/lineage').then((m) => m.Lineage),
  },
  {
    path: 'monitor',
    title: 'Impact · Anas Almehmadi',
    loadComponent: () => import('./features/monitor/monitor').then((m) => m.Monitor),
  },
  {
    path: 'query',
    title: 'Console & contact · Anas Almehmadi',
    loadComponent: () => import('./features/query/query').then((m) => m.Query),
  },
  {
    path: '**',
    title: 'Not found · Anas Almehmadi',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
