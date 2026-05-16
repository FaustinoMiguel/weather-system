import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { WeatherService } from '../../../core/services/weather.service';
import { ExportService } from '../../../core/services/export.service';
import { I18nService } from '../../../core/services/i18n.service';
import { WeatherData, ForecastDay, FavouriteCity, SearchHistoryItem } from '../../../core/services/api.types';
import { TemperaturePipe } from '../../../shared/pipes/temperature.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { environment } from '../../../../environments/environment';

interface Suggestion {
  name: string; country: string; country_code: string;
  admin1: string; latitude: number; longitude: number; timezone: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, RouterLink, TemperaturePipe, DateFormatPipe],
  template: `
    <div class="main-inner">

      <!-- Header -->
      <header class="dash-header">
        <div class="dash-greeting">
          <h1>{{ greeting() }}, {{ userName() }}</h1>
          <p>{{ i18n.t('dashboard.headerSub') }}</p>
        </div>
        <div class="dash-controls">
          <!-- Search with suggestions -->
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              [(ngModel)]="cityInput"
              (ngModelChange)="onSearchInput($event)"
              (keydown.enter)="searchFirst()"
              (keydown.escape)="closeSuggestions()"
              [placeholder]="i18n.t('dashboard.searchPlaceholder')"
              autocomplete="off" />
            <button class="icon-btn" style="border:none;background:none;margin-left:.25rem"
                    (click)="loadGpsLocation()" [title]="i18n.t('dashboard.useGps')" [disabled]="gpsLoading()">
              {{ gpsLoading() ? '⏳' : '📍' }}
            </button>

            @if (suggestions().length) {
              <div class="suggestions-dropdown">
                @for (s of suggestions(); track s.latitude) {
                  <button class="suggestion-item" (click)="selectSuggestion(s)">
                    <span class="suggestion-pin">📍</span>
                    <div>
                      <div class="suggestion-city">{{ s.name }}{{ s.admin1 ? ', ' + s.admin1 : '' }}</div>
                      <div class="suggestion-region">{{ s.country }}</div>
                    </div>
                  </button>
                }
              </div>
            }
          </div>

          <!-- Notificações -->
          <button class="icon-btn" [title]="i18n.t('nav.notifications') || 'Notificações'">
            🔔
            @if (weather()?.is_extreme) {
              <span class="notif-dot"></span>
            }
          </button>
        </div>
      </header>

      <!-- Erros -->
      @if (error()) {
        <div class="alert-error" style="margin-bottom:1rem;border-radius:var(--radius)">⚠️ {{ error() }}</div>
      }
      @if (gpsError()) {
        <div class="alert-error" style="margin-bottom:1rem;border-radius:var(--radius)">📍 {{ gpsError() }}</div>
      }

      <!-- Grid principal -->
      <div class="dash-grid">

        <!-- ── Coluna principal ── -->
        <div class="col-main">

          <!-- Linha: Current + Weekly Cards -->
          <div style="display:grid;grid-template-columns:2fr 3fr;gap:1.25rem">

            <!-- Current Weather -->
            <div class="card current-weather-card">
              @if (loading()) {
                <div style="display:flex;flex-direction:column;gap:.75rem">
                  <div class="skeleton" style="height:14px;width:60%;border-radius:6px"></div>
                  <div class="skeleton" style="height:80px;width:80%;border-radius:8px"></div>
                  <div class="skeleton" style="height:14px;width:40%;border-radius:6px"></div>
                </div>
              } @else if (weather()) {
                <div class="cw-location">
                  <span>📍</span>
                  <span>{{ weather()!.city }}, {{ weather()!.country }}</span>
                </div>
                <p class="cw-date">{{ today() }}</p>

                <div class="cw-main">
                  <div>
                    <div style="display:flex;align-items:flex-start">
                      <span class="cw-temp-val">{{ weather()!.temperature | temperature:'':0 }}</span>
                      <span class="cw-temp-unit">°C</span>
                    </div>
                    <p class="cw-feels">{{ i18n.t('weather.feelsLike') }} {{ weather()!.feels_like | temperature }}</p>
                    <p class="cw-cond-label">{{ weather()!.condition }}</p>
                  </div>
                  <div class="cw-icon">{{ getIcon(weather()!.condition_code, weather()!.is_day) }}</div>
                </div>

                <div class="cw-metrics">
                  <div class="cw-metric">
                    <div class="cw-metric-icon">💨</div>
                    <div>
                      <div class="cw-metric-label">{{ i18n.t('weather.wind') }}</div>
                      <div class="cw-metric-val">{{ weather()!.wind_speed }} km/h</div>
                    </div>
                  </div>
                  <div class="cw-metric">
                    <div class="cw-metric-icon">💧</div>
                    <div>
                      <div class="cw-metric-label">{{ i18n.t('weather.humidity') }}</div>
                      <div class="cw-metric-val">{{ weather()!.humidity }}%</div>
                    </div>
                  </div>
                  <div class="cw-metric">
                    <div class="cw-metric-icon">👁</div>
                    <div>
                      <div class="cw-metric-label">{{ i18n.t('weather.cloudCover') }}</div>
                      <div class="cw-metric-val">{{ weather()!.cloud_cover }}%</div>
                    </div>
                  </div>
                </div>

                <div class="cw-hilo">
                  <span class="cw-hi">▲ {{ maxTemp() }}°</span>
                  <span class="cw-lo">▼ {{ minTemp() }}°</span>
                </div>

                <!-- Acções favorito + PDF -->
                <div style="display:flex;gap:.5rem;margin-top:1rem">
                  <button (click)="toggleFav()" style="flex:1;padding:.45rem;border-radius:var(--radius);
                    border:1px solid var(--border);background:var(--secondary);font-size:.78rem;font-weight:600;
                    cursor:pointer;transition:all var(--t)"
                    [style.background]="isFav() ? 'rgba(217,119,6,.12)' : ''"
                    [style.border-color]="isFav() ? 'rgba(217,119,6,.4)' : ''">
                    {{ isFav() ? '💛 ' + i18n.t('weather.removeFromFav') : '🤍 ' + i18n.t('weather.addToFav') }}
                  </button>
                  <button (click)="exportService.downloadPdf(weather()!.city)"
                    style="padding:.45rem .7rem;border-radius:var(--radius);border:1px solid var(--border);
                    background:var(--secondary);cursor:pointer;font-size:.85rem;transition:all var(--t)">
                    📄
                  </button>
                </div>
              } @else {
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                            height:100%;gap:.75rem;color:var(--muted-fg);padding:2rem 1rem;text-align:center">
                  <span style="font-size:3rem;opacity:.4">🌤</span>
                  <p style="font-size:.875rem">{{ gpsLoading() ? i18n.t('dashboard.detectingLocation') : i18n.t('dashboard.searchPrompt') }}</p>
                </div>
              }
            </div>

            <!-- 7-day forecast cards -->
            <div class="card card-pad">
              <div class="card-title">{{ i18n.t('dashboard.forecast7days') }}</div>
              @if (forecast().length) {
                <div class="weekly-row">
                  @for (day of forecast(); track day.date; let i = $index) {
                    <div class="wday-card" [class.today]="i === 0">
                      <span class="wday-name">{{ formatDay(day.date) }}</span>
                      <span class="wday-icon">{{ getIcon(day.condition_code, true) }}</span>
                      <span class="wday-hi">{{ day.temp_max | temperature:'':0 }}</span>
                      <span class="wday-lo">{{ day.temp_min | temperature:'':0 }}</span>
                    </div>
                  }
                </div>
              } @else {
                <div class="skeleton" style="height:120px;border-radius:var(--radius)"></div>
              }
            </div>
          </div>

          <!-- Hourly forecast -->
          <div class="card card-pad">
            <div class="card-title">{{ i18n.t('dashboard.hourlyForecast') }}</div>
            @if (hourly().length) {
              <div class="hourly-scroll">
                @for (h of hourly(); track h.time; let i = $index) {
                  <div class="hourly-item" [class.now]="i === 0">
                    <span class="hourly-time">{{ i === 0 ? i18n.t('dashboard.now') : h.time }}</span>
                    <span class="hourly-icon">{{ getIcon(h.code, h.is_day) }}</span>
                    <span class="hourly-temp">{{ h.temp | temperature:'':0 }}°</span>
                  </div>
                }
              </div>
            } @else {
              <div class="skeleton" style="height:80px;border-radius:var(--radius)"></div>
            }
          </div>

          <!-- Weekly chart -->
          <div class="card card-pad">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
              <div class="card-title" style="margin:0">{{ i18n.t('dashboard.weeklyOverview') }}</div>
              <div class="chart-tabs">
                <button class="chart-tab" [class.active]="chartTab()==='temp'" (click)="chartTab.set('temp')">
                  {{ i18n.t('dashboard.temperature') }}
                </button>
                <button class="chart-tab" [class.active]="chartTab()==='rain'" (click)="chartTab.set('rain')">
                  {{ i18n.t('dashboard.precipitation') }}
                </button>
              </div>
            </div>
            @if (forecast().length) {
              <div class="chart-wrap">
                <svg [attr.viewBox]="'0 0 ' + chartW + ' ' + chartH" style="width:100%;height:100%;overflow:visible">
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="var(--primary)" stop-opacity=".35"/>
                      <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <!-- Grid lines -->
                  @for (g of gridLines(); track g) {
                    <line [attr.x1]="60" [attr.x2]="chartW - 10" [attr.y1]="g.y" [attr.y2]="g.y"
                          stroke="var(--border)" stroke-width="1" stroke-dasharray="4 4"/>
                    <text [attr.x]="52" [attr.y]="g.y + 4" text-anchor="end"
                          font-size="10" fill="var(--muted-fg)">{{ g.label }}</text>
                  }
                  <!-- X labels -->
                  @for (day of forecast(); track day.date; let i = $index) {
                    <text [attr.x]="xPos(i)" [attr.y]="chartH - 4" text-anchor="middle"
                          font-size="10" fill="var(--muted-fg)">{{ formatDay(day.date) }}</text>
                  }
                  @if (chartTab() === 'temp') {
                    <!-- Area fill -->
                    <path [attr.d]="areaPath()" fill="url(#grad)"/>
                    <!-- Line -->
                    <path [attr.d]="linePath()" fill="none" stroke="var(--primary)" stroke-width="2.5"
                          stroke-linecap="round" stroke-linejoin="round"/>
                    <!-- Dots -->
                    @for (day of forecast(); track day.date; let i = $index) {
                      <circle [attr.cx]="xPos(i)" [attr.cy]="yPosTemp(day.temp_max)"
                              r="4" fill="var(--primary)" stroke="var(--card)" stroke-width="2"/>
                    }
                  } @else {
                    <!-- Bars (precipitation) -->
                    @for (day of forecast(); track day.date; let i = $index) {
                      <rect [attr.x]="xPos(i) - 12" [attr.y]="yPosRain(day.precipitation)"
                            [attr.width]="24"
                            [attr.height]="chartH - 20 - yPosRain(day.precipitation)"
                            rx="4" fill="var(--accent)" opacity=".8"/>
                    }
                  }
                </svg>
              </div>
            } @else {
              <div class="skeleton" style="height:200px;border-radius:var(--radius)"></div>
            }
          </div>

          <!-- Highlights -->
          @if (weather()) {
            <div class="card card-pad">
              <div class="card-title">{{ i18n.t('dashboard.todayHighlights') }}</div>
              <div class="highlights-grid">
                <div class="highlight-card">
                  <div class="hc-header"><span class="hc-label">UV Index</span><span class="hc-icon">☀️</span></div>
                  <div>
                    <span class="hc-val">{{ weather()!.uv_index }}</span>
                    <div class="progress-bar"><div class="progress-fill" [style.width.%]="(weather()!.uv_index/12)*100"></div></div>
                    <div class="hc-sub">{{ uvLabel(weather()!.uv_index) }}</div>
                  </div>
                </div>
                <div class="highlight-card">
                  <div class="hc-header"><span class="hc-label">{{ i18n.t('weather.wind') }}</span><span class="hc-icon">💨</span></div>
                  <div>
                    <span class="hc-val">{{ weather()!.wind_speed }}</span><span class="hc-unit">km/h</span>
                    <div class="hc-sub">Dir. {{ weather()!.wind_direction }}°</div>
                  </div>
                </div>
                <div class="highlight-card">
                  <div class="hc-header"><span class="hc-label">{{ i18n.t('weather.humidity') }}</span><span class="hc-icon">💧</span></div>
                  <div>
                    <span class="hc-val">{{ weather()!.humidity }}</span><span class="hc-unit">%</span>
                    <div class="progress-bar"><div class="progress-fill" [style.width.%]="weather()!.humidity"></div></div>
                    <div class="hc-sub">{{ humidLabel(weather()!.humidity) }}</div>
                  </div>
                </div>
                <div class="highlight-card">
                  <div class="hc-header"><span class="hc-label">{{ i18n.t('weather.pressure') }}</span><span class="hc-icon">🌡</span></div>
                  <div>
                    <span class="hc-val">{{ weather()!.pressure }}</span><span class="hc-unit">hPa</span>
                    <div class="hc-sub">{{ weather()!.pressure > 1013 ? 'Alto' : 'Normal' }}</div>
                  </div>
                </div>
                <div class="highlight-card">
                  <div class="hc-header"><span class="hc-label">{{ i18n.t('weather.precipitation') }}</span><span class="hc-icon">🌧</span></div>
                  <div>
                    <span class="hc-val">{{ weather()!.precipitation }}</span><span class="hc-unit">mm</span>
                  </div>
                </div>
                <div class="highlight-card">
                  <div class="hc-header"><span class="hc-label">{{ i18n.t('weather.cloudCover') }}</span><span class="hc-icon">☁️</span></div>
                  <div>
                    <span class="hc-val">{{ weather()!.cloud_cover }}</span><span class="hc-unit">%</span>
                    <div class="progress-bar"><div class="progress-fill" [style.width.%]="weather()!.cloud_cover"></div></div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- ── Coluna lateral ── -->
        <div class="col-side">

          <!-- Outras cidades (favoritos) -->
          <div class="card card-pad">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
              <div class="card-title" style="margin:0">{{ i18n.t('favourites.title') }}</div>
              <a routerLink="/favourites" style="font-size:.75rem;font-weight:600;color:var(--primary)">
                {{ i18n.t('favourites.seeAll') }}
              </a>
            </div>
            @if (favourites().length === 0) {
              <div style="text-align:center;padding:1.5rem;color:var(--muted-fg);font-size:.825rem">
                {{ i18n.t('favourites.empty') }}
              </div>
            }
            <div class="city-list">
              @for (fav of favourites().slice(0, 4); track fav.id) {
                <div class="city-row" (click)="loadCity(fav.city_name)">
                  <div class="city-row-left">
                    <div class="city-icon-wrap">🌍</div>
                    <div>
                      <div class="city-name">{{ fav.city_name }}</div>
                      <div class="city-country">📍 {{ fav.country_code }}</div>
                    </div>
                  </div>
                  <div>
                    <div class="city-temp">--°</div>
                    <div class="city-cond">{{ i18n.t('favourites.tap') }}</div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Qualidade do ar (simulada — Open-Meteo free não inclui AQI) -->
          <div class="card card-pad">
            <div class="aq-header">
              <div class="card-title" style="margin:0">Air Quality</div>
              @if (weather()) {
                <span class="aq-badge" [class]="aqClass()">{{ aqLabel() }}</span>
              }
            </div>
            @if (weather()) {
              <div class="aq-main">
                <div class="aq-icon">💨</div>
                <div>
                  <div class="aq-aqi">{{ aqiValue() }}</div>
                  <div class="aq-aqi-label">AQI (estimado)</div>
                </div>
              </div>
              <div class="aq-grid">
                @for (p of aqPollutants(); track p.label) {
                  <div class="aq-item">
                    <span class="aq-item-val">{{ p.value }}</span>
                    <span class="aq-item-lbl">{{ p.label }}</span>
                  </div>
                }
              </div>
              <p style="font-size:.68rem;color:var(--muted-fg);margin-top:.75rem">
                * Valores estimados. Para dados reais de qualidade do ar, é necessária uma API dedicada.
              </p>
            } @else {
              <div class="skeleton" style="height:120px;border-radius:var(--radius)"></div>
            }
          </div>

          <!-- Histórico recente -->
          <div class="card card-pad">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
              <div class="card-title" style="margin:0">{{ i18n.t('history.title') }}</div>
              <a routerLink="/history" style="font-size:.75rem;font-weight:600;color:var(--primary)">
                {{ i18n.t('favourites.seeAll') }}
              </a>
            </div>
            <div class="city-list">
              @for (h of history().slice(0, 4); track h.id) {
                <div class="city-row" (click)="loadCity(h.city_name)">
                  <div class="city-row-left">
                    <div class="city-icon-wrap">🕐</div>
                    <div>
                      <div class="city-name">{{ h.city_name }}</div>
                      <div class="city-country">{{ h.searched_at | dateFormat }}</div>
                    </div>
                  </div>
                  <div>
                    <div class="city-temp">{{ h.temperature | temperature:'':0 }}°</div>
                    <div class="city-cond">{{ h.condition_text }}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton {
      background: linear-gradient(90deg, var(--secondary) 25%, var(--border) 50%, var(--secondary) 75%);
      background-size: 200% 100%; animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  ws    = inject(WeatherService);
  exportService = inject(ExportService);
  i18n  = inject(I18nService);
  http  = inject(HttpClient);

  // State
  cityInput   = '';
  suggestions = signal<Suggestion[]>([]);
  weather     = signal<WeatherData | null>(null);
  forecast    = signal<ForecastDay[]>([]);
  favourites  = signal<FavouriteCity[]>([]);
  history     = signal<SearchHistoryItem[]>([]);
  hourly      = signal<{time:string;temp:number;code:number;is_day:boolean}[]>([]);
  loading     = signal(false);
  gpsLoading  = signal(false);
  error       = signal('');
  gpsError    = signal('');
  chartTab    = signal<'temp'|'rain'>('temp');
  private _searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Chart dimensions
  chartW = 560; chartH = 180;

  ngOnInit(): void {
    this.loadFavourites();
    this.loadHistory();
    this.loadGpsLocation();

    // Debounce das sugestões de pesquisa
    this._searchSubject.pipe(
      debounceTime(280),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => this.fetchSuggestions(q));
  }

  // ── Helpers de UI ──
  greeting(): string {
    const h = new Date().getHours();
    if (this.i18n.lang() === 'pt') {
      if (h < 12) return 'Bom dia';
      if (h < 18) return 'Boa tarde';
      return 'Boa noite';
    }
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  userName(): string { return this.favourites()[0]?.city_name ? (this.weather()?.city || '') : (this.weather()?.city || ''); }
  today(): string { return new Date().toLocaleDateString(this.i18n.lang() === 'pt' ? 'pt-PT' : 'en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' }); }
  maxTemp(): number { return this.forecast()[0]?.temp_max ?? this.weather()?.temperature ?? 0; }
  minTemp(): number { return this.forecast()[0]?.temp_min ?? this.weather()?.temperature ?? 0; }
  isFav(): boolean {
    const w = this.weather();
    if (!w) return false;
    return this.favourites().some(f => f.city_name === w.city && f.country_code === w.country_code);
  }
  uvLabel(uv: number): string { if(uv<=2) return 'Baixo'; if(uv<=5) return 'Moderado'; if(uv<=7) return 'Alto'; return 'Muito alto'; }
  humidLabel(h: number): string { if(h<40) return 'Seco'; if(h<70) return 'Normal'; return 'Húmido'; }
  formatDay(date: string): string { return new Date(date + 'T12:00:00').toLocaleDateString(this.i18n.lang()==='pt'?'pt-PT':'en-GB', {weekday:'short'}); }

  // AQI estimado baseado nas métricas disponíveis
  aqiValue(): number {
    const w = this.weather();
    if (!w) return 0;
    return Math.min(200, Math.round(20 + w.humidity * 0.3 + w.wind_speed * 0.5));
  }
  aqLabel(): string { const a=this.aqiValue(); if(a<=50) return 'Good'; if(a<=100) return 'Moderate'; return 'Sensitive'; }
  aqClass(): string { const a=this.aqiValue(); if(a<=50) return 'good'; if(a<=100) return 'moderate'; return 'sensitive'; }
  aqPollutants() { return [{label:'PM2.5',value:(this.weather()?.humidity??0)*0.1|0},{label:'PM10',value:(this.weather()?.humidity??0)*0.13|0},{label:'SO₂',value:4},{label:'NO₂',value:5},{label:'O₃',value:6},{label:'CO',value:1}]; }

  // ── Chart SVG ──
  xPos(i: number): number {
    const pad = 70; return pad + (i / Math.max(this.forecast().length-1, 1)) * (this.chartW - pad - 20);
  }
  yPosTemp(t: number): number {
    const temps = this.forecast().map(d=>d.temp_max);
    const min=Math.min(...temps)-3, max=Math.max(...temps)+3;
    return 20 + ((max-t)/(max-min)) * (this.chartH - 40);
  }
  yPosRain(r: number): number {
    const rains = this.forecast().map(d=>d.precipitation);
    const max = Math.max(...rains, 1);
    return 20 + ((max-r)/max) * (this.chartH - 40);
  }
  linePath(): string {
    return this.forecast().map((d,i)=>(i===0?'M':'L')+`${this.xPos(i)},${this.yPosTemp(d.temp_max)}`).join(' ');
  }
  areaPath(): string {
    const line = this.linePath();
    const last = this.forecast().length - 1;
    return `${line} L${this.xPos(last)},${this.chartH-20} L${this.xPos(0)},${this.chartH-20} Z`;
  }
  gridLines() {
    if (!this.forecast().length) return [];
    const temps = this.forecast().map(d=>d.temp_max);
    const min=Math.floor(Math.min(...temps)/5)*5, max=Math.ceil(Math.max(...temps)/5)*5;
    const step = Math.max(5, Math.round((max-min)/3/5)*5);
    const lines = [];
    for (let v=min; v<=max; v+=step) lines.push({label:`${v}°`, y:this.yPosTemp(v)});
    return lines;
  }

  // ── Pesquisa & sugestões ──
  onSearchInput(q: string): void {
    if (q.length >= 2) this._searchSubject.next(q);
    else this.suggestions.set([]);
  }

  fetchSuggestions(q: string): void {
    const params = new HttpParams().set('q', q).set('lang', this.i18n.lang());
    this.http.get<{success:boolean;data:Suggestion[]}>(`${environment.apiUrl}/weather/suggest`, {params})
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: r => this.suggestions.set(r.data ?? []), error: () => {} });
  }

  selectSuggestion(s: Suggestion): void {
    this.cityInput = s.name;
    this.suggestions.set([]);
    this.loadByCoords(s.latitude, s.longitude, s.name, s.country, s.country_code, s.timezone);
  }

  searchFirst(): void {
    if (this.suggestions().length > 0) { this.selectSuggestion(this.suggestions()[0]); return; }
    if (!this.cityInput.trim()) return;
    this.suggestions.set([]);
    this.loadByCity(this.cityInput);
  }

  closeSuggestions(): void { this.suggestions.set([]); }
  loadCity(name: string): void { this.cityInput = name; this.loadByCity(name); }

  loadByCity(city: string): void {
    this.loading.set(true); this.error.set('');
    this.ws.searchByCity(city, this.i18n.lang()).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => { this.weather.set(r.data); this.loading.set(false);
        this.loadForecastByCity(city); this.loadFavourites(); this.loadHistory(); },
      error: e => { this.loading.set(false); this.error.set(e.error?.message ?? 'Erro'); }
    });
  }

  loadByCoords(lat: number, lon: number, name: string, country: string, cc: string, tz: string): void {
    this.loading.set(true); this.error.set('');
    this.ws.searchByCoords(lat, lon, this.i18n.lang()).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => { this.weather.set(r.data); this.loading.set(false);
        this.loadForecastByCoords(lat, lon, name); this.loadFavourites(); this.loadHistory(); },
      error: e => { this.loading.set(false); this.error.set(e.error?.message ?? 'Erro'); }
    });
  }

  loadGpsLocation(): void {
    this.gpsError.set('');
    if (!navigator.geolocation) { this.gpsError.set(this.i18n.t('dashboard.gpsNotSupported')); return; }
    this.gpsLoading.set(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const {latitude:lat, longitude:lon} = pos.coords;
        this.ws.searchByCoords(lat, lon, this.i18n.lang()).pipe(takeUntil(this.destroy$)).subscribe({
          next: r => { this.weather.set(r.data); this.gpsLoading.set(false);
            this.loadForecastByCoords(lat, lon, r.data.city); this.loadFavourites(); this.loadHistory(); },
          error: () => { this.gpsLoading.set(false); this.gpsError.set(this.i18n.t('dashboard.gpsApiError')); }
        });
      },
      err => { this.gpsLoading.set(false);
        this.gpsError.set(err.code===err.PERMISSION_DENIED ? this.i18n.t('dashboard.gpsPermissionDenied') : this.i18n.t('dashboard.gpsError')); },
      {timeout:10000, maximumAge:300000}
    );
  }

  private loadForecastByCity(city: string): void {
    this.ws.getForecast(city, this.i18n.lang()).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => { this.forecast.set(r.data.forecast); this.buildHourly(); }, error: ()=>{}
    });
  }

  private loadForecastByCoords(lat: number, lon: number, city: string): void {
    this.ws.getForecastByCoords(lat, lon, city, this.i18n.lang()).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => { this.forecast.set(r.data.forecast); this.buildHourly(); }, error: ()=>{}
    });
  }

  // Gera dados horários aproximados interpolando a previsão diária
  private buildHourly(): void {
    const now = new Date();
    const today = this.forecast()[0];
    if (!today) return;
    const slots = [];
    for (let h = 0; h < 12; h++) {
      const t = new Date(now.getTime() + h * 3600000);
      const frac = (t.getHours() - 6) / 14; // pico às 13h
      const temp = today.temp_min + Math.max(0, Math.sin(frac * Math.PI)) * (today.temp_max - today.temp_min);
      slots.push({ time: t.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),
        temp: Math.round(temp), code: today.condition_code,
        is_day: t.getHours() >= 6 && t.getHours() < 20 });
    }
    this.hourly.set(slots);
  }

  toggleFav(): void {
    const w = this.weather(); if (!w) return;
    const ex = this.favourites().find(f=>f.city_name===w.city && f.country_code===w.country_code);
    if (ex) this.ws.removeFavourite(ex.id).subscribe(()=>this.loadFavourites());
    else this.ws.addFavourite(w).subscribe(()=>this.loadFavourites());
  }

  private loadFavourites(): void {
    this.ws.getFavourites().pipe(takeUntil(this.destroy$)).subscribe({next:r=>this.favourites.set(r.data),error:()=>{}});
  }
  private loadHistory(): void {
    this.ws.getHistory().pipe(takeUntil(this.destroy$)).subscribe({next:r=>this.history.set(r.data),error:()=>{}});
  }

  getIcon(code: number, isDay: boolean): string {
    if (code===0) return isDay?'☀️':'🌙';
    if ([1,2].includes(code)) return isDay?'⛅':'🌤';
    if (code===3) return '☁️';
    if ([45,48].includes(code)) return '🌫️';
    if (code>=51&&code<=67) return '🌧';
    if (code>=71&&code<=77) return '❄️';
    if (code>=80&&code<=82) return '🌧';
    if (code>=95) return '⛈';
    return '🌡';
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
