import {Component, inject, OnInit} from '@angular/core';
import {Button} from 'primeng/button';
import {FloatLabel} from 'primeng/floatlabel';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {InputText} from 'primeng/inputtext';
import {Password} from 'primeng/password';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../core/auth/auth.service';
import {UserService} from '../../shared/services/user-and-entity/user.service';
import {WebsocketService} from '../../shared/services/websocket.service';
import {FormUtils} from '../../shared/form-utils';
import {UserToLog} from '../../core/auth/auth-models';
import {finalize, tap} from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [
    FloatLabel,
    FormsModule,
    InputText,
    Button,
    ReactiveFormsModule,
    Password,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  protected loginForm!: FormGroup;
  protected forgotUsername!: string;

  protected loading: boolean = false;
  protected recoverPassword: boolean = false;

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group(
      {
        username: ["", [Validators.required, Validators.email]],
        password: ["", Validators.required]
      }
    );
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
    if (this.forgotUsername && !this.loading) {
      this.loading = true;
      this.userService.forgotPassword(this.forgotUsername).subscribe({
        next: () => {
          this.loading = false;
          this.forgotUsername = "";
        }
      });
    }
  }
}
