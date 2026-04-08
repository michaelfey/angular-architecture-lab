import { Routes } from '@angular/router';
import { CatalogPageComponent } from './pages/catalog-page.component';
import { WorkshopDetailPageComponent } from './pages/workshop-detail-page.component';
import { WorkshopsApiService } from './data-access/workshops-api.service';
import { WorkshopsRepository } from './data-access/workshops.repository';
import { WorkshopsFacade } from './state/workshops.facade';

export const WORKSHOPS_ROUTES: Routes = [
  {
    path: '',
    providers: [WorkshopsApiService, WorkshopsRepository, WorkshopsFacade],
    children: [
      {
        path: '',
        component: CatalogPageComponent
      },
      {
        path: ':id',
        component: WorkshopDetailPageComponent
      }
    ]
  }
];
