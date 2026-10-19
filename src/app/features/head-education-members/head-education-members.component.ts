import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {TableModule} from 'primeng/table';
import {Button} from 'primeng/button';
import {InputText} from 'primeng/inputtext';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {Tooltip} from 'primeng/tooltip';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {ConfirmationService, MessageService} from 'primeng/api';
import {HeadEducationService} from '../../shared/services/head-education.service';
import {HeadEducationMember} from '../../shared/models/head-education.model';
import {UserAvatarComponent} from '../../shared/components/user-avatar/user-avatar.component';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'app-head-education-members',
  imports: [
    FormsModule,
    RouterLink,
    TableModule,
    Button,
    InputText,
    IconField,
    InputIcon,
    Tooltip,
    ConfirmDialog,
    UserAvatarComponent
  ],
  templateUrl: './head-education-members.component.html',
  styleUrl: './head-education-members.component.scss'
})
export class HeadEducationMembersComponent implements OnInit {

  private readonly headEducationService = inject(HeadEducationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly pageSize = 15;

  members = signal<HeadEducationMember[]>([]);
  loading = signal<boolean>(true);
  failed = signal<boolean>(false);

  search = signal<string>('');
  statusFilter = signal<StatusFilter>('ACTIVE');


  activeCount = computed(() => this.members().filter(member => member.enabled).length);

  filteredMembers = computed(() => {
    const query = this.normalize(this.search());
    const status = this.statusFilter();

    return this.members().filter(member => {
      if (status === 'ACTIVE' && !member.enabled) return false;
      if (status === 'INACTIVE' && member.enabled) return false;
      if (!query) return true;
      return this.normalize([member.name, member.surname, member.email, member.currentStage?.name]
        .filter(Boolean).join(' ')).includes(query);
    });
  });

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.failed.set(false);
    this.headEducationService.getMembers().subscribe({
      next: members => {
        this.members.set(members);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      }
    });
  }

  confirmToggle(event: Event, member: HeadEducationMember) {
    const deactivating = member.enabled;
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      header: deactivating ? 'Desactivar usuario' : 'Reactivar usuario',
      message: deactivating
        ? this.fullName(member) + ' dejará de poder acceder al Aula Virtual, pero conservarás su historial. ¿Quieres desactivarlo?'
        : this.fullName(member) + ' volverá a poder acceder al Aula Virtual. ¿Quieres reactivarlo?',
      icon: deactivating ? 'pi pi-exclamation-triangle' : 'pi pi-user-plus',
      closable: true,
      closeOnEscape: true,
      rejectButtonProps: {label: 'Cancelar', severity: 'secondary', outlined: true},
      acceptButtonProps: {label: deactivating ? 'Sí, desactivar' : 'Sí, reactivar'},
      accept: () => this.toggle(member)
    });
  }

  private toggle(member: HeadEducationMember) {
    const request = member.enabled
      ? this.headEducationService.deactivateMember(member.id)
      : this.headEducationService.activateMember(member.id);

    request.subscribe({
      next: updated => {
        this.members.update(members => members.map(m => m.id === updated.id ? updated : m));
        this.messageService.add({
          severity: 'success',
          summary: 'Confirmado',
          detail: this.fullName(updated) + (updated.enabled ? ' se ha reactivado' : ' se ha desactivado')
        });
      },
      error: () => this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar a ' + this.fullName(member)
      })
    });
  }

  fullName(member: Pick<HeadEducationMember, 'name' | 'surname' | 'email'>): string {
    return [member.surname, member.name].filter(Boolean).join(', ') || member.email;
  }

  initials(member: Pick<HeadEducationMember, 'name' | 'email'>): string {
    return (member.name ?? member.email).charAt(0).toUpperCase();
  }

  private normalize(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
