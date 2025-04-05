import {Component, inject, OnInit} from '@angular/core';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {TableModule} from 'primeng/table';
import {UserService} from '../../shared/services/user.service';
import {User} from '../../shared/models/user.model';
import {Button} from 'primeng/button';
import {UserModalAddEditComponent} from '../user-modal-add-edit/user-modal-add-edit.component';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {ConfirmationService, MessageService} from 'primeng/api';

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
    ConfirmDialog
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit {

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

  confirmDialog(event: Event, user: User, mode: string) {
    if (mode == 'Deactivate') {
      const confirmationMessage = {
        message: '¿Está seguro de que desea desactivar a ' + user.name + "?",
        header: 'Confirmación de desactivación de usuario',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar la desactivación',
        acceptLabel: 'Confirmo'
      }
      this.generateConfirmation(event, user, mode, confirmationMessage);
    } else {
      const confirmationMessage = {
        message: '¿Está seguro de que desea reactivar a ' + user.name + "?",
        header: 'Confirmación de reactivación de usuario',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar la activación',
        acceptLabel: 'Activar'
      }
      this.generateConfirmation(event, user, mode, confirmationMessage);
    }
  }

  private generateConfirmation(event: Event, user: User, mode: string, confirmation: {
    message: string;
    header: string;
    icon: string,
    rejectLabel: string,
    acceptLabel: string
  }) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: confirmation.message,
      header: confirmation.header,
      closable: true,
      closeOnEscape: true,
      icon: confirmation.icon,
      rejectButtonProps: {
        label: confirmation.rejectLabel,
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: confirmation.acceptLabel,
      },
      accept: () => {
        this.sendAcceptedMessageAndDoActionMode(mode, user);
      },
      reject: () => {
        if (mode == 'Deactivate') {
          this.sendRejectedMessage('Se ha cancelado la desactivación del usuario');
        } else {
          this.sendRejectedMessage('Se ha cancelado la activación del usuario')
        }
      },
    });
  }

  private sendAcceptedMessageAndDoActionMode(mode: string, user: User) {
    if (mode == 'Deactivate') {
      this.messageService.add({
        severity: 'success',
        summary: 'Confirmado',
        detail: 'Se ha desactivado a ' + user.name
      });
      this.deactivateUser(user);
    } else {
      this.messageService.add({
        severity: 'success',
        summary: 'Confirmado',
        detail: 'Se ha activado a ' + user.name
      });
      this.activateUser(user);
    }
  }

  private sendRejectedMessage(detail: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Cancelado',
      detail: detail
    });
  }
}
