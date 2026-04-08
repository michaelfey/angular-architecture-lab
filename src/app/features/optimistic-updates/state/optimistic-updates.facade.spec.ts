import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { OptimisticLab } from '../domain/optimistic-updates.models';
import { INITIAL_STATE, reduceState } from './optimistic-updates.facade';

const LABS: readonly OptimisticLab[] = [
  {
    id: 'concurrency-clinic',
    title: 'Concurrency Clinic',
    track: 'testing',
    coach: 'Nora Beek',
    summary: 'Rollback example.',
    capacity: 8,
    reservedSeats: 7,
    joined: false
  }
];

describe('optimistic updates facade reducer', () => {
  it('applies an optimistic patch immediately', () => {
    const updated = reduceState(
      {
        ...INITIAL_STATE,
        labs: LABS
      },
      {
        type: 'reservationOptimisticallyPatched',
        previousLab: LABS[0],
        optimisticLab: {
          ...LABS[0],
          joined: true,
          reservedSeats: 8
        }
      }
    );

    expect(updated.labs[0].joined).toBe(true);
    expect(updated.labs[0].reservedSeats).toBe(8);
    expect(updated.pendingIds).toEqual(['concurrency-clinic']);
  });

  it('restores the previous lab when the server rejects the write', () => {
    const updated = reduceState(
      {
        ...INITIAL_STATE,
        labs: [
          {
            ...LABS[0],
            joined: true,
            reservedSeats: 8
          }
        ],
        pendingIds: ['concurrency-clinic']
      },
      {
        type: 'reservationRolledBack',
        previousLab: LABS[0],
        message: 'Another participant claimed the last seat.'
      }
    );

    expect(updated.labs[0]).toEqual(LABS[0]);
    expect(updated.pendingIds).toEqual([]);
    expect(updated.rolledBackIds).toEqual(['concurrency-clinic']);
  });

  it('reconciles the optimistic write with the authoritative server response', () => {
    const updated = reduceState(
      {
        ...INITIAL_STATE,
        labs: [
          {
            ...LABS[0],
            joined: true,
            reservedSeats: 8
          }
        ],
        pendingIds: ['concurrency-clinic']
      },
      {
        type: 'reservationCommitted',
        lab: {
          ...LABS[0],
          joined: true,
          reservedSeats: 8
        }
      }
    );

    expect(updated.pendingIds).toEqual([]);
    expect(updated.labs[0].joined).toBe(true);
    expect(updated.statusMessage).toContain('confirmed');
  });
});
