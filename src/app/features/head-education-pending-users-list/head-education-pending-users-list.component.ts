import {Component, inject, OnInit} from '@angular/core';
import {Button} from "primeng/button";
import {TableModule} from "primeng/table";
import {PendingUser} from '../../shared/models/pending-user.model';
import {PendingUserService} from '../../shared/services/pending-user.service';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {ConfirmationService, MessageService} from 'primeng/api';

@Component({
  selector: 'app-head-education-pending-users-list',
  imports: [
    Button,
    TableModule,
    ConfirmDialog
  ],
  templateUrl: './head-education-pending-users-list.component.html',
  styleUrl: './head-education-pending-users-list.component.scss'
})
export class HeadEducationPendingUsersListComponent implements OnInit{
  protected readonly pendingUserService = inject(PendingUserService);
  protected readonly confirmationService = inject(ConfirmationService);
  protected readonly messageService = inject(MessageService);

  pendingUserRequests: PendingUser[] = [];

  ngOnInit(): void {
    this.pendingUserService.getPendingUsersForMyScoutGroup().subscribe({
      next: pendingUsers => {
        this.pendingUserRequests = pendingUsers;
      }
    })
  }

  confirmDialog(event: Event, mode: string, pendingUser: PendingUser) {
    if (mode == 'Create User' && pendingUser) {
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
      };
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
      };
      this.generateConfirmation(confirmationMessage);
    }
  }

  private generateConfirmation(confirmation: {
    message: string;
    header: string;
    icon: string;
    rejectLabel: string;
    acceptLabel: string;
    pendingUser: PendingUser;
    event: Event;
    mode: string;
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
        if (confirmation.pendingUser != null) {
          this.sendAcceptedMessageAndDoActionMode(confirmation.mode, confirmation.pendingUser);
        }
      },
      reject: () => {
        if (confirmation.mode == 'Create User') {
          this.sendRejectedMessage('Se ha cancelado la aceptación de la solicitud de alta');
        } else if (confirmation.mode == 'Delete request') {
          this.sendRejectedMessage('Se ha cancelado la eliminación de la solicitud de alta');
        }
      },
    });
  }

  private sendAcceptedMessageAndDoActionMode(mode: string, pendingUser: PendingUser) {
    if (mode == 'Create User' && pendingUser) {
      this.createUserFromPendingUser(pendingUser);
    } else if (mode == 'Delete request' && pendingUser) {
      this.deletePendingUserRequest(pendingUser);
    }
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

  private sendRejectedMessage(detail: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Cancelado',
      detail: detail
    });
  }
}
