import { inject, Injectable } from '@angular/core';
import { Observable, Subject, combineLatest, map, merge, scan, shareReplay } from 'rxjs';
import {
  TrackSummary,
  Workshop,
  WorkshopDetailVm,
  WorkshopDifficultyFilter,
  WorkshopSort,
  WorkshopTrack,
  WorkshopTrackFilter,
  WorkshopsRepositorySnapshot,
  WorkshopsState,
  WorkshopsVm
} from '../domain/workshop.models';
import { WorkshopsRepository } from '../data-access/workshops.repository';

type StateMutation =
  | { readonly type: 'repositoryChanged'; readonly snapshot: WorkshopsRepositorySnapshot }
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

const INITIAL_STATE: WorkshopsState = {
  loading: false,
  error: null,
  workshops: [],
  query: '',
  track: 'all',
  difficulty: 'all',
  sort: 'featured',
  showSavedOnly: false,
  savedIds: []
};

@Injectable()
export class WorkshopsFacade {
  private readonly repository = inject(WorkshopsRepository);
  private readonly mutations$$ = new Subject<StateMutation>();

  readonly state$: Observable<WorkshopsState> = merge(
    this.repository.snapshot$.pipe(map((snapshot): StateMutation => ({ type: 'repositoryChanged', snapshot }))),
    this.mutations$$
  ).pipe(
    scan((state, mutation) => reduceState(state, mutation), INITIAL_STATE),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly vm$: Observable<WorkshopsVm> = this.state$.pipe(
    map((state) => {
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
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  refresh(): void {
    this.repository.refresh();
  }

  setQuery(query: string): void {
    this.mutations$$.next({
      type: 'queryChanged',
      query: query.trim()
    });
  }

  setFilters(track: WorkshopTrackFilter, difficulty: WorkshopDifficultyFilter, sort: WorkshopSort): void {
    this.mutations$$.next({
      type: 'filtersChanged',
      track,
      difficulty,
      sort
    });
  }

  setSavedOnly(showSavedOnly: boolean): void {
    this.mutations$$.next({
      type: 'savedOnlyChanged',
      showSavedOnly
    });
  }

  toggleSaved(workshopId: string): void {
    this.mutations$$.next({
      type: 'savedToggled',
      workshopId
    });
  }

  resetFilters(): void {
    this.mutations$$.next({
      type: 'filtersReset'
    });
  }

  createDetailVm(workshopId$: Observable<string>): Observable<WorkshopDetailVm> {
    return combineLatest([this.state$, workshopId$]).pipe(
      map(([state, workshopId]) => {
        const workshop = state.workshops.find((candidate) => candidate.id === workshopId) ?? null;
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
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }
}

function reduceState(state: WorkshopsState, mutation: StateMutation): WorkshopsState {
  switch (mutation.type) {
    case 'repositoryChanged':
      return {
        ...state,
        loading: mutation.snapshot.loading,
        error: mutation.snapshot.error,
        workshops: mutation.snapshot.workshops
      };

    case 'queryChanged':
      return {
        ...state,
        query: mutation.query
      };

    case 'filtersChanged':
      return {
        ...state,
        track: mutation.track,
        difficulty: mutation.difficulty,
        sort: mutation.sort
      };

    case 'savedOnlyChanged':
      return {
        ...state,
        showSavedOnly: mutation.showSavedOnly
      };

    case 'savedToggled':
      return {
        ...state,
        savedIds: state.savedIds.includes(mutation.workshopId)
          ? state.savedIds.filter((savedId) => savedId !== mutation.workshopId)
          : [...state.savedIds, mutation.workshopId]
      };

    case 'filtersReset':
      return {
        ...state,
        query: '',
        track: 'all',
        difficulty: 'all',
        sort: 'featured',
        showSavedOnly: false
      };
  }
}

function selectVisibleWorkshops(state: WorkshopsState): readonly Workshop[] {
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

export {
  INITIAL_STATE,
  buildTrackSummary,
  compareWorkshops,
  reduceState,
  selectVisibleWorkshops
};
