import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { WeatherService } from '../../../core/services/weather.service';
import { ExportService } from '../../../core/services/export.service';
import { I18nService } from '../../../core/services/i18n.service';
import { SearchHistoryItem } from '../../../core/services/api.types';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { TemperaturePipe } from '../../../shared/pipes/temperature.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { translateCountry } from '../../../core/services/country-names';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [DateFormatPipe, TemperaturePipe, LoadingSpinnerComponent, RouterLink],
  template: `
    <div class="hist-page">

      <!-- ── Header ── -->
      <div class="hist-header">
        <div>
          <h2 class="hist-title">📋 {{ i18n.t('history.title') }}</h2>
          @if (!loading() && history().length) {
            <p class="hist-subtitle">
              {{ history().length }} {{ history().length === 1 ? 'pesquisa registada' : 'pesquisas registadas' }}
            </p>
          }
        </div>
        <div class="hist-actions">
          <div class="hist-view-toggle">
            <button [class.active]="viewMode() === 'table'" (click)="viewMode.set('table')" title="Tabela">☰</button>
            <button [class.active]="viewMode() === 'cards'" (click)="viewMode.set('cards')" title="Cards">⊞</button>
          </div>
          <button class="hist-btn hist-btn--export" (click)="exportCsv()" [disabled]="!history().length">
            📊 {{ i18n.t('history.exportCsv') }}
          </button>
          @if (history().length) {
            <button class="hist-btn hist-btn--clear" (click)="clearAll()" [disabled]="clearing()">
              {{ clearing() ? '⏳' : '🗑 ' + i18n.t('history.clear') }}
            </button>
          }
        </div>
      </div>

      <!-- ── Toasts ── -->
      @if (successMsg()) {
        <div class="hist-toast hist-toast--success">✅ {{ successMsg() }}</div>
      }
      @if (errorMsg()) {
        <div class="hist-toast hist-toast--error">⚠️ {{ errorMsg() }}</div>
      }

      <app-loading-spinner [visible]="loading()" [inline]="true" />

      <!-- ── Stats clicáveis ── -->
      @if (!loading() && history().length >= 2) {
        <div class="hist-stats">
          <button class="hist-stat hist-stat--btn" (click)="goToCity(topCity())" title="Ver no dashboard">
            <span class="hist-stat__icon">🏙</span>
            <div>
              <div class="hist-stat__val">{{ topCity() }}</div>
              <div class="hist-stat__lbl">Mais pesquisada</div>
            </div>
            <span class="hist-stat__arrow">›</span>
          </button>
          <button class="hist-stat hist-stat--btn" (click)="goToCity(avgCity())" title="Ver no dashboard">
            <span class="hist-stat__icon">🌡</span>
            <div>
              <div class="hist-stat__val">{{ avgTemp() !== null ? avgTemp() + '°C' : '—' }}</div>
              <div class="hist-stat__lbl">Temperatura média</div>
            </div>
            <span class="hist-stat__arrow">›</span>
          </button>
          <button class="hist-stat hist-stat--btn" (click)="goToCity(hottestCity())" title="Ver no dashboard">
            <span class="hist-stat__icon">🔥</span>
            <div>
              <div class="hist-stat__val">{{ maxTemp() !== null ? maxTemp() + '°C' : '—' }}</div>
              <div class="hist-stat__lbl">Temperatura máxima</div>
            </div>
            <span class="hist-stat__arrow">›</span>
          </button>
          <button class="hist-stat hist-stat--btn" (click)="goToCity(coldestCity())" title="Ver no dashboard">
            <span class="hist-stat__icon">🧊</span>
            <div>
              <div class="hist-stat__val">{{ minTemp() !== null ? minTemp() + '°C' : '—' }}</div>
              <div class="hist-stat__lbl">Temperatura mínima</div>
            </div>
            <span class="hist-stat__arrow">›</span>
          </button>
        </div>
      }

      <!-- ── Empty ── -->
      @if (!loading() && history().length === 0) {
        <div class="hist-empty">
          <span class="hist-empty__icon">🔍</span>
          <p>{{ i18n.t('history.empty') }}</p>
          <a routerLink="/dashboard" class="hist-btn-primary">Pesquisar uma cidade</a>
        </div>
      }

      <!-- ── Modo tabela ── -->
      @if (!loading() && viewMode() === 'table' && history().length > 0) {
        <div class="hist-table-wrap">
          <table class="hist-table">
            <thead>
              <tr>
                <th>{{ i18n.t('history.colDate') }}</th>
                <th>{{ i18n.t('history.colCity') }}</th>
                <th>{{ i18n.t('history.colCountry') }}</th>
                <th>{{ i18n.t('history.colTemp') }}</th>
                <th>{{ i18n.t('history.colCondition') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (item of history(); track item.id) {
                <tr>
                  <td class="hist-td--date">{{ item.searched_at | dateFormat }}</td>
                  <td><strong class="hist-city-name">{{ item.city_name }}</strong></td>
                  <td class="hist-td--muted">{{ countryName(item) }}</td>
                  <td>
                    @if (item.temperature !== null && item.temperature !== undefined) {
                      <span class="hist-temp-pill" [class]="tempPillClass(item.temperature)">
                        {{ item.temperature | temperature }}
                      </span>
                    } @else { <span class="hist-td--muted">—</span> }
                  </td>
                  <td class="hist-td--muted">{{ item.condition_text || '—' }}</td>
                  <td>
                    <button class="hist-btn-link" (click)="goToCity(item.city_name)" title="Ver no dashboard">🔍</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ── Modo cards ── -->
      @if (!loading() && viewMode() === 'cards' && history().length > 0) {
        <div class="hist-cards">
          @for (item of history(); track item.id) {
            <div class="hist-card" (click)="goToCity(item.city_name)" role="button" tabindex="0"
                 (keydown.enter)="goToCity(item.city_name)">
              <div class="hist-card__left">
                <span class="hist-card__icon">{{ conditionIcon(item.condition_text) }}</span>
                <div>
                  <div class="hist-card__city">{{ item.city_name }}</div>
                  <div class="hist-card__country">{{ countryName(item) }}</div>
                  <div class="hist-card__date">{{ item.searched_at | dateFormat }}</div>
                </div>
              </div>
              <div class="hist-card__right">
                @if (item.temperature !== null && item.temperature !== undefined) {
                  <span class="hist-temp-pill" [class]="tempPillClass(item.temperature)">
                    {{ item.temperature | temperature }}
                  </span>
                }
                <span class="hist-card__cond">{{ item.condition_text || '—' }}</span>
                <span class="hist-card__go">🔍</span>
              </div>
            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    /* ── Página ── */
    .hist-page {
      max-width: 960px;
      margin: 0 auto;
      padding: 1.75rem 1.25rem 3rem;
    }

    /* ── Header ── */
    .hist-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: .75rem;
    }
    .hist-title {
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: -.02em;
      color: var(--foreground);
      margin: 0 0 .2rem;
    }
    .hist-subtitle {
      margin: 0;
      font-size: .82rem;
      color: var(--muted-fg);
    }
    .hist-actions {
      display: flex;
      gap: .5rem;
      flex-wrap: wrap;
      align-items: center;
    }

    /* ── View toggle ── */
    .hist-view-toggle {
      display: flex;
      border: 1.5px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .hist-view-toggle button {
      border: none;
      background: none;
      padding: .4rem .75rem;
      font-size: .95rem;
      cursor: pointer;
      color: var(--muted-fg);
      transition: background var(--t), color var(--t);
    }
    .hist-view-toggle button.active {
      background: var(--primary);
      color: var(--primary-fg);
    }

    /* ── Botões ── */
    .hist-btn {
      border: none;
      border-radius: var(--radius);
      padding: .5rem 1rem;
      cursor: pointer;
      font-size: .85rem;
      font-weight: 500;
      transition: opacity var(--t);
    }
    .hist-btn:disabled { opacity: .5; cursor: not-allowed; }
    .hist-btn--export { background: var(--primary); color: var(--primary-fg); }
    .hist-btn--clear {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    [data-theme="dark"] .hist-btn--clear { background: rgba(239,68,68,.15); color: #fca5a5; border-color: rgba(239,68,68,.25); }
    .hist-btn-primary {
      display: inline-block;
      background: var(--primary);
      color: var(--primary-fg);
      border: none;
      border-radius: var(--radius);
      padding: .6rem 1.4rem;
      font-size: .9rem;
      font-weight: 600;
      text-decoration: none;
    }

    /* ── Toasts ── */
    .hist-toast {
      padding: .75rem 1rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
      font-size: .875rem;
      font-weight: 500;
      animation: slideDown .25s ease;
    }
    .hist-toast--success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .hist-toast--error   { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    [data-theme="dark"] .hist-toast--success { background: #052e16; color: #86efac; border-color: #166534; }
    [data-theme="dark"] .hist-toast--error   { background: #2d0a0a; color: #fca5a5; border-color: #7f1d1d; }
    @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }

    /* ── Stats ── */
    .hist-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: .75rem;
      margin-bottom: 1.25rem;
    }
    .hist-stat {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: calc(var(--radius) * 1.2);
      padding: .85rem 1rem;
      display: flex;
      align-items: center;
      gap: .75rem;
      box-shadow: var(--shadow-sm);
    }
    .hist-stat--btn {
      cursor: pointer;
      text-align: left;
      width: 100%;
      transition: border-color var(--t), transform var(--t), box-shadow var(--t);
    }
    .hist-stat--btn:hover {
      border-color: var(--primary);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .hist-stat--btn:hover .hist-stat__arrow { opacity: 1; }
    .hist-stat__icon { font-size: 1.4rem; flex-shrink: 0; }
    .hist-stat__val  { font-size: .95rem; font-weight: 700; color: var(--foreground); }
    .hist-stat__lbl  {
      font-size: .7rem;
      color: var(--muted-fg);
      margin-top: .1rem;
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    .hist-stat__arrow {
      margin-left: auto;
      font-size: 1.1rem;
      color: var(--primary);
      opacity: 0;
      transition: opacity var(--t);
      flex-shrink: 0;
    }

    /* ── Empty ── */
    .hist-empty {
      text-align: center;
      padding: 3.5rem 1rem;
      color: var(--muted-fg);
    }
    .hist-empty__icon { font-size: 2.5rem; display: block; margin-bottom: .75rem; }
    .hist-empty p     { margin-bottom: 1.2rem; font-size: .95rem; color: var(--muted-fg); }
    .hist-empty strong { color: var(--foreground); }

    /* ── Tabela ── */
    .hist-table-wrap {
      overflow-x: auto;
      border-radius: calc(var(--radius) * 1.2);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
    }
    .hist-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card);
    }
    .hist-table th {
      background: var(--secondary);
      padding: .75rem 1rem;
      text-align: left;
      font-size: .78rem;
      font-weight: 600;
      color: var(--muted-fg);
      white-space: nowrap;
      letter-spacing: .04em;
      text-transform: uppercase;
    }
    .hist-table td {
      padding: .7rem 1rem;
      font-size: .875rem;
      color: var(--foreground);
      border-top: 1px solid var(--border);
    }
    .hist-table tr:hover td { background: var(--secondary); }
    .hist-td--date  { white-space: nowrap; color: var(--muted-fg) !important; font-size: .8rem; }
    .hist-td--muted { color: var(--muted-fg) !important; }
    .hist-city-name { font-weight: 600; color: var(--foreground); }

    /* ── Pill de temperatura ── */
    .hist-temp-pill {
      border-radius: 20px;
      padding: .15rem .65rem;
      font-size: .8rem;
      font-weight: 700;
      color: #fff;
      display: inline-block;
    }
    .pill-cold { background: #3b82f6; }
    .pill-mild { background: #10b981; }
    .pill-warm { background: #f59e0b; }
    .pill-hot  { background: #ef4444; }

    /* ── Botão link (tabela) ── */
    .hist-btn-link {
      font-size: .85rem;
      text-decoration: none;
      background: var(--primary);
      color: var(--primary-fg);
      border-radius: 6px;
      padding: .3rem .55rem;
      border: none;
      cursor: pointer;
      transition: opacity var(--t);
      display: inline-flex;
      align-items: center;
    }
    .hist-btn-link:hover { opacity: .85; }

    /* ── Cards ── */
    .hist-cards {
      display: flex;
      flex-direction: column;
      gap: .6rem;
    }
    .hist-card {
      background: var(--card);
      border: 1.5px solid var(--border);
      border-radius: calc(var(--radius) * 1.2);
      padding: .9rem 1.1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: border-color var(--t), transform var(--t), box-shadow var(--t);
    }
    .hist-card:hover {
      border-color: var(--primary);
      transform: translateX(4px);
      box-shadow: var(--shadow-md);
    }
    .hist-card__left {
      display: flex;
      align-items: center;
      gap: .75rem;
    }
    .hist-card__icon    { font-size: 1.8rem; }
    .hist-card__city    { font-size: .95rem; font-weight: 600; color: var(--foreground); }
    .hist-card__country { font-size: .78rem; color: var(--muted-fg); }
    .hist-card__date    { font-size: .75rem; color: var(--muted-fg); margin-top: .1rem; }
    .hist-card__right {
      display: flex;
      align-items: center;
      gap: .6rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .hist-card__cond { font-size: .8rem; color: var(--muted-fg); }
    .hist-card__go   {
      font-size: .9rem;
      opacity: 0;
      transition: opacity var(--t);
      color: var(--primary);
    }
    .hist-card:hover .hist-card__go { opacity: 1; }

    /* ── Responsividade ── */
    @media (max-width: 700px) {
      .hist-stats { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 480px) {
      .hist-stats { grid-template-columns: 1fr 1fr; }
      .hist-table th:nth-child(3),
      .hist-table td:nth-child(3) { display: none; }
      .hist-actions { gap: .35rem; }
    }
  `]
})
export class HistoryComponent implements OnInit, OnDestroy {
  ws            = inject(WeatherService);
  exportService = inject(ExportService);
  i18n          = inject(I18nService);
  router        = inject(Router);

