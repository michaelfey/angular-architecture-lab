import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, catchError, map, of, scan, shareReplay, startWith, switchMap } from 'rxjs';
import {
  DashboardSession,
  DashboardSessionsSnapshot
} from '../domain/dashboard-composition.models';
import { DashboardSessionsApiService } from './dashboard-sessions-api.service';

type RepositoryEvent =
  | { readonly type: 'loading' }
  | { readonly type: 'loaded'; readonly sessions: readonly DashboardSession[] }
  | { readonly type: 'failed'; readonly message: string };

export const INITIAL_SESSIONS_SNAPSHOT: DashboardSessionsSnapshot = {
  loading: false,
  error: null,
  sessions: []
};

@Injectable()
export class DashboardSessionsRepository {
  private readonly refreshRequests$$ = new ReplaySubject<void>(1);

  readonly snapshot$: Observable<DashboardSessionsSnapshot> = this.refreshRequests$$.pipe(
    switchMap(() =>
      this.api.loadSessions().pipe(
        map(
          (sessions): RepositoryEvent => ({
            type: 'loaded',
            sessions
          })
        ),
        startWith<RepositoryEvent>({ type: 'loading' }),
        catchError((error: unknown) =>
          of<RepositoryEvent>({
            type: 'failed',
            message: error instanceof Error ? error.message : 'The dashboard session slice could not be loaded.'
          })
        )
      )
    ),
    scan((snapshot, event) => reduceSessionsSnapshot(snapshot, event), INITIAL_SESSIONS_SNAPSHOT),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private readonly api: DashboardSessionsApiService) {
    this.refresh();
  }

  refresh(): void {
    this.refreshRequests$$.next();
  }
}

function reduceSessionsSnapshot(
  snapshot: DashboardSessionsSnapshot,
  event: RepositoryEvent
): DashboardSessionsSnapshot {
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
        sessions: event.sessions
      };

    case 'failed':
      return {
        ...snapshot,
        loading: false,
        error: event.message
      };
  }
}
