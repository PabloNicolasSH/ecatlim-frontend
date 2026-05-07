import {Component, computed, inject, signal} from '@angular/core';
import {EnrollmentService} from '../../shared/services/enrollment.service';
import {Enrollment} from '../../shared/models/enrollment.model';

@Component({
  selector: 'app-user-education-stages-progress',
  imports: [],
  templateUrl: './user-education-stages-progress.component.html',
  styleUrl: './user-education-stages-progress.component.scss'
})
export class UserEducationStagesProgressComponent {

  protected readonly enrollmentsService = inject(EnrollmentService);

  activeTabIndex = signal<number>(0);
  expandedBlockId = signal<string | null>(null);
  enrollments = signal<Enrollment[]>([]);

  activeEnrollment = computed(() => this.enrollments()[this.activeTabIndex()]);

  ngOnInit(): void {
    this.enrollmentsService.getUserProgress()
      .subscribe({
        next: enrollments => {
          this.enrollments.set(enrollments);
        },
        error: () => {
          this.enrollments.set([]);
        }
      })
  }

  toggleBlock(id: string) {
    this.expandedBlockId.set(this.expandedBlockId() === id ? null : id);
  }
}
