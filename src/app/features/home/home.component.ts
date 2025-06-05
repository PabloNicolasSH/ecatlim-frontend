import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from '../../core/auth/auth.service';
import {Profile} from '../../shared/models/profile.model';

@Component({
  selector: 'app-home',
  imports: [
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
