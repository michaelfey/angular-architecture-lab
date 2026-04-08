import {
  computed,
  inject,
  Injectable,
  Signal,
  signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  TrackSummary,
  Workshop,
  WorkshopDetailVm,
  WorkshopDifficultyFilter,
  WorkshopSort,
  WorkshopTrack,
  WorkshopTrackFilter,
  WorkshopsState,
  WorkshopsVm
} from '../domain/workshop.models';
import { INITIAL_SNAPSHOT, WorkshopsRepository } from '../data-access/workshops.repository';

type LocalState = Pick<
  WorkshopsState,
  'query' | 'track' | 'difficulty' | 'sort' | 'showSavedOnly' | 'savedIds'
>;

type StateMutation =
  | { readonly type: 'queryChanged'; readonly query: string }
  | {
      readonly type: 'filtersChanged';
      readonly track: WorkshopTrackFilter;
      readonly difficulty: WorkshopDifficultyFilter;
      readonly sort: WorkshopSort;
    }
  | { readonly type: 'savedOnlyChanged'; readonly showSavedOnly: boolean }
  | { readonly type: 'savedToggled'; readonly workshopId: string }
  | { readonly type: 'filtersReset' };

const INITIAL_LOCAL_STATE: LocalState = {
  query: '',
  track: 'all',
  difficulty: 'all',
  sort: 'featured',
  showSavedOnly: false,
  savedIds: []
};

export const INITIAL_STATE: WorkshopsState = {
  ...INITIAL_SNAPSHOT,
  ...INITIAL_LOCAL_STATE
};

@Injectable()
export class WorkshopsFacade {
  private readonly repository = inject(WorkshopsRepository);
  private readonly repositorySnapshot = toSignal(this.repository.snapshot$, {
    initialValue: INITIAL_SNAPSHOT
  });
  private readonly stateSource = signal<LocalState>(INITIAL_LOCAL_STATE);

  readonly state = computed<WorkshopsState>(() => ({
    ...this.repositorySnapshot(),
    ...this.stateSource()
  }));
  readonly vm = computed<WorkshopsVm>(() => {
    const state = this.state();
    const visibleWorkshops = selectVisibleWorkshops(state);

    return {
      ...state,
      visibleWorkshops,
      visibleCount: visibleWorkshops.length,
      hasActiveFilters:
        state.query.length > 0 ||
        state.track !== 'all' ||
        state.difficulty !== 'all' ||
        state.sort !== 'featured' ||
        state.showSavedOnly,
      trackSummary: buildTrackSummary(state.workshops, state.savedIds)
    };
  });

  refresh(): void {
    this.repository.refresh();
  }

  setQuery(query: string): void {
    this.applyMutation({
      type: 'queryChanged',
      query: query.trim()
    });
  }

  setFilters(track: WorkshopTrackFilter, difficulty: WorkshopDifficultyFilter, sort: WorkshopSort): void {
    this.applyMutation({
      type: 'filtersChanged',
      track,
      difficulty,
      sort
    });
  }

  setSavedOnly(showSavedOnly: boolean): void {
    this.applyMutation({
      type: 'savedOnlyChanged',
      showSavedOnly
    });
  }

  toggleSaved(workshopId: string): void {
    this.applyMutation({
      type: 'savedToggled',
      workshopId
    });
  }

  resetFilters(): void {
    this.applyMutation({
      type: 'filtersReset'
    });
  }

  createDetailVm(workshopId: Signal<string>): Signal<WorkshopDetailVm> {
    return computed(() => {
      const state = this.state();
      const currentWorkshopId = workshopId();
      const workshop = state.workshops.find((candidate) => candidate.id === currentWorkshopId) ?? null;
      const recommendations = workshop
        ? state.workshops
            .filter((candidate) => candidate.id !== workshop.id && candidate.track === workshop.track)
            .slice(0, 3)
        : [];

      return {
        loading: state.loading,
        error: state.error,
        workshop,
        recommendations
      };
    });
  }

  private applyMutation(mutation: StateMutation): void {
    this.stateSource.update((state) => reduceState(state, mutation));
  }
}

export function reduceState<TState extends LocalState>(state: TState, mutation: StateMutation): TState {
  switch (mutation.type) {
    case 'queryChanged':
      return {
        ...state,
        query: mutation.query
      } as TState;

    case 'filtersChanged':
      return {
        ...state,
        track: mutation.track,
        difficulty: mutation.difficulty,
        sort: mutation.sort
      } as TState;

    case 'savedOnlyChanged':
      return {
        ...state,
        showSavedOnly: mutation.showSavedOnly
      } as TState;

    case 'savedToggled':
      return {
        ...state,
        savedIds: state.savedIds.includes(mutation.workshopId)
          ? state.savedIds.filter((savedId) => savedId !== mutation.workshopId)
          : [...state.savedIds, mutation.workshopId]
      } as TState;

    case 'filtersReset':
      return {
        ...state,
        query: '',
        track: 'all',
        difficulty: 'all',
        sort: 'featured',
        showSavedOnly: false
      } as TState;
  }
}

export function selectVisibleWorkshops(state: WorkshopsState): readonly Workshop[] {
  const normalizedQuery = state.query.toLowerCase();
  const filtered = state.workshops.filter((workshop) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      workshop.title.toLowerCase().includes(normalizedQuery) ||
      workshop.track.toLowerCase().includes(normalizedQuery) ||
      workshop.summary.toLowerCase().includes(normalizedQuery) ||
      workshop.patterns.some((pattern) => pattern.toLowerCase().includes(normalizedQuery)) ||
      workshop.rxjsFocus.some((focus) => focus.toLowerCase().includes(normalizedQuery));

    const matchesTrack = state.track === 'all' || workshop.track === state.track;
    const matchesDifficulty = state.difficulty === 'all' || workshop.difficulty === state.difficulty;
    const matchesSaved = !state.showSavedOnly || state.savedIds.includes(workshop.id);

    return matchesQuery && matchesTrack && matchesDifficulty && matchesSaved;
  });

  return [...filtered].sort((left, right) => compareWorkshops(left, right, state.sort));
}

function compareWorkshops(left: Workshop, right: Workshop, sort: WorkshopSort): number {
  switch (sort) {
    case 'duration':
      return left.durationHours - right.durationHours;

    case 'difficulty':
      return difficultyRank(left) - difficultyRank(right) || left.title.localeCompare(right.title);

    case 'featured':
      return left.featuredRank - right.featuredRank;
  }
}

function difficultyRank(workshop: Workshop): number {
  return workshop.difficulty === 'intermediate' ? 0 : 1;
}

function buildTrackSummary(
  workshops: readonly Workshop[],
  savedIds: readonly string[]
): readonly TrackSummary[] {
  const tracks: readonly WorkshopTrack[] = ['architecture', 'rxjs', 'testing', 'performance'];

  return tracks.map((track) => {
    const trackWorkshops = workshops.filter((workshop) => workshop.track === track);

    return {
      track,
      total: trackWorkshops.length,
      saved: trackWorkshops.filter((workshop) => savedIds.includes(workshop.id)).length
    };
  });
}
