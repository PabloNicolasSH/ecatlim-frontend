import {Component, inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '../../shared/services/user.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Button} from 'primeng/button';
import {FloatLabel} from 'primeng/floatlabel';
import {Password} from 'primeng/password';
import {ResetPassword} from './reset-password.model';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-reset-password',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    Button,
    FloatLabel,
    Password
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);

  token: string = '';
  newPassword: string = '';
  repeatedPassword: string = '';
  loading: boolean = false;

  protected passwordRegex: RegExp = /^(?=.*[A-ZÑ])(?=.*[a-zñ])(?=.*\d)(?=.*[!@#\$%\^&\*\(\)_\+\[\]{};':"\\|,.<>\/?`~\-])(?!.*\s).{8,}$/;


  protected passwordValidationRules = [
    { key: 'len', regex: /.{8,}/, text: 'Al menos 8 caracteres. ' },
    { key: 'space', regex: /^\S*$/, text: 'Ningún espacio. <br>' },
    { key: 'may', regex: /.*[A-ZÑ].*/, text: 'Al menos 1 mayúscula. ' },
    { key: 'min', regex: /.*[a-zñ].*/, text: 'Al menos 1 minúscula. ' },
    { key: 'dig', regex: /.*\d.*/, text: 'Al menos 1 número. <br>' },
    { key: 'special', regex: /[!@#\$%\^&\*\(\)_\+\[\]{};':"\\|,.<>\/?`~\-]/, text: 'Al menos 1 carácter especial (!@#?%_.:)'}
  ];

  constructor() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
    });
  }

  protected checkPasswordRegex(regex: RegExp): 'green' | 'red' {
    return regex.test(this.newPassword) ? 'green' : 'red';
  }

  protected get passwordValid(): boolean {
    return this.passwordRegex.test(this.newPassword);
  }

  protected get passwordsMatch(): boolean {
    return this.newPassword === this.repeatedPassword;
  }

  protected get repeatMismatch(): boolean {
    return this.repeatedPassword.length > 0 && this.newPassword !== this.repeatedPassword;
  }

  resetPassword(){
    this.loading = true;
    const forgotPassword: ResetPassword = {token: this.token, newPassword: this.newPassword, newPasswordRepeat: this.repeatedPassword};
    this.userService.resetPassword(forgotPassword).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: "success",
          detail: "Se ha cambiado correctamente tu contraseña"
        });
        this.router.navigateByUrl('/login');
      }
    });
  }
}
