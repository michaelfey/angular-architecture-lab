import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { OptimisticUpdatesFacade } from '../state/optimistic-updates.facade';
import { OptimisticLabCardComponent } from '../ui/optimistic-lab-card.component';

@Component({
  selector: 'app-optimistic-updates-page',
  standalone: true,
  imports: [AsyncPipe, OptimisticLabCardComponent],
  templateUrl: './optimistic-updates-page.component.html',
  styleUrl: './optimistic-updates-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimisticUpdatesPageComponent {
  readonly facade = inject(OptimisticUpdatesFacade);
  readonly vm$ = this.facade.vm$;
}
