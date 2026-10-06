import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {TableModule} from 'primeng/table';
import {Select} from 'primeng/select';
import {MultiSelect} from 'primeng/multiselect';
import {InputText} from 'primeng/inputtext';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {Textarea} from 'primeng/textarea';
import {Button} from 'primeng/button';
import {Tag} from 'primeng/tag';
import {Dialog} from 'primeng/dialog';
import {MessageService} from 'primeng/api';
import {RecognitionService} from '../../shared/services/recognition.service';
import {LoggedUserDataService} from '../../core/auth/logged-user-data-service';
import {Role} from '../../shared/models/role.model';
import {SimpleUser} from '../../shared/models/user.model';
import {
  RECOGNITION_STATUS_LABELS,
  RECOGNITION_TYPE_OPTIONS,
  RecognitionDecision,
  RecognitionRequest,
  RecognitionStatus,
  RecognitionType
} from '../../shared/models/recognition.model';
import {
  RecognitionConversationComponent
} from '../../shared/components/recognition-conversation/recognition-conversation.component';

type CandidateOption = SimpleUser & { fullName: string };
type StatusFilter = 'ACTION' | 'OPEN' | 'APPROVED' | 'REJECTED' | 'ALL';
type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

@Component({
  selector: 'app-recognition-management',
  imports: [
    DatePipe, FormsModule, RouterLink, TableModule, Select, MultiSelect, InputText, IconField, InputIcon,
    Textarea, Button, Tag, Dialog, RecognitionConversationComponent
  ],
  templateUrl: './recognition-management.component.html',
  styleUrl: './recognition-management.component.scss'
})
export class RecognitionManagementComponent implements OnInit {

  protected readonly recognitionService = inject(RecognitionService);
  protected readonly loggedUser = inject(LoggedUserDataService);
  protected readonly messageService = inject(MessageService);

  readonly pageSize = 10;
  readonly statusLabels = RECOGNITION_STATUS_LABELS;
  readonly typeOptions = RECOGNITION_TYPE_OPTIONS;
  readonly isManager = this.loggedUser.hasAnyRole(Role.MANAGEMENT, Role.MANAGER_DIRECTOR);
  private readonly myId = this.loggedUser.getLoggedUserData()?.id;

  requests = signal<RecognitionRequest[]>([]);
  loading = signal<boolean>(true);
  failed = signal<boolean>(false);
  working = signal<boolean>(false);

  statusFilter = signal<StatusFilter>('OPEN');
  typeFilter = signal<RecognitionType | null>(null);
  search = signal<string>('');

  selectedId = signal<number | null>(null);
  dialogVisible = signal<boolean>(false);

  candidates = signal<CandidateOption[]>([]);
  selectedMemberIds = signal<number[]>([]);
  responseComment = signal<string>('');

  selected = computed(() => this.requests().find(r => r.id === this.selectedId()) ?? null);

  needsMyAction = (request: RecognitionRequest): boolean =>
    request.status === 'PENDING_REVIEW'
    && (this.isInCommission(request) || (this.isManager && request.commission.length === 0));

  statusOptions = computed(() => {
    const all = this.requests();
    const counts: Record<StatusFilter, number> = {
      ACTION: all.filter(this.needsMyAction).length,
      OPEN: all.filter(r => this.isActive(r)).length,
      APPROVED: all.filter(r => r.status === 'APPROVED').length,
      REJECTED: all.filter(r => r.status === 'REJECTED').length,
      ALL: all.length
    };
    const labels: Record<StatusFilter, string> = {
      ACTION: 'Requieren mi acción',
      OPEN: 'Abiertas',
      APPROVED: 'Convalidadas',
      REJECTED: 'Rechazadas',
      ALL: 'Todas'
    };
    return (Object.keys(labels) as StatusFilter[]).map(value => ({value, label: `${labels[value]} (${counts[value]})`}));
  });

  actionCount = computed(() => this.requests().filter(this.needsMyAction).length);

  filtered = computed(() => {
    const status = this.statusFilter();
    const type = this.typeFilter();
    const text = this.search().trim().toLowerCase();

    return this.requests().filter(r => {
      const matchesStatus = status === 'ALL'
        || (status === 'ACTION' && this.needsMyAction(r))
        || (status === 'OPEN' && this.isActive(r))
        || r.status === status;
      const matchesType = !type || r.type === type;
      const matchesText = !text
        || r.userName.toLowerCase().includes(text)
        || r.lessonBlockCode.toLowerCase().includes(text)
        || r.lessonBlockName.toLowerCase().includes(text)
        || r.messages.some(m => (m.comment ?? '').toLowerCase().includes(text));
      return matchesStatus && matchesType && matchesText;
    });
  });

