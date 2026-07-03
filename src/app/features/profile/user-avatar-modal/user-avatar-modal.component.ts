import {Component, EventEmitter, inject, model, Output} from '@angular/core';
import {UserService} from '../../../shared/services/user.service';
import {MessageService} from 'primeng/api';
import {Button} from 'primeng/button';
import {FileUpload} from 'primeng/fileupload';
import {Dialog} from 'primeng/dialog';
import {Tooltip} from 'primeng/tooltip';

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
    if (!this.selectedFile || this.loading) return;

    this.loading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.userService.uploadAvatar(formData).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Foto actualizada',
          detail: 'Tu nueva imagen de perfil se ha guardado correctamente'
        });
        this.avatarUpdated.emit();
        this.closeModal();
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error de subida',
          detail: err.message || 'No se pudo subir la imagen'
        });
      }
    });
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
