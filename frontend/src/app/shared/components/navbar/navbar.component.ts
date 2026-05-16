import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar" [class.scrolled]="scrolled()">
      <div class="nav-inner">

        <!-- Logo -->
        <a routerLink="/dashboard" class="nav-logo">
          <span class="logo-icon">🌤</span>
          <span class="logo-text">WeatherApp</span>
        </a>

        <!-- Links desktop -->
        <ul class="nav-links">
          @if (auth.isLoggedIn()) {
            <li><a routerLink="/dashboard"  routerLinkActive="active">{{ i18n.t('nav.dashboard') }}</a></li>
            <li><a routerLink="/favourites" routerLinkActive="active">{{ i18n.t('nav.favourites') }}</a></li>
            <li><a routerLink="/history"    routerLinkActive="active">{{ i18n.t('nav.history') }}</a></li>
            <li><a routerLink="/compare"    routerLinkActive="active">{{ i18n.t('nav.compare') }}</a></li>
            <li><a routerLink="/export"     routerLinkActive="active">{{ i18n.t('nav.export') }}</a></li>
          }
        </ul>

        <!-- Acções -->
        <div class="nav-actions">
          <!-- Seletor de idioma -->
          <div class="lang-toggle">
            <button [class.active]="i18n.lang() === 'pt'" (click)="i18n.setLanguage('pt')">PT</button>
            <span class="lang-sep">|</span>
            <button [class.active]="i18n.lang() === 'en'" (click)="i18n.setLanguage('en')">EN</button>
          </div>

          <!-- Toggle tema -->
          <button class="theme-toggle" (click)="theme.toggle()" [title]="i18n.t('nav.toggleTheme')">
            <span class="theme-icon">{{ theme.theme() === 'dark' ? '☀️' : '🌙' }}</span>
          </button>

          <!-- User menu -->
          @if (auth.isLoggedIn()) {
            <div class="user-menu">
              <button class="user-btn" (click)="userMenuOpen.set(!userMenuOpen())">
                <span class="user-avatar">{{ getInitial() }}</span>
                <span class="user-name">{{ auth.user()?.name }}</span>
                <span class="chevron" [class.open]="userMenuOpen()">▾</span>
              </button>
              @if (userMenuOpen()) {
                <div class="user-dropdown">
                  <div class="dropdown-header">
                    <strong>{{ auth.user()?.name }}</strong>
                    <small>{{ auth.user()?.email }}</small>
                  </div>
                  <button class="dropdown-item logout" (click)="auth.logout(); userMenuOpen.set(false)">
                    🚪 {{ i18n.t('nav.logout') }}
                  </button>
                </div>
              }
            </div>
          }

          <!-- Hambúrguer mobile -->
          <button class="hamburger" [class.open]="menuOpen()" (click)="menuOpen.set(!menuOpen())">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      <!-- Menu mobile -->
      @if (menuOpen()) {
        <div class="mobile-menu">
          @if (auth.isLoggedIn()) {
            <a routerLink="/dashboard"  routerLinkActive="active" (click)="menuOpen.set(false)">{{ i18n.t('nav.dashboard') }}</a>
            <a routerLink="/favourites" routerLinkActive="active" (click)="menuOpen.set(false)">{{ i18n.t('nav.favourites') }}</a>
            <a routerLink="/history"    routerLinkActive="active" (click)="menuOpen.set(false)">{{ i18n.t('nav.history') }}</a>
            <a routerLink="/compare"    routerLinkActive="active" (click)="menuOpen.set(false)">{{ i18n.t('nav.compare') }}</a>
            <a routerLink="/export"     routerLinkActive="active" (click)="menuOpen.set(false)">{{ i18n.t('nav.export') }}</a>
            <button class="mobile-logout" (click)="auth.logout()">🚪 {{ i18n.t('nav.logout') }}</button>
          }
        </div>
      }
    </nav>
  `,
  styles: [`
    .navbar {
      position: sticky; top: 0; z-index: 100;
      background: var(--color-card-glass);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      border-bottom: 1px solid var(--color-border-light);
      transition: box-shadow var(--transition-normal), background var(--transition-slow);
    }
    .navbar.scrolled { box-shadow: var(--shadow-md); }

    .nav-inner {
      max-width: 1100px; margin: 0 auto;
      display: flex; align-items: center; gap: 1rem;
      padding: 0 1.5rem; height: 60px;
    }

    /* Logo */
    .nav-logo {
      display: flex; align-items: center; gap: .5rem;
      text-decoration: none; flex-shrink: 0;
    }
    .logo-icon { font-size: 1.4rem; }
    .logo-text {
      font-family: var(--font-display); font-weight: 800; font-size: 1.05rem;
      color: var(--color-text-primary); letter-spacing: -.03em;
    }

    /* Links */
    .nav-links {
      display: flex; list-style: none; gap: .25rem; flex: 1; margin-left: 1.5rem;
    }
    .nav-links a {
      display: block; padding: .4rem .8rem; border-radius: var(--radius-md);
      font-size: .875rem; font-weight: 500; color: var(--color-text-secondary);
      text-decoration: none; transition: all var(--transition-fast);
    }
    .nav-links a:hover { color: var(--color-text-primary); background: var(--color-overlay); }
    .nav-links a.active {
      color: var(--color-primary); background: rgba(59,130,246,.1);
      font-weight: 600;
    }

    /* Acções */
    .nav-actions { display: flex; align-items: center; gap: .6rem; margin-left: auto; }

    /* Idioma */
    .lang-toggle {
      display: flex; align-items: center; gap: .2rem;
      background: var(--color-bg-secondary); border-radius: var(--radius-md);
      padding: .25rem .4rem; border: 1px solid var(--color-border);
    }
    .lang-toggle button {
      background: none; border: none; cursor: pointer; font-size: .75rem;
      font-weight: 600; font-family: var(--font-display); color: var(--color-text-muted);
      padding: .15rem .35rem; border-radius: 5px; transition: all var(--transition-fast);
    }
    .lang-toggle button.active {
      background: var(--color-primary); color: #fff;
      box-shadow: 0 1px 4px rgba(59,130,246,.4);
    }
    .lang-sep { color: var(--color-border); font-size: .7rem; }

    /* Tema */
    .theme-toggle {
      width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
      background: var(--color-bg-secondary); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); cursor: pointer; font-size: 1rem;
      transition: all var(--transition-fast);
    }
    .theme-toggle:hover { background: var(--color-border); transform: scale(1.08); }

    /* User */
    .user-menu { position: relative; }
    .user-btn {
      display: flex; align-items: center; gap: .5rem;
      background: var(--color-bg-secondary); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); padding: .3rem .7rem .3rem .4rem;
      cursor: pointer; transition: all var(--transition-fast);
    }
    .user-btn:hover { background: var(--color-border); }
    .user-avatar {
      width: 26px; height: 26px; border-radius: 50%;
      background: var(--color-primary); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-size: .75rem; font-weight: 700; flex-shrink: 0;
    }
    .user-name { font-size: .825rem; font-weight: 500; max-width: 90px;
                 overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .chevron { font-size: .65rem; color: var(--color-text-muted); transition: transform var(--transition-fast); }
    .chevron.open { transform: rotate(180deg); }

    .user-dropdown {
      position: absolute; top: calc(100% + .5rem); right: 0;
      min-width: 200px; background: var(--color-card);
      border: 1px solid var(--color-border); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg); overflow: hidden;
      animation: fadeIn .15s ease both;
    }
    .dropdown-header {
      padding: .9rem 1rem; border-bottom: 1px solid var(--color-border-light);
      display: flex; flex-direction: column; gap: .15rem;
    }
    .dropdown-header strong { font-size: .9rem; }
    .dropdown-header small { font-size: .78rem; color: var(--color-text-muted); }
    .dropdown-item {
      width: 100%; padding: .7rem 1rem; background: none; border: none;
      text-align: left; font-size: .875rem; cursor: pointer; display: flex;
      align-items: center; gap: .5rem; transition: background var(--transition-fast);
    }
    .dropdown-item:hover { background: var(--color-bg-secondary); }
    .dropdown-item.logout { color: #b91c1c; }
    [data-theme="dark"] .dropdown-item.logout { color: #fca5a5; }

    /* Hambúrguer */
    .hamburger {
      display: none; flex-direction: column; gap: 4px;
      background: none; border: none; cursor: pointer; padding: 6px;
    }
    .hamburger span {
      display: block; width: 20px; height: 2px;
      background: var(--color-text-primary); border-radius: 2px;
      transition: all var(--transition-fast); transform-origin: center;
    }
    .hamburger.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
    .hamburger.open span:nth-child(2) { opacity: 0; }
    .hamburger.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

    /* Mobile menu */
    .mobile-menu {
      display: flex; flex-direction: column;
      border-top: 1px solid var(--color-border-light);
      padding: .75rem 1.25rem 1rem;
      animation: fadeUp .2s ease both;
      gap: .15rem;
    }
    .mobile-menu a {
      padding: .6rem .75rem; border-radius: var(--radius-md);
      font-size: .9rem; font-weight: 500; color: var(--color-text-secondary);
      text-decoration: none; transition: all var(--transition-fast);
    }
    .mobile-menu a.active, .mobile-menu a:hover {
      color: var(--color-primary); background: rgba(59,130,246,.08);
    }
    .mobile-logout {
      margin-top: .5rem; padding: .6rem .75rem; border-radius: var(--radius-md);
      background: none; border: 1px solid #fecaca; color: #b91c1c;
      font-size: .875rem; font-weight: 500; cursor: pointer; text-align: left;
      transition: background var(--transition-fast);
    }
    .mobile-logout:hover { background: #fef2f2; }
    [data-theme="dark"] .mobile-logout { border-color: #7f1d1d; color: #fca5a5; }
    [data-theme="dark"] .mobile-logout:hover { background: #2d0a0a; }

    @media (max-width: 768px) {
      .nav-links { display: none; }
      .user-name  { display: none; }
      .hamburger  { display: flex; }
    }
  `]
})
export class NavbarComponent {
  auth  = inject(AuthService);
  theme = inject(ThemeService);
  i18n  = inject(I18nService);

  menuOpen     = signal(false);
  userMenuOpen = signal(false);
  scrolled     = signal(false);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => this.scrolled.set(window.scrollY > 10));
      document.addEventListener('click', (e) => {
        if (!(e.target as HTMLElement).closest('.user-menu')) this.userMenuOpen.set(false);
      });
    }
  }

  getInitial(): string {
    return (this.auth.user()?.name ?? 'U')[0].toUpperCase();
  }
}
