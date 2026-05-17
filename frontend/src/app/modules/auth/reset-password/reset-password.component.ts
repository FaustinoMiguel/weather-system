import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

// O utilizador chega aqui através do link no email:
//   /reset-password?token=abc123...
//
// Estados possíveis:
//   - Sem token na URL          → ecrã "link inválido"
//   - Token presente            → formulário nova senha
//   - Submetido com sucesso     → ecrã de confirmação + redirecção para login

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">

        @if (noToken()) {
          <!-- ── Link inválido ── -->
          <div class="auth-logo">⚠️</div>
          <h1>Link inválido</h1>
          <p class="auth-subtitle">
            Este link de recuperação é inválido ou já expirou.<br>
            Solicita um novo para continuares.
          </p>
          <a routerLink="/forgot-password" class="btn-primary" style="display:block;text-align:center">
            Solicitar novo link
          </a>
          <p class="auth-links"><a routerLink="/login">← Voltar ao login</a></p>
        }

        @if (!noToken() && !done()) {
          <!-- ── Formulário de nova senha ── -->
          <div class="auth-logo">🔐</div>
          <h1>Nova senha</h1>
          <p class="auth-subtitle">Escolhe uma senha forte com pelo menos 8 caracteres.</p>

          @if (error()) {
            <div class="alert-error">⚠️ {{ error() }}</div>
          }

          <div class="form-group">
            <label>Nova senha</label>
            <div class="password-wrapper">
              <input
                [type]="showPass() ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                placeholder="Mínimo 8 caracteres"
                autocomplete="new-password"
                (keydown.enter)="submit()"
              />
              <button type="button" class="toggle-pass" (click)="showPass.set(!showPass())">
                {{ showPass() ? '🙈' : '👁️' }}
              </button>
            </div>
            @if (password.length > 0) {
              <div class="strength-bar">
                <div class="strength-fill" [class]="strengthClass()"></div>
              </div>
              <span class="strength-label" [class]="strengthClass()">{{ strengthLabel() }}</span>
            }
          </div>

          <div class="form-group">
            <label>Confirmar nova senha</label>
            <div class="password-wrapper">
              <input
                [type]="showConfirm() ? 'text' : 'password'"
                [(ngModel)]="confirm"
                name="confirm"
                placeholder="Repete a senha"
                autocomplete="new-password"
                (keydown.enter)="submit()"
              />
              <button type="button" class="toggle-pass" (click)="showConfirm.set(!showConfirm())">
                {{ showConfirm() ? '🙈' : '👁️' }}
              </button>
            </div>
            @if (confirm.length > 0 && password !== confirm) {
              <span class="field-error">As senhas não coincidem.</span>
            }
          </div>

          <button
            class="btn-primary"
            (click)="submit()"
            [disabled]="loading() || !canSubmit()"
          >
            @if (loading()) { ⏳ A redefinir… } @else { ✅ Definir nova senha }
          </button>

          <p class="auth-links"><a routerLink="/login">← Voltar ao login</a></p>
        }

        @if (done()) {
          <!-- ── Sucesso ── -->
          <div class="auth-logo">✅</div>
          <h1>Senha redefinida!</h1>
          <p class="auth-subtitle">
            A tua senha foi alterada com sucesso.<br>
            Podes fazer login com a nova senha agora.
          </p>
          <div class="redirect-notice">
            A redirecionar para o login em {{ countdown() }}s…
          </div>
          <a routerLink="/login" class="btn-primary" style="display:block;text-align:center">
            Ir para o login agora →
          </a>
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

    /* Campo senha com botão mostrar/esconder */
    .password-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .password-wrapper input { flex: 1; padding-right: 2.5rem; }
    .toggle-pass {
      position: absolute;
      right: .6rem;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0;
      line-height: 1;
      opacity: .7;
    }
    .toggle-pass:hover { opacity: 1; }

    /* Barra de força da senha */
    .strength-bar {
      height: 4px;
      background: var(--color-border);
      border-radius: 2px;
      margin-top: .4rem;
      overflow: hidden;
    }
    .strength-fill {
      height: 100%;
      border-radius: 2px;
      transition: width .3s, background .3s;
    }
    .strength-fill.weak   { width: 33%; background: #ef4444; }
    .strength-fill.medium { width: 66%; background: #f59e0b; }
    .strength-fill.strong { width: 100%; background: #22c55e; }

    .strength-label {
      font-size: .75rem;
      margin-top: .2rem;
      display: inline-block;
    }
    .strength-label.weak   { color: #ef4444; }
    .strength-label.medium { color: #f59e0b; }
    .strength-label.strong { color: #22c55e; }

    /* Erro de campo inline */
    .field-error {
      font-size: .78rem;
      color: #ef4444;
      margin-top: .3rem;
      display: block;
    }

    /* Contador de redirecção */
    .redirect-notice {
      text-align: center;
      font-size: .82rem;
      color: var(--color-text-muted);
      margin-bottom: 1rem;
      padding: .6rem;
      background: var(--color-bg-secondary);
      border-radius: 6px;
    }

    .btn-primary { margin-bottom: 0; }
  `],
  styleUrls: ['../auth-shared.styles.css']
})
export class ResetPasswordComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private auth   = inject(AuthService);

  private token = '';

  password     = '';
  confirm      = '';
  loading      = signal(false);
  error        = signal('');
  done         = signal(false);
  noToken      = signal(false);
  showPass     = signal(false);
  showConfirm  = signal(false);
  countdown    = signal(5);

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.noToken.set(true);
    }
  }

  // ── Força da senha ────────────────────────────────────────────────────────

  private get strength(): 'weak' | 'medium' | 'strong' {
    const p = this.password;
    if (p.length < 8) return 'weak';
    const hasUpper  = /[A-Z]/.test(p);
    const hasLower  = /[a-z]/.test(p);
    const hasDigit  = /\d/.test(p);
    const hasSymbol = /[^A-Za-z0-9]/.test(p);
    const score = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;
    if (score >= 3 && p.length >= 12) return 'strong';
    if (score >= 2) return 'medium';
    return 'weak';
  }

  strengthClass(): string { return this.strength; }
  strengthLabel(): string {
    return { weak: 'Fraca', medium: 'Razoável', strong: 'Forte' }[this.strength];
  }

  canSubmit(): boolean {
    return this.password.length >= 8 && this.password === this.confirm;
  }

  // ── Submissão ─────────────────────────────────────────────────────────────

  submit(): void {
    if (!this.canSubmit()) {
      if (this.password.length < 8) {
        this.error.set('A senha deve ter pelo menos 8 caracteres.');
      } else {
        this.error.set('As senhas não coincidem.');
      }
      return;
    }

    this.error.set('');
    this.loading.set(true);

    this.auth.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
        this.startCountdown();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message ?? 'Link inválido ou expirado.';
        this.error.set(msg);
        // Só redireciona para o ecrã de link inválido se o token expirou/inválido.
        // Erros de validação (ex: senha igual à anterior) ficam no formulário.
        const isTokenError = err.status === 422 && !msg.includes('igual');
        if (isTokenError) {
          setTimeout(() => this.noToken.set(true), 2500);
        }
      }
    });
  }

  private startCountdown(): void {
    const interval = setInterval(() => {
      const next = this.countdown() - 1;
      this.countdown.set(next);
      if (next <= 0) {
        clearInterval(interval);
        this.router.navigate(['/login']);
      }
    }, 1000);
  }
}
