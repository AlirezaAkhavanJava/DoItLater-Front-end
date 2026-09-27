import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, SignupRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly base = 'http://localhost:8080/api/v1/auth';

  /** Simple in-memory flag; cookies do the real auth via `withCredentials`. */
  readonly isAuthenticated = signal<boolean>(false);

  login(payload: LoginRequest): Observable<unknown> {
    return this.http
      .post(`${this.base}/login`, payload, { withCredentials: true })
      .pipe(tap(() => this.isAuthenticated.set(true)));
  }

  signup(payload: SignupRequest): Observable<unknown> {
    return this.http.post(`${this.base}/signup`, payload, { withCredentials: true });
  }

  logout(): Observable<unknown> {
    return this.http
      .post(`${this.base}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.isAuthenticated.set(false)));
  }
}