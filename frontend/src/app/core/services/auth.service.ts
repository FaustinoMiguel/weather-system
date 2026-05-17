import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiResponse, AuthResponse, User } from './api.types';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'weather_token';
  private readonly USER_KEY  = 'weather_user';

  // Signal reactivo com o utilizador actual
  private _user = signal<User | null>(this.loadUser());
  readonly user  = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  constructor(private http: HttpClient, private router: Router) {}

  private get apiUrl(): string { return environment.apiUrl; }

  register(name: string, email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/register`, { name, email, password })
      .pipe(tap(res => {
        if (res.success) {
          this.router.navigate(['/login']);
        }
      }));
  }

  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap(res => {
        if (res.success) {
          this.saveSession(res.data);
          this.router.navigate(['/dashboard']);
        }
      }));
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe();
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  forgotPassword(email: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/auth/reset-password`, { token, password });
  }

  updatePreferences(language: string, theme: string): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.apiUrl}/auth/preferences`, { language, theme })
      .pipe(tap(res => {
        if (res.success) {
          const u = this._user();
          if (u) {
            const updated = { ...u, language, theme };
            this._user.set(updated);
            localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
          }
        }
      }));
  }

  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }

  private saveSession(auth: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, auth.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(auth.user));
    this._user.set(auth.user);
  }

  private loadUser(): User | null {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY) ?? 'null'); }
    catch { return null; }
  }
}
