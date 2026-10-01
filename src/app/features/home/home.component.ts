import {Component, inject, OnInit} from '@angular/core';
import {EventWidgetComponent} from './event-widget/event-widget.component';
import {User} from '../../shared/models/user.model';
import {LoggedUserDataService} from '../../core/auth/logged-user-data-service';

@Component({
  selector: 'app-home',
  imports: [
    EventWidgetComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  protected readonly loggedUserDataService = inject(LoggedUserDataService);

  me!: User;

  ngOnInit(): void {
    this.me = this.loggedUserDataService.getLoggedUserData();
  }
}
