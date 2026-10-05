import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {DatePipe, NgClass} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Dialog} from 'primeng/dialog';
import {MultiSelect} from 'primeng/multiselect';
import {MessageService} from 'primeng/api';
import {RecognitionService} from '../../../../shared/services/recognition.service';
import {LoggedUserDataService} from '../../../../core/auth/logged-user-data-service';
import {Role} from '../../../../shared/models/role.model';
import {SimpleUser} from '../../../../shared/models/user.model';
import {
  RECOGNITION_STATUS_LABELS,
  RECOGNITION_TYPE_OPTIONS,
  RecognitionDecision,
  RecognitionFile,
  RecognitionMessage,
  RecognitionRequest
} from '../../../../shared/models/recognition.model';

type CandidateOption = SimpleUser & { fullName: string };

@Component({
  selector: 'app-recognition-inbox',
  imports: [DatePipe, NgClass, FormsModule, Dialog, MultiSelect],
  templateUrl: './recognition-inbox.component.html',
  styleUrl: './recognition-inbox.component.scss'
})
export class RecognitionInboxComponent implements OnInit {

  protected readonly recognitionService = inject(RecognitionService);
  protected readonly loggedUser = inject(LoggedUserDataService);
  protected readonly messageService = inject(MessageService);

  readonly statusLabels = RECOGNITION_STATUS_LABELS;

  requests = signal<RecognitionRequest[]>([]);
  loading = signal<boolean>(true);

  selected = signal<RecognitionRequest | null>(null);
  dialogVisible = signal<boolean>(false);
  working = signal<boolean>(false);

  candidates = signal<CandidateOption[]>([]);
  selectedMemberIds = signal<number[]>([]);
  responseComment = signal<string>('');

  readonly isManager = this.loggedUser.hasAnyRole(Role.MANAGEMENT, Role.MANAGER_DIRECTOR);

  /** Requests nobody has been assigned to yet: what management has to act on. */
  unassignedCount = computed(() => this.requests().filter(r => r.status === 'PENDING_REVIEW' && r.commission.length === 0).length);

  canRespond = computed(() => {
    const request = this.selected();
    const myId = this.loggedUser.getLoggedUserData()?.id;
    return !!request && request.status === 'PENDING_REVIEW' && myId != null && request.commission.some(m => m.id === myId);
  });

  canEditCommission = computed(() => this.isManager && !!this.selected()?.status && this.isActive(this.selected()!));

  ngOnInit(): void {
    this.reload();
    if (this.isManager) {
      this.recognitionService.getCommissionCandidates().subscribe(users =>
        this.candidates.set(users.map(u => ({...u, fullName: `${u.name} ${u.surname}`.trim()}))));
    }
  }

  reload(): void {
    this.loading.set(true);
    this.recognitionService.getForReview(['PENDING_REVIEW', 'AWAITING_DOCUMENTATION']).subscribe({
      next: requests => {
        this.requests.set(requests);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  open(request: RecognitionRequest): void {
    this.select(request);
    this.dialogVisible.set(true);
  }

  isActive(request: RecognitionRequest): boolean {
    return request.status === 'PENDING_REVIEW' || request.status === 'AWAITING_DOCUMENTATION';
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

  download(file: RecognitionFile): void {
    this.recognitionService.downloadFile(file.fileId).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  typeLabel(request: RecognitionRequest): string {
    return RECOGNITION_TYPE_OPTIONS.find(o => o.value === request.type)?.label ?? request.type;
  }

  messageTitle(message: RecognitionMessage, request: RecognitionRequest): string {
    switch (message.kind) {
      case 'SUBMISSION': return request.userName;
      case 'DOCUMENTATION_REQUESTED': return `${message.authorName} · Falta documentación`;
      case 'APPROVED': return `${message.authorName} · Aceptada`;
      case 'REJECTED': return `${message.authorName} · Rechazada`;
    }
  }

  private select(request: RecognitionRequest): void {
    this.selected.set(request);
    this.selectedMemberIds.set(request.commission.map(m => m.id!).filter(id => id != null));
    this.responseComment.set('');
  }

  private applyUpdate(updated: RecognitionRequest): void {
    this.working.set(false);
    this.select(updated);
    this.requests.update(list => this.isActive(updated)
      ? list.map(r => r.id === updated.id ? updated : r)
      : list.filter(r => r.id !== updated.id));
    if (!this.isActive(updated)) {
      this.dialogVisible.set(false);
    }
  }
}
