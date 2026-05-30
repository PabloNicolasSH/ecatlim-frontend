import {Component, inject, OnInit} from '@angular/core';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {TableModule} from 'primeng/table';
import {Button} from 'primeng/button';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {EducationStageService} from '../../shared/services/education-stage.service';
import {EducationStage} from '../../shared/models/education-stage.model';

@Component({
  selector: 'app-admin-education-offer',
  imports: [
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    TableModule,
    Button,
    RouterLink
  ],
  templateUrl: './admin-education-offer.component.html',
  styleUrl: './admin-education-offer.component.scss'
})
export class AdminEducationOfferComponent implements OnInit{

  protected readonly educationStageService = inject(EducationStageService);
  protected readonly router = inject(Router);

  educationStages: EducationStage[] = [];

  ngOnInit(): void {
    this.educationStageService.getEducationStages().subscribe({
      next: educationStages => {
        this.educationStages = educationStages;
      }
    })
  }

  getEducationStageCode(previousStageId: number) {
    const previousStage = this.educationStages.find(e => e.id === previousStageId);
    return previousStage ? previousStage["code"] : null;
  }

  openEducationStage(event: any) {
    const educationStage = event.data;
    this.router.navigateByUrl("app/admin/oferta-educativa/detalle-etapa/" + educationStage.id);
  }

  protected readonly history = history;
}
