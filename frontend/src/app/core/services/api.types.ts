// Decisão técnica: contratos partilhados mantêm tipagem forte entre serviços e componentes.

export type Language = 'pt' | 'en';
export type ThemeName = 'light' | 'dark';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  language: Language;
  theme: ThemeName;
  created_at: string;
}

export interface AuthData {
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
}

export interface WeatherAlertKey {
  key: 'heat' | 'cold' | 'storm' | 'heavy_rain';
}

export interface WeatherCurrent {
  city: string;
  country: string;
  coordinates: { lat: number; lon: number } | null;
  temperature: number | null;
  feels_like: number | null;
  humidity: number | null;
  pressure: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  condition: string;
  condition_code: string;
  icon: string;
  uv_index: number | null;
  uv_note: string;
  date: string | null;
  alerts: Array<WeatherAlertKey['key']>;
}

export interface WeatherDay {
  date: string;
  min: number;
  max: number;
  humidity: number | null;
  pressure: number | null;
  wind_speed: number | null;
  condition: string;
  condition_code: string;
  icon: string;
  uv_index: number | null;
  alerts: Array<WeatherAlertKey['key']>;
}

export interface WeatherResponse {
  current: WeatherCurrent;
  daily: WeatherDay[];
  raw_city: {
    id?: number;
    name?: string;
    country?: string;
    coord?: { lat: number; lon: number };
  };
}

export interface FavouriteCity {
  id: number;
  city_name: string;
  country_code: string;
  added_at: string;
}

export interface SearchHistoryItem {
  id: number;
  city_name: string;
  country_code: string | null;
  temperature: string | number | null;
  condition_text: string;
  searched_at: string;
}
