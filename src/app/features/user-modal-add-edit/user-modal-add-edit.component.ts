import {Component, inject, Input, model, OnInit} from '@angular/core';
import {Dialog} from 'primeng/dialog';
import {User} from '../../shared/models/user.model';
import {Button} from 'primeng/button';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import * as console from 'node:console';

@Component({
  selector: 'app-user-modal-add-edit',
  imports: [
    Dialog,
    Button,
    ReactiveFormsModule
  ],
  templateUrl: './user-modal-add-edit.component.html',
  styleUrl: './user-modal-add-edit.component.scss'
})
export class UserModalAddEditComponent implements OnInit{

  protected readonly formBuilder = inject(FormBuilder);

  visible = model<boolean>(false);
  @Input() dialogMode!: string;
  @Input() userToEdit!: User;

  protected form!: FormGroup;
  protected loading: boolean = false;

  ngOnInit(): void {
    this.initializeForm();
  }

  onSubmit() {
    console.log("Prueba");
  }

  private initializeForm() {
    if (this.dialogMode == 'Add'){
      this.form = this.formBuilder.group({
        name: ["", Validators.required],
        surname: ["", Validators.required],
        email: ["", [Validators.required, Validators.email]],
        phone: [""],
        census: [""],
        nif: [""],
        address: [""],
        city: [""],
        country: [""]
      })
    } else if (this.dialogMode == 'Edit'){
      this.form = this.formBuilder.group({
        name: [this.userToEdit.name, Validators.required],
        surname: [this.userToEdit.surname, Validators.required],
        email: [this.userToEdit.email, [Validators.required, Validators.email]],
        phone: [this.userToEdit.phone],
        census: [this.userToEdit.census],
        nif: [this.userToEdit.nif],
        address: [this.userToEdit.address],
        city: [this.userToEdit.city],
        country: [this.userToEdit.country]
      })
    }
  }
}
