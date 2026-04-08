export type   WorkshopTrack = 'architecture' | 'rxjs' | 'testing' | 'performance';
export type WorkshopDifficulty = 'intermediate' | 'advanced';
export type WorkshopTrackFilter = WorkshopTrack | 'all';
export type WorkshopDifficultyFilter = WorkshopDifficulty | 'all';
export type WorkshopSort = 'featured' | 'duration' | 'difficulty';

export interface Workshop {
  readonly id: string;
  readonly title: string;
  readonly track: WorkshopTrack;
  readonly difficulty: WorkshopDifficulty;
  readonly durationHours: number;
  readonly featuredRank: number;
  readonly cohortSize: number;
  readonly summary: string;
  readonly patterns: readonly string[];
  readonly outcomes: readonly string[];
  readonly rxjsFocus: readonly string[];
}

export interface WorkshopsRepositorySnapshot {
  readonly loading: boolean;
  readonly error: string | null;
  readonly workshops: readonly Workshop[];
}

export interface WorkshopsState extends WorkshopsRepositorySnapshot {
  readonly query: string;
  readonly track: WorkshopTrackFilter;
  readonly difficulty: WorkshopDifficultyFilter;
  readonly sort: WorkshopSort;
  readonly showSavedOnly: boolean;
  readonly savedIds: readonly string[];
}

export interface WorkshopsVm extends WorkshopsState {
  readonly visibleWorkshops: readonly Workshop[];
  readonly hasActiveFilters: boolean;
  readonly visibleCount: number;
  readonly trackSummary: readonly TrackSummary[];
}

export interface TrackSummary {
  readonly track: WorkshopTrack;
  readonly total: number;
  readonly saved: number;
}

export interface WorkshopDetailVm {
  readonly loading: boolean;
  readonly error: string | null;
  readonly workshop: Workshop | null;
  readonly recommendations: readonly Workshop[];
}
