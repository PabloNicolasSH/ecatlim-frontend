import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {OnboardingModuleId, OnboardingModuleProgress} from './onboarding.model';

@Injectable({
  providedIn: 'root'
})
export class OnboardingApiService {
  private readonly http = inject(HttpClient);

  getProgress(): Observable<OnboardingModuleProgress[]> {
    return this.http.get<OnboardingModuleProgress[]>(`${environment.apiUrl}/onboarding/me`);
  }

  completeTour(module: OnboardingModuleId): Observable<OnboardingModuleProgress[]> {
    return this.http.put<OnboardingModuleProgress[]>(
      `${environment.apiUrl}/onboarding/me/modules/${module}/tour-completed`, {});
  }

  completeTask(task: string): Observable<OnboardingModuleProgress[]> {
    return this.http.put<OnboardingModuleProgress[]>(`${environment.apiUrl}/onboarding/me/tasks/${task}`, {});
  }
}
