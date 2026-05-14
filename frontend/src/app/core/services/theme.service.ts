// Decisão técnica: tema persiste no localStorage e é aplicado no elemento raiz para CSS global.

import { Injectable, signal } from '@angular/core';
import { ThemeName } from './api.types';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'weather_theme';
  readonly theme = signal<ThemeName>(this.restoreTheme());

  constructor() {
    this.apply(this.theme());
  }

  toggle(): void {
    const next: ThemeName = this.theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  setTheme(theme: ThemeName): void {
    localStorage.setItem(this.storageKey, theme);
    this.theme.set(theme);
    this.apply(theme);
  }

  private apply(theme: ThemeName): void {
    document.documentElement.dataset['theme'] = theme;
  }

  private restoreTheme(): ThemeName {
    return localStorage.getItem(this.storageKey) === 'dark' ? 'dark' : 'light';
  }
}
