// Decisão técnica: pedido de recuperação mostra mensagem neutra para não revelar se o email existe.

import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Mail } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule.pick({ Mail })],
  template: `
    <section class="auth-shell">
      <div class="auth-panel">
        <h1>{{ t('auth.forgotTitle') }}</h1>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span>{{ t('auth.email') }}</span>
            <input type="email" formControlName="email" autocomplete="email">
          </label>
          @if (message()) {
            <p class="muted">{{ message() }}</p>
          }
          <button class="btn primary" type="submit" [disabled]="form.invalid || loading()">
            <lucide-icon name="mail" size="18" />
            {{ loading() ? t('common.loading') : t('auth.sendReset') }}
          </button>
        </form>
        <div class="auth-links">
          <a routerLink="/login">{{ t('auth.backLogin') }}</a>
        </div>
      </div>
    </section>
  `
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly message = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  t(key: string): string {
    return this.i18n.t(key);
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.auth.forgotPassword(this.form.controls.email.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          this.message.set(response.message || this.t('auth.resetSent'));
        },
        error: () => {
          this.loading.set(false);
          this.message.set(this.t('auth.resetSent'));
        }
      });
  }
}
