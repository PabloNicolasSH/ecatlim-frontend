import { Component, inject, OnInit } from '@angular/core';
import { EventSchedulerComponent } from '../event-scheduler/event-scheduler.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { MessageService, PrimeTemplate, SelectItemGroup } from 'primeng/api';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { MultiSelect } from 'primeng/multiselect';
import { EventService } from '../../../shared/services/event.service';
import { Textarea } from 'primeng/textarea';
import { UserService } from '../../../shared/services/user.service';
import { LessonBlockService } from '../../../shared/services/lesson-block.service';
import { Role } from '../../../shared/models/role.model';
import { User } from '../../../shared/models/user.model';
import { LessonBlock } from '../../../shared/models/lesson-block.model';
import { EventCreatorService } from '../event-creator.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TimelineItem } from '../../../shared/models/timeline-item.model';
import { InputNumber } from 'primeng/inputnumber';
import { NgClass } from '@angular/common';
import { EducationStageService } from '../../../shared/services/education-stage.service';
import { EducationStage } from '../../../shared/models/education-stage.model';
import { forkJoin } from 'rxjs';
import {EventForm} from '../../../shared/models/event.model';

@Component({
  selector: 'app-admin-create-event',
  imports: [
    EventSchedulerComponent,
    ReactiveFormsModule,
    FloatLabel,
    Select,
    InputText,
    Button,
    DatePicker,
    MultiSelect,
    Textarea,
    PrimeTemplate,
    InputNumber,
    NgClass
  ],
  templateUrl: './admin-edit-create-event.component.html',
  styleUrl: './admin-edit-create-event.component.scss'
})
export class AdminEditCreateEventComponent implements OnInit {

