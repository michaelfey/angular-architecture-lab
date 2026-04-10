import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Observable,
  ReplaySubject,
  Subject,
  catchError,
  concat,
  concatMap,
  map,
  merge,
  of,
  switchMap
} from 'rxjs';
import { OptimisticUpdatesApiService } from '../data-access/optimistic-updates-api.service';
import {
  OptimisticLab,
  OptimisticUpdatesState,
  OptimisticUpdatesVm
} from '../domain/optimistic-updates.models';

type LabsRefreshRequested = {
  readonly type: 'labsRefreshRequested';
};

type LabsLoadStarted = {
  readonly type: 'labsLoadStarted';
};

type LabsLoadSucceeded = {
  readonly type: 'labsLoadSucceeded';
  readonly labs: readonly OptimisticLab[];
};

type LabsLoadFailed = {
  readonly type: 'labsLoadFailed';
  readonly message: string;
};

type ReservationToggleRequested = {
  readonly type: 'reservationToggleRequested';
  readonly labId: string;
};

type ReservationOptimisticallyPatched = {
  readonly type: 'reservationOptimisticallyPatched';
  readonly previousLab: OptimisticLab;
  readonly optimisticLab: OptimisticLab;
};

type ReservationCommitted = {
  readonly type: 'reservationCommitted';
  readonly lab: OptimisticLab;
};

type ReservationRolledBack = {
  readonly type: 'reservationRolledBack';
  readonly previousLab: OptimisticLab;
  readonly message: string;
};

type OptimisticUpdatesEvent =
  | LabsRefreshRequested
  | LabsLoadStarted
  | LabsLoadSucceeded
  | LabsLoadFailed
  | ReservationToggleRequested
  | ReservationOptimisticallyPatched
  | ReservationCommitted
  | ReservationRolledBack;

export const INITIAL_STATE: OptimisticUpdatesState = {
  loading: false,
  error: null,
  labs: [],
  pendingIds: [],
  rolledBackIds: [],
  statusMessage: null
};

@Injectable()
export class OptimisticUpdatesFacade {
  private readonly api = inject(OptimisticUpdatesApiService);
  private readonly refreshRequested$$ = new ReplaySubject<void>(1);
  private readonly reservationToggleRequested$$ = new Subject<ReservationToggleRequested>();
  private readonly stateSource = signal<OptimisticUpdatesState>(INITIAL_STATE);

  readonly state = this.stateSource.asReadonly();
  readonly vm = computed<OptimisticUpdatesVm>(() => {
    const state = this.state();

    return {
      ...state,
      joinedCount: state.labs.filter((lab) => lab.joined).length,
      pendingCount: state.pendingIds.length,
      availableSeats: state.labs.reduce(
        (total, lab) => total + Math.max(lab.capacity - lab.reservedSeats, 0),
        0
      )
    };
  });

  constructor() {
    merge(this.loadEvents$, this.reservationEvents$)
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        this.stateSource.update((state) => reduceState(state, event));
      });

    this.refresh();
  }

  private readonly loadEvents$: Observable<OptimisticUpdatesEvent> = this.refreshRequested$$.pipe(
    switchMap(() =>
      concat(
        of<OptimisticUpdatesEvent>({ type: 'labsLoadStarted' }),
        this.api.loadLabs().pipe(
          map(
            (labs): OptimisticUpdatesEvent => ({
              type: 'labsLoadSucceeded',
              labs
            })
          ),
          catchError((error: unknown) =>
            of<OptimisticUpdatesEvent>({
              type: 'labsLoadFailed',
              message: toMessage(error, 'The lab snapshot could not be loaded.')
            })
          )
        )
      )
    )
  );

  private readonly reservationEvents$: Observable<OptimisticUpdatesEvent> =
    this.reservationToggleRequested$$.pipe(
      concatMap((action) => {
        const previousLab = this.stateSource().labs.find((lab) => lab.id === action.labId);

        if (!previousLab) {
          return of<OptimisticUpdatesEvent>({
            type: 'labsLoadFailed',
            message: 'The selected lab is missing from the current snapshot.'
          });
        }

        const optimisticLab = toggleReservation(previousLab);

        return concat(
          of<OptimisticUpdatesEvent>(action),
          of<OptimisticUpdatesEvent>({
            type: 'reservationOptimisticallyPatched',
            previousLab,
            optimisticLab
          }),
          this.api.toggleReservation(action.labId).pipe(
            map(
              (lab): OptimisticUpdatesEvent => ({
                type: 'reservationCommitted',
                lab
              })
            ),
            catchError((error: unknown) =>
              of<OptimisticUpdatesEvent>({
                type: 'reservationRolledBack',
                previousLab,
                message: toMessage(error, 'The optimistic reservation could not be confirmed.')
              })
            )
          )
        );
      })
    );

  refresh(): void {
    this.stateSource.update((state) =>
      reduceState(state, {
        type: 'labsRefreshRequested'
      })
    );
    this.refreshRequested$$.next();
  }

  toggleReservation(labId: string): void {
    this.reservationToggleRequested$$.next({
      type: 'reservationToggleRequested',
      labId
    });
  }
}

