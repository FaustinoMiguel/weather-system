import { Component, inject, signal, computed, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { WeatherService } from '../../../core/services/weather.service';
import { I18nService } from '../../../core/services/i18n.service';
import { WeatherData } from '../../../core/services/api.types';
import { TemperaturePipe } from '../../../shared/pipes/temperature.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { translateCountry } from '../../../core/services/country-names';
import { environment } from '../../../../environments/environment';

interface Suggestion {
  name: string; country: string; country_code: string;
  admin1: string; latitude: number; longitude: number; timezone: string;
}

interface RecentComparison {
  city1: string; city2: string;
  temp1: number; temp2: number;
  date: string;
}

interface MetricRow {
  label: string; icon: string;
  val1: number; val2: number; unit: string;
  winner: 1 | 2 | 0;   // 0 = empate / não aplicável
  higherIsBetter: boolean;
}

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [FormsModule, TemperaturePipe, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <h2>⚖️ {{ i18n.t('compare.title') }}</h2>

      <!-- ── Formulário de pesquisa ── -->
      <div class="compare-form">

        <!-- Cidade 1 -->
        <div class="city-search-wrap">
          <label class="city-label">Cidade 1</label>
          <div class="input-wrap">
            <input type="text" [(ngModel)]="city1Input"
                   (ngModelChange)="onInput1($event)"
                   (keydown.enter)="selectFirst(1)"
                   (keydown.escape)="closeSug(1)"
                   [placeholder]="i18n.t('compare.city1Placeholder')"
                   class="city-input" autocomplete="off" />
            @if (city1Input) {
              <button class="clear-btn" (click)="clearCity(1)">✕</button>
            }
          </div>
          @if (sug1().length) {
            <div class="sug-dropdown">
              @for (s of sug1(); track s.latitude) {
                <button class="sug-item" (click)="selectSug(1, s)">
                  <span class="sug-pin">📍</span>
                  <div>
                    <div class="sug-city">{{ s.name }}{{ s.admin1 ? ', ' + s.admin1 : '' }}</div>
                    <div class="sug-region">{{ s.country }}</div>
                  </div>
                </button>
              }
            </div>
          }
        </div>

        <div class="vs-col">
          <span class="vs-badge">VS</span>
        </div>

        <!-- Cidade 2 -->
        <div class="city-search-wrap">
          <label class="city-label">Cidade 2</label>
          <div class="input-wrap">
            <input type="text" [(ngModel)]="city2Input"
                   (ngModelChange)="onInput2($event)"
                   (keydown.enter)="selectFirst(2)"
                   (keydown.escape)="closeSug(2)"
                   [placeholder]="i18n.t('compare.city2Placeholder')"
                   class="city-input" autocomplete="off" />
            @if (city2Input) {
              <button class="clear-btn" (click)="clearCity(2)">✕</button>
            }
          </div>
          @if (sug2().length) {
            <div class="sug-dropdown">
              @for (s of sug2(); track s.latitude) {
                <button class="sug-item" (click)="selectSug(2, s)">
                  <span class="sug-pin">📍</span>
                  <div>
                    <div class="sug-city">{{ s.name }}{{ s.admin1 ? ', ' + s.admin1 : '' }}</div>
                    <div class="sug-region">{{ s.country }}</div>
                  </div>
                </button>
              }
            </div>
          }
        </div>

        <button class="btn-compare" (click)="compare()" [disabled]="loading() || !city1 || !city2">
          @if (loading()) { ⏳ } @else { {{ i18n.t('compare.compareBtn') }} }
        </button>
      </div>

      @if (error()) { <div class="error-banner">⚠️ {{ error() }}</div> }
      <app-loading-spinner [visible]="loading()" [inline]="true" />

      <!-- ── Resultado ── -->
      @if (result()) {
        <!-- Cabeçalhos das cidades -->
        <div class="result-header">
          <div class="city-head" [class.winner-head]="overallWinner() === 1">
            @if (overallWinner() === 1) { <span class="crown">🏆</span> }
            <span class="ch-name">{{ result()!.city1.city }}</span>
            <span class="ch-country">{{ result()!.city1.country }}</span>
            <div class="ch-temp">{{ result()!.city1.temperature | temperature }}</div>
            <div class="ch-icon">{{ weatherIcon(result()!.city1) }}</div>
            @if (result()!.city1.is_extreme) {
              <span class="extreme-tag">⚠️ Condições extremas</span>
            }
          </div>

          <div class="vs-center">
            <span class="vs-lg">VS</span>
            <div class="score-chip">
              <span [class.score-win]="overallWinner() === 1">{{ scores().c1 }}</span>
              <span class="score-sep">:</span>
              <span [class.score-win]="overallWinner() === 2">{{ scores().c2 }}</span>
            </div>
          </div>

          <div class="city-head" [class.winner-head]="overallWinner() === 2">
            @if (overallWinner() === 2) { <span class="crown">🏆</span> }
            <span class="ch-name">{{ result()!.city2.city }}</span>
            <span class="ch-country">{{ result()!.city2.country }}</span>
            <div class="ch-temp">{{ result()!.city2.temperature | temperature }}</div>
            <div class="ch-icon">{{ weatherIcon(result()!.city2) }}</div>
            @if (result()!.city2.is_extreme) {
              <span class="extreme-tag">⚠️ Condições extremas</span>
            }
          </div>
        </div>

        <!-- Comparação métrica a métrica com barras -->
        <div class="metrics-section">
          <div class="ms-title">Comparação detalhada</div>
          @for (m of metricRows(); track m.label) {
            <div class="metric-row">
              <div class="mr-val mr-left" [class.mr-winner]="m.winner === 1">
                {{ m.val1 }} {{ m.unit }}
                @if (m.winner === 1) { <span class="win-dot">●</span> }
              </div>
              <div class="mr-center">
                <div class="mr-bars">
                  <div class="bar-wrap bar-left">
                    <div class="bar-fill bar-fill-left" [style.width.%]="barPct(m.val1, m.val2)"></div>
                  </div>
                  <span class="mr-label">{{ m.icon }} {{ m.label }}</span>
                  <div class="bar-wrap bar-right">
                    <div class="bar-fill bar-fill-right" [style.width.%]="barPct(m.val2, m.val1)"></div>
                  </div>
                </div>
              </div>
              <div class="mr-val mr-right" [class.mr-winner]="m.winner === 2">
                @if (m.winner === 2) { <span class="win-dot">●</span> }
                {{ m.val2 }} {{ m.unit }}
              </div>
            </div>
          }
        </div>

        <!-- Resumo / Veredicto -->
        <div class="verdict-section">
          <div class="verdict-title">📝 Veredicto</div>
          <div class="verdict-grid">
            <div class="verdict-item">
              <span class="vi-icon">🌡</span>
              <span>Diferença de temperatura: <strong>{{ tempDiff() }}°C</strong></span>
            </div>
            <div class="verdict-item">
              <span class="vi-icon">💧</span>
              <span>Diferença de humidade: <strong>{{ humidityDiff() }}%</strong></span>
            </div>
            <div class="verdict-item">
              <span class="vi-icon">💨</span>
              <span>Diferença de vento: <strong>{{ windDiff() }} km/h</strong></span>
            </div>
            <div class="verdict-item">
              <span class="vi-icon">🧘</span>
              <span>Mais confortável: <strong>{{ comfortWinner() }}</strong></span>
            </div>
          </div>
        </div>
      }

      <!-- ── Comparações recentes ── -->
      @if (recentComparisons().length > 0) {
        <div class="recent-section">
          <div class="recent-title">🕐 Comparações recentes</div>
          <div class="recent-list">
            @for (r of recentComparisons(); track r.date) {
              <button class="recent-item" (click)="loadRecent(r)">
                <span class="ri-cities">{{ r.city1 }} <span class="ri-vs">vs</span> {{ r.city2 }}</span>
                <span class="ri-temps">{{ r.temp1 | temperature }} · {{ r.temp2 | temperature }}</span>
              </button>
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .page-container { max-width: 960px; margin: 0 auto; padding: 1.5rem 1rem; }
    h2 { font-size: 1.35rem; font-weight: 700; margin-bottom: 1.25rem; }

    /* ── Formulário ── */
    .compare-form {
      display: flex; align-items: flex-end; gap: .75rem;
      flex-wrap: wrap; margin-bottom: 1.5rem;
      background: var(--color-card); border-radius: 14px;
      padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,.06);
    }
    .city-label { display: block; font-size: .75rem; font-weight: 600; text-transform: uppercase;
                  letter-spacing: .04em; color: var(--color-text-secondary); margin-bottom: .35rem; }
    .city-search-wrap { flex: 1; min-width: 200px; position: relative; }
    .input-wrap { position: relative; }
    .city-input {
      width: 100%; box-sizing: border-box;
      padding: .65rem 2rem .65rem 1rem; border: 2px solid var(--input-border);
      border-radius: 10px; font-size: .95rem;
      background: var(--input-bg); color: var(--input-text);
      transition: border-color .15s, box-shadow .15s;
    }
    .city-input:focus { outline: none; border-color: var(--input-focus-border); box-shadow: 0 0 0 3px var(--input-focus-shadow); background: var(--color-card); }
    .city-input::placeholder { color: var(--input-placeholder); }
    .clear-btn {
      position: absolute; right: .6rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; font-size: .85rem; cursor: pointer;
      color: var(--color-text-secondary); padding: .1rem .2rem;
    }
    .vs-col { align-self: flex-end; padding-bottom: .65rem; }
    .vs-badge { font-weight: 700; font-size: 1rem; color: var(--color-text-secondary); }
    .btn-compare {
      align-self: flex-end;
      background: var(--color-primary); color: #fff; border: none;
      border-radius: 10px; padding: .7rem 1.5rem; cursor: pointer;
      font-size: .95rem; font-weight: 600; white-space: nowrap;
      transition: opacity .15s;
    }
    .btn-compare:disabled { opacity: .55; cursor: not-allowed; }
    .btn-compare:hover:not(:disabled) { opacity: .9; }

    /* Dropdown */
    .sug-dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 50;
      background: var(--color-card); border: 1px solid var(--color-border);
      border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.12);
      overflow: hidden; max-height: 220px; overflow-y: auto;
    }
    .sug-item {
      display: flex; align-items: center; gap: .6rem; width: 100%;
      padding: .55rem .85rem; background: none; border: none; cursor: pointer;
      text-align: left; transition: background .12s;
    }
    .sug-item:hover { background: var(--color-bg-secondary); }
    .sug-pin { font-size: .85rem; flex-shrink: 0; }
    .sug-city { font-size: .875rem; font-weight: 500; }
    .sug-region { font-size: .75rem; color: var(--color-text-secondary); }

    /* ── Erro ── */
    .error-banner {
      background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;
      border-radius: 10px; padding: .75rem 1rem; margin-bottom: 1rem; font-size: .875rem;
    }
    [data-theme="dark"] .error-banner { background: #2d0a0a; color: #fca5a5; border-color: #7f1d1d; }

    /* ── Cabeçalho do resultado ── */
    .result-header {
      display: grid; grid-template-columns: 1fr auto 1fr;
      gap: 1rem; margin-bottom: 1.25rem;
      background: var(--color-card); border-radius: 16px; padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0,0,0,.07);
    }
    .city-head {
      display: flex; flex-direction: column; align-items: center;
      gap: .35rem; text-align: center; padding: .5rem; border-radius: 12px;
      transition: background .2s;
    }
    .city-head.winner-head { background: rgba(59,130,246,.07); }
    .crown { font-size: 1.4rem; }
    .ch-name { font-size: 1.15rem; font-weight: 700; }
    .ch-country { font-size: .8rem; color: var(--color-text-secondary); }
    .ch-temp { font-size: 2rem; font-weight: 800; color: var(--color-primary); line-height: 1.1; }
    .ch-icon { font-size: 1.8rem; }
    .extreme-tag { font-size: .72rem; background: #fef3c7; color: #92400e;
                   border-radius: 6px; padding: .15rem .5rem; }

    .vs-center { display: flex; flex-direction: column; align-items: center;
                 justify-content: center; gap: .5rem; }
    .vs-lg { font-size: 1.1rem; font-weight: 800; color: var(--color-text-secondary); }
    .score-chip {
      display: flex; gap: .35rem; align-items: center;
      background: var(--color-bg-secondary); border-radius: 20px;
      padding: .3rem .85rem; font-size: 1.1rem; font-weight: 700;
    }
    .score-win { color: var(--color-primary); }
    .score-sep { color: var(--color-text-secondary); }

    /* ── Métricas ── */
    .metrics-section {
      background: var(--color-card); border-radius: 14px; padding: 1.25rem;
      margin-bottom: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,.06);
    }
    .ms-title { font-size: .8rem; font-weight: 600; text-transform: uppercase;
                letter-spacing: .05em; color: var(--color-text-secondary); margin-bottom: 1rem; }
    .metric-row {
      display: grid; grid-template-columns: 1fr 2fr 1fr;
      align-items: center; gap: .5rem; padding: .5rem 0;
      border-bottom: 1px solid var(--color-border);
    }
    .metric-row:last-child { border-bottom: none; }
    .mr-val { font-size: .9rem; font-weight: 600; }
    .mr-left  { text-align: right; display: flex; align-items: center; justify-content: flex-end; gap: .3rem; }
    .mr-right { text-align: left;  display: flex; align-items: center; gap: .3rem; }
    .mr-winner { color: var(--color-primary); }
    .win-dot { color: var(--color-primary); font-size: .6rem; }

    .mr-center { display: flex; flex-direction: column; align-items: center; gap: .4rem; }
    .mr-bars { display: flex; align-items: center; gap: .4rem; width: 100%; }
    .bar-wrap { flex: 1; height: 6px; background: var(--color-bg-secondary); border-radius: 4px; overflow: hidden; }
    .bar-left  { display: flex; justify-content: flex-end; }
    .bar-right { display: flex; justify-content: flex-start; }
    .bar-fill { height: 100%; border-radius: 4px; background: var(--color-primary); opacity: .7; }
    .bar-fill-left  { }
    .bar-fill-right { }
    .mr-label { font-size: .75rem; color: var(--color-text-secondary); white-space: nowrap; }

    /* ── Veredicto ── */
    .verdict-section {
      background: var(--color-card); border-radius: 14px; padding: 1.25rem;
      margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,.06);
    }
    .verdict-title { font-size: .8rem; font-weight: 600; text-transform: uppercase;
                     letter-spacing: .05em; color: var(--color-text-secondary); margin-bottom: 1rem; }
    .verdict-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
    .verdict-item {
      display: flex; align-items: center; gap: .5rem;
      background: var(--color-bg-secondary); border-radius: 8px; padding: .6rem .85rem;
      font-size: .875rem; color: var(--color-text-secondary);
    }
    .vi-icon { font-size: 1rem; flex-shrink: 0; }

    /* ── Recentes ── */
    .recent-section {
      background: var(--color-card); border-radius: 14px; padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,.06);
    }
    .recent-title { font-size: .8rem; font-weight: 600; text-transform: uppercase;
                    letter-spacing: .05em; color: var(--color-text-secondary); margin-bottom: .85rem; }
    .recent-list { display: flex; flex-direction: column; gap: .4rem; }
    .recent-item {
      display: flex; justify-content: space-between; align-items: center;
      background: var(--color-bg-secondary); border: 1.5px solid transparent;
      border-radius: 8px; padding: .55rem .9rem; cursor: pointer;
      transition: border-color .15s, background .15s; text-align: left;
      width: 100%;
    }
    .recent-item:hover { border-color: var(--color-primary); background: var(--color-card); }
    .ri-cities { font-size: .9rem; font-weight: 500; }
    .ri-vs     { font-size: .78rem; color: var(--color-text-secondary); margin: 0 .25rem; }
    .ri-temps  { font-size: .8rem; color: var(--color-text-secondary); }

    @media (max-width: 700px) {
      .result-header { grid-template-columns: 1fr; }
      .vs-center { flex-direction: row; }
      .compare-form { flex-direction: column; }
      .btn-compare { width: 100%; }
      .verdict-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 520px) {
      .metric-row { grid-template-columns: 1fr 1.5fr 1fr; }
    }
  `]
})
export class CompareComponent implements OnInit, OnDestroy {
  ws    = inject(WeatherService);
  i18n  = inject(I18nService);
  http  = inject(HttpClient);
  route = inject(ActivatedRoute);

  city1Input = '';
  city2Input = '';
  city1 = '';
  city2 = '';

  sug1    = signal<Suggestion[]>([]);
  sug2    = signal<Suggestion[]>([]);
  loading = signal(false);
  error   = signal('');
  result  = signal<{ city1: WeatherData; city2: WeatherData } | null>(null);
  recentComparisons = signal<RecentComparison[]>(this.loadRecents());

  private s1$ = new Subject<string>();
  private s2$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  // ── Computed ──
  metricRows = computed((): MetricRow[] => {
    const r = this.result();
    if (!r) return [];
    const c1 = r.city1, c2 = r.city2;
    const w = (v1: number, v2: number, higher: boolean): 1 | 2 | 0 => {
      if (v1 === v2) return 0;
      return (higher ? v1 > v2 : v1 < v2) ? 1 : 2;
    };
    return [
      { label: 'Temperatura',   icon: '🌡', val1: Math.round(c1.temperature), val2: Math.round(c2.temperature), unit: '°C',   winner: w(c1.temperature, c2.temperature, false), higherIsBetter: false },
      { label: 'Humidade',      icon: '💧', val1: c1.humidity,    val2: c2.humidity,    unit: '%',    winner: w(c1.humidity, c2.humidity, false), higherIsBetter: false },
      { label: 'Vento',         icon: '💨', val1: c1.wind_speed,  val2: c2.wind_speed,  unit: 'km/h', winner: w(c1.wind_speed, c2.wind_speed, false), higherIsBetter: false },
      { label: 'Pressão',       icon: '⬛', val1: c1.pressure,    val2: c2.pressure,    unit: 'hPa',  winner: 0,  higherIsBetter: false },
      { label: 'UV Index',      icon: '☀️', val1: c1.uv_index,    val2: c2.uv_index,    unit: '',     winner: w(c1.uv_index, c2.uv_index, false), higherIsBetter: false },
      { label: 'Precipitação',  icon: '🌧', val1: c1.precipitation, val2: c2.precipitation, unit: 'mm', winner: w(c1.precipitation, c2.precipitation, false), higherIsBetter: false },
      { label: 'Cobertura',     icon: '☁️', val1: c1.cloud_cover, val2: c2.cloud_cover, unit: '%',    winner: w(c1.cloud_cover, c2.cloud_cover, false), higherIsBetter: false },
    ];
  });

  scores = computed(() => {
    const rows = this.metricRows();
    const c1 = rows.filter(r => r.winner === 1).length;
    const c2 = rows.filter(r => r.winner === 2).length;
    return { c1, c2 };
  });

  overallWinner = computed((): 1 | 2 | 0 => {
    const s = this.scores();
    if (s.c1 > s.c2) return 1;
    if (s.c2 > s.c1) return 2;
    return 0;
  });

  // ── Lifecycle ──
  ngOnInit(): void {
    this.s1$.pipe(debounceTime(280), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(q => this.fetchSug(q, 1));
    this.s2$.pipe(debounceTime(280), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(q => this.fetchSug(q, 2));

    // Pre-preenche cidade 1 via queryParams (ex: botao comparar nos favoritos)
    const c1 = this.route.snapshot.queryParamMap.get('city1');
    if (c1) { this.city1Input = c1; this.city1 = c1; }
  }

  onInput1(v: string): void { this.city1 = ''; if (v.length >= 2) this.s1$.next(v); else this.sug1.set([]); }
  onInput2(v: string): void { this.city2 = ''; if (v.length >= 2) this.s2$.next(v); else this.sug2.set([]); }

  clearCity(n: 1 | 2): void {
    if (n === 1) { this.city1Input = ''; this.city1 = ''; this.sug1.set([]); }
    else         { this.city2Input = ''; this.city2 = ''; this.sug2.set([]); }
  }

  fetchSug(q: string, n: 1 | 2): void {
    const lang = this.i18n.lang();
    const params = new HttpParams().set('q', q).set('lang', lang);
    this.http.get<{success: boolean; data: Suggestion[]}>(`${environment.apiUrl}/weather/suggest`, { params })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => {
          const translated = (r.data ?? []).map(s => ({ ...s, country: translateCountry(s.country, lang) }));
          n === 1 ? this.sug1.set(translated) : this.sug2.set(translated);
        },
        error: () => {}
      });
  }

  selectSug(n: 1 | 2, s: Suggestion): void {
    const label = s.name + (s.admin1 ? ', ' + s.admin1 : '') + ', ' + s.country;
    if (n === 1) { this.city1Input = label; this.city1 = label; this.sug1.set([]); }
    else         { this.city2Input = label; this.city2 = label; this.sug2.set([]); }
  }

  selectFirst(n: 1 | 2): void {
    const list = n === 1 ? this.sug1() : this.sug2();
    if (list.length) { this.selectSug(n, list[0]); return; }
    if (n === 1) this.city1 = this.city1Input;
    else         this.city2 = this.city2Input;
  }

  closeSug(n: 1 | 2): void { n === 1 ? this.sug1.set([]) : this.sug2.set([]); }

  compare(): void {
    if (!this.city1) this.city1 = this.city1Input;
    if (!this.city2) this.city2 = this.city2Input;
    if (!this.city1.trim() || !this.city2.trim()) return;

    this.loading.set(true);
    this.error.set('');
    this.sug1.set([]); this.sug2.set([]);

    this.ws.compareCities(this.city1, this.city2, this.i18n.lang())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.result.set(res.data);
          this.loading.set(false);
          this.saveRecent(res.data);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? this.i18n.t('compare.error'));
        }
      });
  }

  loadRecent(r: RecentComparison): void {
    this.city1Input = r.city1; this.city1 = r.city1;
    this.city2Input = r.city2; this.city2 = r.city2;
    this.compare();
  }

  // ── Helpers visuais ──
  weatherIcon(w: WeatherData): string {
    const c = w.condition_code, d = w.is_day;
    if (c === 0) return d ? '☀️' : '🌙';
    if ([1, 2].includes(c)) return d ? '⛅' : '🌤';
    if (c === 3) return '☁️';
    if ([45, 48].includes(c)) return '🌫️';
    if (c >= 51 && c <= 67) return '🌧';
    if (c >= 71 && c <= 77) return '❄️';
    if (c >= 80 && c <= 82) return '🌦';
    if (c >= 95) return '⛈';
    return '🌡';
  }

  barPct(val1: number, val2: number): number {
    const total = val1 + val2;
    if (!total) return 50;
    return Math.round((val1 / total) * 100);
  }

  tempDiff(): string {
    const r = this.result();
    if (!r) return '--';
    return Math.abs(r.city1.temperature - r.city2.temperature).toFixed(1);
  }

  humidityDiff(): number {
    const r = this.result();
    if (!r) return 0;
    return Math.abs(r.city1.humidity - r.city2.humidity);
  }

  windDiff(): number {
    const r = this.result();
    if (!r) return 0;
    return Math.abs(r.city1.wind_speed - r.city2.wind_speed);
  }

  comfortWinner(): string {
    const r = this.result();
    if (!r) return '—';
    // Conforto: temperatura entre 18-24°C, humidade baixa, vento fraco
    const score = (w: WeatherData) => {
      let s = 0;
      const t = w.temperature;
      if (t >= 18 && t <= 24) s += 3;
      else if (t >= 15 && t <= 28) s += 1;
      if (w.humidity < 60) s += 2;
      if (w.wind_speed < 20) s += 1;
      return s;
    };
    const s1 = score(r.city1), s2 = score(r.city2);
    if (s1 > s2) return r.city1.city;
    if (s2 > s1) return r.city2.city;
    return 'Empate';
  }

  // ── Persistência de recentes (localStorage) ──
  private loadRecents(): RecentComparison[] {
    try {
      const raw = localStorage.getItem('weather_recent_comparisons');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private saveRecent(data: { city1: WeatherData; city2: WeatherData }): void {
    const entry: RecentComparison = {
      city1: data.city1.city,
      city2: data.city2.city,
      temp1: data.city1.temperature,
      temp2: data.city2.temperature,
      date:  new Date().toISOString(),
    };
    const list = [entry, ...this.recentComparisons().filter(
      r => !(r.city1 === entry.city1 && r.city2 === entry.city2)
    )].slice(0, 5);
    this.recentComparisons.set(list);
    try { localStorage.setItem('weather_recent_comparisons', JSON.stringify(list)); } catch {}
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