  protected readonly formBuilder = inject(FormBuilder);
  protected readonly messageService = inject(MessageService);
  protected readonly eventService = inject(EventService);
  protected readonly userService = inject(UserService);
  protected readonly lessonBlockService = inject(LessonBlockService);
  protected readonly eventCreatorService = inject(EventCreatorService);
  protected readonly educationStageService = inject(EducationStageService);
  protected readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);

  eventForm!: FormGroup;
  step: number = 1;
  savedTimeline: any[] = [];

  directors: User[] = [];
  facilitators: User[] = [];

  allBlocks: LessonBlock[] = [];
  availableBlocks: SelectItemGroup[] = [];
  availableEducationStages: EducationStage[] = [];

  pendingBlocks: any[] = [];
  loading: boolean = false;
  eventId: number | undefined;

  isEdit: boolean = false;

  protected defaultStartDate!: Date;
  protected defaultEndDate!: Date;

  notificationTargets = [
    { label: 'Usuarios Interesados', value: 'INTERESTED_USERS' },
    { label: 'Usuarios Disponibles', value: 'AVAILABLE_USERS' },
    { label: 'Coordinadores de Formación', value: 'HEAD_OF_EDUCATION' }
  ];

  constructor() {
    this.initializeForm();
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      this.isEdit = true;
      this.eventId = Number(idParam);
    }
  }

  ngOnInit(): void {
    const start = new Date();
    start.setHours(20, 0, 0, 0);
    this.defaultStartDate = start;

    const end = new Date();
    end.setDate(end.getDate() + 2);
    end.setHours(15, 0, 0, 0);
    this.defaultEndDate = end;

    this.eventForm.get('selectedEducationStage')?.valueChanges.subscribe((stage: EducationStage | null) => {
      this.filterAndGroupBlocks(stage);
      if (this.eventForm.get('selectedEducationStage')?.dirty) {
        this.eventForm.get('selectedBlocks')?.setValue([]);
      }
    });

    this.loadDataAndEvent();
  }

  private initializeForm() {
    this.eventForm = this.formBuilder.group({
      title: ['', Validators.required],
      shortname: ['', Validators.required],
      description: [''],
      contents: ['', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      location: ['', Validators.required],
      organizer: ['ECATLIM', Validators.required],
      selectedDirector: [null, Validators.required],
      selectedFacilitators: [[], [Validators.required, Validators.minLength(1)]],
      selectedEducationStage: [null, Validators.required],
      selectedBlocks: [[], [Validators.required, Validators.minLength(1)]],
      status: ['PENDING', Validators.required],
      minParticipants: [1, [Validators.required, Validators.min(1)]],
      dateOpenInscription: [null, Validators.required],
      dateCloseInscription: [null, Validators.required],
      cost: [0, [Validators.required, Validators.min(0)]],
      transferBankNumber: ['', Validators.required],
      transferCode: ['', Validators.required],
      notificationTarget: [[], Validators.required]
    });
  }

  private loadDataAndEvent() {
    this.loading = true;
    forkJoin({
      directors: this.userService.getUsersByRole(Role.EVENT_DIRECTOR),
      facilitators: this.userService.getUsersByRole(Role.TRAINER),
      stages: this.educationStageService.getEducationStages(),
      blocks: this.lessonBlockService.getAll()
    }).subscribe({
      next: (res) => {
        this.directors = res.directors;
        this.facilitators = res.facilitators;
        this.availableEducationStages = res.stages;
        this.allBlocks = res.blocks;

        if (this.isEdit && this.eventId) {
          this.loadEventForEditing(this.eventId);
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los datos maestros.' });
      }
    });
  }

  private loadEventForEditing(id: number) {
    this.eventService.getEventFormById(id).subscribe({
      next: (event: EventForm) => {
        const director = this.directors.find(d => d.id === event.directorId) || null;
        const stage = this.availableEducationStages.find(s => s.id === event.educationStageId) || null;
        const selectedFacilitators = this.facilitators.filter(f =>
          f.id && event.facilitatorIds?.includes(f.id)
        );

        if (stage) {
          this.filterAndGroupBlocks(stage);
        }
        const selectedBlocks = this.allBlocks.filter(b =>
           b.id && event.lessonBlockIds?.includes(b.id)
        );

        const rawTargets = event.eventConfiguration?.notificationTarget || [];

        const cleanTargets = rawTargets.map(target =>
          target.replace('[', '').replace(']', '')
        );

        this.eventForm.patchValue({
          title: event.title,
          shortname: event.shortname,
          description: event.description,
          contents: event.contents,
          startDate: event.startDate ? new Date(event.startDate) : null,
          endDate: event.endDate ? new Date(event.endDate) : null,
          location: event.location,
          organizer: event.organizer || 'ECATLIM',
          selectedDirector: director,
          selectedFacilitators: selectedFacilitators,
          selectedEducationStage: stage,
          selectedBlocks: selectedBlocks,
          status: event.status || 'PENDING',
          minParticipants: event.eventConfiguration?.minParticipants || 1,
          dateOpenInscription: event.eventConfiguration?.dateOpenInscription ? new Date(event.eventConfiguration.dateOpenInscription) : null,
          dateCloseInscription: event.eventConfiguration?.dateCloseInscription ? new Date(event.eventConfiguration.dateCloseInscription) : null,
          cost: event.eventConfiguration?.cost || 0,
          transferBankNumber: event.eventConfiguration?.transferBankNumber || '',
          transferCode: event.eventConfiguration?.transferCode || '',
          notificationTarget: cleanTargets
        });

        this.savedTimeline = event.timelineItems || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el evento.' });
      }
    });
  }

  private filterAndGroupBlocks(stage: EducationStage | null) {
    if (!stage) {
      this.availableBlocks = [];
      return;
    }
    const filtered = this.allBlocks.filter(block => block.educationStageId === stage.id);
    this.availableBlocks = this.groupedBlocksByCode(filtered);
  }

  private groupedBlocksByCode(blocks: LessonBlock[]) {
    const labels: { [key: string]: string } = {
      'AS': 'Acogida al Scouter (AS)',
      'ES': 'Educador/a Scout (ES)',
      'CS': 'Coordinador/a Scout (CS)'
    };

    const groups = blocks.reduce((acc, block) => {
      const match = block.code?.match(/^B[FP]([A-Z]{2})/);
      const groupKey = match ? match[1] : 'OTROS';

      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(block);
      return acc;
    }, {} as { [key: string]: LessonBlock[] });

    const result = Object.keys(groups).map(key => ({
      label: labels[key] || 'Otros Bloques',
      value: key,
      items: [...groups[key]]
        .sort((a, b) => (a.code || '').localeCompare((b.code || ''), undefined, {
          numeric: true,
          sensitivity: 'base'
        }))
        .map(b => ({
          label: `${b.code}`,
          value: b
        }))
    }));

    const order = ['AS', 'ES', 'CS'];
    return result.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
  }

  onBlockSelectionChange(event: any) {
    const selected = event.value;
    if (selected && selected.length > 1) {
      const firstStageId = selected[0].educationStageId;
      const differentStage = selected.some((b: any) => b.educationStageId !== firstStageId);

      if (differentStage) {
        selected.pop();
        this.eventForm.get('selectedBlocks')?.setValue([...selected]);
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Etapa',
          detail: 'Todos los bloques deben pertenecer a la misma etapa educativa.'
        });
      }
    }
  }

  saveDraftEvent() {
    if (this.eventForm.invalid) return;

    this.loading = true;
    this.eventForm.patchValue({ status: 'DRAFT' });
    const eventDto = this.prepareDto(false);

    const request = this.eventId
      ? this.eventService.updateEvent(this.eventId, eventDto)
      : this.eventService.saveEvent(eventDto);

    request.subscribe({
      next: (res: any) => {
        this.eventId = res.id;
        this.messageService.add({ severity: 'success', summary: 'Borrador Guardado', detail: 'El evento se ha guardado correctamente como Borrador.' });
        this.loading = false;
        this.router.navigate(['/app/admin/eventos-formativos'], { queryParams: { openEventId: this.eventId } });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
        this.loading = false;
        this.eventForm.patchValue({ status: 'PENDING' });
      }
    });
  }

  saveEvent() {
    if (this.eventForm.invalid) return;

    this.loading = true;
    const eventDto = this.prepareDto(false);

    const request = this.eventId
      ? this.eventService.updateEvent(this.eventId, eventDto)
      : this.eventService.saveEvent(eventDto);

    request.subscribe({
      next: (res: any) => {
        this.eventId = res.id;
        this.messageService.add({ severity: 'success', summary: 'Evento Guardado', detail: 'El evento se ha guardado, para que sea visible, el director debe darle a publicar.' });
        this.loading = false;
        this.router.navigate(['/app/admin/eventos-formativos'], { queryParams: { openEventId: this.eventId } });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
        this.loading = false;
        this.eventForm.patchValue({ status: 'PENDING' });
      }
    });
  }

  onFinishScheduler(timelineEvents: TimelineItem[]) {
    this.loading = true;
    this.savedTimeline = timelineEvents;

    const eventDto = this.prepareDto(true);

    const request = this.eventId
      ? this.eventService.updateEvent(this.eventId, eventDto)
      : this.eventService.saveEvent(eventDto);

    request.subscribe({
      next: (res: any) => {
        const finalId = this.eventId || res?.id;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Evento y cronograma guardados' });
        this.router.navigate(['/app/admin/eventos-formativos'], { queryParams: { openEventId: finalId } });
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al finalizar' });
      }
    });
  }

  private prepareDto(includeTimeline: boolean = false): any {
    const formValue = this.eventForm.value;
    return {
      title: formValue.title,
      shortname: formValue.shortname,
      description: formValue.description,
      contents: formValue.contents,
      startDate: this.eventCreatorService.toLocalISO(formValue.startDate),
      endDate: this.eventCreatorService.toLocalISO(formValue.endDate),
      location: formValue.location,
      organizer: formValue.organizer,
      status: formValue.status,
      directorId: formValue.selectedDirector?.id,
      facilitatorIds: formValue.selectedFacilitators.map((f: any) => f.id),
      educationStageId: formValue.selectedEducationStage?.id,
      lessonBlockIds: formValue.selectedBlocks.map((b: any) => b.id),
      timelineItems: includeTimeline ? this.savedTimeline : [],
      eventConfiguration: {
        minParticipants: formValue.minParticipants,
        dateOpenInscription: this.eventCreatorService.toLocalISO(formValue.dateOpenInscription),
        dateCloseInscription: this.eventCreatorService.toLocalISO(formValue.dateCloseInscription),
        cost: formValue.cost,
        transferBankNumber: formValue.transferBankNumber,
        transferCode: formValue.transferCode,
        notificationTarget: formValue.notificationTarget
      }
    };
  }

  isStepValid(currentStep: number): boolean {
    const fieldsByStep: { [key: number]: string[] } = {
      1: ['title', 'shortname', 'startDate', 'endDate', 'location', 'organizer', 'selectedDirector', 'selectedBlocks', 'status'],
      2: ['minParticipants', 'dateOpenInscription', 'dateCloseInscription', 'cost', 'transferBankNumber', 'transferCode', 'notificationTarget']
    };

    const fields = fieldsByStep[currentStep];
    if (!fields) return true;

    return fields.every(field => this.eventForm.get(field)?.valid);
  }

  nextStep() {
    if (this.isStepValid(this.step)) {
      if (this.step === 2) {
        this.prepareBlocksForScheduler();
      }
      this.step++;
    }
  }

  prevStep() {
    if (this.step > 1) {
      this.step--;
    }
  }

  private prepareBlocksForScheduler() {
    const selectedBlocks = this.eventForm.value.selectedBlocks.map((block: any) => ({
      id: block.id,
      title: block.name,
      code: block.code,
      totalHours: block.contactHours,
      remainingHours: block.contactHours,
      assignedHours: 0,
      color: this.getRandomColor(),
      itemType: 'FORMATIVE'
    }));

    const logisticBlock = {
      id: 9999,
      title: 'Gestión y Logística',
      code: 'LOG',
      assignedHours: 0,
      color: '#64748b',
      itemType: 'LOGISTIC'
    };

    this.pendingBlocks = [logisticBlock, ...selectedBlocks];
  }

  handleBackFromScheduler(events: any[]) {
    this.savedTimeline = events;
    this.step = 2;
  }

  private getRandomColor(): string {
    const presetColors = [
      '#8c4007', '#b45309', '#92400e', '#78350f',
      '#a16207', '#c2410c', '#9a3412', '#b45309',
      '#c68753', '#854d0e', '#064e3b', '#14532d',
      '#15803d', '#166534', '#065f46', '#047857',
      '#059669', '#064e3b', '#0f766e', '#115e59',
      '#7f1d1d', '#991b1b', '#b91c1c', '#dc2626',
      '#9233ea', '#7c3aed', '#c026d3', '#9d174d',
      '#be123c', '#881337'
    ];
    return presetColors[Math.floor(Math.random() * presetColors.length)];
  }

  protected readonly history = history;
}
