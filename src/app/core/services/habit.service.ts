import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../api.config';
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
  private base = `${API_BASE}/habits`;

  getWeek(startDateIso: string): Promise<WeekGridDto> {
    return firstValueFrom(
      this.http.get<WeekGridDto>(`${this.base}/week`, {
        params: { startDate: startDateIso },
      })
    );
  }

  getById(id: number): Promise<HabitDto> {
    return firstValueFrom(this.http.get<HabitDto>(`${this.base}/${id}`));
  }

  create(payload: CreateHabitRequestDto): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/create`, payload));
  }

  update(id: number, payload: UpdateHabitRequestDto): Promise<HabitDto> {
    return firstValueFrom(this.http.put<HabitDto>(`${this.base}/${id}`, payload));
  }

  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
  }

  toggleEntry(id: number, payload: ToggleHabitEntryRequestDto): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/${id}/entries`, payload));
  }
}