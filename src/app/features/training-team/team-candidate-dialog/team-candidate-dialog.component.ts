import {Component, effect, inject, model, output, signal} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {catchError, debounceTime, distinctUntilChanged, finalize, of, switchMap, tap} from 'rxjs';
import {Dialog} from 'primeng/dialog';
import {InputText} from 'primeng/inputtext';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {Button} from 'primeng/button';
import {MessageService} from 'primeng/api';
import {UserService} from '../../../shared/services/user.service';
import {TeamMember} from '../../../shared/models/training-people.model';
import {Role} from '../../../shared/models/role.model';
import {ROLE_CLASSES, ROLE_LABELS} from '../../../shared/models/role-labels';
import {UserAvatarComponent} from '../../../shared/components/user-avatar/user-avatar.component';

const MIN_QUERY_LENGTH = 2;

/** Search for existing students and give them a team role (e.g. a student becoming a trainer). */
@Component({
  selector: 'app-team-candidate-dialog',
  imports: [
    FormsModule,
    Dialog,
    InputText,
    IconField,
    InputIcon,
    Button,
    UserAvatarComponent
  ],
  templateUrl: './team-candidate-dialog.component.html'
})
export class TeamCandidateDialogComponent {

  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);

  visible = model<boolean>(false);
  /** Emits after a role has been granted so the team list can reload. */
  memberUpdated = output<void>();

  readonly roleLabels: Record<string, string> = ROLE_LABELS;
  readonly roleClasses: Record<string, string> = ROLE_CLASSES;
  readonly minQueryLength = MIN_QUERY_LENGTH;
  readonly targetRoles = [
    {value: Role.TRAINER, label: 'Persona Formadora'},
    {value: Role.EVENT_DIRECTOR, label: 'Dirección de Eventos'}
  ];

  query = signal<string>('');
  targetRole = signal<Role>(Role.TRAINER);
  candidates = signal<TeamMember[]>([]);
  searching = signal<boolean>(false);
  assigningId = signal<number | null>(null);

  constructor() {
    toObservable(this.query).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(query => this.searching.set(query.trim().length >= MIN_QUERY_LENGTH)),
      switchMap(query => query.trim().length < MIN_QUERY_LENGTH
        ? of<TeamMember[]>([])
        : this.userService.searchTeamCandidates(query.trim()).pipe(catchError(() => of<TeamMember[]>([])))),
      tap(() => this.searching.set(false))
    ).subscribe(candidates => this.candidates.set(candidates));

    // Start every time from an empty search.
    effect(() => {
      if (!this.visible()) {
        this.query.set('');
        this.candidates.set([]);
        this.targetRole.set(Role.TRAINER);
      }
    });
  }

  alreadyHas(candidate: TeamMember): boolean {
    return candidate.roles.includes(this.targetRole());
  }

  assign(candidate: TeamMember) {
    const role = this.targetRole();
    this.assigningId.set(candidate.id);
    this.userService.addTeamRole(candidate.id, role).pipe(
      finalize(() => this.assigningId.set(null))
    ).subscribe({
      next: updated => {
        this.messageService.add({
          severity: 'success',
          summary: 'Rol asignado',
          detail: `${this.fullName(updated)} ahora es "${this.roleLabels[role]}".`
        });
        this.candidates.update(list => list.map(c => c.id === updated.id ? updated : c));
        this.memberUpdated.emit();
      }
    });
  }

  fullName(member: TeamMember): string {
    return [member.name, member.surname].filter(Boolean).join(' ') || member.email;
  }

  initials(member: TeamMember): string {
    return (member.name ?? member.email).charAt(0).toUpperCase();
  }
}
