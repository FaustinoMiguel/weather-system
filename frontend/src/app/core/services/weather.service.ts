import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, WeatherData, ForecastResponse, FavouriteCity, SearchHistoryItem } from './api.types';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private get api(): string { return environment.apiUrl; }

  constructor(private http: HttpClient) {}

  searchByCity(city: string, lang = 'pt'): Observable<ApiResponse<WeatherData>> {
    const params = new HttpParams().set('city', city).set('lang', lang);
    return this.http.get<ApiResponse<WeatherData>>(`${this.api}/weather/search`, { params });
  }

  searchByCoords(lat: number, lon: number, lang = 'pt'): Observable<ApiResponse<WeatherData>> {
    const params = new HttpParams().set('lat', lat).set('lon', lon).set('lang', lang);
    return this.http.get<ApiResponse<WeatherData>>(`${this.api}/weather/coords`, { params });
  }

  getForecast(city: string, lang = 'pt'): Observable<ApiResponse<ForecastResponse>> {
    const params = new HttpParams().set('city', city).set('lang', lang);
    return this.http.get<ApiResponse<ForecastResponse>>(`${this.api}/weather/forecast`, { params });
  }


  getForecastByCoords(lat: number, lon: number, city: string, lang = 'pt'): Observable<ApiResponse<ForecastResponse>> {
    const params = new HttpParams().set('lat', lat).set('lon', lon).set('city', city).set('lang', lang);
    return this.http.get<ApiResponse<ForecastResponse>>(`${this.api}/weather/forecast/coords`, { params });
  }
  compareCities(city1: string, city2: string, lang = 'pt'): Observable<ApiResponse<{ city1: WeatherData; city2: WeatherData }>> {
    const params = new HttpParams().set('city1', city1).set('city2', city2).set('lang', lang);
    return this.http.get<ApiResponse<{ city1: WeatherData; city2: WeatherData }>>(`${this.api}/weather/compare`, { params });
  }

  getFavourites(): Observable<ApiResponse<FavouriteCity[]>> {
    return this.http.get<ApiResponse<FavouriteCity[]>>(`${this.api}/favourites`);
  }

  addFavourite(city: WeatherData): Observable<ApiResponse<FavouriteCity>> {
    return this.http.post<ApiResponse<FavouriteCity>>(`${this.api}/favourites`, {
      city_name: city.city, country_code: city.country_code,
      latitude: city.latitude, longitude: city.longitude,
    });
  }

  removeFavourite(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.api}/favourites/${id}`);
  }

  getHistory(): Observable<ApiResponse<SearchHistoryItem[]>> {
    return this.http.get<ApiResponse<SearchHistoryItem[]>>(`${this.api}/history`);
  }

  clearHistory(): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.api}/history`);
  }
}
