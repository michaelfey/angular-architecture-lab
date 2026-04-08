export interface EnrollmentSession {
  readonly id: string;
  readonly title: string;
  readonly track: 'architecture' | 'rxjs' | 'testing' | 'performance';
  readonly coach: string;
  readonly summary: string;
  readonly dayLabel: string;
  readonly startTime: string;
  readonly capacity: number;
  readonly reservedSeats: number;
  readonly isEnrolled: boolean;
}

export interface EnrollmentState {
  readonly query: string;
  readonly loading: boolean;
  readonly error: string | null;
  readonly sessions: readonly EnrollmentSession[];
  readonly pendingIds: readonly string[];
  readonly activeRequestLabel: string | null;
}

export interface EnrollmentVm extends EnrollmentState {
  readonly enrolledCount: number;
  readonly availableSeats: number;
  readonly isEmpty: boolean;
}
