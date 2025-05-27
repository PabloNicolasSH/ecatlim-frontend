import {Component, OnInit} from '@angular/core';
import {Button} from 'primeng/button';
import {Steps} from 'primeng/steps';
import {MenuItem} from 'primeng/api';
import {Step, StepList, StepPanel, StepPanels, Stepper} from 'primeng/stepper';

@Component({
  selector: 'app-admin-create-education-stage',
  imports: [
    Button,
    Steps,
    Stepper,
    StepList,
    Step,
    StepPanels,
    StepPanel
  ],
  templateUrl: './admin-create-education-stage.component.html',
  styleUrl: './admin-create-education-stage.component.scss'
})
export class AdminCreateEducationStageComponent implements OnInit{

  items: MenuItem[] | undefined;
  active: number = 0;

  ngOnInit(): void {
    this.items = [
      {label: "Definición de la Etapa"},
      {label: "Creación de Módulos"},
      {label: "Creación de Bloques Formativos"},
      {label: "Confirmar"}
    ]
  }
}
