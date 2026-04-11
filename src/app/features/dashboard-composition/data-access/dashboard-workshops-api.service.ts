import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { DashboardWorkshop } from '../domain/dashboard-composition.models';

interface ApiWorkshop extends DashboardWorkshop {
  readonly outcomes?: readonly string[];
  readonly patterns?: readonly string[];
  readonly rxjsFocus?: readonly string[];
  readonly cohortSize?: number;
}

@Injectable()
export class DashboardWorkshopsApiService {
  private readonly http = inject(HttpClient);

  loadWorkshops(): Observable<readonly DashboardWorkshop[]> {
    return this.http.get<readonly ApiWorkshop[]>('/api/workshops').pipe(
      map((workshops) =>
        workshops.map(({ id, title, track, difficulty, durationHours, featuredRank, summary }) => ({
          id,
          title,
          track,
          difficulty,
          durationHours,
          featuredRank,
          summary
        }))
      ),
      catchError((error: HttpErrorResponse) =>
        throwError(() => new Error(readMessage(error, 'The dashboard workshop slice could not be loaded.')))
      )
    );
  }
}

function readMessage(error: HttpErrorResponse, fallback: string): string {
  return typeof error.error?.message === 'string' ? error.error.message : fallback;
}
