import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, catchError, map, of, scan, shareReplay, startWith, switchMap } from 'rxjs';
import { DashboardLab, DashboardLabsSnapshot } from '../domain/dashboard-composition.models';
import { DashboardLabsApiService } from './dashboard-labs-api.service';

type RepositoryEvent =
  | { readonly type: 'loading' }
  | { readonly type: 'loaded'; readonly labs: readonly DashboardLab[] }
  | { readonly type: 'failed'; readonly message: string };

export const INITIAL_LABS_SNAPSHOT: DashboardLabsSnapshot = {
  loading: false,
  error: null,
  labs: []
};

@Injectable()
export class DashboardLabsRepository {
  private readonly refreshRequests$$ = new ReplaySubject<void>(1);

  readonly snapshot$: Observable<DashboardLabsSnapshot> = this.refreshRequests$$.pipe(
    switchMap(() =>
      this.api.loadLabs().pipe(
        map(
          (labs): RepositoryEvent => ({
            type: 'loaded',
            labs
          })
        ),
        startWith<RepositoryEvent>({ type: 'loading' }),
        catchError((error: unknown) =>
          of<RepositoryEvent>({
            type: 'failed',
            message: error instanceof Error ? error.message : 'The dashboard lab slice could not be loaded.'
          })
        )
      )
    ),
    scan((snapshot, event) => reduceLabsSnapshot(snapshot, event), INITIAL_LABS_SNAPSHOT),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private readonly api: DashboardLabsApiService) {
    this.refresh();
  }

  refresh(): void {
    this.refreshRequests$$.next();
  }
}

function reduceLabsSnapshot(
  snapshot: DashboardLabsSnapshot,
  event: RepositoryEvent
): DashboardLabsSnapshot {
  switch (event.type) {
    case 'loading':
      return {
        ...snapshot,
        loading: true,
        error: null
      };

    case 'loaded':
      return {
        loading: false,
        error: null,
        labs: event.labs
      };

    case 'failed':
      return {
        ...snapshot,
        loading: false,
        error: event.message
      };
  }
}
