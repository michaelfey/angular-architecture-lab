import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { EnrollmentSession } from '../domain/enrollment.models';

@Injectable()
export class EnrollmentApiService {
  private readonly http = inject(HttpClient);

  searchSessions(query: string): Observable<readonly EnrollmentSession[]> {
    return this.http
      .get<readonly EnrollmentSession[]>('/api/enrollment-effects/sessions', {
        params: new HttpParams().set('query', query.trim())
      })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(readMessage(error, 'The session search failed.')))
        )
      );
  }

  toggleEnrollment(sessionId: string): Observable<EnrollmentSession> {
    return this.http
      .post<EnrollmentSession>(`/api/enrollment-effects/sessions/${sessionId}/toggle`, {})
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(readMessage(error, 'The enrollment request failed.')))
        )
      );
  }
}

function readMessage(error: HttpErrorResponse, fallback: string): string {
  return typeof error.error?.message === 'string' ? error.error.message : fallback;
}
