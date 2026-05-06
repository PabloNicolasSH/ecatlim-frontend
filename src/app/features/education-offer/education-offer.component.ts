import {Component, inject, OnInit} from '@angular/core';
import {Card} from 'primeng/card';
import {Button} from 'primeng/button';
import {RouterLink} from '@angular/router';
import {EducationStageService} from '../../shared/services/education-stage.service';
import {EducationStage, EducationStageCard} from '../../shared/models/education-stage.model';
import {Tag} from 'primeng/tag';
import {NgClass} from '@angular/common';
import {EducationStageStatusPipe} from '../../shared/pipes/education-stage-status.pipe';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-education-offer',
  imports: [
    Card,
    Button,
    RouterLink,
    Tag,
    NgClass,
    EducationStageStatusPipe
  ],
  templateUrl: './education-offer.component.html',
  styleUrl: './education-offer.component.scss'
})
export class EducationOfferComponent implements OnInit{

  stages: EducationStageCard[] = [];
  loading: boolean = false;

  protected readonly educationStageService = inject(EducationStageService);
  protected readonly messageService = inject(MessageService);

  ngOnInit(): void {
    this.educationStageService.getEducationOffer()
      .subscribe({
        next: educationStagesOffered => {
          this.stages = educationStagesOffered;
        }
      })
  }

  getSeverity(status: string) {
    const severities = {
      COMPLETED: 'success',
      IN_PROGRESS: 'info',
      ENROLLED: 'warn',
      LOCKED: 'secondary',
      DROPPED: 'danger'
    } as const;

    return severities[status as keyof typeof severities] || 'secondary';
  }

  getIcon(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'pi pi-check-circle';
      case 'IN_PROGRESS': return 'pi pi-spin pi-spinner';
      case 'LOCKED': return 'pi pi-lock';
      default: return 'pi pi-tag';
    }
  }

  enrollInStage(id: number) {
    this.loading = true;
    this.educationStageService.enrollInStage(id)
      .subscribe({
        next: (enrolledStage) => {
          this.stages = this.stages.map(stage =>
            stage.id === enrolledStage.id ? enrolledStage : stage
          );

          this.loading = false;

          this.messageService.add({
            severity: "success",
            summary: "¡Inscripción de etapa exitosa!",
            detail: "Te has inscrito correctamente en la etapa " + enrolledStage.name + ".",
            life: 5000
          })
        },
        error: () => {
          this.loading = false;
        }
      })
  }
}
