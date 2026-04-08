import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { WorkshopsFacade } from '../state/workshops.facade';

@Component({
  selector: 'app-workshop-detail-page',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  templateUrl: './workshop-detail-page.component.html',
  styleUrl: './workshop-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkshopDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(WorkshopsFacade);

  readonly vm$ = this.facade.createDetailVm(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? ''))
  );
}
