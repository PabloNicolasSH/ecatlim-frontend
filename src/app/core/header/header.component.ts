import {Component, inject} from '@angular/core';
import {SplitButton} from 'primeng/splitbutton';
import {MenuItem} from 'primeng/api';
import {AuthService} from '../auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [
    SplitButton
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  protected readonly authService = inject(AuthService);

  userOptions: MenuItem[];
  username: string = "Pablo Nicolás Santana Hernández"

  constructor() {
    this.userOptions = [
      {},
      {separator: true},
      {
        label: 'Cerrar Sesión',
        command: () => {this.authService.logout()}
      }
    ]
  }
}
