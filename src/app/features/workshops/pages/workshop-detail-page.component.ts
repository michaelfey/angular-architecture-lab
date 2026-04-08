import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { WorkshopsFacade } from '../state/workshops.facade';

@Component({
  selector: 'app-workshop-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './workshop-detail-page.component.html',
  styleUrl: './workshop-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkshopDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(WorkshopsFacade);
  private readonly workshopId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id') ?? '')), {
    initialValue: this.route.snapshot.paramMap.get('id') ?? ''
  });

  readonly vm = this.facade.createDetailVm(this.workshopId);
}
