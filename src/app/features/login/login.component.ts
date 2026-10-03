import {Component, inject, OnInit} from '@angular/core';
import {Button} from 'primeng/button';
import {FloatLabel} from 'primeng/floatlabel';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {InputText} from 'primeng/inputtext';
import {Password} from 'primeng/password';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../core/auth/auth.service';
import {UserService} from '../../shared/services/user.service';
import {FormUtils} from '../../shared/form-utils';
import {UserToLog} from '../../core/auth/auth-models';
import {finalize, tap} from 'rxjs';
import {MessageService} from 'primeng/api';
import {FieldErrorComponent} from '../../shared/components/field-error/field-error.component';
import {MAX_TEXT} from '../../shared/validation/validation-patterns';

@Component({
  selector: 'app-login',
  imports: [
    FloatLabel,
    FormsModule,
    InputText,
    Button,
    ReactiveFormsModule,
    Password,
    RouterLink,
    FieldErrorComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  protected loginForm!: FormGroup;
  protected recoverForm!: FormGroup;

  protected loading: boolean = false;
  protected recoverPassword: boolean = false;

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group(
      {
        username: ["", [Validators.required, Validators.email, Validators.maxLength(MAX_TEXT)]],
        password: ["", [Validators.required, Validators.maxLength(256)]]
      }
    );
    this.recoverForm = this.formBuilder.group({
      email: ["", [Validators.required, Validators.email, Validators.maxLength(MAX_TEXT)]]
    });
  }

  login() {
    FormUtils.markAllAsDirtyAndTouched(this.loginForm);
    if (this.loginForm.valid && !this.loading) {
      this.loading = true;
      const userToLog: UserToLog = {...this.loginForm.value};
      this.authService.login(userToLog).pipe(
        finalize(() => this.loading = false),
        tap(() => this.router.navigate(['/app/home'])),
      ).subscribe();
    }
  }

  sendRecoverEmail() {
    FormUtils.markAllAsDirtyAndTouched(this.recoverForm);
    if (this.recoverForm.valid && !this.loading) {
      this.loading = true;
      this.userService.forgotPassword(this.recoverForm.value.email.trim()).pipe(
        finalize(() => this.loading = false)
      ).subscribe({
        next: () => {
          this.recoverForm.reset();
          this.messageService.add({
            severity: 'success',
            summary: 'Solicitud enviada',
            detail: 'Si el email corresponde a una cuenta activa, recibirás un correo con las instrucciones en unos minutos.'
          });
        }
      });
    }
  }
}
