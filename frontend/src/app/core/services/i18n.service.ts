import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';

type Lang = 'pt' | 'en';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private _lang   = signal<Lang>((localStorage.getItem('weather_lang') as Lang) ?? 'pt');
  private _labels = signal<Record<string, string>>({});

  readonly lang         = this._lang.asReadonly();
  readonly labels       = this._labels.asReadonly();

  constructor(private http: HttpClient) {
    this.loadLabels(this._lang());
  }

  setLanguage(lang: Lang): void {
    this._lang.set(lang);
    localStorage.setItem('weather_lang', lang);
    this.loadLabels(lang);
  }

  t(key: string): string {
    return this._labels()[key] ?? key;
  }

  private loadLabels(lang: Lang): void {
    this.http.get<Record<string, string>>(`/assets/i18n/${lang}.json`)
      .subscribe(data => this._labels.set(data));
  }
}
