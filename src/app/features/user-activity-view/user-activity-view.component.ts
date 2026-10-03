import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {Button} from 'primeng/button';
import {AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {DatePipe, NgClass} from '@angular/common';
import {Tooltip} from 'primeng/tooltip';
import {EventService} from '../../shared/services/event.service';
import {UserEventCalendar} from '../../shared/models/event.model';
import {UserAvatarComponent} from '../../shared/components/user-avatar/user-avatar.component';
import {ActivityService} from '../../shared/services/activity.service';
import {FloatLabel} from 'primeng/floatlabel';
import {Textarea} from 'primeng/textarea';
import {InputText} from 'primeng/inputtext';
import {FieldErrorComponent} from '../../shared/components/field-error/field-error.component';
import {MAX_RICH_TEXT, MAX_TEXT, MAX_UPLOAD_MB, notBlankValidator} from '../../shared/validation/validation-patterns';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-user-activity-view',
  imports: [
    Button,
    ReactiveFormsModule,
    FloatLabel,
    Textarea,
    InputText,
    RouterLink,
    DatePipe,
    NgClass,
    Tooltip,
    UserAvatarComponent,
    FieldErrorComponent
  ],
  templateUrl: './user-activity-view.component.html',
  styleUrl: './user-activity-view.component.scss'
})
export class UserActivityViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly activityService = inject(ActivityService);
  private readonly fb = inject(FormBuilder);
  private readonly eventService = inject(EventService);
  private readonly messageService = inject(MessageService);

  protected readonly maxUploadMb = MAX_UPLOAD_MB;

  eventId = signal<number>(0);
  activities = signal<any[]>([]);
  event = signal<UserEventCalendar | null>(null);
  selectedActivity = signal<any | null>(null);
  forumPublications = signal<any[]>([]);

  forumForm!: FormGroup;
  surveyForm!: FormGroup;
  selectedFile: File | null = null;

  readonly activityTypes: Record<string, { label: string; icon: string }> = {
    FORUM: {label: 'Foro', icon: 'pi-comments'},
    GLOSSARY: {label: 'Glosario', icon: 'pi-book'},
    SURVEY: {label: 'Encuesta', icon: 'pi-list-check'},
    FILE_UPLOAD: {label: 'Entrega de archivo', icon: 'pi-upload'}
  };

  sortedActivities = computed(() => {
    const now = Date.now();
    const due = (a: any) => new Date(a.dueDate).getTime();
    const open = this.activities().filter(a => due(a) >= now).sort((a, b) => due(a) - due(b));
    const closed = this.activities().filter(a => due(a) < now).sort((a, b) => due(b) - due(a));
    return [...open, ...closed];
  });

  pendingCount = computed(() =>
    this.activities().filter(a => a.progressStatus !== 'COMPLETED' && new Date(a.dueDate).getTime() >= Date.now()).length
  );

  nextClosing = computed(() => this.sortedActivities().find(a => new Date(a.dueDate).getTime() >= Date.now()) ?? null);

  phase(activity: any): 'PREVIA' | 'POST' | null {
    const event = this.event();
    if (!event) return null;
    return new Date(activity.dueDate).getTime() <= new Date(event.endDate).getTime() ? 'PREVIA' : 'POST';
  }

  isClosed(activity: any): boolean {
    return new Date(activity.dueDate).getTime() < Date.now();
  }

  closingInfo(activity: any): { text: string; tone: 'closed' | 'urgent' | 'soon' | 'ok' } {
    const diff = new Date(activity.dueDate).getTime() - Date.now();
    const abs = Math.abs(diff);
    const hours = Math.floor(abs / 3_600_000);
    const days = Math.floor(abs / 86_400_000);
    const span = days >= 1 ? `${days} ${days === 1 ? 'día' : 'días'}` : `${Math.max(hours, 1)} h`;

    if (diff < 0) return {text: `Cerró hace ${span}`, tone: 'closed'};
    if (diff < 86_400_000) return {text: `Cierra en ${span}`, tone: 'urgent'};
    if (diff < 3 * 86_400_000) return {text: `Cierra en ${span}`, tone: 'soon'};
    return {text: `Cierra en ${span}`, tone: 'ok'};
  }

  activityType(activity: any) {
    return this.activityTypes[activity.activityType] ?? {label: activity.activityType, icon: 'pi-file'};
  }

  fullName(person: { name?: string; surname?: string; email: string }): string {
    return [person.name, person.surname].filter(Boolean).join(' ') || person.email;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('eventId'));
    this.eventId.set(id);
    this.loadActivities();
    this.initForms();
    this.eventService.getUserEventsForCalendar().subscribe({
      next: events => this.event.set(events.find(e => Number(e.id) === id) ?? null)
    });
  }

  initForms(): void {
    this.forumForm = this.fb.group({
      title: ['', [Validators.required, notBlankValidator, Validators.maxLength(MAX_TEXT)]],
      body: ['', [Validators.required, notBlankValidator, Validators.maxLength(MAX_RICH_TEXT)]]
    });
    this.surveyForm = this.fb.group({
      answers: this.fb.array([])
    });
  }

  loadActivities(): void {
    this.activityService.getActivitiesByEvent(this.eventId()).subscribe({
      next: (data) => this.activities.set(data),
      error: (err) => console.error('Error cargando actividades', err)
    });
  }

  selectActivity(activity: any): void {
    this.selectedActivity.set(activity);
    this.selectedFile = null;

    if (activity.activityType === 'FORUM' || activity.activityType === 'GLOSSARY') {
      this.loadForumPublications(activity.id);
      this.forumForm.reset();
    } else if (activity.activityType === 'SURVEY') {
      this.buildSurveyForm(activity.questions);
    }
  }

  loadForumPublications(activityId: number): void {
    this.activityService.getForumPublications(activityId).subscribe({
      next: (data) => this.forumPublications.set(data)
    });
  }

  buildSurveyForm(questions: any[]): void {
    this.answers.clear();
    if (questions) {
      questions.forEach(q => {
        const numeric = q.responseType === 'VALUE';
        this.answers.push(this.fb.group({
          questionId: [q.id],
          responseType: [q.responseType],
          textValue: ['', numeric ? [] : [Validators.required, notBlankValidator, Validators.maxLength(MAX_TEXT)]],
          numValue: [null, numeric ? [Validators.required] : []]
        }));
      });
    }
  }

  get answers(): FormArray {
    return this.surveyForm.get('answers') as FormArray;
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  onForumSubmit(): void {
    if (this.forumForm.invalid) return;

    this.activityService.publishInForum(this.selectedActivity().id, this.forumForm.value).subscribe({
      next: () => {
        this.loadForumPublications(this.selectedActivity().id);
        this.forumForm.reset();
        this.loadActivities();
      }
    });
  }

  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      const file: File = event.target.files[0];
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        this.selectedFile = null;
        event.target.value = '';
        this.messageService.add({
          severity: 'warn',
          summary: 'Archivo demasiado grande',
          detail: `El tamaño máximo permitido es de ${MAX_UPLOAD_MB} MB`
        });
        return;
      }
      this.selectedFile = file;
    }
  }

  onFileUploadSubmit(): void {
    if (!this.selectedFile) return;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('comment', 'Entrega realizada por el alumno');

    this.activityService.uploadSubmissionFile(this.selectedActivity().id, formData).subscribe({
      next: () => {
        this.selectedFile = null;
        this.loadActivities();
        if (this.selectedActivity()) {
          this.selectedActivity.set({ ...this.selectedActivity(), progressStatus: 'COMPLETED' });
        }
      }
    });
  }

  onSurveySubmit(): void {
    if (this.surveyForm.invalid) {
      this.surveyForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Encuesta incompleta',
        detail: 'Responde a todas las preguntas antes de enviar'
      });
      return;
    }
    const answers = this.surveyForm.value.answers.map((answer: any) => ({
      id: answer.questionId,
      responseValue: answer.textValue || (answer.numValue != null ? String(answer.numValue) : '')
    }));
    this.activityService.submitSurvey(this.selectedActivity().id, answers).subscribe({
      next: () => {
        this.loadActivities();
        this.selectedActivity.set(null);
      }
    });
  }
}
