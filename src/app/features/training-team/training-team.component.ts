import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {InputText} from 'primeng/inputtext';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {Button} from 'primeng/button';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {ConfirmationService, MessageService} from 'primeng/api';
import {UserService} from '../../shared/services/user.service';
import {TeamMember} from '../../shared/models/training-people.model';
import {Role} from '../../shared/models/role.model';
import {ROLE_CLASSES, ROLE_LABELS} from '../../shared/models/role-labels';
import {LoggedUserDataService} from '../../core/auth/logged-user-data-service';
import {UserAvatarComponent} from '../../shared/components/user-avatar/user-avatar.component';
import {UserModalAddEditComponent} from '../user-modal-add-edit/user-modal-add-edit.component';
import {TeamCandidateDialogComponent} from './team-candidate-dialog/team-candidate-dialog.component';

/** Roles that make someone part of the training team, in the order they are shown. */
const TEAM_ROLES = [Role.TRAINER, Role.EVENT_DIRECTOR, Role.MANAGEMENT];
/** Roles that can be removed from a person on this page. */
const REMOVABLE_ROLES: string[] = [Role.TRAINER, Role.EVENT_DIRECTOR];

@Component({
  selector: 'app-training-team',
  imports: [
    RouterLink,
    FormsModule,
    TableModule,
    InputText,
    IconField,
    InputIcon,
    Button,
    ConfirmDialog,
    UserAvatarComponent,
    UserModalAddEditComponent,
    TeamCandidateDialogComponent
  ],
  templateUrl: './training-team.component.html',
  styleUrl: './training-team.component.scss'
})
export class TrainingTeamComponent implements OnInit {

  private readonly userService = inject(UserService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly loggedUserDataService = inject(LoggedUserDataService);

  readonly pageSize = 10;
  readonly roleLabels: Record<string, string> = ROLE_LABELS;
  readonly roleClasses: Record<string, string> = ROLE_CLASSES;
  readonly teamRoles = TEAM_ROLES;

  /** Only MANAGEMENT and MANAGER_DIRECTOR can add people or remove roles. */
  readonly canManage = this.loggedUserDataService.hasAnyRole(Role.MANAGEMENT, Role.MANAGER_DIRECTOR);

  members = signal<TeamMember[]>([]);
  loading = signal<boolean>(true);
  failed = signal<boolean>(false);
  modalVisible = false;
  candidateDialogVisible = false;

  search = signal<string>('');
  roleFilter = signal<string | null>(null);

  countByRole = computed(() => {
    const counts: Record<string, number> = {};
    TEAM_ROLES.forEach(role => counts[role] = this.members().filter(m => m.roles.includes(role)).length);
    return counts;
  });

  filteredMembers = computed(() => {
    const query = this.normalize(this.search());
    const role = this.roleFilter();

    return this.members().filter(member => {
      if (role !== null && !member.roles.includes(role)) return false;
      if (!query) return true;
      return this.normalize([member.name, member.surname, member.email].filter(Boolean).join(' ')).includes(query);
    });
  });

  hasActiveFilters = computed(() => !!this.search().trim() || this.roleFilter() !== null);

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.failed.set(false);
    this.userService.getTrainingTeam().subscribe({
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

  toggleRoleFilter(role: string) {
    this.roleFilter.update(current => current === role ? null : role);
  }

  clearFilters() {
    this.search.set('');
    this.roleFilter.set(null);
  }

  canRemoveRole(role: string): boolean {
    return this.canManage && REMOVABLE_ROLES.includes(role);
  }

  confirmRemoveRole(event: Event, member: TeamMember, role: string) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      header: 'Quitar rol',
      icon: 'pi pi-exclamation-triangle',
      message: `¿Quitar el rol "${this.roleLabels[role] ?? role}" a ${this.fullName(member)}?`,
      rejectButtonProps: {label: 'Cancelar', severity: 'secondary', outlined: true},
      acceptButtonProps: {label: 'Quitar rol', severity: 'danger'},
      accept: () => this.removeRole(member, role)
    });
  }

  private removeRole(member: TeamMember, role: string) {
    this.userService.removeTeamRole(member.id, role as Role).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Rol eliminado',
          detail: `${this.fullName(member)} ya no tiene el rol "${this.roleLabels[role] ?? role}".`
        });
        this.load();
      }
    });
  }

  fullName(member: TeamMember): string {
    return [member.surname, member.name].filter(Boolean).join(', ') || member.email;
  }

  initials(member: TeamMember): string {
    return (member.name ?? member.email).charAt(0).toUpperCase();
  }

  private normalize(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
