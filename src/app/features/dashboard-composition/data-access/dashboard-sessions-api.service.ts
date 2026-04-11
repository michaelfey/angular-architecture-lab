import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { DashboardSession } from '../domain/dashboard-composition.models';

interface ApiSession extends DashboardSession {
  readonly summary?: string;
}

@Injectable()
export class DashboardSessionsApiService {
  private readonly http = inject(HttpClient);

  loadSessions(): Observable<readonly DashboardSession[]> {
    return this.http.get<readonly ApiSession[]>('/api/enrollment-effects/sessions').pipe(
      map((sessions) =>
        sessions.map(
          ({ id, title, track, coach, dayLabel, startTime, capacity, reservedSeats, isEnrolled }) => ({
            id,
            title,
            track,
            coach,
            dayLabel,
            startTime,
            capacity,
            reservedSeats,
            isEnrolled
          })
        )
      ),
      catchError((error: HttpErrorResponse) =>
        throwError(() => new Error(readMessage(error, 'The dashboard session slice could not be loaded.')))
      )
    );
  }
}

function readMessage(error: HttpErrorResponse, fallback: string): string {
  return typeof error.error?.message === 'string' ? error.error.message : fallback;
}
