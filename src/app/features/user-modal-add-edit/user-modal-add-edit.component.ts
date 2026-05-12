import {Component, effect, EventEmitter, inject, Input, model, OnInit, Output} from '@angular/core';
import {Dialog} from 'primeng/dialog';
import {User} from '../../shared/models/user.model';
import {Button} from 'primeng/button';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ScoutGroupService} from '../../shared/services/scout-group.service';
import {FloatLabel} from 'primeng/floatlabel';
import {Select} from 'primeng/select';
import {ScoutGroup} from '../../shared/models/scout-group.model';
import {InputText} from 'primeng/inputtext';
import {UserService} from '../../shared/services/user.service';
import {UserForm} from '../../shared/models/user-form.model';
import {Role} from '../../shared/models/role.model';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-user-modal-add-edit',
  imports: [
    Dialog,
    Button,
    ReactiveFormsModule,
    FloatLabel,
    Select,
    FormsModule,
    InputText
  ],
  templateUrl: './user-modal-add-edit.component.html',
  styleUrl: './user-modal-add-edit.component.scss'
})
export class UserModalAddEditComponent implements OnInit{

  protected readonly formBuilder = inject(FormBuilder);
  protected readonly scoutGroupService = inject(ScoutGroupService);
  protected readonly userService = inject(UserService);
  protected readonly messageService = inject(MessageService);

  visible = model<boolean>(false);
  @Input() dialogMode!: string;
  @Input() userToEdit!: User;

  @Output() userUpdated = new EventEmitter();

  protected form!: FormGroup;
  protected loading: boolean = false;

  scoutGroups: ScoutGroup[] = [];
  roles: Role[] = [];

  constructor() {
    effect(() => {
      if (this.dialogMode == 'Edit'){
        this.initializeEditForm();
      }
      if (!this.visible()){
        this.form.reset();
        this.loading = false;
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.getScoutGroups();
    this.roles = [Role.ADMIN, Role.EVENT_DIRECTOR, Role.MANAGEMENT, Role.STUDENT, Role.TRAINER]
  }

  private initializeForm() {
    this.form = this.formBuilder.group({
      name: ["", Validators.required],
      surname: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      phone: [""],
      census: [""],
      nif: [""],
      address: [""],
      city: [""],
      country: [""],
      selectedScoutGroup: [],
      selectedRole: [null, Validators.required]
    });
  }

  private getScoutGroups() {
    this.scoutGroupService.getScoutGroups().subscribe({
      next: scoutGroups => this.scoutGroups = scoutGroups.sort((a,b) => a.name.localeCompare(b.name))
    })
  }

  onSubmit() {
    this.form.markAsDirty();
    if (this.form.valid && !this.loading){
      this.loading = true;
      const userForm: UserForm = {...this.form.value};
      userForm.scoutGroupId = this.form.get('selectedScoutGroup')?.value?.id;
      userForm.role = this.form.get('selectedRole')?.value;
      if (this.dialogMode == 'Edit'){
        this.userService.updateUser(this.userToEdit.id!, userForm).subscribe({
          next: () => {
            this.loading = false;
            this.visible.set(false);
            this.userUpdated.emit();
            this.messageService.add({
              severity: 'success',
              summary: 'Confirmado',
              detail: 'Se ha actualizado correctamente el usuario'
            })
          },
          error: err => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.message
            })
          }
        })
      } else {
        this.userService.addUser(userForm).subscribe({
          next: () => {
            this.loading = false;
            this.visible.set(false);
            this.userUpdated.emit();
            this.messageService.add({
              severity: 'success',
              summary: 'Confirmado',
              detail: 'Se ha añadido el usuario al Aula Virtual'
            })
          },
          error: err => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.message
            })
            this.visible.set(false);
            this.loading = false;
          }
        })
      }
    }
  }

  private initializeEditForm() {
    this.form = this.formBuilder.group({
      name: [this.userToEdit.name, Validators.required],
      surname: [this.userToEdit.surname, Validators.required],
      email: [this.userToEdit.email, [Validators.required, Validators.email]],
      phone: [this.userToEdit.phone],
      census: [this.userToEdit.census],
      nif: [this.userToEdit.nif],
      address: [this.userToEdit.address],
      city: [this.userToEdit.city],
      country: [this.userToEdit.country],
      selectedScoutGroup: [this.userToEdit.scoutGroup],
      selectedRole: [this.userToEdit.role, Validators.required]
    });
  }
}
