// Decisão técnica: WeatherService expõe métodos pequenos e tipados para API, mantendo componentes sem HTTP directo.

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, FavouriteCity, Language, SearchHistoryItem, WeatherResponse } from './api.types';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  constructor(private readonly http: HttpClient) {}

  searchByCity(city: string, lang: Language): Observable<ApiResponse<WeatherResponse>> {
    const params = this.baseParams(lang).set('city', city);
    return this.http.get<ApiResponse<WeatherResponse>>(`${environment.apiUrl}/weather/search`, { params });
  }

  searchByCoordinates(lat: number, lon: number, lang: Language, label?: string): Observable<ApiResponse<WeatherResponse>> {
    let params = this.baseParams(lang).set('lat', lat).set('lon', lon);
    if (label) {
      params = params.set('label', label).set('country', 'GPS');
    }

    return this.http.get<ApiResponse<WeatherResponse>>(`${environment.apiUrl}/weather/search`, { params });
  }

  forecast(city: string, lang: Language): Observable<ApiResponse<WeatherResponse>> {
    const params = this.baseParams(lang).set('city', city);
    return this.http.get<ApiResponse<WeatherResponse>>(`${environment.apiUrl}/weather/forecast`, { params });
  }

  favourites(): Observable<ApiResponse<FavouriteCity[]>> {
    return this.http.get<ApiResponse<FavouriteCity[]>>(`${environment.apiUrl}/favourites`);
  }

  addFavourite(cityName: string, countryCode: string): Observable<ApiResponse<{ id: number }>> {
    return this.http.post<ApiResponse<{ id: number }>>(`${environment.apiUrl}/favourites`, {
      city_name: cityName,
      country_code: countryCode
    });
  }

  removeFavourite(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/favourites/${id}`);
  }

  history(limit = 20): Observable<ApiResponse<SearchHistoryItem[]>> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<ApiResponse<SearchHistoryItem[]>>(`${environment.apiUrl}/history`, { params });
  }

  clearHistory(): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/history`);
  }

  private baseParams(lang: Language): HttpParams {
    // Decisão técnica: timestamp força uma requisição nova ao backend em cada refresh/pesquisa.
    return new HttpParams().set('lang', lang).set('_ts', Date.now().toString());
  }
}
