import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">🌤</div>
        <h1>{{ i18n.t('auth.register') }}</h1>

        @if (error())   { <div class="alert-error">⚠️ {{ error() }}</div> }
        @if (success()) { <div class="alert-success">✅ {{ success() }}</div> }

        <form (ngSubmit)="submit()">
          <div class="form-group">
            <label>{{ i18n.t('auth.name') }}</label>
            <input type="text" [(ngModel)]="name" name="name" required
                   [placeholder]="i18n.t('auth.namePlaceholder')" autocomplete="name" />
          </div>
          <div class="form-group">
            <label>{{ i18n.t('auth.email') }}</label>
            <input type="email" [(ngModel)]="email" name="email" required
                   [placeholder]="i18n.t('auth.emailPlaceholder')" autocomplete="email" />
          </div>
          <div class="form-group">
            <label>{{ i18n.t('auth.password') }}</label>
            <input type="password" [(ngModel)]="password" name="password" required
                   minlength="8" [placeholder]="i18n.t('auth.passwordMin')" />
          </div>
          <div class="form-group">
            <label>{{ i18n.t('auth.confirmPassword') }}</label>
            <input type="password" [(ngModel)]="confirmPassword" name="confirm" required
                   [placeholder]="i18n.t('auth.confirmPasswordPlaceholder')" />
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading() || !!success()">
            @if (loading()) { <span class="btn-loading">⏳ A criar conta…</span> }
            @else { 🚀 Criar conta }
          </button>
        </form>

        <p class="auth-links">
          {{ i18n.t('auth.hasAccount') }} <a routerLink="/login">{{ i18n.t('auth.loginLink') }}</a>
        </p>
      </div>
    </div>
  `,
  styleUrls: ['../auth-shared.styles.css']
})
export class RegisterComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);

  name            = '';
  email           = '';
  password        = '';
  confirmPassword = '';
  loading         = signal(false);
  error           = signal('');
  success         = signal('');

  submit(): void {
    this.error.set('');
    this.success.set('');
    if (this.password !== this.confirmPassword) {
      this.error.set(this.i18n.t('auth.passwordMismatch'));
      return;
    }
    if (this.password.length < 8) {
      this.error.set(this.i18n.t('auth.passwordTooShort'));
      return;
    }
    this.loading.set(true);
    this.auth.register(this.name, this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Conta criada com sucesso! A redirecionar para o login…');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? this.i18n.t('auth.registerError'));
      }
    });
  }
}
