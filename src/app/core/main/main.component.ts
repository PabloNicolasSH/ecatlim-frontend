import {AfterViewInit, Component, inject} from '@angular/core';
import {HeaderComponent} from '../header/header.component';
import {RouterOutlet} from '@angular/router';
import {FooterComponent} from '../footer/footer.component';
import {OnboardingService} from '../onboarding/onboarding.service';
import {OnboardingHubComponent} from '../onboarding/onboarding-hub.component';

@Component({
  selector: 'app-main',
  imports: [
    HeaderComponent,
    RouterOutlet,
    FooterComponent,
    OnboardingHubComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent implements AfterViewInit {
  private readonly onboardingService = inject(OnboardingService);

  ngAfterViewInit(): void {
    this.onboardingService.init();
  }
}