  hasActiveFilters = computed(() => this.statusFilter() !== 'OPEN' || !!this.typeFilter() || !!this.search().trim());

  canRespond = computed(() => {
    const request = this.selected();
    return !!request && request.status === 'PENDING_REVIEW' && this.isInCommission(request);
  });

  /** Only management can set the commission; trainers and event directors can sit on it but not change it. */
  canEditCommission = computed(() => {
    const request = this.selected();
    return this.isManager && !!request && this.isActive(request);
  });

  ngOnInit(): void {
    this.load();
    if (this.isManager) {
      this.recognitionService.getCommissionCandidates().subscribe(users =>
        this.candidates.set(users.map(u => ({...u, fullName: `${u.name} ${u.surname}`.trim()}))));
    }
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.recognitionService.getForReview().subscribe({
      next: requests => {
        this.requests.set(requests);
        this.loading.set(false);
        if (this.actionCount() > 0) {
          this.statusFilter.set('ACTION');
        }
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      }
    });
  }

  clearFilters(): void {
    this.statusFilter.set('OPEN');
    this.typeFilter.set(null);
    this.search.set('');
  }

  open(request: RecognitionRequest): void {
    this.selectedId.set(request.id);
    this.syncCommissionSelection(request);
    this.responseComment.set('');
    this.dialogVisible.set(true);
  }

  isActive(request: RecognitionRequest): boolean {
    return request.status === 'PENDING_REVIEW' || request.status === 'AWAITING_DOCUMENTATION';
  }

  isInCommission(request: RecognitionRequest): boolean {
    return this.myId != null && request.commission.some(m => m.id === this.myId);
  }

  statusLabel(status: RecognitionStatus): string {
    return this.statusLabels[status];
  }

  severity(status: RecognitionStatus): TagSeverity {
    switch (status) {
      case 'PENDING_REVIEW': return 'warn';
      case 'AWAITING_DOCUMENTATION': return 'info';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
    }
  }

  typeLabel(request: RecognitionRequest): string {
    return this.typeOptions.find(o => o.value === request.type)?.label ?? request.type;
  }

  decisionComment(request: RecognitionRequest): string | null {
    const decision = [...request.messages].reverse().find(m => m.kind === 'APPROVED' || m.kind === 'REJECTED');
    return decision?.comment ?? null;
  }

  saveCommission(): void {
    const request = this.selected();
    if (!request || this.selectedMemberIds().length === 0) return;

    this.working.set(true);
    this.recognitionService.assignCommission(request.id, this.selectedMemberIds()).subscribe({
      next: updated => {
        this.applyUpdate(updated);
        this.messageService.add({severity: 'success', summary: 'Comisión asignada', detail: 'Las personas elegidas ya pueden gestionar la solicitud.'});
      },
      error: () => this.working.set(false)
    });
  }

  respond(decision: RecognitionDecision): void {
    const request = this.selected();
    if (!request) return;
    if (decision === 'REQUEST_DOCUMENTATION' && this.responseComment().trim().length === 0) {
      this.messageService.add({severity: 'warn', summary: 'Falta el comentario', detail: 'Indica qué documentación necesitas.'});
      return;
    }

    this.working.set(true);
    this.recognitionService.respond(request.id, decision, this.responseComment().trim()).subscribe({
      next: updated => {
        this.applyUpdate(updated);
        this.responseComment.set('');
        this.messageService.add({severity: 'success', summary: 'Respuesta enviada', detail: 'La persona solicitante verá tu respuesta en su progreso.'});
      },
      error: () => this.working.set(false)
    });
  }

  private applyUpdate(updated: RecognitionRequest): void {
    this.working.set(false);
    this.requests.update(list => list.map(r => r.id === updated.id ? updated : r));
    this.syncCommissionSelection(updated);
  }

  private syncCommissionSelection(request: RecognitionRequest): void {
    this.selectedMemberIds.set(request.commission.map(m => m.id).filter((id): id is number => id != null));
  }
}
