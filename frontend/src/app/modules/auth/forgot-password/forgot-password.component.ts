import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

// Passo 1: utilizador insere o email.
// Passo 2 (sucesso): ecrã "verifica o teu inbox" — sem código, sem campos extra.
// O link chega no email e leva para /reset-password?token=...

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">

        @if (!sent()) {
          <!-- ── Passo 1: inserir email ── -->
          <div class="auth-logo">🔑</div>
          <h1>Recuperar senha</h1>
          <p class="auth-subtitle">
            Insere o email associado à tua conta.<br>
            Vamos enviar-te um link para criares uma nova senha.
          </p>

          @if (error()) {
            <div class="alert-error">⚠️ {{ error() }}</div>
          }

          <div class="form-group">
            <label>Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="o_teu@email.com"
              autocomplete="email"
              (keydown.enter)="send()"
            />
          </div>

          <button
            class="btn-primary"
            (click)="send()"
            [disabled]="loading() || !email.trim()"
          >
            @if (loading()) { ⏳ A enviar… } @else { 📨 Enviar link de recuperação }
          </button>

          <p class="auth-links"><a routerLink="/login">← Voltar ao login</a></p>

        } @else {
          <!-- ── Passo 2: confirmação ── -->
          <div class="auth-logo">📬</div>
          <h1>Email enviado!</h1>
          <p class="auth-subtitle">
            Se <strong>{{ sentEmail() }}</strong> estiver registado,
            receberás um link de recuperação nos próximos instantes.
          </p>

          <div class="info-box">
            <p>💡 <strong>Não encontras o email?</strong></p>
            <ul>
              <li>Verifica a pasta de <strong>spam / lixo</strong>.</li>
              <li>
                Em desenvolvimento sem SMTP: abre
                <code>backend/logs/emails.log</code>
                e copia o link directamente para o browser.
              </li>
            </ul>
          </div>

          <button class="btn-secondary" (click)="reset()">
            ← Tentar outro email
          </button>

          <p class="auth-links"><a routerLink="/login">Ir para o login</a></p>
        }

      </div>
    </div>
  `,
  styles: [`
    .auth-subtitle {
      text-align: center;
      color: var(--color-text-secondary);
      font-size: .88rem;
      margin-bottom: 1.25rem;
      line-height: 1.6;
    }
    .info-box {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1rem 1.25rem;
      font-size: .82rem;
      color: var(--color-text-secondary);
      margin-bottom: 1.25rem;
      text-align: left;
    }
    .info-box p  { margin: 0 0 .5rem; font-size: .85rem; }
    .info-box ul { margin: 0; padding-left: 1.2rem; }
    .info-box li { margin-bottom: .35rem; line-height: 1.5; }
    .info-box code {
      background: var(--color-bg-primary);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: .1rem .35rem;
      font-size: .78rem;
    }
    .btn-secondary {
      width: 100%;
      padding: .75rem;
      border-radius: 8px;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-text-primary);
      font-size: .95rem;
      cursor: pointer;
      margin-bottom: .75rem;
      transition: background .2s;
    }
    .btn-secondary:hover { background: var(--color-bg-secondary); }
  `],
  styleUrls: ['../auth-shared.styles.css']
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);

  email     = '';
  loading   = signal(false);
  error     = signal('');
  sent      = signal(false);
  sentEmail = signal('');

  send(): void {
    const trimmed = this.email.trim();
    if (!trimmed) return;

    this.error.set('');
    this.loading.set(true);

    this.auth.forgotPassword(trimmed).subscribe({
      next: () => {
        this.loading.set(false);
        this.sentEmail.set(trimmed);
        this.sent.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Erro ao enviar. Tenta novamente.');
      }
    });
  }

  reset(): void {
    this.sent.set(false);
    this.sentEmail.set('');
    this.email = '';
    this.error.set('');
  }
}
