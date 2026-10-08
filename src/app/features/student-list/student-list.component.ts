import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {TableModule} from 'primeng/table';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {Button} from 'primeng/button';
import {Tooltip} from 'primeng/tooltip';
import {UserService} from '../../shared/services/user.service';
import {StudentOverview, StudentSummary} from '../../shared/models/training-people.model';
import {UserAvatarComponent} from '../../shared/components/user-avatar/user-avatar.component';
import {UserModalAddEditComponent} from '../user-modal-add-edit/user-modal-add-edit.component';
import {LoggedUserDataService} from '../../core/auth/logged-user-data-service';
import {Role} from '../../shared/models/role.model';
import {StudentCertificatesDialogComponent} from '../student-certificates-dialog/student-certificates-dialog.component';

const NO_STAGE = 0;

@Component({
  selector: 'app-student-list',
  imports: [
    RouterLink,
    FormsModule,
    TableModule,
    Select,
    InputText,
    IconField,
    InputIcon,
    Button,
    Tooltip,
    UserAvatarComponent,
    UserModalAddEditComponent,
    StudentCertificatesDialogComponent
  ],
  templateUrl: './student-list.component.html',
  styleUrl: './student-list.component.scss'
})
export class StudentListComponent implements OnInit {

  private readonly userService = inject(UserService);
  private readonly loggedUserDataService = inject(LoggedUserDataService);

  readonly canAddStudents = this.loggedUserDataService.hasAnyRole(Role.MANAGEMENT, Role.MANAGER_DIRECTOR);
  modalVisible = false;

  readonly canManageCertificates = this.loggedUserDataService.hasAnyRole(Role.ADMIN, Role.MANAGEMENT, Role.MANAGER_DIRECTOR);
  certificatesVisible = false;
  certificatesStudent = signal<StudentSummary | null>(null);

  readonly NO_STAGE = NO_STAGE;
  readonly pageSize = 10;

  overview = signal<StudentOverview | null>(null);
  loading = signal<boolean>(true);
  failed = signal<boolean>(false);

  showFullData = signal<boolean>(true);
  search = signal<string>('');
  stageFilter = signal<number | null>(null);
  entityFilter = signal<string | null>(null);

  students = computed(() => this.overview()?.students ?? []);
  stages = computed(() => this.overview()?.stages ?? []);

  stageOptions = computed(() => [
    ...this.stages().map(stage => ({label: `${stage.code} · ${stage.name}`, value: stage.stageId})),
    {label: 'Sin etapa en curso', value: NO_STAGE}
  ]);

  entityOptions = computed(() =>
    [...new Set(this.students().map(s => s.entityName).filter((name): name is string => !!name))]
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map(name => ({label: name, value: name}))
  );

  filteredStudents = computed(() => {
    const query = this.normalize(this.search());
    const stage = this.stageFilter();
    const entity = this.entityFilter();

    return this.students().filter(student => {
      if (stage !== null && (student.currentStage?.id ?? NO_STAGE) !== stage) return false;
      if (entity !== null && student.entityName !== entity) return false;
      if (!query) return true;
      return this.normalize(
        [student.name, student.surname, student.email, student.entityName, student.currentStage?.name]
          .filter(Boolean).join(' ')
      ).includes(query);
    });
  });

  hasActiveFilters = computed(() => !!this.search().trim() || this.stageFilter() !== null || this.entityFilter() !== null);

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.failed.set(false);
    this.userService.getStudentOverview().subscribe({
      next: overview => {
        this.overview.set(overview);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      }
    });
  }

  openCertificates(student: StudentSummary) {
    this.certificatesStudent.set(student);
    this.certificatesVisible = true;
  }

  toggleStageFilter(stageId: number) {
    this.stageFilter.update(current => current === stageId ? null : stageId);
  }

  clearFilters() {
    this.search.set('');
    this.stageFilter.set(null);
    this.entityFilter.set(null);
  }

  stageClass(stageId: number): string {
    const palette = [
      'bg-[#F3E3C3] text-[#795221]',
      'bg-[#d9a45b] text-[#3D2E24]',
      'bg-[#633F17] text-white',
      'bg-emerald-100 text-emerald-800',
      'bg-[#EFEAE2] text-[#633F17]'
    ];
    const index = this.stages().findIndex(stage => stage.stageId === stageId);
    return palette[(index < 0 ? 0 : index) % palette.length];
  }

  fullName(student: StudentSummary): string {
    return [student.surname, student.name].filter(Boolean).join(', ') || student.email;
  }

  initials(student: StudentSummary): string {
    return (student.name ?? student.email).charAt(0).toUpperCase();
  }

  private normalize(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
