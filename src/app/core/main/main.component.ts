import {Component} from '@angular/core';
import {HeaderComponent} from '../header/header.component';
import {RouterOutlet} from '@angular/router';
import {FooterComponent} from '../footer/footer.component';
import {OnboardingComponent} from '../onboarding/onboarding.component';

@Component({
  selector: 'app-main',
  imports: [
    HeaderComponent,
    RouterOutlet,
    FooterComponent,
    OnboardingComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {

}
