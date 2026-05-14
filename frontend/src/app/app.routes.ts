// Decisão técnica: rotas lazy com componentes standalone reduzem bundle inicial e protegem áreas autenticadas.

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./modules/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./modules/auth/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./modules/auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./modules/auth/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/weather/dashboard/dashboard.component').then((m) => m.DashboardComponent)
  },
  {
    path: 'city/:city',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/weather/city-detail/city-detail.component').then((m) => m.CityDetailComponent)
  },
  {
    path: 'favourites',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/weather/favourites/favourites.component').then((m) => m.FavouritesComponent)
  },
  {
    path: 'history',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/weather/history/history.component').then((m) => m.HistoryComponent)
  },
  {
    path: 'compare',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/weather/compare/compare.component').then((m) => m.CompareComponent)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
