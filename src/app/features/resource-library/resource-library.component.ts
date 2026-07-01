import {Component, computed, inject, OnInit, signal, ViewChild} from '@angular/core';
import {LearningResource, LRTag} from '../../shared/models/learning-resource.model';
import {ResourceService} from '../../shared/services/resource.service';
import {DataView} from 'primeng/dataview';
import {Tag} from 'primeng/tag';
import {Button} from 'primeng/button';
import {PrimeTemplate} from 'primeng/api';
import {Card} from 'primeng/card';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {FileUpload} from 'primeng/fileupload';
import {Select} from 'primeng/select';
import {Textarea} from 'primeng/textarea';
import {InputText} from 'primeng/inputtext';
import {Dialog} from 'primeng/dialog';
import {TagService} from '../../shared/services/tag.service';
import {MultiSelect} from 'primeng/multiselect';

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
    MultiSelect
  ],
  templateUrl: './resource-library.component.html',
  styleUrl: './resource-library.component.scss'
})
export class ResourceLibraryComponent implements OnInit {

  @ViewChild('tagSelect') tagSelect!: MultiSelect;

  protected readonly resourceService = inject(ResourceService);
  protected readonly tagService = inject(TagService);
  protected readonly fb = inject(FormBuilder);

  categories = ['Todos', 'PDFs', 'Imágenes', 'Plantillas', 'Vídeos', 'Enlaces'];

  displayAddModal = signal<boolean>(false);
  resourceForm!: FormGroup;
  selectedFile: File | null = null;
  isSubmitting = signal<boolean>(false);

  currentSearch = signal<string>('');
  isCreatingTag = signal<boolean>(false);

  resourceTypes = [
    { label: 'Documento PDF', value: 'PDF' },
    { label: 'Imagen', value: 'IMAGE' },
    { label: 'Plantilla Editable', value: 'TEMPLATE' },
    { label: 'Enlace Web', value: 'LINK' },
    { label: 'Vídeo', value: 'VIDEO' }
  ];

  availableTags = signal<LRTag[]>([]);

  resources = signal<LearningResource[]>([]);
  activeCategory = signal<string>('Todos');

  filteredResources = computed(() => {
    const active = this.activeCategory();
    if (active === 'Todos') return this.resources();

    const typeMapping: Record<string, string> = {
      'PDFs': 'PDF',
      'Imágenes': 'IMAGE',
      'Plantillas': 'TEMPLATE',
      'Vídeos': 'VIDEO',
      'Enlaces': 'LINK'
    };

    return this.resources().filter(r => r.type === typeMapping[active]);
  });

  ngOnInit() {
    this.resourceService.getAll().subscribe(data => this.resources.set(data));
    this.tagService.getTags().subscribe(tags => {
      this.availableTags.set(tags);
    });
    this.initForm();
  }

  initForm() {
    this.resourceForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      type: ['PDF', Validators.required],
      tagNames: [[]]
    });
  }

  onTagFilter(event: any) {
    this.currentSearch.set(event.filter);
  }

  openNewTagModal() {
    this.tagSelect.hide();
    const newName = prompt('Introduce el nombre de la nueva etiqueta:');

    if (newName && newName.trim() !== '') {
      this.createInlineTag(newName.trim());
    }
  }

  createInlineTag(name: string) {
    if (!name) return;

    this.isCreatingTag.set(true);

    this.tagService.createTag(name).subscribe({
      next: (newTag) => {
        console.log("Holaaa")
        this.availableTags.update(tags => [...tags, newTag]);

        const currentSelected = this.resourceForm.get('tagNames')?.value || [];
        this.resourceForm.patchValue({ tagNames: [...currentSelected, newTag.name] });

        this.isCreatingTag.set(false);
        this.currentSearch.set('');
        this.tagSelect.resetFilter();
      },
      error: (err) => {
        console.error('Error creando etiqueta', err);
        alert('Hubo un error al crear la etiqueta. Asegúrate de que no exista ya.');
        this.isCreatingTag.set(false);
      }
    });
  }

  getIconForType(type: string): string {
    const icons: Record<string, string> = {
      'PDF': 'pi pi-file-pdf',
      'IMAGE': 'pi pi-image',
      'TEMPLATE': 'pi pi-file-edit',
      'VIDEO': 'pi pi-video',
      'LINK': 'pi pi-link'
    };
    return icons[type] || 'pi pi-file';
  }

  getSeverityForType(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const severities: Record<string, any> = {
      'PDF': 'success',
      'IMAGE': 'info',
      'TEMPLATE': 'secondary',
      'VIDEO': 'danger',
      'LINK': 'warn'
    };
    return severities[type] || 'info';
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
    this.resourceForm.reset({ type: 'PDF', tagNames: [] });
    this.selectedFile = null;
    this.displayAddModal.set(true);
  }

  onFileSelect(event: any) {
    if (event.files && event.files.length > 0) {
      this.selectedFile = event.files[0];
    }
  }

  onSubmit() {
    if (this.resourceForm.invalid) return;

    if (this.resourceForm.value.type !== 'LINK' && !this.selectedFile) {
      alert('Por favor, selecciona un archivo.');
      return;
    }

    this.isSubmitting.set(true);

    const formData = new FormData();
    const formValue = this.resourceForm.value;

    const dto = {
      title: formValue.title,
      description: formValue.description,
      type: formValue.type,
      tagNames: formValue.tagNames
    };

    formData.append('data', new Blob([JSON.stringify(dto)], { type: 'application/json' }));

    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    } else {
      formData.append('file', new Blob([]), 'empty.txt');
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
