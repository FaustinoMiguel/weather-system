import { Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _theme = signal<Theme>((localStorage.getItem('weather_theme') as Theme) ?? 'light');
  readonly theme  = this._theme.asReadonly();

  constructor() { this.applyTheme(this._theme()); }

  toggle(): void {
    const next = this._theme() === 'light' ? 'dark' : 'light';
    this._theme.set(next);
    localStorage.setItem('weather_theme', next);
    this.applyTheme(next);
  }

  set(theme: Theme): void {
    this._theme.set(theme);
    localStorage.setItem('weather_theme', theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark', theme === 'dark');
  }
}
