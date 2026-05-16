import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">🔑</div>
        <h1>{{ i18n.t('auth.forgotTitle') }}</h1>
        <p style="text-align:center;color:var(--color-text-secondary);font-size:.9rem;margin-bottom:1.25rem">
          {{ i18n.t('auth.forgotSubtitle') }}
        </p>

        @if (error())   { <div class="alert-error">{{ error() }}</div> }
        @if (success()) { <div class="alert-success">{{ success() }}</div> }

        @if (!success()) {
          <form (ngSubmit)="submit()">
            <div class="form-group">
              <label>{{ i18n.t('auth.email') }}</label>
              <input type="email" [(ngModel)]="email" name="email" required
                     [placeholder]="i18n.t('auth.emailPlaceholder')" />
            </div>
            <button type="submit" class="btn-primary" [disabled]="loading()">
              @if (loading()) { ⏳ } @else { {{ i18n.t('auth.sendLink') }} }
            </button>
          </form>
        }

        <p class="auth-links"><a routerLink="/login">← {{ i18n.t('auth.backToLogin') }}</a></p>
      </div>
    </div>
  `,
  styleUrls: ['../auth-shared.styles.css']
})
export class ForgotPasswordComponent {
  auth = inject(AuthService);
  i18n = inject(I18nService);

  email   = '';
  loading = signal(false);
  error   = signal('');
  success = signal('');

  submit(): void {
    this.error.set('');
    this.loading.set(true);
    this.auth.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(res.message);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? this.i18n.t('auth.genericError'));
      }
    });
  }
}
