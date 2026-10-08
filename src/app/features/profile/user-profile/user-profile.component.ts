import {Component, inject, OnInit} from '@angular/core';
import {Button} from 'primeng/button';
import {User} from '../../../shared/models/user.model';
import {FormsModule} from '@angular/forms';
import {UserModalMeEditComponent} from '../user-modal-me-edit/user-modal-me-edit.component';
import {RouterLink} from '@angular/router';
import {UserAvatarModalComponent} from '../user-avatar-modal/user-avatar-modal.component';
import {HttpClient} from '@angular/common/http';
import {LoggedUserDataService} from '../../../core/auth/logged-user-data-service';
import {UserService} from '../../../shared/services/user.service';
import {NotificationService} from '../../../shared/services/notification.service';
import {ToggleSwitch} from 'primeng/toggleswitch';
import {RoleNamePipe} from '../../../shared/pipes/role-name.pipe';

@Component({
  selector: 'app-user-profile',
  imports: [
    Button,
    FormsModule,
    UserModalMeEditComponent,
    RouterLink,
    UserAvatarModalComponent,
    ToggleSwitch,
    RoleNamePipe
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit {
  protected readonly userService = inject(UserService);
  protected readonly http = inject(HttpClient);
  protected readonly loggedUserDataService = inject(LoggedUserDataService);
  protected readonly notificationService = inject(NotificationService);

  user!: User;
  secureAvatarUrl: any = null;

  visibleEditProfile: boolean = false;
  visibleEditAvatar: boolean = false;
  emailReminders: boolean | null = null;

  ngOnInit(): void {
    this.loggedUserDataService.avatarUrl$.subscribe(url => this.secureAvatarUrl = url);
    this.updateUser();
    this.notificationService.getPreferences().subscribe(prefs => this.emailReminders = prefs.emailReminders);
  }

  onEmailRemindersChange(enabled: boolean) {
    const previous = this.emailReminders;
    this.emailReminders = enabled;
    this.notificationService.setEmailReminders(enabled).subscribe({
      error: () => this.emailReminders = previous
    });
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
}
