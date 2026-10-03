import {Component, computed, inject, OnInit, signal, ViewChild} from '@angular/core';
import {LearningResource, LRTag} from '../../shared/models/learning-resource.model';
import {ResourceService} from '../../shared/services/resource.service';
import {DataView} from 'primeng/dataview';
import {Tag} from 'primeng/tag';
import {Button} from 'primeng/button';
import {MessageService, PrimeTemplate} from 'primeng/api';
import {Card} from 'primeng/card';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {FileUpload} from 'primeng/fileupload';
import {Select} from 'primeng/select';
import {Textarea} from 'primeng/textarea';
import {InputText} from 'primeng/inputtext';
import {Dialog} from 'primeng/dialog';
import {TagService} from '../../shared/services/tag.service';
import {MultiSelect} from 'primeng/multiselect';
import {Role} from '../../shared/models/role.model';
import {LoggedUserDataService} from '../../core/auth/logged-user-data-service';
import {FieldErrorComponent} from '../../shared/components/field-error/field-error.component';
import {MAX_TEXT, MAX_UPLOAD_MB, notBlankValidator, urlValidator} from '../../shared/validation/validation-patterns';
import {FormUtils} from '../../shared/form-utils';

const ROLES_ALLOWED_TO_ADD_RESOURCES: Role[] = [
  Role.MANAGEMENT,
  Role.EVENT_DIRECTOR,
  Role.TRAINER,
  Role.ADMIN
];

@Component({
  selector: 'app-resource-library',
  imports: [
    DataView,
    Tag,
    Button,
    PrimeTemplate,
    Card,
    FileUpload,
    Select,
    ReactiveFormsModule,
    Textarea,
    InputText,
    Dialog,
    MultiSelect,
    FieldErrorComponent
  ],
  templateUrl: './resource-library.component.html',
  styleUrl: './resource-library.component.scss'
})
export class ResourceLibraryComponent implements OnInit {

  @ViewChild('tagSelect') tagSelect!: MultiSelect;

  protected readonly resourceService = inject(ResourceService);
  protected readonly tagService = inject(TagService);
  protected readonly fb = inject(FormBuilder);
  protected readonly loggedUserDataService = inject(LoggedUserDataService);
  protected readonly messageService = inject(MessageService);

  categories = ['Todos', 'PDFs', 'Imágenes', 'Plantillas', 'Vídeos', 'Enlaces'];

  displayAddModal = signal<boolean>(false);
  resourceForm!: FormGroup;
  selectedFile: File | null = null;
  isSubmitting = signal<boolean>(false);

  currentSearch = signal<string>('');
  isCreatingTag = signal<boolean>(false);

  resourceTypes = [
    {label: 'Documento PDF', value: 'PDF'},
    {label: 'Imagen', value: 'IMAGE'},
    {label: 'Plantilla Editable', value: 'TEMPLATE'},
    {label: 'Enlace Web', value: 'LINK'},
    {label: 'Vídeo', value: 'VIDEO_LINK'}
  ];

  availableTags = signal<LRTag[]>([]);

  resources = signal<LearningResource[]>([]);
  activeCategory = signal<string>('Todos');

  canAddResources = signal<boolean>(false);

  filteredResources = computed(() => {
    const active = this.activeCategory();
    if (active === 'Todos') return this.resources();

    const typeMapping: Record<string, string> = {
      'PDFs': 'PDF',
      'Imágenes': 'IMAGE',
      'Plantillas': 'TEMPLATE',
      'Vídeos': 'VIDEO_LINK',
      'Enlaces': 'LINK'
    };

    return this.resources().filter(r => r.type === typeMapping[active]);
  });

  ngOnInit() {
    this.resourceService.getAll().subscribe(data => {
      this.resources.set(data);
    });
    this.tagService.getTags().subscribe(tags => {
      this.availableTags.set(tags);
    });
    this.canAddResources.set(this.loggedUserDataService.hasAnyRole(...ROLES_ALLOWED_TO_ADD_RESOURCES));
    this.initForm();
  }

  protected readonly maxUploadBytes = MAX_UPLOAD_MB * 1024 * 1024;

