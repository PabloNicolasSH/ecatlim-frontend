import {Component, inject, OnInit, ViewChild} from '@angular/core';
import {Button} from 'primeng/button';
import {MessageService} from 'primeng/api';
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {FloatLabel} from 'primeng/floatlabel';
import {InputText} from 'primeng/inputtext';
import {Checkbox} from 'primeng/checkbox';
import {Select} from 'primeng/select';
import {EducationStage} from '../../shared/models/education-stage.model';
import {EducationStageService} from '../../shared/services/education-stage.service';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {forkJoin, Observable} from 'rxjs';
import {ModuleService} from '../../shared/services/module.service';
import {ModuleModel} from '../../shared/models/module.model';
import {LessonBlockService} from '../../shared/services/lesson-block.service';
import {LessonBlock} from '../../shared/models/lesson-block.model';
import {Dialog} from "primeng/dialog";
import {ScrollPanel} from "primeng/scrollpanel";
import {HoursMetreComponent} from "../../shared/components/hours-metre/hours-metre.component";
import {map, switchMap} from 'rxjs';
import {FieldErrorComponent} from '../../shared/components/field-error/field-error.component';
import {FormUtils} from '../../shared/form-utils';
import {MAX_LONG_TEXT, MAX_TEXT, notBlankValidator} from '../../shared/validation/validation-patterns';

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
    HoursMetreComponent,
    FieldErrorComponent
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
  protected readonly route = inject(ActivatedRoute);

  activeTab: string = "0";
  editingStageId: number | null = null;
  private initialSelectionDone = false;
  previousStageOptions: EducationStage[] = [];

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

  moduleOnlineHours: number = 0;
  moduleContactHours: number = 0;

  ngOnInit(): void {
    this.moduleTypes = ["Teórico", "Práctico"]
    this.load();
    this.initializeForms();
  }

  private load() {
    this.educationStageService.getEducationStages().pipe(
      switchMap(stages => {
        this.educationStages = stages;
        this.previousStageOptions = stages.filter(s => s.id !== this.editingStageId);

        return this.moduleService.getAll();
      }),
      map(modules => {
        this.modulesList = modules;
        return this.createGroupedModulesList(this.educationStages, modules);
      })
    ).subscribe({
      next: (groupedList) => {
        this.groupedModulesList = groupedList;
        this.preselectStageFromQuery();
        this.refreshSelectedStage();
      }
    });
  }

  private refreshSelectedStage(): void {
    const control = this.modulesForm.get("selectedEducationStage");
    const fresh = this.educationStages.find(s => s.id === control?.value?.id);
    if (fresh && fresh !== control?.value) {
      control?.setValue(fresh, {emitEvent: false});
      this.updateStageHours(fresh);
      if (this.modulesForm.pristine) {
        this.fillModules(fresh);
      }
    }
  }

  private preselectStageFromQuery(): void {
    if (this.initialSelectionDone) return;
    this.initialSelectionDone = true;

    const stageId = Number(this.route.snapshot.queryParamMap.get("etapa"));
    const stage = stageId ? this.educationStages.find(s => s.id === stageId) : null;
    if (!stage) return;

    this.editingStageId = stage.id!;
    this.previousStageOptions = this.educationStages.filter(s => s.id !== stage.id);
    this.educationStageForm.patchValue({
      name: stage.name,
      code: stage.code,
      onlineHours: stage.onlineHours,
      contactHours: stage.contactHours,
      practicalHours: stage.practicalHours,
      previousStageRequired: !!stage.previousStageRequired,
      preEducationStage: this.educationStages.find(s => s.id === stage.previousStageId) ?? "",
      description: stage.description
    });
    this.modulesForm.get("selectedEducationStage")?.setValue(stage);
  }


  private createGroupedModulesList(stages: any[], modules: any[]) {
    return stages.map(stage => {
      const modulesInStage = modules.filter(m => m.educationStage === stage.id);
      return {
        label: stage.name,
        value: stage.name,
        items: modulesInStage
      };
    }).filter(group => group.items.length > 0);
  }

  private initializeForms() {
    this.initializeEducationStageForm();
    this.initializeModulesForm();
    this.initializeLessonBlockForm();
  }

  private initializeEducationStageForm() {
    this.educationStageForm = this.formBuilder.group({
      name: ["", [Validators.required, notBlankValidator, Validators.maxLength(MAX_TEXT)]],
      code: ["", [Validators.required, notBlankValidator, Validators.maxLength(MAX_TEXT)]],
      onlineHours: [0, [Validators.required, Validators.min(0), Validators.max(10000)]],
      contactHours: [0, [Validators.required, Validators.min(0), Validators.max(10000)]],
      practicalHours: [0, [Validators.required, Validators.min(0), Validators.max(10000)]],
      previousStageRequired: [false],
      preEducationStage: [""],
      description: ["", [Validators.required, notBlankValidator, Validators.maxLength(MAX_LONG_TEXT)]],
    })
  }

  onSubmitEducationStage() {
    FormUtils.markAllAsDirtyAndTouched(this.educationStageForm);
    if (this.educationStageForm.valid && !this.loading){
      this.loading = true;
      const educationStageForm: EducationStage = {...this.educationStageForm.value};
      educationStageForm.previousStageId = this.educationStageForm.get("preEducationStage")?.value?.id;
      const request$ = this.editingStageId !== null
        ? this.educationStageService.updateEducationStage(this.editingStageId, educationStageForm)
        : this.educationStageService.createEducationStage(educationStageForm);
      const editing = this.editingStageId !== null;
      const lowered = editing ? this.loweredStageHours(educationStageForm) : [];
      request$.subscribe({
        next: () => {
          this.loading = false;
          this.messageService.add({
            severity: "success",
            summary: editing ? "Actualizada con éxito" : "Creado con éxito",
            detail: editing
              ? "Se han guardado los cambios de la etapa formativa"
              : "Se ha creado exitosamente la nueva etapa formativa"
          });
          if (lowered.length > 0) {
            this.messageService.add({
              severity: "warn",
              summary: "Revisa los módulos de la etapa",
              detail: `Has bajado las horas (${lowered.join(", ")}) por debajo de las ya asignadas a los módulos. Revisa los módulos de la etapa para ajustarlos.`,
              life: 12000
            });
          }
          this.load();
          if (!editing) {
            this.initializeEducationStageForm();
          }
        },
        error: () => this.loading = false
      });
    }
  }

  private loweredStageHours(form: EducationStage): string[] {
    const stage = this.educationStages.find(s => s.id === this.editingStageId);
    if (!stage) return [];

    const lowered: string[] = [];
    if (+form.onlineHours < (stage.allocatedOnlineHours ?? 0)) lowered.push(`online ${form.onlineHours}/${stage.allocatedOnlineHours}`);
    if (+form.contactHours < (stage.allocatedContactHours ?? 0)) lowered.push(`presenciales ${form.contactHours}/${stage.allocatedContactHours}`);
    if (+form.practicalHours < (stage.allocatedPracticalHours ?? 0)) lowered.push(`prácticas ${form.practicalHours}/${stage.allocatedPracticalHours}`);
    return lowered;
  }

  private initializeModulesForm() {
    this.modulesForm = this.formBuilder.group({
      selectedEducationStage: ['', Validators.required],
      modules: this.formBuilder.array([this.createModuleGroup()])
    })

    this.modulesForm.get('selectedEducationStage')?.valueChanges.subscribe(stage => {
      if (stage) {
        this.updateStageHours(stage);
        this.fillModules(stage);
      }
    });
  }

  private updateStageHours(stage: EducationStage): void {
    this.educationStageOnlineHours = stage.onlineHours ?? 0;
    this.educationStageContactHours = stage.contactHours ?? 0;
    this.educationStagePracticalHours = stage.practicalHours ?? 0;
  }

  private fillModules(stage: EducationStage): void {
    const existing = this.modulesList
      .filter(m => m.educationStage === stage.id)
      .sort((a, b) => (a.moduleId ?? 0) - (b.moduleId ?? 0));

    this.modules.clear();
    (existing.length > 0 ? existing : [undefined]).forEach(module => this.modules.push(this.createModuleGroup(module)));
    this.modulesForm.markAsPristine();
  }

  private createModuleGroup(module?: ModuleModel): FormGroup {
    return this.formBuilder.group({
      id: [module?.id ?? null],
      name: [module?.name ?? '', [Validators.required, notBlankValidator, Validators.maxLength(MAX_TEXT)]],
      number: [module?.moduleId ?? '', [Validators.required, Validators.min(1)]],
      description: [module?.description ?? '', Validators.maxLength(MAX_LONG_TEXT)],
      type: [module ? this.moduleTypeLabel(module.type) : '', Validators.required],
      onlineHours: [module?.onlineHours ?? 0, [Validators.required, Validators.min(0), Validators.max(10000)]],
      contactHours: [module?.contactHours ?? 0, [Validators.required, Validators.min(0), Validators.max(10000)]]
    });
  }

  private moduleTypeLabel(type: string): string {
    return type === 'THEORETICAL' ? 'Teórico' : type === 'PRACTICAL' ? 'Práctico' : type;
  }

  calculateEducationStageAllocatedHours() {
    let online = 0;
    let contact = 0;
    let practical = 0;

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
      const stage: EducationStage = this.modulesForm.get('selectedEducationStage')!.value;

      const toModule = (mod: any): ModuleModel => ({
        ...mod,
        moduleId: Number(mod.number),
        educationStage: stage.id!
      });

      const requests: Observable<unknown>[] = [];
      const modulesToUpdate = this.modules.controls.filter(c => c.value.id && c.dirty).map(c => toModule(c.value));
      const modulesToCreate = this.modules.controls.filter(c => !c.value.id).map(c => toModule(c.value));

      const modulesToReview = modulesToUpdate.filter(mod => {
        const saved = this.modulesList.find(m => m.id === mod.id);
        return !!saved && (+mod.onlineHours < (saved.allocatedOnlineHours ?? 0) || +mod.contactHours < (saved.allocatedContactHours ?? 0));
      });

      modulesToUpdate.forEach(mod => requests.push(this.moduleService.updateModule(mod.id!, mod)));
      if (modulesToCreate.length > 0) {
        requests.push(this.moduleService.createModules(modulesToCreate));
      }

      if (requests.length === 0) {
        this.loading = false;
        return;
      }

      forkJoin(requests).subscribe({
        next: () => {
          this.messageService.add({
            severity: "success",
            summary: "Módulos guardados con éxito",
            detail: "Se han guardado los módulos de la etapa formativa " + stage.name
          });
          if (modulesToReview.length > 0) {
            this.messageService.add({
              severity: "warn",
              summary: "Revisa los bloques formativos",
              detail: `Has bajado las horas por debajo de las ya asignadas a sus bloques en: ${modulesToReview.map(m => m.name).join(", ")}. Revisa los bloques de esos módulos para ajustarlos.`,
              life: 12000
            });
          }
          this.initializeModulesForm();
          this.load();
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else {
      this.modulesForm.markAllAsTouched();
    }
  }

  private initializeLessonBlockForm() {
    this.lessonBlockForm = this.formBuilder.group({
      selectedModule: ['', Validators.required],
      lessonBlocks: this.formBuilder.array([this.createLessonBlockGroup()])
    });

    this.lessonBlockForm.get('selectedModule')?.valueChanges.subscribe((module: ModuleModel) => {
      if (module) {
        this.moduleOnlineHours = module.onlineHours ?? 0;
        this.moduleContactHours = module.contactHours ?? 0;
        this.fillLessonBlocks(module);
      }
    });
  }

  private fillLessonBlocks(module: ModuleModel): void {
    const existing = [...(module.lessonBlocks ?? [])].sort((a, b) => a.lessonBlockId - b.lessonBlockId);

    this.lessonBlocks.clear();
    (existing.length > 0 ? existing : [undefined]).forEach(lb => this.lessonBlocks.push(this.createLessonBlockGroup(lb)));
    this.lessonBlockForm.markAsPristine();
  }

  private createLessonBlockGroup(lessonBlock?: LessonBlock): FormGroup {
    return this.formBuilder.group({
      id: [lessonBlock?.id ?? null],
      name: [lessonBlock?.name ?? '', [Validators.required, notBlankValidator, Validators.maxLength(MAX_TEXT)]],
      description: [lessonBlock?.description ?? '', Validators.maxLength(MAX_LONG_TEXT)],
      lessonBlockId: [lessonBlock?.lessonBlockId ?? '', [Validators.required, Validators.min(1)]],
      onlineHours: [lessonBlock?.onlineHours ?? 0, [Validators.required, Validators.min(0), Validators.max(10000)]],
      contactHours: [lessonBlock?.contactHours ?? 0, [Validators.required, Validators.min(0), Validators.max(10000)]],
      recognizable: [lessonBlock?.recognizable ?? false]
    });
  }

  calculateModuleAllocatedHours() {
    let online = 0;
    let contact = 0;
    let practical = 0;

    this.lessonBlocks.controls.forEach(control => {
      const onlineHours = +control.get('onlineHours')?.value || 0;
      const contactHours = +control.get('contactHours')?.value || 0;

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

      const toLessonBlock = (lessonBlock: any): LessonBlock => ({...lessonBlock, moduleId});

      const requests: Observable<unknown>[] = [];
      const toUpdate = this.lessonBlocks.controls.filter(c => c.value.id && c.dirty).map(c => toLessonBlock(c.value));
      const toCreate = this.lessonBlocks.controls.filter(c => !c.value.id).map(c => toLessonBlock(c.value));

      toUpdate.forEach(lb => requests.push(this.lessonBlockService.updateLessonBlock(lb.id!, lb)));
      if (toCreate.length > 0) {
        requests.push(this.lessonBlockService.createLessonBlocks(toCreate));
      }

      if (requests.length === 0) {
        this.loading = false;
        return;
      }

      forkJoin(requests).subscribe({
        next: () => {
          this.messageService.add({
            severity: "success",
            summary: "Bloques formativos guardados con éxito",
            detail: "Se han guardado los bloques formativos del módulo"
          });
          this.initializeLessonBlockForm();
          this.load();
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else {
      this.lessonBlockForm.markAllAsTouched();
    }
  }

  showDialog() {
    this.visible = true;
  }
}
