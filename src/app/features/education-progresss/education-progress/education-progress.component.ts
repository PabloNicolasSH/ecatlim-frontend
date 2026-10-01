import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {EducationStageService} from '../../../shared/services/education-stage.service';
import {EnrollmentService} from '../../../shared/services/enrollment.service';
import {MessageService, PrimeTemplate} from 'primeng/api';
import {EducationStageCard} from '../../../shared/models/education-stage.model';
import {Enrollment, Module} from '../../../shared/models/enrollment.model';
import {forkJoin} from 'rxjs';
import {Carousel} from 'primeng/carousel';
import {NgClass} from '@angular/common';
import {EducationStageStatusPipe} from '../../../shared/pipes/education-stage-status.pipe';
import {Button} from 'primeng/button';
import {DocumentUploaderComponent} from '../document-uploader/document-uploader.component';

@Component({
  selector: 'app-education-progress',
  imports: [
    Carousel,
    NgClass,
    EducationStageStatusPipe,
    PrimeTemplate,
    Button,
    DocumentUploaderComponent
  ],
  templateUrl: './education-progress.component.html',
  styleUrl: './education-progress.component.scss'
})
export class EducationProgressComponent implements OnInit {

  protected readonly educationStageService = inject(EducationStageService);
  protected readonly enrollmentService = inject(EnrollmentService);
  protected readonly messageService = inject(MessageService);

  stages = signal<EducationStageCard[]>([]);
  enrollments = signal<Enrollment[]>([]);

  selectedStage = signal<EducationStageCard | null>(null);

  expandedModuleCode = signal<string | null>(null);
  loading = signal<boolean>(false);

  responsiveOptions = [
    { breakpoint: '1400px', numVisible: 4, numScroll: 1 },
    { breakpoint: '1100px', numVisible: 3, numScroll: 1 },
    { breakpoint: '768px', numVisible: 2, numScroll: 1 },
    { breakpoint: '560px', numVisible: 1, numScroll: 1 }
  ];

  activeEnrollment = computed<Enrollment | null>(() => {
    const stage = this.selectedStage();
    if (!stage) return null;
    return this.enrollments().find(e => e.stageName.toLowerCase() === stage.name.toLowerCase()) || null;
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    forkJoin({
      stages: this.educationStageService.getEducationOffer(),
      enrollments: this.enrollmentService.getUserProgress()
    }).subscribe({
      next: ({ stages, enrollments }) => {
        this.stages.set(stages);
        this.enrollments.set(enrollments as unknown as Enrollment[]);

        if (stages.length > 0) {
          const firstEnabled = stages.find(s => s.isEnabled) || stages[0];
          this.selectedStage.set(firstEnabled);
        }
      },
      error: () => {
        this.stages.set([]);
        this.enrollments.set([]);
      }
    });
  }

  selectStage(stage: EducationStageCard): void {
    if (stage.isEnabled) {
      this.selectedStage.set(stage);
      this.expandedModuleCode.set(null);
    }
  }

  enrollInStage(): void {
    const id = this.selectedStage()?.id;
    this.loading.set(true);
    if (id != null) {
      this.enrollmentService.enrollInStage(id).subscribe({
        next: (enrolledStage) => {
          this.stages.update(currentStages =>
            currentStages.map(s => s.id === enrolledStage.id ? enrolledStage : s)
          );

          this.enrollmentService.getUserProgress().subscribe(enrollments => {
            this.enrollments.set(enrollments as unknown as Enrollment[]);
            this.selectedStage.set(enrolledStage);
          });

          this.loading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: '¡Inscripción exitosa!',
            detail: `Te has inscrito correctamente en la etapa ${enrolledStage.name}.`,
            life: 5000
          });
        },
        error: () => {
          this.loading.set(false);
        }
      });
    }
  }

  toggleModule(code: string): void {
    this.expandedModuleCode.set(this.expandedModuleCode() === code ? null : code);
  }

  getModuleStatus(module: Module): 'Superada' | 'En Curso' | 'Pendiente' {
    if (!module.blocks || module.blocks.length === 0) return 'Pendiente';

    const allCompleted = module.blocks.every(b => b.status === 'Superada');
    if (allCompleted) return 'Superada';

    const hasProgress = module.blocks.some(b => b.status === 'Superada' || b.status === 'En Curso');
    if (hasProgress) return 'En Curso';

    return 'Pendiente';
  }
}
