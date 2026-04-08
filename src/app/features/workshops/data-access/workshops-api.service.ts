import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { Workshop } from '../domain/workshop.models';

@Injectable()
export class WorkshopsApiService {
  private readonly http = inject(HttpClient);

  loadCatalog(): Observable<readonly Workshop[]> {
    return this.http.get<readonly Workshop[]>('/api/workshops').pipe(
      catchError((error: HttpErrorResponse) =>
        throwError(() => new Error(readMessage(error, 'The workshop catalog could not be loaded.')))
      )
    );
  }
}

function readMessage(error: HttpErrorResponse, fallback: string): string {
  return typeof error.error?.message === 'string' ? error.error.message : fallback;
}
