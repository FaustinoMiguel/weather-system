import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">🔐</div>
        <h1>{{ i18n.t('auth.resetTitle') }}</h1>

        @if (error())   { <div class="alert-error">{{ error() }}</div> }
        @if (success()) {
          <div class="alert-success">{{ success() }}</div>
          <p class="auth-links"><a routerLink="/login">{{ i18n.t('auth.goToLogin') }}</a></p>
        }

        @if (!success()) {
          <form (ngSubmit)="submit()">
            <div class="form-group">
              <label>{{ i18n.t('auth.newPassword') }}</label>
              <input type="password" [(ngModel)]="password" name="password" required minlength="8"
                     [placeholder]="i18n.t('auth.passwordMin')" />
            </div>
            <div class="form-group">
              <label>{{ i18n.t('auth.confirmPassword') }}</label>
              <input type="password" [(ngModel)]="confirmPassword" name="confirm" required
                     [placeholder]="i18n.t('auth.confirmPasswordPlaceholder')" />
            </div>
            <button type="submit" class="btn-primary" [disabled]="loading()">
              @if (loading()) { ⏳ } @else { {{ i18n.t('auth.resetBtn') }} }
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styleUrls: ['../auth-shared.styles.css']
})
export class ResetPasswordComponent implements OnInit {
  auth  = inject(AuthService);
  i18n  = inject(I18nService);
  route = inject(ActivatedRoute);

  token           = '';
  password        = '';
  confirmPassword = '';
  loading         = signal(false);
  error           = signal('');
  success         = signal('');

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) this.error.set(this.i18n.t('auth.invalidToken'));
  }

  submit(): void {
    this.error.set('');
    if (this.password !== this.confirmPassword) {
      this.error.set(this.i18n.t('auth.passwordMismatch')); return;
    }
    this.loading.set(true);
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: (res) => { this.loading.set(false); this.success.set(res.message); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? this.i18n.t('auth.genericError'));
      }
    });
  }
}
