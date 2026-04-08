import { inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  Subject,
  catchError,
  concat,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  map,
  merge,
  of,
  scan,
  shareReplay,
  switchMap,
  withLatestFrom
} from 'rxjs';
import { EnrollmentApiService } from '../data-access/enrollment-api.service';
import { EnrollmentSession, EnrollmentState, EnrollmentVm } from '../domain/enrollment.models';

type QueryChanged = {
  readonly type: 'queryChanged';
  readonly query: string;
};

type RefreshRequested = {
  readonly type: 'refreshRequested';
};

type ToggleEnrollmentRequested = {
  readonly type: 'toggleEnrollmentRequested';
  readonly sessionId: string;
};

type SearchStarted = {
  readonly type: 'searchStarted';
  readonly query: string;
  readonly reason: 'queryChanged' | 'refreshRequested';
};

type SearchSucceeded = {
  readonly type: 'searchSucceeded';
  readonly query: string;
  readonly sessions: readonly EnrollmentSession[];
};

type SearchFailed = {
  readonly type: 'searchFailed';
  readonly message: string;
};

type ToggleStarted = {
  readonly type: 'toggleStarted';
  readonly sessionId: string;
};

type ToggleSucceeded = {
  readonly type: 'toggleSucceeded';
  readonly session: EnrollmentSession;
};

type ToggleFailed = {
  readonly type: 'toggleFailed';
  readonly sessionId: string;
  readonly message: string;
};

type EnrollmentEvent =
  | QueryChanged
  | RefreshRequested
  | ToggleEnrollmentRequested
  | SearchStarted
  | SearchSucceeded
  | SearchFailed
  | ToggleStarted
  | ToggleSucceeded
  | ToggleFailed;

export const INITIAL_STATE: EnrollmentState = {
  query: '',
  loading: false,
  error: null,
  sessions: [],
  pendingIds: [],
  activeRequestLabel: null
};

@Injectable()
export class EnrollmentFacade {
  private readonly api = inject(EnrollmentApiService);
  private readonly queryChanged$$ = new ReplaySubject<QueryChanged>(1);
  private readonly refreshRequested$$ = new Subject<RefreshRequested>();
  private readonly toggleEnrollmentRequested$$ = new Subject<ToggleEnrollmentRequested>();
  private readonly latestQuery$$ = new BehaviorSubject(INITIAL_STATE.query);

  private readonly queryEvents$: Observable<EnrollmentEvent> = merge(
    this.queryChanged$$,
    this.queryChanged$$.pipe(
      map((action) => action.query),
      debounceTime(220),
      distinctUntilChanged(),
      switchMap((query) => this.searchSessions(query, 'queryChanged'))
    )
  );

  private readonly refreshEvents$: Observable<EnrollmentEvent> = this.refreshRequested$$.pipe(
    withLatestFrom(this.latestQuery$$),
    switchMap(([action, query]) =>
      concat(
        of<EnrollmentEvent>(action),
        this.searchSessions(query, 'refreshRequested')
      )
    )
  );

  private readonly toggleEvents$: Observable<EnrollmentEvent> = this.toggleEnrollmentRequested$$.pipe(
    concatMap((action) =>
      concat(
        of<EnrollmentEvent>(action),
        this.runToggleEnrollment(action.sessionId)
      )
    )
  );

  private readonly stateEvents$: Observable<EnrollmentEvent> = merge(
    this.queryEvents$,
    this.refreshEvents$,
    this.toggleEvents$
  );

  readonly state$: Observable<EnrollmentState> = this.stateEvents$.pipe(
    scan((state, event) => reduceState(state, event), INITIAL_STATE),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly vm$: Observable<EnrollmentVm> = this.state$.pipe(
    map((state) => ({
      ...state,
      enrolledCount: state.sessions.filter((session) => session.isEnrolled).length,
      availableSeats: state.sessions.reduce(
        (total, session) => total + Math.max(session.capacity - session.reservedSeats, 0),
        0
      ),
      isEmpty: state.sessions.length === 0 && !state.loading && !state.error
    })),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor() {
    this.queryChanged$$.next({
      type: 'queryChanged',
      query: INITIAL_STATE.query
    });
  }

  setQuery(query: string): void {
    const normalizedQuery = query.trim();

    this.latestQuery$$.next(normalizedQuery);
    this.queryChanged$$.next({
      type: 'queryChanged',
      query: normalizedQuery
    });
  }

  refresh(): void {
    this.refreshRequested$$.next({
      type: 'refreshRequested'
    });
  }

  toggleEnrollment(sessionId: string): void {
    this.toggleEnrollmentRequested$$.next({
      type: 'toggleEnrollmentRequested',
      sessionId
    });
  }

  private searchSessions(
    query: string,
    reason: SearchStarted['reason']
  ): Observable<EnrollmentEvent> {
    return concat(
      of<EnrollmentEvent>({
        type: 'searchStarted',
        query,
        reason
      }),
      this.api.searchSessions(query).pipe(
        map(
          (sessions): EnrollmentEvent => ({
            type: 'searchSucceeded',
            query,
            sessions
          })
        ),
        catchError((error: unknown) =>
          of<EnrollmentEvent>({
            type: 'searchFailed',
            message: toMessage(error, 'The session search failed.')
          })
        )
      )
    );
  }

  private runToggleEnrollment(sessionId: string): Observable<EnrollmentEvent> {
    return concat(
      of<EnrollmentEvent>({
        type: 'toggleStarted',
        sessionId
      }),
      this.api.toggleEnrollment(sessionId).pipe(
        map(
          (session): EnrollmentEvent => ({
            type: 'toggleSucceeded',
            session
          })
        ),
        catchError((error: unknown) =>
          of<EnrollmentEvent>({
            type: 'toggleFailed',
            sessionId,
            message: toMessage(error, 'The enrollment request failed.')
          })
        )
      )
    );
  }
}

export function reduceState(state: EnrollmentState, event: EnrollmentEvent): EnrollmentState {
  switch (event.type) {
    case 'queryChanged':
      return {
        ...state,
        query: event.query
      };

    case 'refreshRequested':
    case 'toggleEnrollmentRequested':
      return state;

    case 'searchStarted':
      return {
        ...state,
        loading: true,
        error: null,
        activeRequestLabel:
          event.reason === 'refreshRequested'
            ? 'Refreshing the current result set.'
            : `Searching for "${event.query || 'all sessions'}".`
      };

    case 'searchSucceeded':
      return {
        ...state,
        loading: false,
        error: null,
        sessions: event.sessions,
        activeRequestLabel: `Showing results for "${event.query || 'all sessions'}".`
      };

    case 'searchFailed':
      return {
        ...state,
        loading: false,
        error: event.message,
        activeRequestLabel: null
      };

    case 'toggleStarted':
      return {
        ...state,
        error: null,
        pendingIds: state.pendingIds.includes(event.sessionId)
          ? state.pendingIds
          : [...state.pendingIds, event.sessionId],
        activeRequestLabel: 'Applying enrollment changes.'
      };

    case 'toggleSucceeded':
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === event.session.id ? event.session : session
        ),
        pendingIds: state.pendingIds.filter((pendingId) => pendingId !== event.session.id),
        activeRequestLabel: 'Enrollment change applied.'
      };

    case 'toggleFailed':
      return {
        ...state,
        error: event.message,
        pendingIds: state.pendingIds.filter((pendingId) => pendingId !== event.sessionId),
        activeRequestLabel: null
      };
  }
}

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