export function reduceState(
  state: OptimisticUpdatesState,
  event: OptimisticUpdatesEvent
): OptimisticUpdatesState {
  return reduceReservationState(reduceLoadState(state, event), event);
}

function reduceLoadState(
  state: OptimisticUpdatesState,
  event: OptimisticUpdatesEvent
): OptimisticUpdatesState {
  switch (event.type) {
    case 'labsRefreshRequested':
      return {
        ...state,
        statusMessage: 'Requesting a fresh server snapshot.',
        error: null
      };

    case 'labsLoadStarted':
      return {
        ...state,
        loading: true,
        error: null,
        statusMessage: 'Refreshing labs while keeping the current snapshot visible.'
      };

    case 'labsLoadSucceeded':
      return {
        ...state,
        loading: false,
        error: null,
        labs: event.labs,
        statusMessage: 'Server snapshot loaded.'
      };

    case 'labsLoadFailed':
      return {
        ...state,
        loading: false,
        error: event.message,
        statusMessage: null
      };

    default:
      return state;
  }
}

function reduceReservationState(
  state: OptimisticUpdatesState,
  event: OptimisticUpdatesEvent
): OptimisticUpdatesState {
  switch (event.type) {
    case 'reservationToggleRequested':
      return state;

    case 'reservationOptimisticallyPatched':
      return {
        ...state,
        error: null,
        labs: replaceLab(state.labs, event.optimisticLab),
        pendingIds: addUnique(state.pendingIds, event.optimisticLab.id),
        rolledBackIds: state.rolledBackIds.filter((labId) => labId !== event.optimisticLab.id),
        statusMessage: `Applied an optimistic ${event.optimisticLab.joined ? 'join' : 'leave'} locally.`
      };

    case 'reservationCommitted':
      return {
        ...state,
        labs: replaceLab(state.labs, event.lab),
        pendingIds: state.pendingIds.filter((labId) => labId !== event.lab.id),
        rolledBackIds: state.rolledBackIds.filter((labId) => labId !== event.lab.id),
        statusMessage: 'The server confirmed the optimistic change.'
      };

    case 'reservationRolledBack':
      return {
        ...state,
        error: event.message,
        labs: replaceLab(state.labs, event.previousLab),
        pendingIds: state.pendingIds.filter((labId) => labId !== event.previousLab.id),
        rolledBackIds: addUnique(state.rolledBackIds, event.previousLab.id),
        statusMessage: 'The server rejected the write. The previous snapshot was restored.'
      };

    default:
      return state;
  }
}

function toggleReservation(lab: OptimisticLab): OptimisticLab {
  return lab.joined
    ? {
        ...lab,
        joined: false,
        reservedSeats: Math.max(lab.reservedSeats - 1, 0)
      }
    : {
        ...lab,
        joined: true,
        reservedSeats: Math.min(lab.reservedSeats + 1, lab.capacity)
      };
}

function replaceLab(labs: readonly OptimisticLab[], nextLab: OptimisticLab): readonly OptimisticLab[] {
  return labs.map((lab) => (lab.id === nextLab.id ? nextLab : lab));
}

function addUnique(values: readonly string[], nextValue: string): readonly string[] {
  return values.includes(nextValue) ? values : [...values, nextValue];
}

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
