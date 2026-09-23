import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PortfolioService } from '../../core/services/portfolio.service';
import { QueryConsole } from '../../shared/components/query-console';
import { SectionHeader } from '../../shared/components/section-header';
import { RevealDirective } from '../../shared/directives/reveal.directive';

const TOPICS = ['hiring', 'internship', 'collaboration', 'hello'] as const;

@Component({
  selector: 'app-query',
  imports: [ReactiveFormsModule, QueryConsole, SectionHeader, RevealDirective],
  templateUrl: './query.html',
  styleUrl: './query.css',
})
export class Query {
  protected readonly profile = inject(PortfolioService).profile;
  protected readonly topics = TOPICS;

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    topic: ['hiring' as (typeof TOPICS)[number]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
  });

  protected readonly sent = signal(false);
  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /** The form rendered as the SQL statement it "runs". */
  protected readonly statement = computed(() => {
    const v = this.value();
    const q = (s: string | undefined, fallback: string) => `'${(s || fallback).replace(/'/g, "''").slice(0, 60)}'`;
    const msg = (v.message ?? '').replace(/\s+/g, ' ');
    return [
      'INSERT INTO inbox (name, email, topic, message)',
      `VALUES (${q(v.name, '…')}, ${q(v.email, '…')},`,
      `        '${v.topic}', ${q(msg.length > 40 ? msg.slice(0, 40) + '…' : msg, '…')});`,
    ].join('\n');
  });

  protected invalid(field: 'name' | 'email' | 'message'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  /** There is no backend, so the message is handed to the visitor's mail client. */
  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, topic, message } = this.form.getRawValue();
    const subject = `[${topic}] Message from ${name}`;
    const body = `${message}\n\n— ${name} (${email})`;
    window.location.href = `mailto:${this.profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    this.sent.set(true);
  }

  protected reset(): void {
    this.form.reset();
    this.sent.set(false);
  }
}
