// Decisão técnica: validação local melhora UX, mas o backend continua como fonte final de verdade.

import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, UserPlus } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule.pick({ UserPlus })],
  template: `
    <section class="auth-shell">
      <div class="auth-panel">
        <h1>{{ t('auth.registerTitle') }}</h1>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>{{ t('auth.name') }}</span>
            <input type="text" formControlName="name" autocomplete="name">
          </label>
          <label class="field">
            <span>{{ t('auth.email') }}</span>
            <input type="email" formControlName="email" autocomplete="email">
          </label>
          <label class="field">
            <span>{{ t('auth.password') }}</span>
            <input type="password" formControlName="password" autocomplete="new-password">
          </label>
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <button class="btn primary" type="submit" [disabled]="form.invalid || loading()">
            <lucide-icon name="user-plus" size="18" />
            {{ loading() ? t('common.loading') : t('auth.register') }}
          </button>
        </form>
        <div class="auth-links">
          <a routerLink="/login">{{ t('auth.haveAccount') }}</a>
        </div>
      </div>
    </section>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    ]]
  });

  t(key: string): string {
    return this.i18n.t(key);
  }

  submit(): void {
    if (this.form.invalid) {
      this.error.set(this.t('auth.passwordHint'));
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigate(['/dashboard']),
        error: () => {
          this.loading.set(false);
          this.error.set(this.t('auth.registerError'));
        }
      });
  }
}
