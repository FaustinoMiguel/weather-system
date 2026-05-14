// Decisão técnica: tradução por signals permite troca imediata de idioma sem recarregar a página.

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Language } from './api.types';

type Dictionary = Record<string, string>;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly storageKey = 'weather_language';
  readonly language = signal<Language>(this.restoreLanguage());
  readonly dictionary = signal<Dictionary>({});

  constructor(private readonly http: HttpClient) {
    this.applyDocumentLanguage(this.language());
    this.load(this.language());
  }

  setLanguage(language: Language): void {
    localStorage.setItem(this.storageKey, language);
    this.language.set(language);
    this.applyDocumentLanguage(language);
    this.load(language);
  }

  t(key: string): string {
    return this.dictionary()[key] ?? key;
  }

  private load(language: Language): void {
    this.http.get<Dictionary>(`/i18n/${language}.json`).subscribe({
      next: (dictionary) => this.dictionary.set(dictionary),
      error: () => this.dictionary.set({})
    });
  }

  private restoreLanguage(): Language {
    return localStorage.getItem(this.storageKey) === 'en' ? 'en' : 'pt';
  }

  private applyDocumentLanguage(language: Language): void {
    document.documentElement.lang = language;
  }
}
