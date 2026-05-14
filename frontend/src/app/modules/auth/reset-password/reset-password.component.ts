// Decisão técnica: token vem por query string e só a nova senha é enviada ao backend.

import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, KeyRound } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule.pick({ KeyRound })],
  template: `
    <section class="auth-shell">
      <div class="auth-panel">
        <h1>{{ t('auth.resetTitle') }}</h1>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>{{ t('auth.password') }}</span>
            <input type="password" formControlName="password" autocomplete="new-password">
          </label>
          @if (message()) {
            <p class="muted">{{ message() }}</p>
          }
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <button class="btn primary" type="submit" [disabled]="form.invalid || loading()">
            <lucide-icon name="key-round" size="18" />
            {{ loading() ? t('common.loading') : t('auth.resetPassword') }}
          </button>
        </form>
        <div class="auth-links">
          <a routerLink="/login">{{ t('auth.backLogin') }}</a>
        </div>
      </div>
    </section>
  `
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
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
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.error.set(this.t('auth.missingToken'));
      return;
    }
    if (this.form.invalid) {
      this.error.set(this.t('auth.passwordHint'));
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.auth.resetPassword(token, this.form.controls.password.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.message.set(this.t('auth.passwordChanged'));
          setTimeout(() => void this.router.navigate(['/login']), 800);
        },
        error: () => {
          this.loading.set(false);
          this.error.set(this.t('auth.resetError'));
        }
      });
  }
}
