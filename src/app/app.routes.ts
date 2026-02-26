import { authGuard } from './core/guards/auth-guard';
import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then(m => m.LoginPage)
  },

  {
    path: 'select-proyecto',
    loadComponent: () =>
      import('./pages/select-proyecto/select-proyecto.page')
        .then(m => m.SelectProyectoPage)
  },

  {
    path: 'select-tipo-usuario',
    loadComponent: () =>
      import('./pages/select-tipo-usuario/select-tipo-usuario.page')
        .then(m => m.SelectTipoUsuarioPage)
  },

  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/home/home.page')
        .then(m => m.HomePage)
  },

  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'nota',
    loadComponent: () =>
      import('./pages/nota/nota.page').then(m => m.NotaPage)
  }

];