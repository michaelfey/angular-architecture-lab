import { Routes } from '@angular/router';
import { DashboardLabsApiService } from './data-access/dashboard-labs-api.service';
import { DashboardLabsRepository } from './data-access/dashboard-labs.repository';
import { DashboardSessionsApiService } from './data-access/dashboard-sessions-api.service';
import { DashboardSessionsRepository } from './data-access/dashboard-sessions.repository';
import { DashboardWorkshopsApiService } from './data-access/dashboard-workshops-api.service';
import { DashboardWorkshopsRepository } from './data-access/dashboard-workshops.repository';
import { DashboardCompositionPageComponent } from './pages/dashboard-composition-page.component';
import { DashboardCompositionFacade } from './state/dashboard-composition.facade';

export const DASHBOARD_COMPOSITION_ROUTES: Routes = [
  {
    path: '',
    providers: [
      DashboardWorkshopsApiService,
      DashboardWorkshopsRepository,
      DashboardSessionsApiService,
      DashboardSessionsRepository,
      DashboardLabsApiService,
      DashboardLabsRepository,
      DashboardCompositionFacade
    ],
    children: [
      {
        path: '',
        component: DashboardCompositionPageComponent
      }
    ]
  }
];
