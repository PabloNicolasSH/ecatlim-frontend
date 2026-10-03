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
import {FieldErrorComponent} from '../../../shared/components/field-error/field-error.component';
import {MAX_TEXT, idDocumentValidator, notBlankValidator, phoneValidator} from '../../../shared/validation/validation-patterns';

@Component({
  selector: 'app-user-modal-me-edit',
  imports: [
    Button,
    Dialog,
    FloatLabel,
    FormsModule,
    InputText,
    ReactiveFormsModule,
    FieldErrorComponent
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
    surname: [''],
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
      const formValue = this.form.getRawValue();
      const userForm: UserMeForm = {
        address: formValue.address,
        census: formValue.census,
        city: formValue.city,
        country: formValue.country,
        name: formValue.name,
        nif: formValue.nif,
        phone: formValue.phone,
        surname: formValue.surname
      };

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
        error: () => this.loading = false
      });
    }
  }

  private initializeEditForm() {
    this.form = this.formBuilder.group({
      name: [this.userToEdit.profile?.name || '', [Validators.required, notBlankValidator, Validators.maxLength(MAX_TEXT)]],
      surname: [this.userToEdit.profile?.surname || '', [Validators.required, notBlankValidator, Validators.maxLength(MAX_TEXT)]],
      email: [this.userToEdit.email],
      phone: [this.userToEdit.profile?.phone || '', phoneValidator],
      census: [this.userToEdit.profile?.census || null, [Validators.min(0), Validators.max(999999999)]],
      nif: [this.userToEdit.profile?.nif || '', idDocumentValidator],
      address: [this.userToEdit.profile?.address || '', Validators.maxLength(MAX_TEXT)],
      city: [this.userToEdit.profile?.city || '', Validators.maxLength(MAX_TEXT)],
      country: [this.userToEdit.profile?.country || '', Validators.maxLength(MAX_TEXT)]
    });
    this.form.get('email')!.disable();
  }
}
