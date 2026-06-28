import {Component, inject, OnInit, signal} from '@angular/core';
import {Button} from 'primeng/button';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {ActivityService} from '../../shared/services/activity.service';

@Component({
  selector: 'app-user-activity-view',
  imports: [
    Button,
    ReactiveFormsModule
  ],
  templateUrl: './user-activity-view.component.html',
  styleUrl: './user-activity-view.component.scss'
})
export class UserActivityViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly activityService = inject(ActivityService);
  private readonly fb = inject(FormBuilder);

  eventId = signal<number>(0);
  activities = signal<any[]>([]);
  selectedActivity = signal<any | null>(null);
  forumPublications = signal<any[]>([]);

  currentStudentId = signal<number>(1);

  forumForm!: FormGroup;
  surveyForm!: FormGroup;
  selectedFile: File | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('eventId'));
    this.eventId.set(id);
    this.loadActivities();
    this.initForms();
  }

  initForms(): void {
    this.forumForm = this.fb.group({
      title: ['', Validators.required],
      body: ['', Validators.required]
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

    if (activity.activityType === 'FORUM' || activity.activityType === 'GLOSARY') {
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
    const answersArray = this.fb.array([]);
    if (questions) {
      questions.forEach(q => {
        answersArray.push(this.fb.group({
          questionId: [q.id],
          responseType: [q.responseType],
          textValue: [''],
          numValue: [null]
        }));
      });
    }
    this.surveyForm.setControl('answers', answersArray);
  }

  onForumSubmit(): void {
    if (this.forumForm.invalid) return;
    this.activityService.publishInForum(this.selectedActivity().id, this.currentStudentId(), this.forumForm.value).subscribe({
      next: () => {
        this.loadForumPublications(this.selectedActivity().id);
        this.forumForm.reset();
        this.loadActivities();
      }
    });
  }

  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onFileUploadSubmit(): void {
    if (!this.selectedFile) return;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('comment', 'Entrega realizada por el alumno');

    this.activityService.uploadSubmissionFile(this.selectedActivity().id, this.currentStudentId(), formData).subscribe({
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
    const rawAnswers = this.surveyForm.value.answers;
    this.activityService.submitSurvey(this.selectedActivity().id, this.currentStudentId(), rawAnswers).subscribe({
      next: () => {
        this.loadActivities();
        this.selectedActivity.set(null);
      }
    });
  }
}
