import { computed, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  DashboardLab,
  DashboardLabCardVm,
  DashboardSession,
  DashboardSessionCardVm,
  DashboardState,
  DashboardTrack,
  DashboardTrackFilter,
  DashboardTrackSummary,
  DashboardVm,
  DashboardWorkshop,
  DashboardWorkshopCardVm
} from '../domain/dashboard-composition.models';
import {
  DashboardLabsRepository,
  INITIAL_LABS_SNAPSHOT
} from '../data-access/dashboard-labs.repository';
import {
  DashboardSessionsRepository,
  INITIAL_SESSIONS_SNAPSHOT
} from '../data-access/dashboard-sessions.repository';
import {
  DashboardWorkshopsRepository,
  INITIAL_WORKSHOPS_SNAPSHOT
} from '../data-access/dashboard-workshops.repository';

type LocalState = Pick<DashboardState, 'track' | 'showAttentionOnly'>;

type StateMutation =
  | { readonly type: 'trackChanged'; readonly track: DashboardTrackFilter }
  | { readonly type: 'attentionOnlyChanged'; readonly showAttentionOnly: boolean };

const TRACKS: readonly DashboardTrack[] = ['architecture', 'rxjs', 'testing', 'performance'];
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const INITIAL_LOCAL_STATE: LocalState = {
  track: 'all',
  showAttentionOnly: false
};

export const INITIAL_STATE: DashboardState = {
  ...INITIAL_LOCAL_STATE,
  workshopsSnapshot: INITIAL_WORKSHOPS_SNAPSHOT,
  sessionsSnapshot: INITIAL_SESSIONS_SNAPSHOT,
  labsSnapshot: INITIAL_LABS_SNAPSHOT
};

@Injectable()
export class DashboardCompositionFacade {
  private readonly workshopsRepository = inject(DashboardWorkshopsRepository);
  private readonly sessionsRepository = inject(DashboardSessionsRepository);
  private readonly labsRepository = inject(DashboardLabsRepository);
  private readonly localState = signal<LocalState>(INITIAL_LOCAL_STATE);

  private readonly workshopsSnapshot = toSignal(this.workshopsRepository.snapshot$, {
    initialValue: INITIAL_WORKSHOPS_SNAPSHOT
  });
  private readonly sessionsSnapshot = toSignal(this.sessionsRepository.snapshot$, {
    initialValue: INITIAL_SESSIONS_SNAPSHOT
  });
  private readonly labsSnapshot = toSignal(this.labsRepository.snapshot$, {
    initialValue: INITIAL_LABS_SNAPSHOT
  });

  readonly state = computed<DashboardState>(() => ({
    ...this.localState(),
    workshopsSnapshot: this.workshopsSnapshot(),
    sessionsSnapshot: this.sessionsSnapshot(),
    labsSnapshot: this.labsSnapshot()
  }));
  readonly vm = computed<DashboardVm>(() => buildVm(this.state()));

  refreshAll(): void {
    this.workshopsRepository.refresh();
    this.sessionsRepository.refresh();
    this.labsRepository.refresh();
  }

  setTrack(track: DashboardTrackFilter): void {
    this.localState.update((state) =>
      reduceState(state, {
        type: 'trackChanged',
        track
      })
    );
  }

  setAttentionOnly(showAttentionOnly: boolean): void {
    this.localState.update((state) =>
      reduceState(state, {
        type: 'attentionOnlyChanged',
        showAttentionOnly
      })
    );
  }
}

export function reduceState<TState extends LocalState>(state: TState, mutation: StateMutation): TState {
  switch (mutation.type) {
    case 'trackChanged':
      return {
        ...state,
        track: mutation.track
      } as TState;

    case 'attentionOnlyChanged':
      return {
        ...state,
        showAttentionOnly: mutation.showAttentionOnly
      } as TState;
  }
}

export function buildVm(state: DashboardState): DashboardVm {
  const workshops = selectVisibleWorkshops(
    state.workshopsSnapshot.workshops,
    state.track,
    state.showAttentionOnly
  );
  const sessions = selectVisibleSessions(
    state.sessionsSnapshot.sessions,
    state.track,
    state.showAttentionOnly
  );
  const labs = selectVisibleLabs(state.labsSnapshot.labs, state.track, state.showAttentionOnly);
  const errors = [
    state.workshopsSnapshot.error,
    state.sessionsSnapshot.error,
    state.labsSnapshot.error
  ].filter((message): message is string => Boolean(message));
  const enrolledCount = state.sessionsSnapshot.sessions.filter((session) => session.isEnrolled).length;
  const joinedCount = state.labsSnapshot.labs.filter((lab) => lab.joined).length;
  const attentionCount =
    countAttentionWorkshops(state.workshopsSnapshot.workshops) +
    countAttentionSessions(state.sessionsSnapshot.sessions) +
    countAttentionLabs(state.labsSnapshot.labs);

  return {
    loading:
      state.workshopsSnapshot.loading ||
      state.sessionsSnapshot.loading ||
      state.labsSnapshot.loading,
    errors,
    track: state.track,
    showAttentionOnly: state.showAttentionOnly,
    metrics: [
      {
        label: 'Source Readiness',
        value: `${3 - errors.length}/3`,
        detail: 'Independent repositories stay route-scoped and refresh separately.'
      },
      {
        label: 'Live Commitments',
        value: String(enrolledCount + joinedCount),
        detail: `${enrolledCount} enrollments and ${joinedCount} optimistic reservations are active.`
      },
      {
        label: 'Open Seats',
        value: String(countOpenSeats(state.sessionsSnapshot.sessions, state.labsSnapshot.labs)),
        detail: 'Open seats are aggregated across enrollment sessions and optimistic labs.'
      },
      {
        label: 'Attention Queue',
        value: String(attentionCount),
        detail: 'High-effort workshops and low-seat activities stay visible in one place.'
      }
    ],
    trackSummary: buildTrackSummary(state),
    featuredWorkshops: workshops,
    sessions,
    labs,
    emptySections: {
      workshops: workshops.length === 0,
      sessions: sessions.length === 0,
      labs: labs.length === 0
    }
  };
}

