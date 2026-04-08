export type OptimisticTrack = 'architecture' | 'rxjs' | 'testing' | 'performance';

export interface OptimisticLab {
  readonly id: string;
  readonly title: string;
  readonly track: OptimisticTrack;
  readonly coach: string;
  readonly summary: string;
  readonly capacity: number;
  readonly reservedSeats: number;
  readonly joined: boolean;
}

export interface OptimisticUpdatesState {
  readonly loading: boolean;
  readonly error: string | null;
  readonly labs: readonly OptimisticLab[];
  readonly pendingIds: readonly string[];
  readonly rolledBackIds: readonly string[];
  readonly statusMessage: string | null;
}

export interface OptimisticUpdatesVm extends OptimisticUpdatesState {
  readonly joinedCount: number;
  readonly pendingCount: number;
  readonly availableSeats: number;
}
