export type DashboardTrack = 'architecture' | 'rxjs' | 'testing' | 'performance';
export type DashboardTrackFilter = DashboardTrack | 'all';

export interface DashboardWorkshop {
  readonly id: string;
  readonly title: string;
  readonly track: DashboardTrack;
  readonly difficulty: 'intermediate' | 'advanced';
  readonly durationHours: number;
  readonly featuredRank: number;
  readonly summary: string;
}

export interface DashboardSession {
  readonly id: string;
  readonly title: string;
  readonly track: DashboardTrack;
  readonly coach: string;
  readonly dayLabel: string;
  readonly startTime: string;
  readonly capacity: number;
  readonly reservedSeats: number;
  readonly isEnrolled: boolean;
}

export interface DashboardLab {
  readonly id: string;
  readonly title: string;
  readonly track: DashboardTrack;
  readonly coach: string;
  readonly summary: string;
  readonly capacity: number;
  readonly reservedSeats: number;
  readonly joined: boolean;
}

export interface DashboardWorkshopsSnapshot {
  readonly loading: boolean;
  readonly error: string | null;
  readonly workshops: readonly DashboardWorkshop[];
}

export interface DashboardSessionsSnapshot {
  readonly loading: boolean;
  readonly error: string | null;
  readonly sessions: readonly DashboardSession[];
}

export interface DashboardLabsSnapshot {
  readonly loading: boolean;
  readonly error: string | null;
  readonly labs: readonly DashboardLab[];
}

export interface DashboardState {
  readonly track: DashboardTrackFilter;
  readonly showAttentionOnly: boolean;
  readonly workshopsSnapshot: DashboardWorkshopsSnapshot;
  readonly sessionsSnapshot: DashboardSessionsSnapshot;
  readonly labsSnapshot: DashboardLabsSnapshot;
}

export interface DashboardMetric {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

export interface DashboardTrackSummary {
  readonly track: DashboardTrack;
  readonly workshopCount: number;
  readonly enrolledCount: number;
  readonly joinedCount: number;
  readonly openSeats: number;
  readonly isActive: boolean;
}

export interface DashboardWorkshopCardVm extends DashboardWorkshop {
  readonly intensityLabel: string;
}

export interface DashboardSessionCardVm extends DashboardSession {
  readonly availableSeats: number;
  readonly statusLabel: string;
  readonly needsAttention: boolean;
}

export interface DashboardLabCardVm extends DashboardLab {
  readonly availableSeats: number;
  readonly statusLabel: string;
  readonly needsAttention: boolean;
}

export interface DashboardVm {
  readonly loading: boolean;
  readonly errors: readonly string[];
  readonly track: DashboardTrackFilter;
  readonly showAttentionOnly: boolean;
  readonly metrics: readonly DashboardMetric[];
  readonly trackSummary: readonly DashboardTrackSummary[];
  readonly featuredWorkshops: readonly DashboardWorkshopCardVm[];
  readonly sessions: readonly DashboardSessionCardVm[];
  readonly labs: readonly DashboardLabCardVm[];
  readonly emptySections: {
    readonly workshops: boolean;
    readonly sessions: boolean;
    readonly labs: boolean;
  };
}