function buildTrackSummary(state: DashboardState): readonly DashboardTrackSummary[] {
  return TRACKS.map((track) => {
    const workshops = state.workshopsSnapshot.workshops.filter((workshop) => workshop.track === track);
    const sessions = state.sessionsSnapshot.sessions.filter((session) => session.track === track);
    const labs = state.labsSnapshot.labs.filter((lab) => lab.track === track);

    return {
      track,
      workshopCount: workshops.length,
      enrolledCount: sessions.filter((session) => session.isEnrolled).length,
      joinedCount: labs.filter((lab) => lab.joined).length,
      openSeats: countOpenSeats(sessions, labs),
      isActive: state.track === 'all' || state.track === track
    };
  });
}

function selectVisibleWorkshops(
  workshops: readonly DashboardWorkshop[],
  track: DashboardTrackFilter,
  showAttentionOnly: boolean
): readonly DashboardWorkshopCardVm[] {
  return workshops
    .filter((workshop) => matchesTrack(workshop.track, track))
    .filter((workshop) => !showAttentionOnly || isWorkshopAttentionItem(workshop))
    .sort((left, right) => left.featuredRank - right.featuredRank)
    .slice(0, 3)
    .map((workshop) => ({
      ...workshop,
      intensityLabel:
        workshop.durationHours >= 6
          ? `${workshop.durationHours}h deep dive`
          : workshop.difficulty === 'advanced'
            ? 'Advanced follow-up'
            : `${workshop.durationHours}h focused lab`
    }));
}

function selectVisibleSessions(
  sessions: readonly DashboardSession[],
  track: DashboardTrackFilter,
  showAttentionOnly: boolean
): readonly DashboardSessionCardVm[] {
  return sessions
    .filter((session) => matchesTrack(session.track, track))
    .map((session) => toSessionCardVm(session))
    .filter((session) => !showAttentionOnly || session.needsAttention)
    .sort(compareSessions)
    .slice(0, 4);
}

function selectVisibleLabs(
  labs: readonly DashboardLab[],
  track: DashboardTrackFilter,
  showAttentionOnly: boolean
): readonly DashboardLabCardVm[] {
  return labs
    .filter((lab) => matchesTrack(lab.track, track))
    .map((lab) => toLabCardVm(lab))
    .filter((lab) => !showAttentionOnly || lab.needsAttention)
    .sort((left, right) => Number(right.joined) - Number(left.joined) || left.availableSeats - right.availableSeats)
    .slice(0, 4);
}

function toSessionCardVm(session: DashboardSession): DashboardSessionCardVm {
  const availableSeats = Math.max(session.capacity - session.reservedSeats, 0);

  return {
    ...session,
    availableSeats,
    needsAttention: session.isEnrolled || availableSeats <= 2,
    statusLabel: session.isEnrolled
      ? 'You are enrolled'
      : availableSeats === 0
        ? 'Waitlist pressure'
        : availableSeats <= 2
          ? `${availableSeats} seat${availableSeats === 1 ? '' : 's'} left`
          : `${availableSeats} seats open`
  };
}

function toLabCardVm(lab: DashboardLab): DashboardLabCardVm {
  const availableSeats = Math.max(lab.capacity - lab.reservedSeats, 0);

  return {
    ...lab,
    availableSeats,
    needsAttention: lab.joined || availableSeats <= 2,
    statusLabel: lab.joined
      ? 'Optimistic reservation active'
      : availableSeats <= 1
        ? 'Rollback risk is high'
        : `${availableSeats} seats open`
  };
}

function compareSessions(left: DashboardSessionCardVm, right: DashboardSessionCardVm): number {
  return (
    DAY_ORDER.indexOf(left.dayLabel) - DAY_ORDER.indexOf(right.dayLabel) ||
    left.startTime.localeCompare(right.startTime)
  );
}

function matchesTrack(track: DashboardTrack, selectedTrack: DashboardTrackFilter): boolean {
  return selectedTrack === 'all' || selectedTrack === track;
}

function isWorkshopAttentionItem(workshop: DashboardWorkshop): boolean {
  return workshop.durationHours >= 6 || workshop.difficulty === 'advanced';
}

function countAttentionWorkshops(workshops: readonly DashboardWorkshop[]): number {
  return workshops.filter((workshop) => isWorkshopAttentionItem(workshop)).length;
}

function countAttentionSessions(sessions: readonly DashboardSession[]): number {
  return sessions.filter((session) => toSessionCardVm(session).needsAttention).length;
}

function countAttentionLabs(labs: readonly DashboardLab[]): number {
  return labs.filter((lab) => toLabCardVm(lab).needsAttention).length;
}

function countOpenSeats(
  sessions: readonly DashboardSession[],
  labs: readonly DashboardLab[]
): number {
  return [...sessions, ...labs].reduce(
    (total, item) => total + Math.max(item.capacity - item.reservedSeats, 0),
    0
  );
}
