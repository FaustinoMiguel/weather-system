import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div style="display:flex;flex-direction:column;align-items:center;gap:.5rem">
        <!-- Logo -->
        <a routerLink="/dashboard" class="sidebar-logo" title="WeatherApp">🌤</a>

        <!-- Nav -->
        <nav class="sidebar-nav">
          <a routerLink="/dashboard"  routerLinkActive="active" class="nav-item" title="Dashboard">🏠</a>
          <a routerLink="/favourites" routerLinkActive="active" class="nav-item" title="{{ i18n.t('nav.favourites') }}">💛</a>
          <a routerLink="/history"    routerLinkActive="active" class="nav-item" title="{{ i18n.t('nav.history') }}">📋</a>
          <a routerLink="/compare"    routerLinkActive="active" class="nav-item" title="{{ i18n.t('nav.compare') }}">⚖️</a>
          <a routerLink="/export"     routerLinkActive="active" class="nav-item" title="{{ i18n.t('nav.export') }}">📤</a>

          <div style="width:28px;height:1px;background:var(--border);margin:.5rem 0"></div>

          <!-- Tema -->
          <button class="nav-item" (click)="theme.toggle()" [title]="theme.theme()==='dark' ? 'Modo claro' : 'Modo escuro'">
            {{ theme.theme() === 'dark' ? '☀️' : '🌙' }}
          </button>

          <!-- Idioma -->
          <button class="nav-item" (click)="toggleLang()" [title]="i18n.lang()==='pt' ? 'Switch to English' : 'Mudar para Português'">
            <span style="font-size:.65rem;font-weight:700;color:var(--primary)">
              {{ i18n.lang().toUpperCase() }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Avatar + logout -->
      <div style="position:relative">
        <button class="sidebar-avatar" (click)="showMenu.set(!showMenu())" [title]="auth.user()?.name ?? ''">
          {{ initial() }}
        </button>
        @if (showMenu()) {
          <div class="sidebar-popup">
            <div class="sidebar-popup-name">{{ auth.user()?.name }}</div>
            <div class="sidebar-popup-email">{{ auth.user()?.email }}</div>
            <button class="sidebar-popup-logout" (click)="auth.logout()">🚪 Sair</button>
          </div>
        }
      </div>
    </aside>
  `,
  styles: [`
    .sidebar-popup {
      position: absolute; bottom: 48px; left: 50%; transform: translateX(-50%);
      width: 180px; background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius); box-shadow: var(--shadow-lg); overflow: hidden;
      animation: fadeUp .15s ease both; z-index: 100;
    }
    .sidebar-popup-name  { font-size:.8rem;font-weight:600;padding:.75rem .9rem .1rem; }
    .sidebar-popup-email { font-size:.72rem;color:var(--muted-fg);padding:.1rem .9rem .6rem;border-bottom:1px solid var(--border); }
    .sidebar-popup-logout {
      width:100%;padding:.6rem .9rem;background:none;border:none;text-align:left;
      font-size:.8rem;color:#b91c1c;cursor:pointer;display:flex;gap:.5rem;align-items:center;
      transition:background var(--t);
    }
    .sidebar-popup-logout:hover { background:var(--secondary); }
    [data-theme="dark"] .sidebar-popup-logout { color:#fca5a5; }
  `]
})
export class SidebarComponent {
  auth  = inject(AuthService);
  theme = inject(ThemeService);
  i18n  = inject(I18nService);
  showMenu = signal(false);

  initial(): string {
    return (this.auth.user()?.name ?? 'U').slice(0, 2).toUpperCase();
  }

  toggleLang(): void {
    this.i18n.setLanguage(this.i18n.lang() === 'pt' ? 'en' : 'pt');
  }
}
