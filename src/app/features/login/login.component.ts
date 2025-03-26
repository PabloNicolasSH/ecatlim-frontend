import {Component, inject, OnInit} from '@angular/core';
import {Button} from 'primeng/button';
import {FloatLabel} from 'primeng/floatlabel';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {InputText} from 'primeng/inputtext';
import {Password} from 'primeng/password';
import {Router, RouterLink} from '@angular/router';
import {UserToLog} from '../../core/auth/user-to-log.model';
import {AuthService} from '../../core/auth/auth.service';

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
export class LoginComponent  implements OnInit{

  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected loginForm!: FormGroup;
  protected loading: boolean = false;

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group(
      {
        username: ["", [Validators.required, Validators.email]],
        password: ["", Validators.required]
      }
    )
  }

  login(){
    this.loginForm.markAllAsTouched();
    if (this.loginForm.valid && !this.loading){
      this.loading = true;
      const userToLog: UserToLog = {...this.loginForm.value};
      this.authService.login(userToLog).subscribe({
        next: () => this.router.navigate(['/app/home']),
        error: (err) => {
            this.loading = false;
        }
      });
    }
  }
}
