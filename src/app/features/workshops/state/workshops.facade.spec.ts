import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { Workshop } from '../domain/workshop.models';
import { INITIAL_STATE, reduceState, selectVisibleWorkshops } from './workshops.facade';

const WORKSHOPS: readonly Workshop[] = [
  {
    id: 'facade-streams',
    title: 'Design Facades Around Streams',
    track: 'rxjs',
    difficulty: 'intermediate',
    durationHours: 6,
    featuredRank: 1,
    cohortSize: 18,
    summary: 'Model UI events as mutations and reduce the feature into a stable view model.',
    patterns: ['facade pattern', 'scan reducer'],
    outcomes: ['Build a facade-driven view model'],
    rxjsFocus: ['scan', 'shareReplay']
  },
  {
    id: 'repository-caching',
    title: 'Hide Caching Behind a Repository',
    track: 'performance',
    difficulty: 'advanced',
    durationHours: 5,
    featuredRank: 2,
    cohortSize: 14,
    summary: 'Keep repository snapshots stable while refresh requests run.',
    patterns: ['repository pattern', 'cache boundary'],
    outcomes: ['Protect components from fetch details'],
    rxjsFocus: ['switchMap', 'catchError']
  }
];

describe('workshops facade helpers', () => {
  it('filters by query, track, and saved state', () => {
    const state = {
      ...INITIAL_STATE,
      workshops: WORKSHOPS,
      query: 'rxjs',
      track: 'rxjs' as const,
      showSavedOnly: true,
      savedIds: ['facade-streams']
    };

    expect(selectVisibleWorkshops(state).map((workshop) => workshop.id)).toEqual(['facade-streams']);
  });

  it('resets filters without removing saved ids', () => {
    const updated = reduceState(
      {
        ...INITIAL_STATE,
        query: 'cache',
        track: 'performance',
        difficulty: 'advanced',
        sort: 'duration',
        showSavedOnly: true,
        savedIds: ['repository-caching']
      },
      { type: 'filtersReset' }
    );

    expect(updated.query).toBe('');
    expect(updated.track).toBe('all');
    expect(updated.savedIds).toEqual(['repository-caching']);
  });
});