  history    = signal<SearchHistoryItem[]>([]);
  loading    = signal(true);
  clearing   = signal(false);
  successMsg = signal('');
  errorMsg   = signal('');
  viewMode   = signal<'table' | 'cards'>('table');

  private destroy$ = new Subject<void>();

  // ── Computed ──
  avgTemp = computed(() => {
    const t = this.history().filter(h => h.temperature != null).map(h => h.temperature);
    if (!t.length) return null;
    return Math.round(t.reduce((a, b) => a + b, 0) / t.length);
  });

  maxTemp = computed(() => {
    const t = this.history().filter(h => h.temperature != null).map(h => h.temperature);
    return t.length ? Math.round(Math.max(...t)) : null;
  });

  minTemp = computed(() => {
    const t = this.history().filter(h => h.temperature != null).map(h => h.temperature);
    return t.length ? Math.round(Math.min(...t)) : null;
  });

  topCity = computed(() => {
    if (!this.history().length) return '—';
    const freq: Record<string, number> = {};
    this.history().forEach(h => { freq[h.city_name] = (freq[h.city_name] ?? 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  });

  // Cidade com temperatura mais alta
  hottestCity = computed(() => {
    const w = this.history().filter(h => h.temperature != null);
    if (!w.length) return '';
    return w.reduce((a, b) => a.temperature > b.temperature ? a : b).city_name;
  });

  // Cidade com temperatura mais baixa
  coldestCity = computed(() => {
    const w = this.history().filter(h => h.temperature != null);
    if (!w.length) return '';
    return w.reduce((a, b) => a.temperature < b.temperature ? a : b).city_name;
  });

  // Cidade com temperatura mais próxima da média
  avgCity = computed(() => {
    const avg = this.avgTemp();
    if (avg === null) return '';
    const w = this.history().filter(h => h.temperature != null);
    if (!w.length) return '';
    return w.reduce((a, b) =>
      Math.abs(a.temperature - avg) <= Math.abs(b.temperature - avg) ? a : b
    ).city_name;
  });

  // ── Lifecycle ──
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.ws.getHistory().pipe(takeUntil(this.destroy$)).subscribe({
      next:  (res) => { this.history.set(res.data ?? []); this.loading.set(false); },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message ?? 'Erro ao carregar histórico.');
        this.autoHide('error');
      }
    });
  }

