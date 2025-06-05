import {Component, inject, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Toast} from 'primeng/toast';
import {UserService} from './shared/services/user-and-entity/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  protected readonly userService = inject(UserService);

  title = 'ecatlim-frontend';

  ngOnInit(): void {
    this.userService.getMyInfo().subscribe({})
  }
}
