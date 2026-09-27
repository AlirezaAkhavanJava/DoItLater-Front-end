import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateHabitRequestDto,
  HabitDto,
  ToggleHabitEntryRequestDto,
  UpdateHabitRequestDto,
  WeekGridDto,
} from '../models/habit.model';

@Injectable({ providedIn: 'root' })
export class HabitService {
  private http = inject(HttpClient);
  private readonly base = 'http://localhost:8080/api/v1/habits';

  getWeek(startDate: string): Observable<WeekGridDto> {
    const params = new HttpParams().set('startDate', startDate);
    return this.http.get<WeekGridDto>(`${this.base}/week`, { params });
  }

  getById(id: number): Observable<HabitDto> {
    return this.http.get<HabitDto>(`${this.base}/${id}`);
  }

  create(payload: CreateHabitRequestDto): Observable<HabitDto> {
    return this.http.post<HabitDto>(`${this.base}/create`, payload);
  }

  update(id: number, payload: UpdateHabitRequestDto): Observable<HabitDto> {
    return this.http.put<HabitDto>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  toggleEntry(id: number, payload: ToggleHabitEntryRequestDto): Observable<unknown> {
    return this.http.post(`${this.base}/${id}/entries`, payload);
  }
}