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
import {AuthLoginResponse, UserToLog} from '../../core/auth/auth-models';
import {toDataURL} from 'qrcode';
import {finalize} from 'rxjs';
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

  /** Where the login is: password, code of the authenticator app, first setup of the app, or the recovery codes. */
  protected step: 'credentials' | 'mfa' | 'setup' | 'recovery' = 'credentials';
  protected challengeToken = '';
  protected mfaCode = '';
  protected setupSecret = '';
  protected setupQr = '';
  protected recoveryCodes: string[] = [];
  protected codesSaved = false;
  private passwordChangeRequired = false;

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
      ).subscribe(res => this.handleResponse(res));
    }
  }

  verifyMfa() {
    if (!this.mfaCode.trim() || this.loading) {
      return;
    }
    this.loading = true;
    this.authService.verifyMfa(this.challengeToken, this.mfaCode).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: res => this.handleResponse(res),
      error: err => this.handleChallengeError(err)
    });
  }

  confirmSetup() {
    if (!this.mfaCode.trim() || this.loading) {
      return;
    }
    this.loading = true;
    this.authService.confirmMfaSetup(this.challengeToken, this.mfaCode).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: res => this.handleResponse(res),
      error: err => this.handleChallengeError(err)
    });
  }

  finishLogin() {
    this.router.navigate([this.passwordChangeRequired ? '/cambiar-contraseña' : '/app/home']);
  }

  backToCredentials() {
    this.step = 'credentials';
    this.challengeToken = '';
    this.mfaCode = '';
    this.loginForm.get('password')?.reset('');
  }

  protected copyRecoveryCodes() {
    navigator.clipboard?.writeText(this.recoveryCodes.join('\n'));
    this.messageService.add({severity: 'success', summary: 'Copiados', detail: 'Guarda los códigos en un lugar seguro.'});
  }

  private handleResponse(res: AuthLoginResponse) {
    this.mfaCode = '';
    switch (res.status) {
      case 'MFA_REQUIRED':
        this.challengeToken = res.challengeToken!;
        this.step = 'mfa';
        break;
      case 'MFA_SETUP_REQUIRED':
        this.challengeToken = res.challengeToken!;
        this.startSetup();
        break;
      default:
        this.passwordChangeRequired = res.passwordChangeRequired;
        if (res.recoveryCodes?.length) {
          this.recoveryCodes = res.recoveryCodes;
          this.step = 'recovery';
        } else {
          this.finishLogin();
        }
    }
  }

  private startSetup() {
    this.loading = true;
    this.authService.beginMfaSetup(this.challengeToken).pipe(
      finalize(() => this.loading = false)
    ).subscribe(async setup => {
      this.setupSecret = setup.secret;
      this.setupQr = await toDataURL(setup.otpauthUri, {width: 220, margin: 1});
      this.step = 'setup';
    });
  }

  /** A wrong code can be retried; when the step expired the password has to be typed again. */
  private handleChallengeError(err: { status?: number; error?: { ecatlimMessage?: string } }) {
    if (err.status === 401 && err.error?.ecatlimMessage?.includes('caducado')) {
      this.backToCredentials();
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
