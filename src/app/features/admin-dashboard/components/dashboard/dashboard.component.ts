import {Component, inject, OnInit, signal} from '@angular/core';
import {TableModule} from 'primeng/table';
import {DatePipe, DecimalPipe, TitleCasePipe} from '@angular/common';
import {DashboardData} from '../../dashboard-data.model';
import {DashboardService} from '../../dashboard.service';
import {Button} from 'primeng/button';
import {Router, RouterLink} from '@angular/router';
import {RecognitionInboxComponent} from '../recognition-inbox/recognition-inbox.component';
import {UserModalAddEditComponent} from '../../../user-modal-add-edit/user-modal-add-edit.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    TableModule,
    DecimalPipe,
    Button,
    DatePipe,
    TitleCasePipe,
    RouterLink,
    UserModalAddEditComponent,
    RecognitionInboxComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  protected readonly dashboardService = inject(DashboardService);
  protected readonly router = inject(Router);

  studentModalVisible = false;

  dashboard = signal<DashboardData | null>(null);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.reloadDashboardData();
  }

  protected generateReport() {

  }

  protected createEvent() {
    this.router.navigateByUrl("/app/eventos-formativos/crear-evento");
  }

  protected addStudent() {
    this.studentModalVisible = true;
  }

  protected reloadDashboardData() {
    this.loading.set(true);
    this.dashboardService.getDashboardData().subscribe({
      next: data => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.dashboard.set(null);
        this.loading.set(false);
      }
    });
  }
}
