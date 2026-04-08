import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, catchError, map, of, scan, shareReplay, startWith, switchMap } from 'rxjs';
import { WorkshopsRepositorySnapshot } from '../domain/workshop.models';
import { WorkshopsApiService } from './workshops-api.service';

type RepositoryEvent =
  | { readonly type: 'loading' }
  | { readonly type: 'loaded'; readonly workshops: WorkshopsRepositorySnapshot['workshops'] }
  | { readonly type: 'failed'; readonly message: string };

export const INITIAL_SNAPSHOT: WorkshopsRepositorySnapshot = {
  loading: false,
  error: null,
  workshops: []
};

@Injectable()
export class WorkshopsRepository {
  private readonly refreshRequests$$ = new ReplaySubject<void>(1);

  readonly snapshot$: Observable<WorkshopsRepositorySnapshot> = this.refreshRequests$$.pipe(
    switchMap(() =>
      this.api.loadCatalog().pipe(
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
            message: error instanceof Error ? error.message : 'The catalog could not be loaded.'
          })
        )
      )
    ),
    scan((snapshot, event) => this.reduceSnapshot(snapshot, event), INITIAL_SNAPSHOT),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private readonly api: WorkshopsApiService) {
    this.refresh();
  }

  refresh(): void {
    this.refreshRequests$$.next();
  }

  private reduceSnapshot(
    snapshot: WorkshopsRepositorySnapshot,
    event: RepositoryEvent
  ): WorkshopsRepositorySnapshot {
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
}
