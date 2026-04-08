import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { combineLatest, debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { WorkshopDifficultyFilter, WorkshopSort, WorkshopTrackFilter } from '../domain/workshop.models';
import { WorkshopsFacade } from '../state/workshops.facade';
import { WorkshopCardComponent } from '../ui/workshop-card.component';

type FiltersForm = FormGroup<{
  query: FormControl<string>;
  track: FormControl<WorkshopTrackFilter>;
  difficulty: FormControl<WorkshopDifficultyFilter>;
  sort: FormControl<WorkshopSort>;
  showSavedOnly: FormControl<boolean>;
}>;

const DEFAULT_FILTERS: {
  readonly query: string;
  readonly track: WorkshopTrackFilter;
  readonly difficulty: WorkshopDifficultyFilter;
  readonly sort: WorkshopSort;
  readonly showSavedOnly: boolean;
} = {
  query: '',
  track: 'all',
  difficulty: 'all',
  sort: 'featured',
  showSavedOnly: false
};

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, WorkshopCardComponent],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogPageComponent {
  readonly facade = inject(WorkshopsFacade);
  readonly vm = this.facade.vm;

  readonly filters: FiltersForm = new FormGroup({
    query: new FormControl(DEFAULT_FILTERS.query, { nonNullable: true }),
    track: new FormControl<WorkshopTrackFilter>(DEFAULT_FILTERS.track, { nonNullable: true }),
    difficulty: new FormControl<WorkshopDifficultyFilter>(DEFAULT_FILTERS.difficulty, { nonNullable: true }),
    sort: new FormControl<WorkshopSort>(DEFAULT_FILTERS.sort, { nonNullable: true }),
    showSavedOnly: new FormControl(DEFAULT_FILTERS.showSavedOnly, { nonNullable: true })
  });

  constructor() {
    this.filters.controls.query.valueChanges
      .pipe(
        startWith(this.filters.controls.query.value),
        debounceTime(180),
        distinctUntilChanged(),
        takeUntilDestroyed()
      )
      .subscribe((query) => this.facade.setQuery(query));

    combineLatest([
      this.filters.controls.track.valueChanges.pipe(startWith(this.filters.controls.track.value)),
      this.filters.controls.difficulty.valueChanges.pipe(startWith(this.filters.controls.difficulty.value)),
      this.filters.controls.sort.valueChanges.pipe(startWith(this.filters.controls.sort.value))
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([track, difficulty, sort]) => this.facade.setFilters(track, difficulty, sort));

    this.filters.controls.showSavedOnly.valueChanges
      .pipe(startWith(this.filters.controls.showSavedOnly.value), takeUntilDestroyed())
      .subscribe((showSavedOnly) => this.facade.setSavedOnly(showSavedOnly));
  }

  resetFilters(): void {
    this.filters.reset(DEFAULT_FILTERS);
    this.facade.resetFilters();
  }
}
