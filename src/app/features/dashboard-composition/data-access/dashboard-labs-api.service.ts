import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { DashboardLab } from '../domain/dashboard-composition.models';

@Injectable()
export class DashboardLabsApiService {
  private readonly http = inject(HttpClient);

  loadLabs(): Observable<readonly DashboardLab[]> {
    return this.http.get<readonly DashboardLab[]>('/api/optimistic-updates/labs').pipe(
      catchError((error: HttpErrorResponse) =>
        throwError(() => new Error(readMessage(error, 'The dashboard lab slice could not be loaded.')))
      )
    );
  }
}

function readMessage(error: HttpErrorResponse, fallback: string): string {
  return typeof error.error?.message === 'string' ? error.error.message : fallback;
}
