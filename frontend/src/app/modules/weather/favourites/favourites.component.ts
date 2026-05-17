import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { WeatherService } from '../../../core/services/weather.service';
import { I18nService } from '../../../core/services/i18n.service';
import { FavouriteCity } from '../../../core/services/api.types';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TemperaturePipe } from '../../../shared/pipes/temperature.pipe';
import { translateCountry } from '../../../core/services/country-names';

interface FavWithWeather extends FavouriteCity {
  temperature?: number;
  feels_like?: number;
  humidity?: number;
  wind_speed?: number;
  condition?: string;
  condition_code?: number;
  icon?: string;
  is_day?: boolean;
  loadingWeather?: boolean;
  country_name?: string;   // nome completo do país (ex: Portugal)
}

@Component({
  selector: 'app-favourites',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, TemperaturePipe],
  template: `
    <div class="fav-page">

      <div class="fav-header">
        <div>
          <h2 class="fav-title">💛 {{ i18n.t('favourites.title') }}</h2>
          @if (!loading() && favourites().length) {
            <p class="fav-subtitle">
              {{ favourites().length }} {{ favourites().length === 1 ? 'cidade guardada' : 'cidades guardadas' }}
            </p>
          }
        </div>
      </div>

      @if (successMsg()) {
        <div class="fav-toast fav-toast--success">✅ {{ successMsg() }}</div>
      }
      @if (errorMsg()) {
        <div class="fav-toast fav-toast--error">⚠️ {{ errorMsg() }}</div>
      }

      <app-loading-spinner [visible]="loading()" [inline]="true" />

      @if (!loading() && favourites().length >= 2) {
        <div class="fav-stats">
          <div class="fav-stat">
            <span class="fav-stat__val">{{ favourites().length }}</span>
            <span class="fav-stat__lbl">Cidades</span>
          </div>
          @if (hottest()) {
            <div class="fav-stat">
              <span class="fav-stat__val">🔥 {{ hottest()!.city_name }}</span>
              <span class="fav-stat__lbl">Mais quente</span>
            </div>
          }
          @if (coldest()) {
            <div class="fav-stat">
              <span class="fav-stat__val">🧊 {{ coldest()!.city_name }}</span>
              <span class="fav-stat__lbl">Mais fria</span>
            </div>
          }
          @if (avgTemp() !== null) {
            <div class="fav-stat">
              <span class="fav-stat__val">{{ avgTemp() }}°C</span>
              <span class="fav-stat__lbl">Média global</span>
            </div>
          }
        </div>
      }

      @if (!loading() && favourites().length === 0) {
        <div class="fav-empty">
          <span class="fav-empty__icon">🌍</span>
          <p>{{ i18n.t('favourites.empty') }}</p>
          <a routerLink="/dashboard" class="fav-btn-primary">{{ i18n.t('favourites.goSearch') }}</a>
        </div>
      }

      <div class="fav-grid">
        @for (city of sorted(); track city.id) {
          <div class="fav-card" [class.fav-card--loading]="city.loadingWeather">
            <div class="fav-card__head">
              <div class="fav-card__meta">
                <h3 class="fav-card__name">{{ city.city_name }}</h3>
                <span class="fav-card__country">{{ countryName(city) }}</span>
              </div>
              @if (city.loadingWeather) {
                <div class="fav-card__temp-skeleton"></div>
              } @else if (city.temperature !== undefined) {
                <div class="fav-card__temp-block">
                  <span class="fav-card__icon">{{ getIcon(city.icon, city.is_day, city.temperature) }}</span>
                  <span class="fav-card__temp">{{ city.temperature | temperature }}</span>
                </div>
              }
            </div>

            @if (!city.loadingWeather && city.condition) {
              <p class="fav-card__cond">{{ city.condition }}</p>
            } @else if (city.loadingWeather) {
              <div class="fav-card__skel" style="width:55%"></div>
            }

            @if (!city.loadingWeather && city.humidity !== undefined) {
              <div class="fav-card__metrics">
                <div class="fav-card__metric"><span>💧</span><span>{{ city.humidity }}%</span></div>
                <div class="fav-card__metric"><span>💨</span><span>{{ city.wind_speed }} km/h</span></div>
                @if (city.feels_like !== undefined) {
                  <div class="fav-card__metric"><span>🌡</span><span>{{ city.feels_like | temperature }}</span></div>
                }
              </div>
            } @else if (city.loadingWeather) {
              <div class="fav-card__skel" style="width:80%"></div>
            }

            @if (!city.loadingWeather && city.temperature !== undefined) {
              <div class="fav-card__bar-wrap">
                <div class="fav-card__bar-fill"
                     [style.width.%]="tempPercent(city.temperature)"
                     [class]="tempClass(city.temperature)"></div>
              </div>
            }

            <div class="fav-card__footer">
              <span class="fav-card__date">🕐 {{ formatDate(city.added_at) }}</span>
              <div class="fav-card__actions">
                <a [routerLink]="['/dashboard']" [queryParams]="{ city: city.city_name }"
                   class="fav-btn-view" title="Ver no dashboard">🔍</a>
                <button class="fav-btn-compare" [routerLink]="['/compare']"
                        [queryParams]="{ city1: city.city_name }" title="Comparar">⚖️</button>
                <button class="fav-btn-remove" (click)="remove(city)" [disabled]="removing() === city.id">
                  {{ removing() === city.id ? '⏳' : '🗑' }}
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .fav-page { max-width: 1000px; margin: 0 auto; padding: 1.75rem 1.25rem 3rem; }

    .fav-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
    .fav-title  { font-size: 1.4rem; font-weight: 700; letter-spacing: -.02em; color: var(--foreground); margin: 0 0 .25rem; }
    .fav-subtitle { margin: 0; font-size: .82rem; color: var(--muted-fg); }

    .fav-toast { padding: .75rem 1rem; border-radius: var(--radius); margin-bottom: 1rem; font-size: .875rem; font-weight: 500; animation: slideDown .25s ease; }
    .fav-toast--success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .fav-toast--error   { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    [data-theme="dark"] .fav-toast--success { background: #052e16; color: #86efac; border-color: #166534; }
    [data-theme="dark"] .fav-toast--error   { background: #2d0a0a; color: #fca5a5; border-color: #7f1d1d; }
    @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }

    .fav-stats { display: flex; gap: 1px; margin-bottom: 1.5rem; background: var(--border); border-radius: calc(var(--radius) * 1.2); overflow: hidden; box-shadow: var(--shadow-sm); }
    .fav-stat  { flex: 1; display: flex; flex-direction: column; align-items: center; padding: .9rem .5rem; background: var(--card); gap: .2rem; }
    .fav-stat__val { font-size: 1rem; font-weight: 700; color: var(--foreground); }
    .fav-stat__lbl { font-size: .7rem; color: var(--muted-fg); text-transform: uppercase; letter-spacing: .05em; }

    .fav-empty { text-align: center; padding: 4rem 1rem; color: var(--muted-fg); }
    .fav-empty__icon { font-size: 2.5rem; display: block; margin-bottom: .75rem; }
    .fav-empty p { margin-bottom: 1.25rem; font-size: .95rem; color: var(--muted-fg); }
    .fav-btn-primary { display: inline-block; background: var(--primary); color: var(--primary-fg); border: none; border-radius: var(--radius); padding: .6rem 1.4rem; font-size: .9rem; font-weight: 600; text-decoration: none; cursor: pointer; }

    .fav-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 1rem; }

    .fav-card { background: var(--card); border-radius: calc(var(--radius) * 1.33); padding: 1.1rem 1.15rem 1rem; display: flex; flex-direction: column; gap: .65rem; border: 1.5px solid var(--border); box-shadow: var(--shadow-sm); transition: border-color var(--t), transform var(--t), box-shadow var(--t); }
    .fav-card:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .fav-card--loading { opacity: .7; }

    .fav-card__head { display: flex; justify-content: space-between; align-items: flex-start; }
    .fav-card__name { margin: 0 0 .3rem; font-size: 1.05rem; font-weight: 700; color: var(--foreground); }
    .fav-card__country { font-size: .72rem; font-weight: 600; text-transform: uppercase; background: var(--secondary); color: var(--foreground); border-radius: 20px; padding: .15rem .55rem; letter-spacing: .04em; }
    .fav-card__temp-block { display: flex; align-items: center; gap: .35rem; }
    .fav-card__icon { font-size: 1.6rem; line-height: 1; }
    .fav-card__temp { font-size: 1.6rem; font-weight: 800; color: var(--primary); line-height: 1; }
    .fav-card__temp-skeleton { width: 56px; height: 32px; border-radius: 8px; background: linear-gradient(90deg, var(--secondary) 25%, var(--border) 50%, var(--secondary) 75%); background-size: 200%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

    .fav-card__cond { margin: 0; font-size: .82rem; color: var(--muted-fg); }
    .fav-card__skel { height: 11px; border-radius: 6px; background: linear-gradient(90deg, var(--secondary) 25%, var(--border) 50%, var(--secondary) 75%); background-size: 200%; animation: shimmer 1.4s infinite; }

    .fav-card__metrics { display: flex; gap: .75rem; }
    .fav-card__metric  { display: flex; align-items: center; gap: .25rem; font-size: .8rem; color: var(--muted-fg); }

    .fav-card__bar-wrap { height: 4px; border-radius: 4px; background: var(--secondary); overflow: hidden; }
    .fav-card__bar-fill { height: 100%; border-radius: 4px; transition: width .6s ease; }
    .temp-cold { background: #60a5fa; }
    .temp-mild { background: #34d399; }
    .temp-warm { background: #fbbf24; }
    .temp-hot  { background: #f87171; }

    .fav-card__footer { display: flex; justify-content: space-between; align-items: center; padding-top: .5rem; border-top: 1px solid var(--border); margin-top: .1rem; }
    .fav-card__date { font-size: .73rem; color: var(--muted-fg); }
    .fav-card__actions { display: flex; gap: .35rem; }

    .fav-btn-view, .fav-btn-compare, .fav-btn-remove {
      border: none; border-radius: 7px; padding: .35rem .6rem; font-size: .85rem; cursor: pointer;
      text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
      transition: opacity var(--t), background var(--t);
    }
    .fav-btn-view    { background: var(--primary); color: var(--primary-fg); }
    .fav-btn-compare { background: var(--secondary); color: var(--foreground); }
    .fav-btn-remove  { background: #fee2e2; color: #991b1b; }
    [data-theme="dark"] .fav-btn-remove { background: rgba(239,68,68,.15); color: #fca5a5; }
    .fav-btn-view:hover    { opacity: .85; }
    .fav-btn-compare:hover { background: var(--border); color: var(--foreground); }
    .fav-btn-remove:hover:not(:disabled) { opacity: .8; }
    .fav-btn-remove:disabled { opacity: .5; cursor: wait; }

    @media (max-width: 520px) {
      .fav-grid { grid-template-columns: 1fr; }
      .fav-stats { flex-wrap: wrap; }
      .fav-stat { min-width: 45%; }
    }
  `]
})
export class FavouritesComponent implements OnInit, OnDestroy {
  ws   = inject(WeatherService);
  i18n = inject(I18nService);

