import { Routes } from '@angular/router';
import { EnrollmentApiService } from './data-access/enrollment-api.service';
import { EnrollmentEffectsPageComponent } from './pages/enrollment-effects-page.component';
import { EnrollmentFacade } from './state/enrollment.facade';

export const ENROLLMENT_EFFECTS_ROUTES: Routes = [
  {
    path: '',
    providers: [EnrollmentApiService, EnrollmentFacade],
    children: [
      {
        path: '',
        component: EnrollmentEffectsPageComponent
      }
    ]
  }
];
