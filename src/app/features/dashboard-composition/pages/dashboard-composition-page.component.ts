import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DashboardTrackFilter } from '../domain/dashboard-composition.models';
import { DashboardCompositionFacade } from '../state/dashboard-composition.facade';

@Component({
  selector: 'app-dashboard-composition-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './dashboard-composition-page.component.html',
  styleUrl: './dashboard-composition-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardCompositionPageComponent {
  readonly facade = inject(DashboardCompositionFacade);
  readonly vm = this.facade.vm;

  readonly track = new FormControl<DashboardTrackFilter>('all', { nonNullable: true });
  readonly showAttentionOnly = new FormControl(false, { nonNullable: true });

  constructor() {
    this.track.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((track) => this.facade.setTrack(track));

    this.showAttentionOnly.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((showAttentionOnly) => this.facade.setAttentionOnly(showAttentionOnly));
  }
}
