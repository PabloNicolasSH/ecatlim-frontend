import { Component, EventEmitter, Input, model, Output, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ScoutGroup } from '../../shared/models/scout-group.model';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PrimeTemplate } from 'primeng/api';

@Component({
  selector: 'app-entity-modal-add-edit',
  standalone: true,
  imports: [
    Dialog,
    Button,
    FloatLabel,
    InputText,
    Select,
    ReactiveFormsModule,
    PrimeTemplate
  ],
  templateUrl: './entity-modal-add-edit.component.html',
  styleUrl: './entity-modal-add-edit.component.scss'
})
export class EntityModalAddEditComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);

  visible = model<boolean>(false);
  @Input() dialogMode: string | undefined;
  @Input() entityToEdit: ScoutGroup = {} as ScoutGroup;
  @Output() entityUpdated = new EventEmitter<ScoutGroup>();

  form: FormGroup;
  loading: boolean = false;

  provinces = [
    { id: 35, name: 'Las Palmas' },
    { id: 38, name: 'Santa Cruz de Tenerife' },
    { id: 28, name: 'Madrid' },
    { id: 8,  name: 'Barcelona' },
    { id: 41, name: 'Sevilla' },
    { id: 46, name: 'Valencia' },
    { id: 50, name: 'Zaragoza' }
  ];

  constructor() {
    this.form = this.fb.group({
      id: [null],
      name: ['', [Validators.required, Validators.minLength(3)]],
      groupNumber: [null],
      provinceId: [null, [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.checkMode();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entityToEdit'] || (changes['visible'] && this.visible())) {
      this.checkMode();
    }
  }

  private checkMode() {
    if (this.dialogMode === 'Edit' && this.entityToEdit) {
      this.form.patchValue(this.entityToEdit);
    } else {
      this.form.reset();
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;

      const payload: ScoutGroup = {
        ...this.form.value,
        groupNumber: Number(this.form.value.groupNumber),
        provinceId: Number(this.form.value.provinceId)
      };

      setTimeout(() => {
        this.entityUpdated.emit(payload);
        this.loading = false;
        this.visible.set(false);
      }, 600);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
