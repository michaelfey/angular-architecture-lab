import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { OptimisticLab } from '../domain/optimistic-updates.models';

@Injectable()
export class OptimisticUpdatesApiService {
  private readonly http = inject(HttpClient);

  loadLabs(): Observable<readonly OptimisticLab[]> {
    return this.http.get<readonly OptimisticLab[]>('/api/optimistic-updates/labs').pipe(
      catchError((error: HttpErrorResponse) =>
        throwError(() => new Error(readMessage(error, 'The lab snapshot could not be loaded.')))
      )
    );
  }

  toggleReservation(labId: string): Observable<OptimisticLab> {
    return this.http.post<OptimisticLab>(`/api/optimistic-updates/labs/${labId}/toggle`, {}).pipe(
      catchError((error: HttpErrorResponse) =>
        throwError(() =>
          new Error(readMessage(error, 'The optimistic reservation could not be confirmed.'))
        )
      )
    );
  }
}

function readMessage(error: HttpErrorResponse, fallback: string): string {
  return typeof error.error?.message === 'string' ? error.error.message : fallback;
}
