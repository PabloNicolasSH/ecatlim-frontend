import {Component, inject, OnInit} from '@angular/core';
import {Button} from 'primeng/button';
import {User} from '../../shared/models/user.model';
import {UserService} from '../../shared/services/user.service';
import {LowerCasePipe, UpperCasePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {UserModalMeEditComponent} from '../user-modal-me-edit/user-modal-me-edit.component';
import {UserModalAddEditComponent} from '../user-modal-add-edit/user-modal-add-edit.component';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-user-profile',
  imports: [
    Button,
    FormsModule,
    UserModalMeEditComponent,
    RouterLink
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit{

  protected readonly userService = inject(UserService);

  user!: User;
  userAddress: string = '';
  visible: boolean = false;
  changePassword: boolean = false;

  ngOnInit(): void {
    this.userService.getMyInfo().subscribe({
      next: user => {
        this.user = user;
        this.prepareProfileInformation();
        this.createUserAddress();
      }
    });
  }

  private prepareProfileInformation() {
    if (this.user.avatarUrl == null){
      this.user.avatarUrl = "assets/user-photo.jpg"
    }
  }

  createUserAddress(){
    const address = this.user.address;
    const city = this.user.city;
    const country = this.user.country;
    this.userAddress = [address, city, country].filter(Boolean).join(', ');
  }

  updateUser() {

  }

  protected readonly navigator = navigator;
}
