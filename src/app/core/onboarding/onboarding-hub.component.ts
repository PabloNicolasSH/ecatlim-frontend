import {Component, inject} from '@angular/core';
import {Router} from '@angular/router';
import {Dialog} from 'primeng/dialog';
import {Button} from 'primeng/button';
import {OnboardingService} from './onboarding.service';
import {OnboardingModuleDef} from './onboarding-steps';
import {OnboardingModuleProgress} from './onboarding.model';

@Component({
  selector: 'app-onboarding-hub',
  imports: [Dialog, Button],
  templateUrl: './onboarding-hub.component.html'
})
export class OnboardingHubComponent {
  protected readonly onboardingService = inject(OnboardingService);
  private readonly router = inject(Router);

  protected onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.onboardingService.closeHub();
    }
  }

  protected tasksDone(progress: OnboardingModuleProgress): number {
    return progress.tasks.filter(task => task.done).length;
  }

  protected taskLabel(def: OnboardingModuleDef, key: string): string {
    return def.tasks[key]?.label ?? key;
  }

  protected goToTask(def: OnboardingModuleDef, key: string): void {
    const route = def.tasks[key]?.route;
    if (route) {
      this.onboardingService.closeHub();
      void this.router.navigateByUrl(route);
    }
  }
}
