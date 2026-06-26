import {Component, inject, OnInit} from '@angular/core';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {TableModule} from 'primeng/table';
import {UserService} from '../../shared/services/user.service';
import {User} from '../../shared/models/user.model';
import {Button} from 'primeng/button';
import {UserModalAddEditComponent} from '../user-modal-add-edit/user-modal-add-edit.component';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {ConfirmationService, FilterService, MessageService} from 'primeng/api';
import {PendingUserService} from '../../shared/services/pending-user.service';
import {PendingUser} from '../../shared/models/pending-user.model';
import {FormsModule} from '@angular/forms';
import {MultiSelect} from 'primeng/multiselect';
import {ScoutGroup} from '../../shared/models/scout-group.model';
import {EntityService} from '../../shared/services/entity.service';

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
    FormsModule
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit {

  protected readonly userService = inject(UserService);
  protected readonly pendingUserService = inject(PendingUserService);
  protected readonly scoutGroupService = inject(EntityService);
  protected readonly confirmationService = inject(ConfirmationService);
  protected readonly messageService = inject(MessageService);

  visible: boolean = false;
  dialogMode: string = '';

  users: User[] = [];
  userToEdit!: User;

  inactiveUsers: User[] = [];
  pendingUserRequests: PendingUser[] = [];
  scoutGroups: ScoutGroup[] = [];

  ngOnInit(): void {
    this.loadUsers();
    this.loadScoutGroups();
    this.pendingUserService.getPendingUsers().subscribe({
      next: pendingUsers => {
        this.pendingUserRequests = pendingUsers;
      }
    });
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

    this.users = this.users.map(user => ({
      ...user,
      fullName: `${user.profile?.surname}, ${user.profile?.name}`
    }));

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

  confirmDialog(event: Event, mode: string, user?: User, pendingUser?: PendingUser) {
    if (mode == 'Deactivate' && user) {
      const confirmationMessage = {
        message: '¿Está seguro de que desea desactivar a ' + user.profile?.name + "?",
        header: 'Confirmación de desactivación de usuario',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar la desactivación',
        acceptLabel: 'Confirmo',
        event: event,
        user: user,
        mode: mode
      }
      this.generateConfirmation(confirmationMessage);
    } else if (mode == 'Create User' && pendingUser) {
      const confirmationMessage = {
        message: 'Con este proceso acepta la solicitud de alta de ' + pendingUser.name + ". Le llegará un correo informativo al " +
          "usuario diciéndole que se le ha dado de alta en el Aula Virtual y que ya tiene acceso, ¿estás de acuerdo?",
        header: 'Confirmación de creación de usuario',
        icon: 'pi pi-save',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Crear Usuario',
        event: event,
        mode: mode,
        pendingUser: pendingUser
      }
      this.generateConfirmation(confirmationMessage);
    } else if (mode == 'Delete request' && pendingUser) {
      const confirmationMessage = {
        message: 'Va a eliminar la solicitud de alta de ' + pendingUser.name + " ¿Está seguro?",
        header: 'Eliminar solicitud de alta',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'No, cancelar',
        acceptLabel: 'Sí, eliminar solicitud',
        pendingUser: pendingUser,
        event: event,
        mode: mode
      }
      this.generateConfirmation(confirmationMessage);
    } else if (user){
      const confirmationMessage = {
        message: '¿Está seguro de que desea reactivar a ' + user.profile?.name + "?",
        header: 'Confirmación de reactivación de usuario',
        icon: 'pi pi-history',
        rejectLabel: 'Cancelar la activación',
        acceptLabel: 'Activar',
        event: event,
        user: user,
        mode: mode
      }
      this.generateConfirmation(confirmationMessage);
    }
  }

  private generateConfirmation(confirmation: {
    message: string;
    header: string;
    icon: string,
    rejectLabel: string,
    acceptLabel: string,
    user?: User,
    pendingUser?: PendingUser,
    event: Event,
    mode: string
  }) {
    this.confirmationService.confirm({
      target: confirmation.event.target as EventTarget,
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
        if (confirmation.user != null){
          this.sendAcceptedMessageAndDoActionMode(confirmation.mode, confirmation.user);
        } else if (confirmation.pendingUser != null){
          this.sendAcceptedMessageAndDoActionMode(confirmation.mode, undefined ,confirmation.pendingUser);
        }
      },
      reject: () => {
        if (confirmation.mode == 'Deactivate') {
          this.sendRejectedMessage('Se ha cancelado la desactivación del usuario');
        } else if (confirmation.mode == 'Create User') {
          this.sendRejectedMessage('Se ha cancelado la aceptación de la solicitud de alta');
        } else if (confirmation.mode == 'Delete request') {
          this.sendRejectedMessage('Se ha cancelado la eliminación de la solicitud de alta');
        } else {
          this.sendRejectedMessage('Se ha cancelado la activación del usuario')
        }
      },
    });
  }

  private sendAcceptedMessageAndDoActionMode(mode: string, user?: User, pendingUser?: PendingUser) {
    if (mode == 'Deactivate' && user) {
      this.messageService.add({
        severity: 'success',
        summary: 'Confirmado',
        detail: 'Se ha desactivado a ' + user.profile?.name
      });
      this.deactivateUser(user);
    } else if (mode == 'Create User' && pendingUser) {
      this.createUserFromPendingUser(pendingUser);
    } else if (mode == 'Delete request' && pendingUser) {
      this.deletePendingUserRequest(pendingUser);
    } else if (user) {
      this.messageService.add({
        severity: 'success',
        summary: 'Confirmado',
        detail: 'Se ha activado a ' + user.profile?.name
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

  private createUserFromPendingUser(pendingUser: PendingUser) {
    this.pendingUserService.createUserFromRequest(pendingUser).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Confirmado',
          detail: 'Se ha creado un usuario a ' + pendingUser.name
        });
      }
    });
  }

  private deletePendingUserRequest(pendingUser: PendingUser) {
    this.pendingUserService.deletePendingUser(pendingUser).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Confirmado',
          detail: 'Se ha eliminado la solicitud de alta de ' + pendingUser.name
        });
      }
    })
  }

  private loadScoutGroups() {
    this.scoutGroupService.getEntities().subscribe({
      next: value => {
        this.scoutGroups = value;
      }
    })
  }
}
