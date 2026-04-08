import { Routes } from '@angular/router';
import { OptimisticUpdatesApiService } from './data-access/optimistic-updates-api.service';
import { OptimisticUpdatesPageComponent } from './pages/optimistic-updates-page.component';
import { OptimisticUpdatesFacade } from './state/optimistic-updates.facade';

export const OPTIMISTIC_UPDATES_ROUTES: Routes = [
  {
    path: '',
    providers: [OptimisticUpdatesApiService, OptimisticUpdatesFacade],
    children: [
      {
        path: '',
        component: OptimisticUpdatesPageComponent
      }
    ]
  }
];
