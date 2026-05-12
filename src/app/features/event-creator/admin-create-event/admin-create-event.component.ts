import {Component, inject, OnInit} from '@angular/core';
import {EventSchedulerComponent} from '../event-scheduler/event-scheduler.component';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {FloatLabel} from 'primeng/floatlabel';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {MessageService, PrimeTemplate, SelectItemGroup} from 'primeng/api';
import {Button} from 'primeng/button';
import {DatePicker} from 'primeng/datepicker';
import {MultiSelect} from 'primeng/multiselect';
import {EventService} from '../../../shared/services/event.service';
import {Textarea} from 'primeng/textarea';
import {UserService} from '../../../shared/services/user.service';
import {LessonBlockService} from '../../../shared/services/lesson-block.service';
import {Role} from '../../../shared/models/role.model';
import {User} from '../../../shared/models/user.model';
import {LessonBlock} from '../../../shared/models/lesson-block.model';

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
    PrimeTemplate
  ],
  templateUrl: './admin-create-event.component.html',
  styleUrl: './admin-create-event.component.scss'
})
export class AdminCreateEventComponent implements OnInit{

  protected readonly formBuilder = inject(FormBuilder);
  protected readonly messageService = inject(MessageService);
  protected readonly eventService = inject(EventService);
  protected readonly userService = inject(UserService);
  protected readonly lessonBlockService = inject(LessonBlockService);

  eventForm!: FormGroup;
  step: number = 1;
  savedTimeline: any[] = [];

  directors: User[] = [];
  availableBlocks: SelectItemGroup[] = [];

  pendingBlocks: any[] = [];
  loading: boolean = false;

  protected defaultStartDate!: Date;
  protected defaultEndDate!: Date;

  constructor() {
    this.initializeForm();
    this.loadData();
  }

  ngOnInit(): void {
    const start = new Date();
    start.setHours(20, 0, 0, 0);
    this.defaultStartDate = start;

    const end = new Date();
    end.setDate(end.getDate() + 2);
    end.setHours(15, 0, 0, 0);
    this.defaultEndDate = end;
  }

  private initializeForm() {
    this.eventForm = this.formBuilder.group({
      title: ['', Validators.required],
      description: [''],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      location: ['', Validators.required],
      organizer: ['ECATLIM', Validators.required],
      selectedDirector: [null, Validators.required],
      selectedBlocks: [[], [Validators.required, Validators.minLength(1)]]
    });
  }

  private loadData() {
    this.userService.getUsersByRole(Role.EVENT_DIRECTOR)
      .subscribe({
        next: (users) => {
          this.directors = users;
        }
      });
    this.lessonBlockService.getAll()
      .subscribe({
        next: (blocks) => {
          this.availableBlocks = this.groupedBlocksByCode(blocks);
        }
      });
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

  goToScheduling() {
    if (this.eventForm.valid) {
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
      this.step = 2;
    }
  }

  saveBasicEvent() {
    if (this.eventForm.invalid) return;

    const formValue = this.eventForm.value;

    const eventDto = {
      title: formValue.title,
      description: formValue.description,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      location: formValue.location,
      organizer: formValue.organizer,
      directorId: formValue.selectedDirector?.id,
      lessonBlockIds: formValue.selectedBlocks.map((b: any) => b.id),
      timelineItems: []
    };

    this.loading = true;

    this.eventService.saveEvent(eventDto).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Evento Guardado',
          detail: 'El evento se ha creado correctamente sin cronograma.'
        });
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar el evento.'
        });
        this.loading = false;
      }
    });
  }

  handleBack(events: any[]) {
    this.savedTimeline = events;
    this.step = 1;
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
}
