// Tipagem forte para todos os dados da API — sem uso de "any"

export interface User {
  id: number;
  name: string;
  email: string;
  language: string;
  theme: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface WeatherData {
  city: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  timezone: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  pressure: number;
  uv_index: number;
  cloud_cover: number;
  precipitation: number;
  is_day: boolean;
  condition: string;
  condition_code: number;
  icon: string;
  is_extreme: boolean;
  units: { temperature: string; wind_speed: string; pressure: string };
}

export interface ForecastDay {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation: number;
  wind_speed: number;
  uv_index_max: number;
  condition: string;
  condition_code: number;
  icon: string;
}

export interface ForecastResponse {
  location: { city: string; country: string; latitude: number; longitude: number };
  forecast: ForecastDay[];
}

export interface FavouriteCity {
  id: number;
  user_id: number;
  city_name: string;
  country_code: string;
  latitude: number;
  longitude: number;
  added_at: string;
}

export interface SearchHistoryItem {
  id: number;
  user_id: number;
  city_name: string;
  country_code: string;
  latitude: number;
  longitude: number;
  temperature: number;
  condition_text: string;
  searched_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
