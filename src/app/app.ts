import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { STAGES } from './core/data/stages';
import { ConsoleService } from './core/services/console.service';
import { PortfolioService } from './core/services/portfolio.service';
import { QueryConsole } from './shared/components/query-console';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, QueryConsole],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '(document:keydown)': 'onGlobalKey($event)',
  },
})
export class App {
  protected readonly stages = STAGES;
  protected readonly console = inject(ConsoleService);
  protected readonly profile = inject(PortfolioService).profile;
  protected readonly path = signal('/');
  protected readonly clock = signal(this.riyadhTime());
  protected readonly menuOpen = signal(false);
  protected readonly year = new Date().getFullYear();

  constructor() {
    const router = inject(Router);
    const sub = router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.path.set(e.urlAfterRedirects.split(/[?#]/)[0]);
        this.menuOpen.set(false);
      });

    const timer = setInterval(() => this.clock.set(this.riyadhTime()), 15_000);
    inject(DestroyRef).onDestroy(() => {
      sub.unsubscribe();
      clearInterval(timer);
    });
  }

  /** Backtick toggles the console anywhere; Escape closes it. */
  protected onGlobalKey(event: KeyboardEvent): void {
    const target = event.target;
    const typing = target instanceof Element && target.closest('input, textarea, [contenteditable="true"]');
    if (event.key === '`' && (!typing || this.console.open())) {
      event.preventDefault();
      this.console.toggle();
    } else if (event.key === 'Escape') {
      this.console.close();
      this.menuOpen.set(false);
    }
  }

  private riyadhTime(): string {
    return new Date().toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Riyadh',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
