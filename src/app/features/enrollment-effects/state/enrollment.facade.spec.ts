import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { EnrollmentSession } from '../domain/enrollment.models';
import { INITIAL_STATE, reduceState } from './enrollment.facade';

const SESSIONS: readonly EnrollmentSession[] = [
  {
    id: 'rxjs-search-lab',
    title: 'RxJS Search Lab',
    track: 'rxjs',
    coach: 'Marcus Vale',
    summary: 'Build debounced query streams.',
    dayLabel: 'Tuesday',
    startTime: '13:30',
    capacity: 18,
    reservedSeats: 15,
    isEnrolled: true
  }
];

describe('enrollment facade reducer', () => {
  it('stores the submitted query before the request finishes', () => {
    const updated = reduceState(INITIAL_STATE, {
      type: 'queryChanged',
      query: 'rxjs'
    });

    expect(updated.query).toBe('rxjs');
    expect(updated.loading).toBe(false);
  });

  it('replaces the matching session when an enrollment toggle succeeds', () => {
    const updated = reduceState(
      {
        ...INITIAL_STATE,
        sessions: SESSIONS,
        pendingIds: ['rxjs-search-lab']
      },
      {
        type: 'toggleSucceeded',
        session: {
          ...SESSIONS[0],
          reservedSeats: 16,
          isEnrolled: true
        }
      }
    );

    expect(updated.sessions[0].reservedSeats).toBe(16);
    expect(updated.pendingIds).toEqual([]);
  });

  it('keeps the previous results when a search fails', () => {
    const updated = reduceState(
      {
        ...INITIAL_STATE,
        sessions: SESSIONS,
        loading: true
      },
      {
        type: 'searchFailed',
        message: 'No seats are available.'
      }
    );

    expect(updated.sessions).toEqual(SESSIONS);
    expect(updated.loading).toBe(false);
    expect(updated.error).toBe('No seats are available.');
  });
});
