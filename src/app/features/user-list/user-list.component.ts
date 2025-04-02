import {Component, inject, OnInit} from '@angular/core';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {TableModule} from 'primeng/table';
import {UserService} from '../../shared/services/user.service';
import {User} from '../../shared/models/user.model';
import {Button} from 'primeng/button';
import {UserModalAddEditComponent} from '../user-modal-add-edit/user-modal-add-edit.component';

@Component({
  selector: 'app-user-list',
  imports: [
    TabList,
    Tabs,
    Tab,
    TabPanels,
    TabPanel,
    TableModule,
    Button,
    UserModalAddEditComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit{

  protected readonly userService = inject(UserService);

  visible: boolean = false;
  dialogMode: string = '';

  users: User[] = [];
  userToEdit!: User;

  inactiveUsers: User[] = [];

  ngOnInit(): void {
   this.loadUsers();
  }

  showDialog() {
    this.visible = true;
    this.dialogMode = 'Add';
  }

  openEditDialog(user: User) {
    this.userToEdit = user;
    this.visible = true;
    this.dialogMode = 'Edit';
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: users => {
        this.users = users;
      }
    });

    this.userService.getInactiveUsers().subscribe({
      next: inactiveUsers => {
        this.inactiveUsers = inactiveUsers;
      }
    });
  }

  deactivateUser(user: User) {
    this.userService.deactivateUser(user.id!).subscribe({
      next: () => {
        console.log("HOLAAA");
        this.loadUsers();
      }
    });
  }

  activateUser(user: User) {
    this.userService.activateUser(user.id!).subscribe({
      next: () => this.loadUsers()
    });
  }
}
