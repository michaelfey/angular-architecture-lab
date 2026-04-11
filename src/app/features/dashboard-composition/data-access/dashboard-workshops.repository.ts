import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, catchError, map, of, scan, shareReplay, startWith, switchMap } from 'rxjs';
import {
  DashboardWorkshop,
  DashboardWorkshopsSnapshot
} from '../domain/dashboard-composition.models';
import { DashboardWorkshopsApiService } from './dashboard-workshops-api.service';

type RepositoryEvent =
  | { readonly type: 'loading' }
  | { readonly type: 'loaded'; readonly workshops: readonly DashboardWorkshop[] }
  | { readonly type: 'failed'; readonly message: string };

export const INITIAL_WORKSHOPS_SNAPSHOT: DashboardWorkshopsSnapshot = {
  loading: false,
  error: null,
  workshops: []
};

@Injectable()
export class DashboardWorkshopsRepository {
  private readonly refreshRequests$$ = new ReplaySubject<void>(1);

  readonly snapshot$: Observable<DashboardWorkshopsSnapshot> = this.refreshRequests$$.pipe(
    switchMap(() =>
      this.api.loadWorkshops().pipe(
        map(
          (workshops): RepositoryEvent => ({
            type: 'loaded',
            workshops
          })
        ),
        startWith<RepositoryEvent>({ type: 'loading' }),
        catchError((error: unknown) =>
          of<RepositoryEvent>({
            type: 'failed',
            message: error instanceof Error ? error.message : 'The dashboard workshop slice could not be loaded.'
          })
        )
      )
    ),
    scan((snapshot, event) => reduceWorkshopsSnapshot(snapshot, event), INITIAL_WORKSHOPS_SNAPSHOT),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private readonly api: DashboardWorkshopsApiService) {
    this.refresh();
  }

  refresh(): void {
    this.refreshRequests$$.next();
  }
}

function reduceWorkshopsSnapshot(
  snapshot: DashboardWorkshopsSnapshot,
  event: RepositoryEvent
): DashboardWorkshopsSnapshot {
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
        workshops: event.workshops
      };

    case 'failed':
      return {
        ...snapshot,
        loading: false,
        error: event.message
      };
  }
}
