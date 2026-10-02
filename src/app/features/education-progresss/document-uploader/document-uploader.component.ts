import {Component, inject, input, output, signal} from '@angular/core';
import {MessageService} from 'primeng/api';
import {DatePipe, NgClass} from '@angular/common';
import {EnrollmentService} from '../../../shared/services/enrollment.service';
import {
  EnrollmentDocument,
  EnrollmentDocuments,
  EnrollmentDocumentType
} from '../../../shared/models/enrollment.model';

interface DocumentSlot {
  type: EnrollmentDocumentType;
  key: keyof EnrollmentDocuments;
  title: string;
  icon: string;
  downloadableTemplate: boolean;
}

@Component({
  selector: 'app-document-uploader',
  imports: [
    NgClass,
    DatePipe
  ],
  templateUrl: './document-uploader.component.html',
  styleUrl: './document-uploader.component.scss'
})
export class DocumentUploaderComponent {

  protected readonly enrollmentService = inject(EnrollmentService);
  protected readonly messageService = inject(MessageService);

  private static readonly MAX_SIZE_BYTES = 8 * 1024 * 1024;
  private static readonly ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

  enrollmentId = input.required<number>();
  documents = input<EnrollmentDocuments | null>(null);

  documentsChange = output<EnrollmentDocuments>();

  uploading = signal<EnrollmentDocumentType | null>(null);

  readonly slots: DocumentSlot[] = [
    {
      type: 'PERSONAL_PLAN',
      key: 'personalPlan',
      title: 'Plan Personal de Formación',
      icon: 'pi-file-edit',
      downloadableTemplate: true
    },
    {
      type: 'ENTITY_APPROVAL',
      key: 'entityApproval',
      title: 'Visto Bueno de la Entidad',
      icon: 'pi-check-circle',
      downloadableTemplate: false
    }
  ];

  iconClass(slot: DocumentSlot): string {
    if (slot.type === 'ENTITY_APPROVAL') {
      return this.documentOf(slot) ? 'text-emerald-600' : 'text-gray-400';
    }
    return 'text-[#795221]';
  }

  canView(doc: EnrollmentDocument): boolean {
    return doc.mimeType === 'application/pdf';
  }

  documentOf(slot: DocumentSlot): EnrollmentDocument | null {
    return this.documents()?.[slot.key] ?? null;
  }

  onFileSelected(event: Event, slot: DocumentSlot): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!DocumentUploaderComponent.ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext))) {
      this.messageService.add({severity: 'warn', summary: 'Formato no válido', detail: 'Sube un archivo PDF o Word.'});
      return;
    }
    if (file.size > DocumentUploaderComponent.MAX_SIZE_BYTES) {
      this.messageService.add({severity: 'warn', summary: 'Archivo demasiado grande', detail: 'El tamaño máximo es 8MB.'});
      return;
    }

    this.uploading.set(slot.type);
    this.enrollmentService.uploadDocument(this.enrollmentId(), slot.type, file).subscribe({
      next: documents => {
        this.uploading.set(null);
        this.documentsChange.emit(documents);
        this.messageService.add({
          severity: 'success',
          summary: 'Archivo subido',
          detail: `Se ha subido "${file.name}" correctamente.`
        });
      },
      error: () => this.uploading.set(null)
    });
  }

  view(doc: EnrollmentDocument): void {
    this.enrollmentService.downloadDocument(doc.fileId).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    });
  }

  download(doc: EnrollmentDocument): void {
    this.enrollmentService.downloadDocument(doc.fileId).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
}
