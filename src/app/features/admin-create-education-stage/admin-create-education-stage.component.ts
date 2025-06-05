import {Component, inject, OnInit, ViewChild} from '@angular/core';
import {Button} from 'primeng/button';
import {MenuItem, MessageService} from 'primeng/api';
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {FloatLabel} from 'primeng/floatlabel';
import {InputText} from 'primeng/inputtext';
import {Checkbox} from 'primeng/checkbox';
import {Select} from 'primeng/select';
import {EducationStage} from '../../shared/models/education-stage.model';
import {EducationStageService} from '../../shared/services/education/education-stage.service';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {RouterLink} from '@angular/router';
import {ModuleService} from '../../shared/services/education/module.service';
import {ModuleModel} from '../../shared/models/module.model';
import {LessonBlockService} from '../../shared/services/education/lesson-block.service';
import {LessonBlock} from '../../shared/models/lesson-block.model';
import {Dialog} from "primeng/dialog";
import {ScrollPanel} from "primeng/scrollpanel";
import {HoursMetreComponent} from "../../shared/components/hours-metre/hours-metre.component";

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
    RouterLink,
    Dialog,
    ScrollPanel,
    HoursMetreComponent
  ],
  templateUrl: './admin-create-education-stage.component.html',
  styleUrl: './admin-create-education-stage.component.scss'
})
export class AdminCreateEducationStageComponent implements OnInit{

  @ViewChild("moduleScrollPanel") moduleScrollPanel!: ScrollPanel;
  @ViewChild("lessonScrollPanel") lessonScrollPanel!: ScrollPanel;

  protected readonly formBuilder = inject(FormBuilder);
  protected readonly educationStageService = inject(EducationStageService);
  protected readonly moduleService = inject(ModuleService);
  protected readonly lessonBlockService = inject(LessonBlockService);
  protected readonly messageService = inject(MessageService);

  educationStageForm!: FormGroup;

  protected loading: boolean = false;
  visible: boolean = false;

  modulesForm!: FormGroup;
  modulesList: ModuleModel[] = [];
  groupedModulesList: any[] = [];

  lessonBlockForm!: FormGroup;

  educationStages: EducationStage[] = [];
  moduleTypes: string[] = [];

  educationStageOnlineHours: number = 0;
  educationStageContactHours: number = 0;
  educationStagePracticalHours: number = 0;
  educationStageAllocatedOnlineHours: number = 0;
  educationStageAllocatedContactHours: number = 0;
  educationStageAllocatedPracticalHours: number = 0;

  moduleOnlineHours: number = 0;
  moduleContactHours: number = 0;
  moduleAllocatedOnlineHours: number = 0;
  moduleAllocatedContactHours: number = 0;

  ngOnInit(): void {
    this.moduleTypes = ["Teórico", "Práctico"]
    this.load();
    this.initializeForms();
  }

  private load() {
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
      onlineHours: [0, [Validators.required, Validators.min(0)]],
      contactHours: [0, [Validators.required, Validators.min(0)]],
      practicalHours: [0, [Validators.required, Validators.min(0)]],
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

    this.modulesForm.get('selectedEducationStage')?.valueChanges.subscribe(stage => {
      if (stage) {
        this.educationStageOnlineHours = stage.onlineHours ?? 0;
        this.educationStageContactHours = stage.contactHours ?? 0;
        this.educationStagePracticalHours = stage.practicalHours ?? 0;

        this.educationStageAllocatedOnlineHours = stage.allocatedOnlineHours ?? 0;
        this.educationStageAllocatedContactHours = stage.allocatedContactHours ?? 0;
        this.educationStageAllocatedPracticalHours = stage.allocatedPracticalHours ?? 0;
      }
    });
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

  calculateEducationStageAllocatedHours() {
    let online = this.educationStageAllocatedOnlineHours || 0;
    let contact = this.educationStageAllocatedContactHours || 0;
    let practical = this.educationStageAllocatedPracticalHours || 0;

    this.modules.controls.forEach(control => {
      const type = control.get('type')?.value;
      const onlineHours = +control.get('onlineHours')?.value || 0;
      const contactHours = +control.get('contactHours')?.value || 0;

      if (type === 'Teórico') {
        online += onlineHours;
        contact += contactHours;
      } else if (type === 'Práctico') {
        practical += onlineHours + contactHours;
      }
    });

    return {
      online,
      contact,
      practical
    }
  }

  get modules(): FormArray {
    return this.modulesForm.get('modules') as FormArray;
  }

  addModule(): void {
    this.modules.push(this.createModuleGroup());
    setTimeout(() => {
      this.moduleScrollPanel.scrollTop(Number.MAX_VALUE);
    },
    20
    );

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
    });

    this.lessonBlockForm.get('selectedModule')?.valueChanges.subscribe(module => {
      if (module) {
        this.moduleOnlineHours = module.onlineHours ?? 0;
        this.moduleContactHours = module.contactHours ?? 0;

        this.moduleAllocatedOnlineHours = module.allocatedOnlineHours ?? 0;
        this.moduleAllocatedContactHours = module.allocatedContactHours ?? 0;
      }
    });
  }

  private createLessonBlockGroup(): FormGroup {
    return this.formBuilder.group({
      lbName: ['', Validators.required],
      lbDescription: [''],
      lessonBlockId: ['', Validators.required],
      lbOnlineHours: [0, [Validators.required, Validators.min(0)]],
      lbContactHours: [0, [Validators.required, Validators.min(0)]],
      recognizable: [false]
    });
  }

  calculateModuleAllocatedHours() {
    let online = this.moduleAllocatedOnlineHours || 0;
    let contact = this.moduleAllocatedContactHours || 0;
    let practical = 0;

    this.lessonBlocks.controls.forEach(control => {
      const onlineHours = +control.get('lbOnlineHours')?.value || 0;
      const contactHours = +control.get('lbContactHours')?.value || 0;

      online += onlineHours;
      contact += contactHours;
    });

    return {
      online,
      contact,
      practical
    }
  }

  get lessonBlocks(): FormArray {
    return this.lessonBlockForm.get('lessonBlocks') as FormArray;
  }

  addLessonBlock(): void {
    this.lessonBlocks.push(this.createLessonBlockGroup());
    setTimeout(() => {
        this.lessonScrollPanel.scrollTop(Number.MAX_VALUE);
      },
      20
    );
  }

  removeLessonBlock(index: number): void {
    this.lessonBlocks.removeAt(index);
  }

  onSubmitLessonBlocks(): void {
    if (this.lessonBlockForm.valid && !this.loading) {
      this.loading = true;
      const moduleId = this.lessonBlockForm.get('selectedModule')!.value.id;
      const lessonBlocks = this.lessonBlockForm.get('lessonBlocks')!.value;

      const lessonsToSend: LessonBlock[] = lessonBlocks.map((lessonBlock: any) => ({
        ...lessonBlock,
        moduleId
      }));

      this.lessonBlockService.createLessonBlocks(lessonsToSend).subscribe({
        next: () => {
          this.messageService.add({
            severity: "success",
            summary: "Creado bloques formativos con éxito",
            detail: "Se han creado exitosamente los nuevos bloques formativos del módulo"
          });
          this.initializeLessonBlockForm();
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

  showDialog() {
    this.visible = true;
  }
}
