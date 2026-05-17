import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ExportService } from '../../core/services/export.service';
import { I18nService } from '../../core/services/i18n.service';
import { translateCountry } from '../../core/services/country-names';
import { environment } from '../../../environments/environment';

interface CitySuggestion {
  name: string; country: string; admin1: string;
  latitude: number; longitude: number;
}

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-container">
      <h2>📤 {{ i18n.t('export.title') }}</h2>
      <p class="subtitle">{{ i18n.t('export.subtitle') }}</p>

      <div class="export-cards">

        <!-- CSV -->
        <div class="export-card">
          <div class="export-icon">📊</div>
          <h3>{{ i18n.t('export.csvTitle') }}</h3>
          <p>{{ i18n.t('export.csvDesc') }}</p>
          <button class="btn-export csv" (click)="downloadCsv()" [disabled]="csvLoading()">
            @if (csvLoading()) { ⏳ A gerar… } @else { {{ i18n.t('export.downloadCsv') }} }
          </button>
        </div>

        <!-- PDF -->
        <div class="export-card">
          <div class="export-icon">📄</div>
          <h3>{{ i18n.t('export.pdfTitle') }}</h3>
          <p>{{ i18n.t('export.pdfDesc') }}</p>

          <div class="pdf-city-wrap">
            <div class="pdf-city-input" [class.focused]="inputFocused">
              <span class="city-input-icon">🔍</span>
              <input
                type="text"
                [(ngModel)]="cityInputText"
                (ngModelChange)="onCityInput($event)"
                (focus)="inputFocused = true"
                (blur)="onBlur()"
                (keydown.enter)="selectFirst()"
                (keydown.escape)="closeSuggestions()"
                [placeholder]="i18n.t('export.pdfCityPlaceholder')"
                autocomplete="off" />
              @if (cityInputText) {
                <button class="clear-btn" (mousedown)="$event.preventDefault()" (click)="clearCity()">✕</button>
              }
            </div>

            @if (suggestions().length && showSuggestions) {
              <div class="city-dropdown">
                @for (s of suggestions(); track s.latitude) {
                  <button class="city-sug-item"
                          (mousedown)="$event.preventDefault()"
                          (click)="selectCity(s)">
                    <span class="sug-pin">📍</span>
                    <div class="sug-info">
                      <span class="sug-name">{{ s.name }}{{ s.admin1 ? ', ' + s.admin1 : '' }}</span>
                      <span class="sug-country">{{ s.country }}</span>
                    </div>
                  </button>
                }
              </div>
            }

            @if (sugLoading()) {
              <div class="sug-loading">A pesquisar…</div>
            }

            @if (selectedCity()) {
              <div class="selected-badge">
                ✅ <strong>{{ selectedCity() }}</strong>
              </div>
            }
          </div>

          <button class="btn-export pdf" (click)="downloadPdf()" [disabled]="pdfLoading()">
            @if (pdfLoading()) { ⏳ A gerar… } @else { {{ i18n.t('export.downloadPdf') }} }
          </button>
        </div>

      </div>

      @if (message()) {
        <div class="status-msg" [class.status-error]="isError()">{{ message() }}</div>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 800px; margin: 0 auto; padding: 1.5rem 1rem; }
    h2 { font-size: 1.3rem; font-weight: 600; margin-bottom: .25rem; }
    .subtitle { color: var(--muted-fg, var(--color-text-secondary)); font-size: .9rem; margin-bottom: 2rem; }

    .export-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .export-card {
      background: var(--card, var(--color-card)); border-radius: 14px; padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,.07); display: flex; flex-direction: column; gap: .75rem;
      border: 1.5px solid var(--border, transparent);
    }
    .export-icon { font-size: 2.5rem; }
    .export-card h3 { margin: 0; font-size: 1.05rem; }
    .export-card p  { margin: 0; font-size: .88rem; color: var(--muted-fg, var(--color-text-secondary)); flex: 1; }

    .pdf-city-wrap { position: relative; }
    .pdf-city-input {
      display: flex; align-items: center; gap: .45rem;
      border: 2px solid var(--border, var(--input-border));
      border-radius: 10px; padding: .5rem .75rem;
      background: var(--background, var(--input-bg));
      transition: border-color .15s, box-shadow .15s;
    }
    .pdf-city-input.focused {
      border-color: var(--primary, var(--input-focus-border));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary, #3b82f6) 15%, transparent);
    }
    .city-input-icon { font-size: .85rem; flex-shrink: 0; opacity: .6; }
    .pdf-city-input input {
      flex: 1; border: none; background: transparent; font-size: .9rem;
      color: var(--foreground, var(--input-text)); outline: none; min-width: 0;
    }
    .pdf-city-input input::placeholder { color: var(--muted-fg, var(--input-placeholder)); opacity: .8; }
    .clear-btn {
      border: none; background: none; cursor: pointer; font-size: .8rem;
      color: var(--muted-fg); padding: 0 .1rem; flex-shrink: 0; opacity: .7;
      transition: opacity .15s;
    }
    .clear-btn:hover { opacity: 1; }

    .city-dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 50;
      background: var(--card, white); border: 1.5px solid var(--border);
      border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.13);
      overflow: hidden; max-height: 220px; overflow-y: auto;
    }
    .city-sug-item {
      width: 100%; display: flex; align-items: center; gap: .65rem;
      padding: .6rem .9rem; border: none; background: none; cursor: pointer;
      text-align: left; transition: background .12s;
    }
    .city-sug-item:hover { background: var(--secondary, #f3f4f6); }
    .sug-pin { font-size: .95rem; flex-shrink: 0; }
    .sug-info { display: flex; flex-direction: column; gap: .05rem; min-width: 0; }
    .sug-name { font-size: .875rem; font-weight: 600; color: var(--foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sug-country { font-size: .75rem; color: var(--muted-fg); }

    .sug-loading { font-size: .8rem; color: var(--muted-fg); padding: .4rem .75rem; }

    .selected-badge {
      margin-top: .4rem; font-size: .8rem; color: #166534;
      background: #dcfce7; border-radius: 6px; padding: .3rem .6rem;
      border: 1px solid #bbf7d0;
    }
    [data-theme="dark"] .selected-badge { background: #052e16; color: #86efac; border-color: #166534; }

    .btn-export {
      border: none; border-radius: 10px; padding: .65rem 1.2rem; cursor: pointer;
      font-size: .9rem; font-weight: 500; width: 100%; transition: opacity .2s;
    }
    .btn-export.csv { background: #10b981; color: #fff; }
    .btn-export.pdf { background: var(--primary, var(--color-primary)); color: #fff; }
    .btn-export:hover:not(:disabled) { opacity: .85; }
    .btn-export:disabled { opacity: .55; cursor: not-allowed; }

    .status-msg {
      margin-top: 1.25rem; background: var(--secondary, var(--color-bg-secondary));
      border-radius: 8px; padding: .75rem 1rem; font-size: .9rem;
      color: var(--muted-fg, var(--color-text-secondary)); border: 1px solid var(--border);
    }
    .status-msg.status-error { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
    [data-theme="dark"] .status-msg.status-error { background: #2d0a0a; color: #fca5a5; border-color: #7f1d1d; }

    @media (max-width: 600px) { .export-cards { grid-template-columns: 1fr; } }
  `]
})
export class ExportComponent implements OnDestroy {
  exportService = inject(ExportService);
  i18n          = inject(I18nService);
  http          = inject(HttpClient);

  cityInputText      = '';
  selectedCity       = signal('');   // badge de display ("Lisboa, Portugal")
  selectedCityName   = signal('');   // nome limpo para a API ("Lisboa")
  suggestions     = signal<CitySuggestion[]>([]);
  sugLoading      = signal(false);
  csvLoading      = signal(false);
  pdfLoading      = signal(false);
  showSuggestions = false;
  inputFocused    = false;
  message         = signal('');
  isError         = signal(false);

  private city$    = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
    this.city$.pipe(
      debounceTime(280),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => this.fetchSuggestions(q));
  }

  onCityInput(v: string): void {
    this.selectedCity.set('');
    this.selectedCityName.set(''); // utilizador voltou a escrever — limpa cidade confirmada
    if (v.length >= 2) { this.sugLoading.set(true); this.city$.next(v); }
    else { this.suggestions.set([]); this.sugLoading.set(false); }
  }

  private fetchSuggestions(q: string): void {
    const lang   = this.i18n.lang();
    const params = new HttpParams().set('q', q).set('lang', lang);
    this.http.get<{ success: boolean; data: CitySuggestion[] }>(
      `${environment.apiUrl}/weather/suggest`, { params }
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        const list = (r.data ?? []).map(s => ({ ...s, country: translateCountry(s.country, lang) }));
        this.suggestions.set(list);
        this.showSuggestions = true;
        this.sugLoading.set(false);
      },
      error: () => { this.suggestions.set([]); this.sugLoading.set(false); }
    });
  }

  selectCity(s: CitySuggestion): void {
    this.cityInputText = s.name;
    this.selectedCityName.set(s.name);                                      // nome confirmado para a API
    this.selectedCity.set(`${s.name}${s.country ? ', ' + s.country : ''}`); // badge de display
    this.suggestions.set([]);
    this.showSuggestions = false;
  }

  selectFirst(): void {
    const list = this.suggestions();
    if (list.length) this.selectCity(list[0]);
  }

  clearCity(): void {
    this.cityInputText = '';
    this.selectedCity.set('');
    this.selectedCityName.set('');
    this.suggestions.set([]);
    this.showSuggestions = false;
  }

  onBlur(): void {
    this.inputFocused = false;
    setTimeout(() => { this.showSuggestions = false; }, 150);
  }

  closeSuggestions(): void {
    this.suggestions.set([]);
    this.showSuggestions = false;
  }

  // FIX: subscreve o Observable e trata erros correctamente
  downloadCsv(): void {
    this.csvLoading.set(true);
    this.isError.set(false);
    this.message.set(this.i18n.t('export.downloadingCsv'));

    this.exportService.downloadCsv()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: blob => {
          this.exportService.triggerDownload(blob, this.exportService.csvFilename());
          this.csvLoading.set(false);
          setTimeout(() => this.message.set(''), 3500);
        },
        error: () => {
          this.csvLoading.set(false);
          this.isError.set(true);
          this.message.set('Erro ao gerar o ficheiro CSV. Tente novamente.');
          setTimeout(() => this.message.set(''), 4000);
        }
      });
  }

  // FIX: subscreve o Observable, activa loading real e trata erros
  downloadPdf(): void {
    // Validação: exige cidade seleccionada
    const city = this.selectedCityName() || this.cityInputText.trim() || undefined;
    if (!city) {
      this.isError.set(true);
      this.message.set('Por favor selecione uma cidade antes de gerar o relatório PDF.');
      setTimeout(() => this.message.set(''), 4000);
      return;
    }

    this.pdfLoading.set(true);
    this.isError.set(false);
    this.message.set(this.i18n.t('export.downloadingPdf'));

    this.exportService.downloadPdf(city)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: blob => {
          this.exportService.triggerDownload(blob, this.exportService.pdfFilename());
          this.pdfLoading.set(false);
          setTimeout(() => this.message.set(''), 3500);
        },
        error: () => {
          this.pdfLoading.set(false);
          this.isError.set(true);
          this.message.set('Erro ao gerar o relatório PDF. Tente novamente.');
          setTimeout(() => this.message.set(''), 4000);
        }
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
