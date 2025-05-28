import {Component, inject, OnInit} from '@angular/core';
import {Button} from 'primeng/button';
import {MenuItem, MessageService} from 'primeng/api';
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {FloatLabel} from 'primeng/floatlabel';
import {InputText} from 'primeng/inputtext';
import {Checkbox} from 'primeng/checkbox';
import {Select} from 'primeng/select';
import {EducationStage} from '../../shared/models/education-stage.model';
import {EducationStageService} from '../../shared/services/education-stage.service';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {RouterLink} from '@angular/router';
import {ModuleService} from '../../shared/services/module.service';
import {ModuleModel} from '../../shared/models/module.model';

@Component({
  selector: 'app-admin-create-education-stage',
  imports: [
    Button,
    ReactiveFormsModule,
    FloatLabel,
    InputText,
    Checkbox,
    Select,
    FormsModule,
    TabList,
    Tabs,
    Tab,
    TabPanels,
    TabPanel,
    RouterLink
  ],
  templateUrl: './admin-create-education-stage.component.html',
  styleUrl: './admin-create-education-stage.component.scss'
})
export class AdminCreateEducationStageComponent implements OnInit{

  protected readonly formBuilder = inject(FormBuilder);
  protected readonly educationStageService = inject(EducationStageService);
  protected readonly moduleService = inject(ModuleService);
  protected readonly messageService = inject(MessageService);

  educationStageForm!: FormGroup;
  protected loading: boolean = false;

  modulesForm!: FormGroup;
  modulesList: ModuleModel[] = [];
  groupedModulesList: any[] = [];

  lessonBlockForm!: FormGroup;

  educationStages: EducationStage[] = [];
  moduleTypes: string[] = [];

  ngOnInit(): void {
    this.moduleTypes = ["Teórico", "Práctico"]
    this.initializeForms();
    this.loadEducationStages();
    this.loadModules();
  }

  private initializeForms() {
    this.initializeEducationStageForm();
    this.initializeModulesForm();
    this.initializeLessonBlockForm();
  }

  private initializeEducationStageForm() {
    this.educationStageForm = this.formBuilder.group({
      name: ["", Validators.required],
      code: ["", Validators.required],
      previousStageRequired: [false],
      preEducationStage: [""],
      description: ["", Validators.required],
    })
  }

  onSubmitEducationStage() {
    this.educationStageForm.markAsDirty();
    if (this.educationStageForm.valid && !this.loading){
      this.loading = true;
      const educationStageForm: EducationStage = {...this.educationStageForm.value};
      educationStageForm.previousStageId = this.educationStageForm.get("preEducationStage")?.value?.id;
      this.educationStageService.createEducationStage(educationStageForm).subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: "success",
            summary: "Creado con éxito",
            detail: "Se ha creado exitosamente la nueva etapa formativa"
          });
          this.loadEducationStages();
          this.initializeEducationStageForm();
        },
        error: error => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: error.message
          });
        }
      });
    }
  }

  private loadEducationStages() {
    this.educationStageService.getEducationStages().subscribe({
      next: educationStages => {
        this.educationStages = educationStages;
      }
    });
  }

  private initializeModulesForm() {
    this.modulesForm = this.formBuilder.group({
      selectedEducationStage: ['', Validators.required],
      modules: this.formBuilder.array([this.createModuleGroup()])
    })
  }

  private createModuleGroup(): FormGroup {
    return this.formBuilder.group({
      name: ['', Validators.required],
      description: [''],
      type: ['', Validators.required],
      onlineHours: [0, [Validators.required, Validators.min(0)]],
      contactHours: [0, [Validators.required, Validators.min(0)]]
    });
  }

  get modules(): FormArray {
    return this.modulesForm.get('modules') as FormArray;
  }

  addModule(): void {
    this.modules.push(this.createModuleGroup());
  }

  removeModule(index: number): void {
    this.modules.removeAt(index);
  }

  onSubmitModules(): void {
    if (this.modulesForm.valid && !this.loading) {
      this.loading = true;
      const educationStage = this.modulesForm.get('selectedEducationStage')!.value.id;
      const modulesRaw = this.modulesForm.get('modules')!.value;

      const modulesToSend: ModuleModel[] = modulesRaw.map((mod: any) => ({
        ...mod,
        educationStage
      }));

      this.moduleService.createModules(modulesToSend).subscribe({
        next: () => {
          this.messageService.add({
            severity: "success",
            summary: "Creado módulos con éxito",
            detail: "Se han creado exitosamente los nuevos módulos del bloque formativo " + educationStage.name
          });
          this.initializeModulesForm();
          this.loadModules();
          this.loading = false;
        },
        error: err => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: err.message
          });
          this.loading = false;
        }
      });
    } else {
      this.modulesForm.markAllAsTouched();
    }
  }

  private loadModules(){
    this.moduleService.getAll().subscribe({
      next: modules => {
        this.modulesList = modules;
        this.createGroupedModulesList();
      }
    });
  }

  private createGroupedModulesList() {
    this.groupedModulesList = this.educationStages.map(stage => {
      const modulesInStage = this.modulesList.filter(m => m.educationStage === stage.id);
      return {
        label: stage.name,
        value: stage.name,
        items: modulesInStage
      };
    }).filter(group => group.items.length > 0);
  }

  private initializeLessonBlockForm() {
    this.lessonBlockForm = this.formBuilder.group({
      selectedModule: ['', Validators.required],
      lessonBlocks: this.formBuilder.array([this.createLessonBlockGroup()])
    })
  }

  private createLessonBlockGroup(): FormGroup {
    return this.formBuilder.group({
      name: ['', Validators.required],
      description: [''],
      lessonBlockId: ['', Validators.required],
      onlineHours: [0, [Validators.required, Validators.min(0)]],
      contactHours: [0, [Validators.required, Validators.min(0)]],
      recognizable: [false]
    });
  }

  get lessonBlocks(): FormArray {
    return this.modulesForm.get('modules') as FormArray;
  }

  addLessonBlock(): void {
    this.modules.push(this.createModuleGroup());
  }

  removeLessonBlock(index: number): void {
    this.modules.removeAt(index);
  }

  onSubmitLessonBlocks(): void {
    if (this.modulesForm.valid && !this.loading) {
      this.loading = true;
      const module = this.modulesForm.get('selectedModule')!.value.id;
      const modulesRaw = this.modulesForm.get('modules')!.value;

      const modulesToSend: ModuleModel[] = modulesRaw.map((mod: any) => ({
        ...mod,
        module
      }));

      this.moduleService.createModules(modulesToSend).subscribe({
        next: () => {
          this.messageService.add({
            severity: "success",
            summary: "Creado módulos con éxito",
            detail: "Se han creado exitosamente los nuevos módulos del bloque formativo " + module.name
          });
          this.initializeModulesForm();
          this.loading = false;
        },
        error: err => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: err.message
          });
          this.loading = false;
        }
      });
    } else {
      this.modulesForm.markAllAsTouched();
    }
  }
}
