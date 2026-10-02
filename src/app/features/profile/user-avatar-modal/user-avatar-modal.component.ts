import {Component, EventEmitter, inject, model, Output, viewChild} from '@angular/core';
import {UserService} from '../../../shared/services/user.service';
import {MessageService} from 'primeng/api';
import {Button} from 'primeng/button';
import {FileUpload} from 'primeng/fileupload';
import {Dialog} from 'primeng/dialog';
import {finalize, tap} from 'rxjs';

@Component({
  selector: 'app-user-avatar-modal',
  imports: [
    Button,
    FileUpload,
    Dialog
  ],
  templateUrl: './user-avatar-modal.component.html',
  styleUrl: './user-avatar-modal.component.scss'
})
export class UserAvatarModalComponent {
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);

  visible = model<boolean>(false);
  @Output() avatarUpdated = new EventEmitter<void>();
  fileUpload = viewChild.required<FileUpload>('fileUpload');

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  loading: boolean = false;

  onFileSelect(event: any) {
    const file = event.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadAvatar() {
    if (this.loading) {
      return;
    }

    this.loading = true;
    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('file', this.selectedFile ?? null);
    }

    this.userService.uploadAvatar(formData).pipe(
      finalize(() => {
        this.loading = false;
      }),
      tap(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Foto actualizada',
            detail: 'Tu nueva imagen de perfil se ha guardado correctamente'
          });
          this.selectedFile = null;
          this.fileUpload().clear();
          this.avatarUpdated.emit();
          this.closeModal();
        }
      )).subscribe();
  }

  triggerUpload(fileUpload: any) {
    if (fileUpload && typeof fileUpload.choose === 'function') {
      fileUpload.choose();
    } else {
      const fileInput = document.querySelector('p-fileupload input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }
  }

  closeModal() {
    this.visible.set(false);
    this.selectedFile = null;
    this.imagePreview = null;
    this.loading = false;
  }
}
