import {Component, effect, EventEmitter, inject, Input, model, Output} from '@angular/core';
import {Button} from "primeng/button";
import {Dialog} from "primeng/dialog";
import {FloatLabel} from "primeng/floatlabel";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {InputText} from "primeng/inputtext";
import {UserService} from '../../../shared/services/user.service';
import {MessageService} from 'primeng/api';
import {User} from '../../../shared/models/user.model';
import {UserMeForm} from '../../../shared/models/user-me-form.model';

@Component({
  selector: 'app-user-modal-me-edit',
  imports: [
    Button,
    Dialog,
    FloatLabel,
    FormsModule,
    InputText,
    ReactiveFormsModule
  ],
  templateUrl: './user-modal-me-edit.component.html',
  styleUrl: './user-modal-me-edit.component.scss'
})
export class UserModalMeEditComponent {
  protected readonly formBuilder = inject(FormBuilder);
  protected readonly userService = inject(UserService);
  protected readonly messageService = inject(MessageService);

  visible = model<boolean>(false);
  @Input() userToEdit!: User;

  @Output() userUpdated = new EventEmitter();

  protected loading: boolean = false;

  protected form: FormGroup = inject(FormBuilder).group({
    name: ['', Validators.required],
    surname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    census: [null],
    nif: [''],
    address: [''],
    city: [''],
    country: ['']
  });

  constructor() {
    effect(() => {
      if (this.visible() && this.userToEdit) {
        this.initializeEditForm();
      } else if (!this.visible() && this.form) {
        this.form.reset();
        this.loading = false;
      }
    });
  }

  onSubmit() {
    this.form.markAsDirty();
    if (this.form.valid && !this.loading) {
      this.loading = true;
      const userForm: UserMeForm = { ...this.form.value };

      this.userService.updateMyInfo(userForm).subscribe({
        next: () => {
          this.loading = false;
          this.visible.set(false);
          this.userUpdated.emit();
          this.messageService.add({
            severity: 'success',
            summary: 'Confirmado',
            detail: 'Se ha actualizado correctamente tu información de usuario'
          });
        },
        error: err => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.message
          });
        }
      });
    }
  }

  private initializeEditForm() {
    this.form = this.formBuilder.group({
      name: [this.userToEdit.name || '', Validators.required],
      surname: [this.userToEdit.surname || '', Validators.required],
      email: [this.userToEdit.email, [Validators.required, Validators.email]],
      phone: [this.userToEdit.phone || ''],
      census: [this.userToEdit.census || null],
      nif: [this.userToEdit.nif || ''],
      address: [this.userToEdit.address || ''],
      city: [this.userToEdit.city || ''],
      country: [this.userToEdit.country || '']
    });
  }
}
