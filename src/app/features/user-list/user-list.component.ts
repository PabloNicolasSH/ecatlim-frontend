import {Component, inject, OnInit} from '@angular/core';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {TableModule} from 'primeng/table';
import {UserService} from '../../shared/services/user.service';
import {User} from '../../shared/models/user.model';
import {Button} from 'primeng/button';
import {UserModalAddEditComponent} from '../user-modal-add-edit/user-modal-add-edit.component';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ConfirmPopup} from 'primeng/confirmpopup';

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
    UserModalAddEditComponent,
    ConfirmDialog,
    ConfirmPopup
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit{

  protected readonly userService = inject(UserService);
  protected readonly confirmationService = inject(ConfirmationService);
  protected readonly messageService = inject(MessageService);

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
        this.loadUsers();
      }
    });
  }

  activateUser(user: User) {
    this.userService.activateUser(user.id!).subscribe({
      next: () => this.loadUsers()
    });
  }

  confirmDialog(event: Event, user: User, mode: string){
    if (mode == 'Deactivate'){
      this.confirmDeactivate(event, user);
    } else {
      this.confirmReactivate(event, user);
    }
  }


  private confirmDeactivate(event: Event, user: User) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Está seguro de que desea desactivar a ' + user.name + "?",
      header: 'Confirmación de desactivación de usuario',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar la desactivación',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Confirmo',
      },
      accept: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Confirmado',
          detail: 'Se ha desactivado a ' + user.name
        });
        this.deactivateUser(user);
      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Cancelado',
          detail: 'Se ha cancelado la desactivación del usuario'
        });
      },
    });
  }

  private confirmReactivate(event: Event, user: User) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Está seguro de que desea reactivar a ' + user.name + "?",
      header: 'Confirmación de reactivación de usuario',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar la activación',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Activar',
      },
      accept: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Confirmado',
          detail: 'Se ha activado a ' + user.name
        });
        this.activateUser(user);
      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Cancelado',
          detail: 'Se ha cancelado la activación del usuario'
        });
      },
    });
  }
}