  clearAll(): void {
    if (!confirm('Limpar todo o histórico? Esta acção não pode ser desfeita.')) return;
    this.clearing.set(true);
    this.ws.clearHistory().pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.history.set([]);
        this.clearing.set(false);
        this.successMsg.set('Histórico limpo com sucesso.');
        this.autoHide('success');
      },
      error: (err) => {
        this.clearing.set(false);
        this.errorMsg.set(err.error?.message ?? 'Erro ao limpar histórico.');
        this.autoHide('error');
      }
    });
  }

  exportCsv(): void {
    try {
      this.exportService.downloadCsv();
      this.successMsg.set('Exportação CSV iniciada.');
      this.autoHide('success');
    } catch {
      this.errorMsg.set('Erro ao exportar CSV.');
      this.autoHide('error');
    }
  }

  // Navega para o dashboard com a cidade seleccionada
  goToCity(city: string): void {
    if (!city || city === '—') return;
    this.router.navigate(['/dashboard'], { queryParams: { city } });
  }

  // Nome completo do país, traduzido conforme idioma
  countryName(item: SearchHistoryItem): string {
    // O histórico guarda country_code (ISO-2 ou nome EN conforme backend)
    // translateCountry espera nome EN — se for código ISO tenta mesmo assim como fallback
    if (!item.country_code) return '—';
    const translated = translateCountry(item.country_code, this.i18n.lang());
    return translated || item.country_code || '—';
  }

  // ── Helpers visuais ──
  tempPillClass(t: number): string {
    if (t < 10) return 'pill-cold';
    if (t < 20) return 'pill-mild';
    if (t < 30) return 'pill-warm';
    return 'pill-hot';
  }

  conditionIcon(cond: string | undefined): string {
    if (!cond) return '🌤';
    const c = cond.toLowerCase();
    if (c.includes('sun') || c.includes('sol') || c.includes('clear') || c.includes('céu limpo')) return '☀️';
    if (c.includes('cloud') || c.includes('nuvem') || c.includes('nublado')) return '☁️';
    if (c.includes('rain') || c.includes('chuva')) return '🌧';
    if (c.includes('snow') || c.includes('neve')) return '❄️';
    if (c.includes('thunder') || c.includes('trovão') || c.includes('storm')) return '⛈';
    if (c.includes('fog') || c.includes('mist') || c.includes('névoa')) return '🌫️';
    return '🌤';
  }

  private autoHide(type: 'success' | 'error', ms = 3500): void {
    setTimeout(() => {
      if (type === 'success') this.successMsg.set('');
      else this.errorMsg.set('');
    }, ms);
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
