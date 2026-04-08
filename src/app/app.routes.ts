import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'workshops'
  },
  {
    path: 'enrollment-effects',
    loadChildren: () =>
      import('./features/enrollment-effects/enrollment-effects.routes').then(
        (module) => module.ENROLLMENT_EFFECTS_ROUTES
      )
  },
  {
    path: 'optimistic-updates',
    loadChildren: () =>
      import('./features/optimistic-updates/optimistic-updates.routes').then(
        (module) => module.OPTIMISTIC_UPDATES_ROUTES
      )
  },
  {
    path: 'workshops',
    loadChildren: () =>
      import('./features/workshops/workshops.routes').then((module) => module.WORKSHOPS_ROUTES)
  },
  {
    path: 'patterns',
    loadComponent: () =>
      import('./features/patterns/patterns-page.component').then((module) => module.PatternsPageComponent)
  },
  {
    path: '**',
    redirectTo: 'workshops'
  }
];