  initForm() {
    this.resourceForm = this.fb.group({
      name: ['', [Validators.required, notBlankValidator, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(MAX_TEXT)]],
      type: ['PDF', Validators.required],
      tagNames: [[]],
      blobPath: ['']
    });

    this.resourceForm.get('type')?.valueChanges.subscribe(type => {
      const blobPath = this.resourceForm.get('blobPath')!;
      blobPath.setValidators(this.isLinkType(type) ? [Validators.required, urlValidator, Validators.maxLength(MAX_TEXT)] : []);
      blobPath.updateValueAndValidity();
    });
  }

  private isLinkType(type: string): boolean {
    return type === 'LINK' || type === 'VIDEO_LINK';
  }

  onTagFilter(event: any) {
    this.currentSearch.set(event.filter);
  }

  openNewTagModal() {
    this.tagSelect.hide();
    const newName = prompt('Introduce el nombre de la nueva etiqueta:');

    if (newName && newName.trim().length > MAX_TEXT) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Etiqueta no válida',
        detail: `El nombre de la etiqueta no puede superar los ${MAX_TEXT} caracteres`
      });
      return;
    }
    if (newName && newName.trim() !== '') {
      this.createInlineTag(newName.trim());
    }
  }

  createInlineTag(name: string) {
    if (!name) return;

    this.isCreatingTag.set(true);

    this.tagService.createTag(name).subscribe({
      next: (newTag) => {
        this.availableTags.update(tags => [...tags, newTag]);

        const currentSelected = this.resourceForm.get('tagNames')?.value || [];
        this.resourceForm.patchValue({tagNames: [...currentSelected, newTag.name]});

        this.isCreatingTag.set(false);
        this.currentSearch.set('');
        this.tagSelect.resetFilter();
      },
      error: () => this.isCreatingTag.set(false)
    });
  }

  getIconForType(type: string): string {
    const icons: Record<string, string> = {
      'PDF': 'pi pi-file-pdf',
      'IMAGE': 'pi pi-image',
      'TEMPLATE': 'pi pi-file-edit',
      'VIDEO_LINK': 'pi pi-video',
      'LINK': 'pi pi-link'
    };
    return icons[type] || 'pi pi-file';
  }

  getSeverityForType(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<string, any> = {
      'PDF': 'success',
      'IMAGE': 'info',
      'TEMPLATE': 'secondary',
      'VIDEO_LINK': 'danger',
      'LINK': 'warn'
    };
    return severities[type] || 'info';
  }

  viewResource(res: LearningResource) {
    if (res.type === 'LINK' || res.type === 'VIDEO_LINK') {
      window.open(res.blobPath, '_blank');
      return;
    }

    this.resourceService.download(res.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 10000);
    });
  }

  download(res: LearningResource) {
    this.resourceService.download(res.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

  openAddModal() {
    this.resourceForm.reset({type: 'PDF', tagNames: []});
    this.selectedFile = null;
    this.displayAddModal.set(true);
  }

  onFileSelect(event: any) {
    if (event.files && event.files.length > 0) {
      this.selectedFile = event.files[0];
    }
  }

  onSubmit() {
    FormUtils.markAllAsDirtyAndTouched(this.resourceForm);
    if (this.resourceForm.invalid) return;

    if (!this.isLinkType(this.resourceForm.value.type) && !this.selectedFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta el archivo',
        detail: 'Selecciona el archivo que quieres subir para este tipo de recurso'
      });
      return;
    }

    this.isSubmitting.set(true);

    const formData = new FormData();
    const formValue = this.resourceForm.value;

    const dto = {
      name: formValue.name,
      description: formValue.description,
      type: formValue.type,
      tagNames: formValue.tagNames,
      blobPath: formValue.blobPath
    };

    formData.append('data', new Blob([JSON.stringify(dto)], {type: 'application/json'}));

    const isLinkOrVideo = formValue.type === 'LINK' || formValue.type === 'VIDEO_LINK';

    if (!isLinkOrVideo && this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.resourceService.upload(formData).subscribe({
      next: (newResource) => {
        this.resources.update(current => [newResource, ...current]);
        this.displayAddModal.set(false);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Error subiendo recurso', err);
        this.isSubmitting.set(false);
      }
    });
  }
}
