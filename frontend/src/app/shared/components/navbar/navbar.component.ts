// Decisão técnica: navbar única adapta navegação por estado autenticado e colapsa em mobile.

import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, CloudSun, Heart, History, LogOut, Menu, Search, Scale, X } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    ThemeToggleComponent,
    LanguageSelectorComponent,
    LucideAngularModule.pick({ CloudSun, Heart, History, LogOut, Menu, Search, Scale, X })
  ],
  template: `
    <header class="topbar">
      <a class="brand" routerLink="/dashboard">
        <lucide-icon name="cloud-sun" size="26" />
        <span>MeteoNow</span>
      </a>

      <button class="btn icon-btn menu-button" type="button" [title]="t('common.menu')" (click)="open.set(!open())">
        <lucide-icon [name]="open() ? 'x' : 'menu'" size="20" />
      </button>

      <nav class="nav-links" [class.open]="open()">
        @if (auth.user()) {
          <a routerLink="/dashboard" routerLinkActive="active">
            <lucide-icon name="search" size="18" />
            {{ t('nav.dashboard') }}
          </a>
          <a routerLink="/favourites" routerLinkActive="active">
            <lucide-icon name="heart" size="18" />
            {{ t('nav.favourites') }}
          </a>
          <a routerLink="/history" routerLinkActive="active">
            <lucide-icon name="history" size="18" />
            {{ t('nav.history') }}
          </a>
          <a routerLink="/compare" routerLinkActive="active">
            <lucide-icon name="scale" size="18" />
            {{ t('nav.compare') }}
          </a>
        }
      </nav>

      <div class="nav-actions">
        <app-language-selector />
        <app-theme-toggle />
        @if (auth.user()) {
          <button class="btn icon-btn" type="button" [title]="t('auth.logout')" (click)="logout()">
            <lucide-icon name="log-out" size="19" />
          </button>
        }
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 18px;
      padding: 12px min(24px, 4vw);
      background: color-mix(in srgb, var(--surface) 92%, transparent);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(14px);
    }

    .brand,
    .nav-links a {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .brand {
      font-weight: 800;
      color: var(--primary);
    }

    .nav-links {
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    .nav-links a {
      padding: 9px 11px;
      border-radius: 8px;
      color: var(--muted);
    }

    .nav-links a.active,
    .nav-links a:hover {
      color: var(--text);
      background: var(--surface-muted);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .menu-button {
      display: none;
    }

    @media (max-width: 860px) {
      .topbar {
        grid-template-columns: auto auto;
      }

      .menu-button {
        display: inline-flex;
        justify-self: end;
      }

      .nav-links {
        display: none;
        grid-column: 1 / -1;
        justify-content: stretch;
        flex-direction: column;
      }

      .nav-links.open {
        display: flex;
      }

      .nav-actions {
        grid-column: 1 / -1;
        justify-content: flex-end;
      }
    }
  `]
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  readonly open = signal(false);

  t(key: string): string {
    return this.i18n.t(key);
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => {
        this.auth.clearSession();
        void this.router.navigate(['/login']);
      }
    });
  }
}
