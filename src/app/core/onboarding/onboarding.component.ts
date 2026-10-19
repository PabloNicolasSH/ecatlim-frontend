import {Component, computed, effect, inject, OnInit, signal} from '@angular/core';
import {Dialog} from 'primeng/dialog';
import {Button} from 'primeng/button';
import {LoggedUserDataService} from '../auth/logged-user-data-service';
import {UserService} from '../../shared/services/user.service';
import {OnboardingService} from './onboarding.service';
import {buildOnboardingSteps} from './onboarding-steps';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-onboarding',
  imports: [Dialog, Button],
  templateUrl: './onboarding.component.html'
})
export class OnboardingComponent implements OnInit {
  private readonly loggedUserDataService = inject(LoggedUserDataService);
  private readonly userService = inject(UserService);
  protected readonly onboardingService = inject(OnboardingService);

  protected readonly manualUrl = environment.userManualUrl;
  protected readonly stepIndex = signal(0);
  protected readonly steps = computed(() =>
    buildOnboardingSteps(this.loggedUserDataService.getLoggedUserData()?.roles ?? []));
  /** The last screen is not a feature step: it points the user to the manual. */
  protected readonly isManualStep = computed(() => this.stepIndex() === this.steps().length);
  protected readonly totalSteps = computed(() => this.steps().length + 1);
  protected readonly dots = computed(() => Array.from({length: this.totalSteps()}));
  protected readonly currentStep = computed(() => this.steps()[this.stepIndex()]);

  constructor() {
    effect(() => {
      if (this.onboardingService.visible()) {
        this.stepIndex.set(0);
      }
    });
  }

  ngOnInit(): void {
    const me = this.loggedUserDataService.getLoggedUserData();
    if (me && !me.onboardingCompleted) {
      this.onboardingService.open();
    }
  }

  protected next(): void {
    this.stepIndex.update(i => Math.min(i + 1, this.totalSteps() - 1));
  }

  protected previous(): void {
    this.stepIndex.update(i => Math.max(i - 1, 0));
  }

  protected onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.finish();
    }
  }

  protected finish(): void {
    this.onboardingService.close();
    const me = this.loggedUserDataService.getLoggedUserData();
    if (!me || me.onboardingCompleted) {
      return;
    }
    this.userService.completeOnboarding().subscribe({
      next: () => this.loggedUserDataService.setUserData({...me, onboardingCompleted: true}),
      error: err => console.error('No se pudo guardar el estado del tutorial:', err)
    });
  }
}
