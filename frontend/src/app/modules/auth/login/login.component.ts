import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">🌤</div>
        <h1>{{ i18n.t('auth.login') }}</h1>

        @if (error()) {
          <div class="alert-error">⚠️ {{ error() }}</div>
        }

        <form (ngSubmit)="submit()">
          <div class="form-group">
            <label>{{ i18n.t('auth.email') }}</label>
            <input type="email" [(ngModel)]="email" name="email" required
                   [placeholder]="i18n.t('auth.emailPlaceholder')" autocomplete="email" />
          </div>
          <div class="form-group">
            <label>{{ i18n.t('auth.password') }}</label>
            <input type="password" [(ngModel)]="password" name="password" required
                   [placeholder]="i18n.t('auth.passwordPlaceholder')" autocomplete="current-password" />
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if (loading()) { ⏳ A entrar… } @else { {{ i18n.t('auth.loginBtn') }} }
          </button>
        </form>

        <p class="auth-links">
          <a routerLink="/forgot-password">{{ i18n.t('auth.forgotPassword') }}</a>
          &nbsp;·&nbsp;
          <a routerLink="/register">{{ i18n.t('auth.noAccount') }}</a>
        </p>
      </div>
    </div>
  `,
  styleUrls: ['../auth-shared.styles.css']
})
export class LoginComponent {
  auth  = inject(AuthService);
  i18n  = inject(I18nService);

  email    = '';
  password = '';
  loading  = signal(false);
  error    = signal('');

  submit(): void {
    this.error.set('');
    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next:  () => this.loading.set(false),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? this.i18n.t('auth.loginError'));
      }
    });
  }
}
