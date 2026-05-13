import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from '../../core/auth/auth.service';
import {Profile} from '../../shared/models/profile.model';
import {EventWidgetComponent} from './event-widget/event-widget.component';

@Component({
  selector: 'app-home',
  imports: [
    EventWidgetComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit{

  protected readonly authService = inject(AuthService);

  me!: Profile;

  ngOnInit(): void {
    this.me = this.authService.getProfile();
  }
}
