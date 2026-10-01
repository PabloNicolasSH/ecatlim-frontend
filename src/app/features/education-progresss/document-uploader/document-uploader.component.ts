import {Component, inject, output, signal} from '@angular/core';
import {EducationStageCard} from '../../../shared/models/education-stage.model';
import {MessageService} from 'primeng/api';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-document-uploader',
  imports: [
    NgClass
  ],
  templateUrl: './document-uploader.component.html',
  styleUrl: './document-uploader.component.scss'
})
export class DocumentUploaderComponent {

  protected readonly messageService = inject(MessageService);

  planUploaded = signal<boolean>(false);
  fileUrl = signal<string | null>(null);

  fileSelected = output<File>();

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      this.fileUrl.set(URL.createObjectURL(file));
      this.planUploaded.set(true);

      this.fileSelected.emit(file);

      this.messageService.add({
        severity: 'success',
        summary: 'Archivo subido',
        detail: `Se ha subido "${file.name}" correctamente.`
      });
    }
  }
}
