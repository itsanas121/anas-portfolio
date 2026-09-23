import { Component, ElementRef, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';

/** Animates a number from 0 to its value once it becomes visible. */
@Component({
  selector: 'app-count-up',
  template: `{{ prefix() }}{{ display() }}{{ suffix() }}`,
  host: { '[attr.aria-label]': 'prefix() + final() + suffix()' },
})
export class CountUp implements OnInit, OnDestroy {
  readonly value = input.required<number>();
  readonly decimals = input(0);
  readonly prefix = input('');
  readonly suffix = input('');
  readonly duration = input(1400);

  private readonly current = signal(0);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;
  private frame = 0;

  protected readonly display = computed(() => this.format(this.current()));
  protected readonly final = computed(() => this.format(this.value()));

  ngOnInit(): void {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      this.current.set(this.value());
      return;
    }
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this.observer?.disconnect();
        this.animate();
      }
    });
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    cancelAnimationFrame(this.frame);
  }

  private animate(): void {
    const start = performance.now();
    const target = this.value();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / this.duration());
      const eased = 1 - Math.pow(1 - t, 4);
      this.current.set(target * eased);
      if (t < 1) this.frame = requestAnimationFrame(step);
    };
    this.frame = requestAnimationFrame(step);
  }

  private format(n: number): string {
    return n.toLocaleString('en', {
      minimumFractionDigits: this.decimals(),
      maximumFractionDigits: this.decimals(),
    });
  }
}
