import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {Button} from 'primeng/button';
import {User} from '../../../shared/models/user.model';
import {UserService} from '../../../shared/services/user.service';
import {FormsModule} from '@angular/forms';
import {UserModalMeEditComponent} from '../user-modal-me-edit/user-modal-me-edit.component';
import {RouterLink} from '@angular/router';
import {UserAvatarModalComponent} from '../user-avatar-modal/user-avatar-modal.component';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {HttpClient} from '@angular/common/http';
import {FileService} from '../../../shared/services/file.service';

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
  protected readonly sanitizer = inject(DomSanitizer);
  protected readonly fileService = inject(FileService)

  user!: User;
  secureAvatarUrl: any = null;

  visibleEditProfile: boolean = false;
  visibleEditAvatar: boolean = false;
  changePassword: boolean = false;

  ngOnInit(): void {
    this.fileService.avatarUrl$.subscribe(url => this.secureAvatarUrl = url);
    this.updateUser();
  }

  updateUser() {
    this.userService.getMyInfo().subscribe({
      next: user => {
        this.user = user;
        if (this.user?.profile?.avatarUrl) {
          this.fileService.loadAvatar(this.user.profile?.avatarUrl);
        }
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
