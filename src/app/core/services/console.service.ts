import { Injectable, signal } from '@angular/core';

/** Open/closed state of the global console drawer. */
@Injectable({ providedIn: 'root' })
export class ConsoleService {
  readonly open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }
}
