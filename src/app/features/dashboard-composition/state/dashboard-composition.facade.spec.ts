import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { INITIAL_LABS_SNAPSHOT } from '../data-access/dashboard-labs.repository';
import { INITIAL_SESSIONS_SNAPSHOT } from '../data-access/dashboard-sessions.repository';
import { INITIAL_WORKSHOPS_SNAPSHOT } from '../data-access/dashboard-workshops.repository';
import { DashboardState } from '../domain/dashboard-composition.models';
import { buildVm, INITIAL_STATE, reduceState } from './dashboard-composition.facade';

const state: DashboardState = {
  ...INITIAL_STATE,
  workshopsSnapshot: {
    ...INITIAL_WORKSHOPS_SNAPSHOT,
    workshops: [
      {
        id: 'facade-streams',
        title: 'Design Facades Around Streams',
        track: 'rxjs',
        difficulty: 'intermediate',
        durationHours: 6,
        featuredRank: 1,
        summary: 'Compose event streams.'
      },
      {
        id: 'contract-testing',
        title: 'Contract Testing',
        track: 'testing',
        difficulty: 'advanced',
        durationHours: 4,
        featuredRank: 2,
        summary: 'Protect feature boundaries.'
      }
    ]
  },
  sessionsSnapshot: {
    ...INITIAL_SESSIONS_SNAPSHOT,
    sessions: [
      {
        id: 'rxjs-search-lab',
        title: 'RxJS Search Lab',
        track: 'rxjs',
        coach: 'Marcus Vale',
        dayLabel: 'Tuesday',
        startTime: '13:30',
        capacity: 18,
        reservedSeats: 17,
        isEnrolled: false
      },
      {
        id: 'contract-clinic',
        title: 'Contract Clinic',
        track: 'testing',
        coach: 'Nina Laurent',
        dayLabel: 'Wednesday',
        startTime: '11:00',
        capacity: 14,
        reservedSeats: 9,
        isEnrolled: true
      }
    ]
  },
  labsSnapshot: {
    ...INITIAL_LABS_SNAPSHOT,
    labs: [
      {
        id: 'concurrency-clinic',
        title: 'Concurrency Clinic',
        track: 'testing',
        coach: 'Nora Beek',
        summary: 'Rollback example.',
        capacity: 8,
        reservedSeats: 7,
        joined: false
      },
      {
        id: 'stream-debug-room',
        title: 'Stream Debug Room',
        track: 'rxjs',
        coach: 'Arun Sethi',
        summary: 'Trace timing bugs.',
        capacity: 10,
        reservedSeats: 7,
        joined: true
      }
    ]
  }
};

describe('dashboard composition facade helpers', () => {
  it('stores local dashboard filters', () => {
    const updated = reduceState(
      {
        track: 'all',
        showAttentionOnly: false
      },
      {
        type: 'trackChanged',
        track: 'testing'
      }
    );

    expect(updated.track).toBe('testing');
    expect(updated.showAttentionOnly).toBe(false);
  });

  it('composes filtered dashboard cards across all slices', () => {
    const vm = buildVm({
      ...state,
      track: 'testing'
    });

    expect(vm.featuredWorkshops.map((workshop) => workshop.id)).toEqual(['contract-testing']);
    expect(vm.sessions.map((session) => session.id)).toEqual(['contract-clinic']);
    expect(vm.labs.map((lab) => lab.id)).toEqual(['concurrency-clinic']);
  });

  it('limits the lists to attention items when requested', () => {
    const vm = buildVm({
      ...state,
      showAttentionOnly: true
    });

    expect(vm.featuredWorkshops.map((workshop) => workshop.id)).toEqual([
      'facade-streams',
      'contract-testing'
    ]);
    expect(vm.sessions.every((session) => session.needsAttention)).toBe(true);
    expect(vm.labs.every((lab) => lab.needsAttention)).toBe(true);
  });
});
