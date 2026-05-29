import {Component, inject, OnInit} from '@angular/core';
import {TableModule} from 'primeng/table';
import {AsyncPipe, DatePipe, DecimalPipe, TitleCasePipe} from '@angular/common';
import {DashboardService} from '../../dashboard.service';
import {Observable} from 'rxjs';
import {DashboardData} from '../../dashboard-data.model';
import {Button} from 'primeng/button';

@Component({
  selector: 'app-dashboard',
  imports: [
    TableModule,
    DecimalPipe,
    AsyncPipe,
    Button,
    DatePipe,
    TitleCasePipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  protected readonly dashboardService = inject(DashboardService);

  dashboardData$: Observable<DashboardData> | undefined;

  ngOnInit(): void {
    this.dashboardData$ = this.dashboardService.getDashboardData();
  }

  protected generateReport() {

  }

  protected createEvent() {

  }

  protected addStudent() {

  }

  protected reloadDashboardData() {
    this.dashboardData$ = this.dashboardService.getDashboardData();
  }
}
