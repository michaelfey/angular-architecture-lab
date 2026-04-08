import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { EnrollmentFacade } from '../state/enrollment.facade';
import { EnrollmentSessionCardComponent } from '../ui/enrollment-session-card.component';

@Component({
  selector: 'app-enrollment-effects-page',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, EnrollmentSessionCardComponent],
  templateUrl: './enrollment-effects-page.component.html',
  styleUrl: './enrollment-effects-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnrollmentEffectsPageComponent {
  readonly facade = inject(EnrollmentFacade);
  readonly vm$ = this.facade.vm$;
  readonly query = new FormControl('', { nonNullable: true });

  constructor() {
    this.query.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((query) => this.facade.setQuery(query));
  }
}
