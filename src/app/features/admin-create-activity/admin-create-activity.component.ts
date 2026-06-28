import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityService } from '../../shared/services/activity.service';

import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Checkbox } from 'primeng/checkbox';
import { FloatLabel } from 'primeng/floatlabel';
import { Tooltip } from 'primeng/tooltip';
import {ToggleButton} from 'primeng/togglebutton';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-admin-create-activity',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Button,
    DatePicker,
    Select,
    InputText,
    Textarea,
    Checkbox,
    FloatLabel,
    Tooltip,
    ToggleButton
  ],
  templateUrl: './admin-create-activity.component.html',
  styleUrl: './admin-create-activity.component.scss'
})
export class AdminCreateActivityComponent implements OnInit {

  protected readonly fb = inject(FormBuilder);
  protected readonly activityService = inject(ActivityService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly messageService = inject(MessageService);
  protected readonly history = history

  activityForm!: FormGroup;
  eventId!: number;

  activityTypes = [
    { label: 'Foro de Discusión', value: 'FORUM' },
    { label: 'Glosario Alfabético', value: 'GLOSSARY' },
    { label: 'Entrega de Archivos', value: 'FILE_UPLOAD' },
    { label: 'Encuesta / Examen', value: 'SURVEY' }
  ];

  evaluationMethods = [
    { label: 'Automática por Participación', value: 'AUTOMATIC' },
    { label: 'Manual por el Formador', value: 'MANUAL' }
  ];

  responseTypes = [
    { label: 'Texto Libre', value: 'TEXT' },
    { label: 'Selección Múltiple (Test)', value: 'SELECTION' },
    { label: 'Valor Numérico / Escala', value: 'VALUE' }
  ];

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('eventId'));
    this.initForm();

    this.activityForm.get('activityType')?.valueChanges.subscribe(type => {
      if (type !== 'SURVEY') {
        this.questions.clear();
        this.activityForm.get('isGradable')?.setValue(false);
      }
    });
  }

  initForm(): void {
    this.activityForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', Validators.required],
      activityType: ['FORUM', Validators.required],
      evaluationMethod: ['AUTOMATIC', Validators.required],
      availableAt: ['', Validators.required],
      dueDate: ['', Validators.required],
      isOptional: [false],
      isGradable: [false],
      maxAttempts: [null],
      passingScore: [null],
      questions: this.fb.array([])
    });
  }

  get questions(): FormArray {
    return this.activityForm.get('questions') as FormArray;
  }

  getOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  addQuestion(): void {
    const questionForm = this.fb.group({
      questionText: ['', Validators.required],
      responseType: ['SELECTION', Validators.required],
      options: this.fb.array([])
    });
    this.questions.push(questionForm);

    const currentQuestionIndex = this.questions.length - 1;
    this.addOption(currentQuestionIndex);
    this.addOption(currentQuestionIndex);
  }

  removeQuestion(index: number): void {
    this.questions.removeAt(index);
  }

  addOption(questionIndex: number): void {
    const optionForm = this.fb.group({
      optionText: ['', Validators.required],
      isCorrect: [false]
    });
    this.getOptions(questionIndex).push(optionForm);
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    this.getOptions(questionIndex).removeAt(optionIndex);
  }

  onSubmit(): void {
    if (this.activityForm.invalid) {
      this.activityForm.markAllAsTouched();
      return;
    }

    const payload = this.activityForm.value;
    this.activityService.createActivity(this.eventId, payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: "success",
          summary: "Actividad creada",
          detail: "Se ha creado correctamente.",
        });
        this.router.navigate(['/admin/eventos-formativos', this.eventId, 'actividades']).then();
      },
      error: (err) => this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: err.message,
      })
    });
  }
}
