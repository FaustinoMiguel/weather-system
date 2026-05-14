// Decisão técnica: downloads são tratados como Blob para preservar CSV/PDF enviados pelo backend.

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WeatherCurrent } from './api.types';

@Injectable({ providedIn: 'root' })
export class ExportService {
  constructor(private readonly http: HttpClient) {}

  downloadCsv(): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/export/csv`, { responseType: 'blob' }).pipe(
      tap((blob) => this.save(blob, 'weather-history.csv'))
    );
  }

  downloadCurrentCsv(current: WeatherCurrent): Observable<Blob> {
    const params = this.currentParams(current);
    return this.http.get(`${environment.apiUrl}/export/csv`, { params, responseType: 'blob' }).pipe(
      tap((blob) => this.save(blob, `weather-${current.city.toLowerCase()}.csv`))
    );
  }

  downloadPdf(current: WeatherCurrent): Observable<Blob> {
    const params = this.currentParams(current);

    return this.http.get(`${environment.apiUrl}/export/pdf`, { params, responseType: 'blob' }).pipe(
      tap((blob) => this.save(blob, `weather-${current.city.toLowerCase()}.pdf`))
    );
  }

  private currentParams(current: WeatherCurrent): HttpParams {
    return new HttpParams()
      .set('city', `${current.city}, ${current.country}`)
      .set('temperature', current.temperature?.toString() ?? '')
      .set('humidity', current.humidity?.toString() ?? '')
      .set('wind_speed', current.wind_speed?.toString() ?? '')
      .set('pressure', current.pressure?.toString() ?? '')
      .set('condition', current.condition);
  }

  private save(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
