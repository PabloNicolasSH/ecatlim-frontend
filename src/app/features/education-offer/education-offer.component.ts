import {Component, inject, OnInit} from '@angular/core';
import {Card} from 'primeng/card';
import {PrimeTemplate} from 'primeng/api';
import {Button} from 'primeng/button';
import {RouterLink} from '@angular/router';
import {EducationStageService} from '../../shared/services/education-stage.service';
import {EducationStage} from '../../shared/models/education-stage.model';

@Component({
  selector: 'app-education-offer',
  imports: [
    Card,
    PrimeTemplate,
    Button,
    RouterLink
  ],
  templateUrl: './education-offer.component.html',
  styleUrl: './education-offer.component.scss'
})
export class EducationOfferComponent implements OnInit{
  stages = [
    {id: 1, type: "Etapa Básica", description: "Lorem ipsum dolor alea iacta est, valeri mane", name: "Acogida al Scouter", isEnabled: true},
    {id: 2, type: "Etapa Intermedia", description: "Lorem ipsum dolor alea iacta est, valeri mane", name: "Educador Scout", isEnabled: false}
  ];

  courses = [
    { id: 1, name: 'Matemáticas', description: 'Curso básico de álgebra', isEnabled: true },
    { id: 2, name: 'Historia', description: 'Curso de historia moderna', isEnabled: true }
  ];

  protected readonly educationStageService = inject(EducationStageService);

  ngOnInit(): void {
    this.educationStageService.getEducationStages()
  }


  enrollInStage(id: number) {

  }
}
