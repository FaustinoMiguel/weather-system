import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { WeatherService } from '../../../core/services/weather.service';
import { I18nService } from '../../../core/services/i18n.service';
import { FavouriteCity } from '../../../core/services/api.types';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-favourites',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>💛 {{ i18n.t('favourites.title') }}</h2>
      </div>

      <app-loading-spinner [visible]="loading()" [inline]="true" />

      @if (!loading() && favourites().length === 0) {
        <div class="empty-state">
          <p>{{ i18n.t('favourites.empty') }}</p>
          <a routerLink="/dashboard" class="btn-primary">{{ i18n.t('favourites.goSearch') }}</a>
        </div>
      }

      <div class="fav-grid">
        @for (city of favourites(); track city.id) {
          <div class="fav-card">
            <div class="fav-info">
              <h3>{{ city.city_name }}</h3>
              <p>{{ city.country_code }}</p>
              <small>{{ city.latitude.toFixed(2) }}°, {{ city.longitude.toFixed(2) }}°</small>
            </div>
            <div class="fav-actions">
              <a [routerLink]="['/dashboard']" [queryParams]="{ city: city.city_name }" class="btn-view">
                🔍 {{ i18n.t('favourites.view') }}
              </a>
              <button class="btn-remove" (click)="remove(city.id)">🗑</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 1.5rem 1rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
    .page-header h2 { font-size: 1.3rem; font-weight: 600; margin: 0; }
    .empty-state { text-align: center; padding: 3rem 1rem; color: var(--color-text-secondary); }
    .empty-state p { margin-bottom: 1rem; }
    .btn-primary { background: var(--color-primary); color: #fff; border: none; border-radius: 8px;
                   padding: .6rem 1.2rem; cursor: pointer; text-decoration: none; font-size: .9rem; }
    .fav-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
    .fav-card { background: var(--color-card); border-radius: 12px; padding: 1.1rem;
                box-shadow: 0 2px 8px rgba(0,0,0,.06); display: flex; flex-direction: column; gap: .75rem; }
    .fav-info h3 { margin: 0 0 .2rem; font-size: 1.1rem; }
    .fav-info p { margin: 0; color: var(--color-text-secondary); font-size: .85rem; }
    .fav-info small { color: var(--color-text-secondary); font-size: .78rem; }
    .fav-actions { display: flex; gap: .5rem; }
    .btn-view { background: var(--color-primary); color: #fff; border-radius: 8px; padding: .45rem .9rem;
                font-size: .85rem; text-decoration: none; flex: 1; text-align: center; }
    .btn-remove { background: #fee2e2; color: #991b1b; border: none; border-radius: 8px;
                  padding: .45rem .7rem; cursor: pointer; font-size: .9rem; }
    .btn-remove:hover { background: #fecaca; }
  `]
})
export class FavouritesComponent implements OnInit, OnDestroy {
  weatherService = inject(WeatherService);
  i18n           = inject(I18nService);

  favourites = signal<FavouriteCity[]>([]);
  loading    = signal(true);
  private destroy$ = new Subject<void>();

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.weatherService.getFavourites().pipe(takeUntil(this.destroy$)).subscribe({
      next:  (res) => { this.favourites.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  remove(id: number): void {
    this.weatherService.removeFavourite(id).subscribe(() => this.load());
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
