import {Component, inject, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {ActivityService} from '../../shared/services/activity.service';

import {Button} from 'primeng/button';
import {DatePicker} from 'primeng/datepicker';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {Textarea} from 'primeng/textarea';
import {Checkbox} from 'primeng/checkbox';
import {FloatLabel} from 'primeng/floatlabel';
import {Tooltip} from 'primeng/tooltip';
import {ToggleButton} from 'primeng/togglebutton';
import {MessageService} from 'primeng/api';
import {EventService} from '../../shared/services/event.service';
import {EventDetailParticipant} from '../../shared/models/event.model';
import {SimpleUser} from '../../shared/models/user.model';
import {FieldErrorComponent} from '../../shared/components/field-error/field-error.component';
import {dateOrderValidator, MAX_TEXT, notBlankValidator} from '../../shared/validation/validation-patterns';

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
    ToggleButton,
    FieldErrorComponent
  ],
  templateUrl: './admin-create-activity.component.html',
  styleUrl: './admin-create-activity.component.scss'
})
export class AdminCreateActivityComponent implements OnInit {

  protected readonly fb = inject(FormBuilder);
  protected readonly activityService = inject(ActivityService);
  protected readonly messageService = inject(MessageService);
  protected readonly eventService = inject(EventService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);

  activityForm!: FormGroup;
  eventId!: number | null;
  availableBlocks: any[] = [];
  trainers: (SimpleUser & { fullName: string })[] = [];
  private participants: EventDetailParticipant[] = [];
  assignableUsers: { id: number; fullName: string }[] = [];

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

    this.route.paramMap.subscribe(params => {
      const rawId = params.get('eventId');
      this.eventId = rawId ? Number(rawId) : null;
      if (this.eventId !== null) {
        this.loadEventBlocks(this.eventId);
        this.loadEventTrainers(this.eventId);
      }
    })

    this.initForm();

    this.activityForm.get('lessonBlockId')?.valueChanges.subscribe(() => this.refreshAssignableUsers());

    this.activityForm.get('activityType')?.valueChanges.subscribe(type => {
      if (type !== 'SURVEY') {
        this.questions.clear();
        this.activityForm.get('isGradable')?.setValue(false);
      }
    });

    this.activityForm.get('isGradable')?.valueChanges.subscribe(gradable => {
      for (const key of ['maxAttempts', 'passingScore']) {
        const control = this.activityForm.get(key)!;
        gradable ? control.addValidators(Validators.required) : control.removeValidators(Validators.required);
        control.updateValueAndValidity();
      }
    });
  }

  initForm(): void {
    this.activityForm = this.fb.group({
      title: ['', [Validators.required, notBlankValidator, Validators.minLength(5), Validators.maxLength(MAX_TEXT)]],
      description: ['', [Validators.required, notBlankValidator, Validators.maxLength(MAX_TEXT)]],
      activityType: ['FORUM', Validators.required],
      evaluationMethod: ['AUTOMATIC', Validators.required],
      availableAt: ['', Validators.required],
      dueDate: ['', Validators.required],
      lessonBlockId: [null, Validators.required],
      responsibleId: [null, Validators.required],
      assignedUserId: [null],
      isOptional: [false],
      isGradable: [false],
      maxAttempts: [null, [Validators.min(1), Validators.max(100)]],
      passingScore: [null, [Validators.min(0), Validators.max(10)]],
      questions: this.fb.array([])
    }, {validators: dateOrderValidator('availableAt', 'dueDate')});
  }

  get questions(): FormArray {
    return this.activityForm.get('questions') as FormArray;
  }

  getOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  addQuestion(): void {
    const questionForm = this.fb.group({
      questionText: ['', [Validators.required, notBlankValidator, Validators.maxLength(MAX_TEXT)]],
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
      optionText: ['', [Validators.required, notBlankValidator, Validators.maxLength(MAX_TEXT)]],
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
      this.messageService.add({
        severity: 'warn',
        summary: 'Revisa el formulario',
        detail: 'Hay campos obligatorios vacíos o con un formato no válido'
      });
      return;
    }

    const payload = {...this.activityForm.value, assignedUserId: this.activityForm.value.assignedUserId ?? null};
    if (this.eventId === null) {return;}
    this.activityService.createActivity(this.eventId, payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: "success",
          summary: "Actividad creada",
          detail: "Se ha creado correctamente.",
        });
        this.router.navigate(['/app/eventos-formativos/detalle', this.eventId]).then();
      },
      error: (err) => this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: err.message,
      })
    });
  }

  goBack(): void {
    this.router.navigate(this.eventId !== null ? ["/app/eventos-formativos/detalle", this.eventId] : ["/app/eventos-formativos"]).then();
  }

  loadEventTrainers(id: number): void {
    this.eventService.getEventDetail(id).subscribe(event => {
      this.participants = event.participants;
      this.refreshAssignableUsers();
      this.trainers = event.facilitators.map(t => ({
        ...t,
        fullName: [t.name, t.surname].filter(Boolean).join(" ") || t.email
      }));
    });
  }

  private refreshAssignableUsers(): void {
    const blockId = this.activityForm?.get('lessonBlockId')?.value;
    this.assignableUsers = blockId == null ? [] : this.participants
      .filter(p => p.blocks.some(b => b.lessonBlockId === blockId))
      .map(p => ({id: p.userId, fullName: [p.name, p.surname].filter(Boolean).join(' ') || p.email}));
    const selected = this.activityForm?.get('assignedUserId')?.value;
    if (selected != null && !this.assignableUsers.some(u => u.id === selected)) {
      this.activityForm.get('assignedUserId')?.setValue(null);
    }
  }

  loadEventBlocks(id: number): void {
    this.eventService.getEventBlocks(id).subscribe(blocks => {
      this.availableBlocks = blocks
    })
  }
}
