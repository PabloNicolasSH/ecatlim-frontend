import {Component, inject, OnInit} from '@angular/core';
import {Button} from 'primeng/button';
import {User} from '../../../shared/models/user.model';
import {FormsModule} from '@angular/forms';
import {UserModalMeEditComponent} from '../user-modal-me-edit/user-modal-me-edit.component';
import {RouterLink} from '@angular/router';
import {UserAvatarModalComponent} from '../user-avatar-modal/user-avatar-modal.component';
import {HttpClient} from '@angular/common/http';
import {Role} from '../../../shared/models/role.model';
import {LoggedUserDataService} from '../../../core/auth/logged-user-data-service';
import {UserService} from '../../../shared/services/user.service';

@Component({
  selector: 'app-user-profile',
  imports: [
    Button,
    FormsModule,
    UserModalMeEditComponent,
    RouterLink,
    UserAvatarModalComponent
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit {
  protected readonly userService = inject(UserService);
  protected readonly http = inject(HttpClient);
  protected readonly loggedUserDataService = inject(LoggedUserDataService);

  user!: User;
  secureAvatarUrl: any = null;

  visibleEditProfile: boolean = false;
  visibleEditAvatar: boolean = false;

  ngOnInit(): void {
    this.loggedUserDataService.avatarUrl$.subscribe(url => this.secureAvatarUrl = url);
    this.updateUser();
  }

  updateUser() {
    this.userService.getMyInfo().subscribe({
      next: user => {
        this.user = user;
        this.loggedUserDataService.setUserData(user);
      }
    });
  }

  userFirstLetter(): string {
    if (this.user?.profile?.name) {
      return this.user.profile?.name.at(0)!.toUpperCase();
    }
    if (this.user?.email) {
      return this.user.email.at(0)!.toUpperCase();
    }
    return 'A';
  }

  getFormattedAddress(): string {
    const profile = this.user.profile;
    if (!profile) {
      return 'No tiene dirección registrada';
    }

    const parts = [
      profile.address,
      profile.city,
      profile.country
    ].filter(value => value && value.trim() !== '');

    return parts.length > 0 ? parts.join(', ') : 'No tiene dirección registrada';
  }

  protected getRoleNames(roles: Role[]) {
    if (!roles || roles.length === 0) {
      return ['Sin Rol'];
    }

    return roles.map(role => {
      switch (role.toUpperCase()) {
        case 'MANAGER_DIRECTOR':
          return 'Dirección ECATLIM';
        case 'ADMIN':
          return 'Administración';
        case 'EVENT_DIRECTOR':
          return 'Dirección de Eventos';
        case 'HEAD_OF_EDUCATION':
          return 'Coord. Formación';
        case 'STUDENT':
          return 'Persona en Formación';
        default:
          return role;
      }
    });
  }
}
