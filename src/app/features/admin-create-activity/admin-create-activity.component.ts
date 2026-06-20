import {Component, inject, OnInit} from '@angular/core';
import {Button} from 'primeng/button';
import {Divider} from 'primeng/divider';
import {InputSwitch} from 'primeng/inputswitch';
import {Calendar} from 'primeng/calendar';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {DropdownModule} from 'primeng/dropdown';
import {ActivatedRoute, Router} from '@angular/router';
import {ActivityService} from '../../shared/services/activity.service';

@Component({
  selector: 'app-admin-create-activity',
  imports: [
    Button,
    Divider,
    InputSwitch,
    Calendar,
    ReactiveFormsModule,
    DropdownModule
  ],
  templateUrl: './admin-create-activity.component.html',
  styleUrl: './admin-create-activity.component.scss'
})
export class AdminCreateActivityComponent implements OnInit {

  protected readonly fb = inject(FormBuilder);
  protected readonly activityService = inject(ActivityService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);

  activityForm!: FormGroup;
  eventId!: number;

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('eventId'));
    this.initForm();

    this.activityForm.get('activityType')?.valueChanges.subscribe(type => {
      if (type !== 'SURVEY') {
        this.questions.clear();
      }
    });
  }

  initForm(): void {
    this.activityForm = this.fb.group({
      activityType: ['FORUM', Validators.required],
      evaluationMethod: ['AUTOMATIC_BY_PARTICIPATION', Validators.required],
      availableAt: ['', Validators.required],
      dueDate: ['', Validators.required],
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
        this.router.navigate(['/events', this.eventId]).then();
      },
      error: (err) => console.error('Error al crear la actividad', err)
    });
  }
}
