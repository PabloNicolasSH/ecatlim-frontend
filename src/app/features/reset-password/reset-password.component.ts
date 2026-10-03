import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '../../shared/services/user.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Button} from 'primeng/button';
import {FloatLabel} from 'primeng/floatlabel';
import {Password} from 'primeng/password';
import {ResetPassword} from './models/reset-password.model';
import {MessageService} from 'primeng/api';
import {ChangePassword} from './models/change-password.model';
import {finalize} from 'rxjs';
import {PASSWORD_SPECIAL_CHARS} from '../../shared/validation/validation-patterns';

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
export class ResetPasswordComponent implements OnInit{

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);

  token: string = '';
  newPassword: string = '';
  repeatedPassword: string = '';
  loading: boolean = false;

  changePassword: boolean = false;
  actualPassword: string = '';

  protected passwordValidationRules = [
    { key: 'len', regex: /^.{8,256}$/, text: 'Entre 8 y 256 caracteres. ' },
    { key: 'space', regex: /^\S*$/, text: 'Ningún espacio. <br>' },
    { key: 'may', regex: /[A-Z]/, text: 'Al menos 1 mayúscula (A-Z). ' },
    { key: 'min', regex: /[a-z]/, text: 'Al menos 1 minúscula (a-z). ' },
    { key: 'dig', regex: /\d/, text: 'Al menos 1 número. <br>' },
    { key: 'special', regex: PASSWORD_SPECIAL_CHARS, text: 'Al menos 1 carácter especial (!@#?%_.:)'}
  ];

  constructor() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
    });
  }

  ngOnInit(): void {
    this.changePassword = this.route.snapshot.data["changePassword"];
  }

  protected checkPasswordRegex(regex: RegExp): 'green' | 'red' {
    return regex.test(this.newPassword) ? 'green' : 'red';
  }

  protected get passwordValid(): boolean {
    return this.passwordValidationRules.every(rule => rule.regex.test(this.newPassword));
  }

  protected get canSubmit(): boolean {
    return this.passwordValid && this.passwordsMatch && (!this.changePassword || this.actualPassword.length > 0);
  }

  protected get passwordsMatch(): boolean {
    return this.newPassword === this.repeatedPassword;
  }

  protected get repeatMismatch(): boolean {
    return this.repeatedPassword.length > 0 && this.newPassword !== this.repeatedPassword;
  }

  resetPassword(){
    if (this.changePassword){
      this.changeUserPassword();
    } else {
      this.loading = true;
      const forgotPassword: ResetPassword = {token: this.token, newPassword: this.newPassword, newPasswordRepeat: this.repeatedPassword};
      this.userService.resetPassword(forgotPassword).pipe(finalize(() => this.loading = false)).subscribe({
        next: () => {
          this.messageService.add({
            severity: "success",
            detail: "Se ha cambiado correctamente tu contraseña"
          });
          this.router.navigateByUrl('/login');
        }
      });
    }
  }


  private changeUserPassword() {
    this.loading = true;
    const changePassword: ChangePassword = {currentPassword: this.actualPassword, newPassword: this.newPassword, newPasswordRepeat: this.repeatedPassword};
    this.userService.changePassword(changePassword).pipe(finalize(() => this.loading = false)).subscribe({
      next: () => {
        this.messageService.add({
          severity: "success",
          detail: "Se ha cambiado correctamente tu contraseña"
        });
        this.router.navigateByUrl('/login');
      }
    });
  }
}
