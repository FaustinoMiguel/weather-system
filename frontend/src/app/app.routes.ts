import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Rotas públicas (só para visitantes não autenticados)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./modules/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./modules/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./modules/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./modules/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },

  // Rotas protegidas (requerem autenticação)
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/weather/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'favourites',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/weather/favourites/favourites.component').then(m => m.FavouritesComponent)
  },
  {
    path: 'history',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/weather/history/history.component').then(m => m.HistoryComponent)
  },
  {
    path: 'compare',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/weather/compare/compare.component').then(m => m.CompareComponent)
  },
  {
    path: 'export',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/export/export.component').then(m => m.ExportComponent)
  },

  // Rota 404
  { path: '**', redirectTo: 'dashboard' }
];
