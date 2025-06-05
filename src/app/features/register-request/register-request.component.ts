import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {Button} from 'primeng/button';
import {FloatLabel} from 'primeng/floatlabel';
import {InputText} from 'primeng/inputtext';
import {Select} from 'primeng/select';
import {ScoutGroupService} from '../../shared/services/scout-group.service';
import {ScoutGroup} from '../../shared/models/scout-group.model';
import {Checkbox} from 'primeng/checkbox';
import {PendingUserService} from '../../shared/services/pending-user.service';
import {PendingUser} from '../../shared/models/pending-user.model';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-register-request',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Button,
    FloatLabel,
    InputText,
    Select,
    FormsModule,
    Checkbox
  ],
  templateUrl: './register-request.component.html',
  styleUrl: './register-request.component.scss'
})
export class RegisterRequestComponent implements OnInit{

  private readonly formBuilder = inject(FormBuilder);
  private readonly scoutGroupService = inject(ScoutGroupService);
  private readonly pendingUserService = inject(PendingUserService);
  private readonly messageService = inject(MessageService);

  protected registerForm!: FormGroup;

  protected loading: boolean = false;
  scoutGroups: ScoutGroup[] = [];

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      name: ["", [Validators.required]],
      surname: ["", [Validators.required]],
      email: ["", [Validators.required, Validators.email]],
      nif: ["", [Validators.required]],
      selectedScoutGroup: [Validators.required],
      checkbox: [false, [Validators.requiredTrue]]
    })

    this.scoutGroupService.getScoutGroups().subscribe({
      next: scoutGroups => this.scoutGroups = scoutGroups.sort((a,b) => a.name.localeCompare(b.name))
    })
  }

  register() {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.valid && !this.loading){
      this.loading = true;
      const pendingUser: PendingUser = {...this.registerForm.value};
      pendingUser.scoutGroupId = this.registerForm.get('selectedScoutGroup')?.value?.id;
      this.pendingUserService.createRequest(pendingUser).subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: "success",
            detail: "Se ha recibido correctamente su solicitud, deberá llegarle un correo de confirmación"
          });
          this.registerForm.reset();
        },
        error: err => {
          this.loading = false;
          this.messageService.add({
            severity: "error",
            detail: "No se ha podido procesar su solicitud"
          });
        }
      });
    }
  }
}