  favourites = signal<FavWithWeather[]>([]);
  loading    = signal(true);
  removing   = signal<number | null>(null);
  successMsg = signal('');
  errorMsg   = signal('');

  private destroy$ = new Subject<void>();

  sorted = computed(() => [...this.favourites()].sort((a, b) => b.id - a.id));

  hottest = computed(() => {
    const w = this.favourites().filter(f => f.temperature !== undefined);
    if (!w.length) return null;
    return w.reduce((a, b) => (a.temperature! > b.temperature! ? a : b));
  });

  coldest = computed(() => {
    const w = this.favourites().filter(f => f.temperature !== undefined);
    if (!w.length) return null;
    return w.reduce((a, b) => (a.temperature! < b.temperature! ? a : b));
  });

  avgTemp = computed(() => {
    const w = this.favourites().filter(f => f.temperature !== undefined);
    if (!w.length) return null;
    return Math.round(w.reduce((s, f) => s + f.temperature!, 0) / w.length);
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.errorMsg.set('');
    this.ws.getFavourites().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        const list: FavWithWeather[] = (res.data ?? []).map(f => ({ ...f, loadingWeather: true }));
        this.favourites.set(list);
        this.loading.set(false);
        this.loadWeatherData(list);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message ?? 'Erro ao carregar favoritos.');
        this.autoHide('error');
      }
    });
  }

  private loadWeatherData(list: FavWithWeather[]): void {
    const lang = this.i18n.lang();
    list.forEach(city => {
      const id = city.id;
      this.ws.searchByCity(city.city_name, lang)
        .pipe(takeUntil(this.destroy$), catchError(() => of(null)))
        .subscribe(res => {
          this.favourites.update(favs => favs.map(f => {
            if (f.id !== id) return f;
            if (!res?.data) return { ...f, loadingWeather: false };
            return { ...f, loadingWeather: false, temperature: res.data.temperature,
              feels_like: res.data.feels_like, humidity: res.data.humidity,
              wind_speed: res.data.wind_speed, condition: res.data.condition,
              condition_code: res.data.condition_code, icon: res.data.icon, is_day: res.data.is_day,
              country_name: res.data.country };
          }));
        });
    });
  }

  remove(city: FavWithWeather): void {
    this.removing.set(city.id);
    this.ws.removeFavourite(city.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.removing.set(null);
        this.successMsg.set(`"${city.city_name}" removida dos favoritos.`);
        this.autoHide('success');
        this.load();
      },
      error: (err) => {
        this.removing.set(null);
        this.errorMsg.set(err.error?.message ?? 'Erro ao remover favorito.');
        this.autoHide('error');
      }
    });
  }

  getIcon(icon: string | undefined, isDay: boolean | undefined, temp: number = 20): string {
    const day = isDay !== false;
    if (!icon) return day ? '🌤️' : '🌙';
    if (temp >= 40) return '🔥';
    if (temp <= -15) return '🥶';
    switch (icon) {
      case 'clear':         return day ? (temp >= 28 ? '☀️' : temp >= 15 ? '🌤️' : '🌥️') : '🌕';
      case 'mainly-clear':  return day ? (temp >= 22 ? '⛅' : '🌤️') : '🌙';
      case 'partly-cloudy': return day ? '⛅' : '☁️';
      case 'cloudy':        return '☁️';
      case 'fog':           return '🌫️';
      case 'drizzle':       return day ? '🌦' : '🌧';
      case 'rain':          return '🌧';
      case 'heavy-rain':    return '🌧';
      case 'showers':       return day ? '🌦' : '🌧';
      case 'snow':          return temp <= -5 ? '🌨️' : '❄️';
      case 'heavy-snow':    return '🌨️';
      case 'thunderstorm':  return '⛈';
      default:              return day ? '⛅' : '🌙';
    }
  }

  tempPercent(t: number): number { return Math.min(100, Math.max(0, ((t + 10) / 55) * 100)); }
  tempClass(t: number): string {
    if (t < 10) return 'temp-cold';
    if (t < 20) return 'temp-mild';
    if (t < 30) return 'temp-warm';
    return 'temp-hot';
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString(this.i18n.lang() === 'pt' ? 'pt-PT' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  }

  private autoHide(type: 'success' | 'error', ms = 3500): void {
    setTimeout(() => { if (type === 'success') this.successMsg.set(''); else this.errorMsg.set(''); }, ms);
  }

  countryName(city: FavWithWeather): string {
    // country_name tem o nome EN que vem da WeatherAPI; traduz-o para PT se necessário
    if (city.country_name) return translateCountry(city.country_name, this.i18n.lang());
    return city.country_code || '—';
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
