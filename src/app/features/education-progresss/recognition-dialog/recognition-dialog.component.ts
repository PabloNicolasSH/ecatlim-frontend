import {Component, effect, inject, input, model, output, signal} from '@angular/core';
import {DatePipe, NgClass} from '@angular/common';
import {Dialog} from 'primeng/dialog';
import {MessageService} from 'primeng/api';
import {Block} from '../../../shared/models/enrollment.model';
import {
  RECOGNITION_STATUS_LABELS,
  RECOGNITION_TYPE_OPTIONS,
  RecognitionFile,
  RecognitionMessage,
  RecognitionRequest,
  RecognitionType
} from '../../../shared/models/recognition.model';
import {RecognitionService} from '../../../shared/services/recognition.service';

@Component({
  selector: 'app-recognition-dialog',
  imports: [Dialog, NgClass, DatePipe],
  templateUrl: './recognition-dialog.component.html',
  styleUrl: './recognition-dialog.component.scss'
})
export class RecognitionDialogComponent {

  private static readonly MAX_FILES = 10;
  private static readonly MAX_TOTAL_BYTES = 8 * 1024 * 1024;
  private static readonly ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

  protected readonly recognitionService = inject(RecognitionService);
  protected readonly messageService = inject(MessageService);

  readonly typeOptions = RECOGNITION_TYPE_OPTIONS;
  readonly statusLabels = RECOGNITION_STATUS_LABELS;

  visible = model<boolean>(false);
  block = input<Block | null>(null);

  recognitionChanged = output<void>();

  request = signal<RecognitionRequest | null>(null);
  loading = signal<boolean>(false);
  sending = signal<boolean>(false);
  startingNew = signal<boolean>(false);

  selectedType = signal<RecognitionType | null>(null);
  comment = signal<string>('');
  files = signal<File[]>([]);

  constructor() {
    effect(() => {
      const block = this.block();
      if (this.visible() && block) {
        this.load(block.id);
      }
    });
  }

  private load(blockId: number): void {
    this.resetForm();
    this.request.set(null);
    this.startingNew.set(false);
    this.loading.set(true);
    this.recognitionService.getMine().subscribe({
      next: requests => {
        this.request.set(requests.find(r => r.lessonBlockId === blockId) ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  get showOpenForm(): boolean {
    const request = this.request();
    return !request || (request.status === 'REJECTED' && this.startingNew());
  }

  get showDocumentationForm(): boolean {
    return this.request()?.status === 'AWAITING_DOCUMENTATION';
  }

  canSubmit(): boolean {
    if (this.sending()) return false;
    if (this.showOpenForm) return this.selectedType() !== null;
    return this.comment().trim().length > 0 || this.files().length > 0;
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files ?? []);
    input.value = '';

    const invalid = selected.find(f => !RecognitionDialogComponent.ALLOWED_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext)));
    if (invalid) {
      this.messageService.add({severity: 'warn', summary: 'Formato no válido', detail: 'Sube archivos PDF, Word o imágenes (JPG, PNG).'});
      return;
    }

    const all = [...this.files(), ...selected];
    if (all.length > RecognitionDialogComponent.MAX_FILES) {
      this.messageService.add({severity: 'warn', summary: 'Demasiados archivos', detail: `Puedes adjuntar como máximo ${RecognitionDialogComponent.MAX_FILES} archivos.`});
      return;
    }
    if (all.reduce((sum, f) => sum + f.size, 0) > RecognitionDialogComponent.MAX_TOTAL_BYTES) {
      this.messageService.add({severity: 'warn', summary: 'Archivos demasiado grandes', detail: 'El tamaño total máximo es 8MB.'});
      return;
    }
    this.files.set(all);
  }

  removeFile(index: number): void {
    this.files.update(list => list.filter((_, i) => i !== index));
  }

  submit(): void {
    const block = this.block();
    if (!block || !this.canSubmit()) return;

    this.sending.set(true);
    const current = this.request();
    const call = this.showOpenForm
      ? this.recognitionService.open(block.id, this.selectedType()!, this.comment().trim(), this.files())
      : this.recognitionService.addDocumentation(current!.id, this.comment().trim(), this.files());

    call.subscribe({
      next: updated => {
        this.request.set(updated);
        this.startingNew.set(false);
        this.resetForm();
        this.sending.set(false);
        this.recognitionChanged.emit();
        this.messageService.add({
          severity: 'success',
          summary: 'Enviado',
          detail: 'El equipo formativo revisará tu solicitud de convalidación.'
        });
      },
      error: () => this.sending.set(false)
    });
  }

  startNewRequest(): void {
    this.resetForm();
    this.startingNew.set(true);
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

  typeLabel(type: RecognitionType): string {
    return this.typeOptions.find(o => o.value === type)?.label ?? type;
  }

  messageTitle(message: RecognitionMessage): string {
    switch (message.kind) {
      case 'SUBMISSION': return 'Tú';
      case 'DOCUMENTATION_REQUESTED': return 'Equipo formativo · Falta documentación';
      case 'APPROVED': return 'Equipo formativo · Convalidación aceptada';
      case 'REJECTED': return 'Equipo formativo · Convalidación rechazada';
    }
  }

  private resetForm(): void {
    this.selectedType.set(null);
    this.comment.set('');
    this.files.set([]);
  }
}
