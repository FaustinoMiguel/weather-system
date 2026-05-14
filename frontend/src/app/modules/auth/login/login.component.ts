// Decisão técnica: formulário reactivo dá validação declarativa e facilita testes de autenticação.

import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, LogIn } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule.pick({ LogIn })],
  template: `
    <section class="auth-shell">
      <div class="auth-panel">
        <h1>{{ t('auth.loginTitle') }}</h1>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>{{ t('auth.email') }}</span>
            <input type="email" formControlName="email" autocomplete="email">
          </label>
          <label class="field">
            <span>{{ t('auth.password') }}</span>
            <input type="password" formControlName="password" autocomplete="current-password">
          </label>
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <button class="btn primary" type="submit" [disabled]="form.invalid || loading()">
            <lucide-icon name="log-in" size="18" />
            {{ loading() ? t('common.loading') : t('auth.login') }}
          </button>
        </form>
        <div class="auth-links">
          <a routerLink="/register">{{ t('auth.createAccount') }}</a>
          <a routerLink="/forgot-password">{{ t('auth.forgot') }}</a>
        </div>
      </div>
    </section>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  t(key: string): string {
    return this.i18n.t(key);
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigate(['/dashboard']),
        error: () => {
          this.loading.set(false);
          this.error.set(this.t('auth.invalidCredentials'));
        }
      });
  }
}
