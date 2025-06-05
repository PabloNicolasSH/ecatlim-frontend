import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {EducationStageService} from '../../shared/services/education/education-stage.service';
import {EducationStage} from '../../shared/models/education-stage.model';
import {DecimalPipe} from '@angular/common';
import {Button} from 'primeng/button';
import {ModuleTypePipe} from '../../shared/pipes/module-type.pipe';
import {Fieldset} from 'primeng/fieldset';
import {ScrollPanel} from 'primeng/scrollpanel';
import {Accordion, AccordionContent, AccordionHeader, AccordionPanel} from 'primeng/accordion';

@Component({
  selector: 'app-education-stage-detail',
  imports: [
    DecimalPipe,
    ModuleTypePipe,
    Button,
    Fieldset,
    ScrollPanel,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent
  ],
  templateUrl: './education-stage-detail.component.html',
  standalone: true,
  styleUrl: './education-stage-detail.component.scss'
})
export class EducationStageDetailComponent implements OnInit{

  protected readonly route = inject(ActivatedRoute);
  protected readonly educationStageService = inject(EducationStageService);

  id: number | null = null;
  stage!: EducationStage;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = Number(idParam);
    this.educationStageService.getEducationStageWithModulesAndLessonBlocks(this.id).subscribe(
      {
        next: educationStage => {
          this.stage = educationStage;
        }
      }
    );
  }

  hasModule(stage: any) {
    return Array.isArray(stage?.modules) && stage.modules.length > 0;
  }

  hasLessonBlock(module: any){
    return Array.isArray(module?.lessonBlocks) && module.lessonBlocks.length > 0;
  }

  getPreviousStageCode(previousStageId: number | undefined) {
    return "";
  }
}
