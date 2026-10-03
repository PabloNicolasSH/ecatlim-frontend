import {Component, computed, effect, ElementRef, inject, OnDestroy, OnInit, signal, untracked, ViewChild} from '@angular/core';
import {DatePipe} from '@angular/common';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ConfirmationService, MessageService, PrimeTemplate} from 'primeng/api';
import {Button} from 'primeng/button';
import {Dialog} from 'primeng/dialog';
import {InputText} from 'primeng/inputtext';
import {Textarea} from 'primeng/textarea';
import {MultiSelect} from 'primeng/multiselect';
import {Select} from 'primeng/select';
import {Paginator, PaginatorState} from 'primeng/paginator';
import {Skeleton} from 'primeng/skeleton';
import {Tooltip} from 'primeng/tooltip';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {LearningResource, LearningResourceType, LRTag} from '../../shared/models/learning-resource.model';
import {ResourceService} from '../../shared/services/resource.service';
import {TagService} from '../../shared/services/tag.service';
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

const LAYOUT_STORAGE_KEY = 'resource-library-layout';

interface TypeMeta {
  label: string;
  plural: string;
  icon: string;
  hint: string;
  accept: string;
  text: string;
  soft: string;
  gradient: string;
}

type SortOption = 'recent' | 'name' | 'popular';
type TypeFilter = LearningResourceType | 'ALL';

const RESOURCE_TYPE_META: Record<LearningResourceType, TypeMeta> = {
  PDF: {
    label: 'PDF', plural: 'PDFs', icon: 'pi pi-file-pdf', hint: 'Documentos y guías',
    accept: 'application/pdf,.pdf',
    text: 'text-[#B9412F]', soft: 'bg-[#FBE9E5]', gradient: 'from-[#F8D9D2] to-[#FBEFEC]'
  },
  IMAGE: {
    label: 'Imagen', plural: 'Imágenes', icon: 'pi pi-image', hint: 'Fotos, carteles, esquemas',
    accept: 'image/*',
    text: 'text-[#1F7A6E]', soft: 'bg-[#E2F3F0]', gradient: 'from-[#CDEBE5] to-[#EEF8F6]'
  },
  TEMPLATE: {
    label: 'Plantilla', plural: 'Plantillas', icon: 'pi pi-file-edit', hint: 'Word, Excel, PowerPoint...',
    accept: '',
    text: 'text-[#2F5D9E]', soft: 'bg-[#E6EEF8]', gradient: 'from-[#D5E2F4] to-[#F0F5FB]'
  },
  VIDEO_LINK: {
    label: 'Vídeo', plural: 'Vídeos', icon: 'pi pi-video', hint: 'YouTube, Vimeo...',
    accept: '',
    text: 'text-[#7A3E9D]', soft: 'bg-[#F1E7F7]', gradient: 'from-[#E6D5F0] to-[#F7F0FB]'
  },
  LINK: {
    label: 'Enlace', plural: 'Enlaces', icon: 'pi pi-link', hint: 'Webs y recursos online',
    accept: '',
    text: 'text-[#A2620F]', soft: 'bg-[#FBF0DC]', gradient: 'from-[#F6E2BC] to-[#FDF6E9]'
  }
};

const YOUTUBE_ID = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i;
const VIMEO_ID = /vimeo\.com\/(?:video\/)?(\d+)/i;

@Component({
  selector: 'app-resource-library',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    PrimeTemplate,
    Button,
    Dialog,
    InputText,
    Textarea,
    MultiSelect,
    Select,
    Paginator,
    Skeleton,
    Tooltip,
    IconField,
    InputIcon,
    ConfirmDialog,
    FieldErrorComponent
  ],
  templateUrl: './resource-library.component.html',
  styleUrl: './resource-library.component.scss'
})
export class ResourceLibraryComponent implements OnInit, OnDestroy {

  @ViewChild('tagSelect') tagSelect?: MultiSelect;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  protected readonly resourceService = inject(ResourceService);
  protected readonly tagService = inject(TagService);
  protected readonly fb = inject(FormBuilder);
  protected readonly loggedUserDataService = inject(LoggedUserDataService);
  protected readonly messageService = inject(MessageService);
  protected readonly confirmationService = inject(ConfirmationService);
  protected readonly sanitizer = inject(DomSanitizer);

  protected readonly typeMeta = RESOURCE_TYPE_META;
  protected readonly resourceTypes = Object.keys(RESOURCE_TYPE_META) as LearningResourceType[];
  protected readonly maxUploadMb = MAX_UPLOAD_MB;
  protected readonly skeletons = Array.from({length: 6});

  protected readonly sortOptions: { label: string; value: SortOption }[] = [
    {label: 'Más recientes', value: 'recent'},
    {label: 'Más usados', value: 'popular'},
    {label: 'Nombre (A-Z)', value: 'name'}
  ];

  resources = signal<LearningResource[]>([]);
  availableTags = signal<LRTag[]>([]);
  loading = signal<boolean>(true);
  failed = signal<boolean>(false);
  canAddResources = signal<boolean>(false);

  search = signal<string>('');
  activeType = signal<TypeFilter>('ALL');
  activeTags = signal<string[]>([]);
  sort = signal<SortOption>('recent');
  layout = signal<'grid' | 'list'>(this.readStoredLayout());
  first = signal<number>(0);
  rows = signal<number>(12);
  showAllTags = signal<boolean>(false);

  thumbnails = signal<Record<number, string>>({});
  private readonly requestedThumbnails = new Set<number>();

  previewResource = signal<LearningResource | null>(null);
  previewUrl = signal<string | null>(null);
  previewSafeUrl = signal<SafeResourceUrl | null>(null);
  previewLoading = signal<boolean>(false);
  previewFailed = signal<boolean>(false);

  displayFormModal = signal<boolean>(false);
  editingResource = signal<LearningResource | null>(null);
  resourceForm!: FormGroup;
  formType = signal<LearningResourceType>('PDF');
  selectedFile = signal<File | null>(null);
  isDragging = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  tagSearch = signal<string>('');
  isCreatingTag = signal<boolean>(false);

  typeCounts = computed(() => {
    const counts = {ALL: 0, PDF: 0, IMAGE: 0, TEMPLATE: 0, VIDEO_LINK: 0, LINK: 0} as Record<TypeFilter, number>;
    for (const resource of this.resources()) {
      counts[resource.type]++;
      counts.ALL++;
    }
    return counts;
  });

  totalUses = computed(() => this.resources().reduce((sum, r) => sum + (r.downloadCount ?? 0), 0));

  popularTags = computed(() => {
    const counts = new Map<string, number>();
    for (const resource of this.resources()) {
      for (const tag of resource.tags) {
        counts.set(tag.name, (counts.get(tag.name) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
      .map(([name, count]) => ({name, count}));
  });

  visibleTags = computed(() => this.showAllTags() ? this.popularTags() : this.popularTags().slice(0, 12));

  hasActiveFilters = computed(() =>
    this.search().trim() !== '' || this.activeType() !== 'ALL' || this.activeTags().length > 0);

  filteredResources = computed(() => {
    const query = normalize(this.search().trim());
    const type = this.activeType();
    const tags = this.activeTags();

    const result = this.resources().filter(resource => {
      if (type !== 'ALL' && resource.type !== type) return false;
      if (tags.length && !tags.every(tag => resource.tags.some(t => t.name === tag))) return false;
      if (!query) return true;
      const haystack = normalize([
        resource.name,
        resource.description ?? '',
        resource.uploadedBy ?? '',
        this.typeMeta[resource.type].label,
        ...resource.tags.map(t => t.name)
      ].join(' '));
      return query.split(/\s+/).every(word => haystack.includes(word));
    });

    switch (this.sort()) {
      case 'name':
        return [...result].sort((a, b) => a.name.localeCompare(b.name, 'es', {sensitivity: 'base'}));
      case 'popular':
        return [...result].sort((a, b) => b.downloadCount - a.downloadCount || b.id - a.id);
      default:
        return result;
    }
  });

  pagedResources = computed(() => this.filteredResources().slice(this.first(), this.first() + this.rows()));

  canCreateTypedTag = computed(() => {
    const term = this.tagSearch().trim();
    return term !== '' && !this.availableTags().some(t => t.name.toLowerCase() === term.toLowerCase());
  });

  constructor() {
    effect(() => {
      const images = this.pagedResources().filter(r => r.type === 'IMAGE');
      untracked(() => images.forEach(resource => this.loadThumbnail(resource)));
    });
  }

  ngOnInit() {
    this.canAddResources.set(this.loggedUserDataService.hasAnyRole(...ROLES_ALLOWED_TO_ADD_RESOURCES));
    this.initForm();
    this.load();
    this.tagService.getTags().subscribe(tags => this.availableTags.set(tags));
  }

  ngOnDestroy() {
    Object.values(this.thumbnails()).forEach(url => URL.revokeObjectURL(url));
    this.clearPreviewUrl();
  }

  load() {
    this.loading.set(true);
    this.failed.set(false);
    this.resourceService.getAll().subscribe({
      next: data => {
        this.resources.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      }
    });
  }

  setSearch(value: string) {
    this.search.set(value);
    this.first.set(0);
  }

  setType(type: TypeFilter) {
    this.activeType.set(this.activeType() === type ? 'ALL' : type);
    this.first.set(0);
  }

  toggleTag(name: string) {
    this.activeTags.update(tags => tags.includes(name) ? tags.filter(t => t !== name) : [...tags, name]);
    this.first.set(0);
  }

  setSort(sort: SortOption) {
    this.sort.set(sort);
    this.first.set(0);
  }

  clearFilters() {
    this.search.set('');
    this.activeType.set('ALL');
    this.activeTags.set([]);
    this.first.set(0);
  }

  setLayout(layout: 'grid' | 'list') {
    this.layout.set(layout);
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
    } catch {
    }
  }

  onPageChange(event: PaginatorState) {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? this.rows());
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  isLink(type: LearningResourceType): boolean {
    return type === 'LINK' || type === 'VIDEO_LINK';
  }

  domain(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  extension(resource: LearningResource): string {
    const match = /\.([a-z0-9]{1,10})$/i.exec(resource.blobPath ?? '');
    return match ? match[1].toUpperCase() : this.typeMeta[resource.type].label.toUpperCase();
  }

  videoThumbnail(resource: LearningResource): string | null {
    if (resource.type !== 'VIDEO_LINK') return null;
    const id = YOUTUBE_ID.exec(resource.blobPath)?.[1];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  }

  private videoEmbedUrl(url: string): string | null {
    const youtube = YOUTUBE_ID.exec(url)?.[1];
    if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube}`;
    const vimeo = VIMEO_ID.exec(url)?.[1];
    if (vimeo) return `https://player.vimeo.com/video/${vimeo}`;
    return null;
  }

  private loadThumbnail(resource: LearningResource) {
    if (this.requestedThumbnails.has(resource.id)) return;
    this.requestedThumbnails.add(resource.id);
    this.resourceService.thumbnail(resource.id, resource.blobPath).subscribe({
      next: blob => this.thumbnails.update(t => ({...t, [resource.id]: URL.createObjectURL(blob)})),
      error: () => {}
    });
  }

  openPreview(resource: LearningResource) {
    this.clearPreviewUrl();
    this.previewResource.set(resource);

    if (resource.type === 'VIDEO_LINK') {
      const embed = this.videoEmbedUrl(resource.blobPath);
      this.previewSafeUrl.set(embed ? this.sanitizer.bypassSecurityTrustResourceUrl(embed) : null);
      return;
    }

    if (resource.type !== 'PDF' && resource.type !== 'IMAGE') return;

    this.previewLoading.set(true);
    this.resourceService.download(resource.id).subscribe({
      next: blob => {
        if (this.previewResource()?.id !== resource.id) return;
        const url = URL.createObjectURL(blob);
        this.previewUrl.set(url);
        this.previewSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.previewLoading.set(false);
        this.bumpUses(resource.id);
      },
      error: () => {
        this.previewLoading.set(false);
        this.previewFailed.set(true);
      }
    });
  }

  closePreview() {
    this.previewResource.set(null);
    this.clearPreviewUrl();
  }

  private clearPreviewUrl() {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
    this.previewSafeUrl.set(null);
    this.previewLoading.set(false);
    this.previewFailed.set(false);
  }

  openInNewTab() {
    const url = this.previewUrl();
    if (url) window.open(url, '_blank', 'noopener');
  }

  openLink(resource: LearningResource) {
    window.open(resource.blobPath, '_blank', 'noopener,noreferrer');
    this.resourceService.registerOpen(resource.id).subscribe({
      next: () => this.bumpUses(resource.id),
      error: () => {}
    });
  }

  async copyLink(resource: LearningResource) {
    try {
      await navigator.clipboard.writeText(resource.blobPath);
      this.messageService.add({severity: 'success', summary: 'Enlace copiado', detail: 'Ya puedes pegarlo donde quieras'});
    } catch {
      this.messageService.add({severity: 'warn', summary: 'No se pudo copiar', detail: resource.blobPath});
    }
  }

  download(resource: LearningResource) {
    this.resourceService.download(resource.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.downloadName(resource);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.bumpUses(resource.id);
    });
  }

  private downloadName(resource: LearningResource): string {
    const match = /\.[a-z0-9]{1,10}$/i.exec(resource.blobPath ?? '');
    const extension = match ? match[0].toLowerCase() : '';
    return resource.name.toLowerCase().endsWith(extension) ? resource.name : resource.name + extension;
  }

  private bumpUses(id: number) {
    const update = (r: LearningResource) => r.id === id ? {...r, downloadCount: r.downloadCount + 1} : r;
    this.resources.update(list => list.map(update));
    const preview = this.previewResource();
    if (preview?.id === id) this.previewResource.set(update(preview));
  }

  confirmDelete(resource: LearningResource) {
    this.confirmationService.confirm({
      header: 'Eliminar recurso',
      message: `Se eliminará "${resource.name}" de la biblioteca${this.isLink(resource.type) ? '' : ' junto con su archivo'}. Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger text-sm',
      rejectButtonStyleClass: 'p-button-text text-sm',
      accept: () => {
        this.resourceService.delete(resource.id).subscribe(() => {
          this.resources.update(list => list.filter(r => r.id !== resource.id));
          if (this.previewResource()?.id === resource.id) this.closePreview();
          if (this.first() >= this.filteredResources().length && this.first() > 0) {
            this.first.set(Math.max(0, this.first() - this.rows()));
          }
          this.messageService.add({severity: 'success', summary: 'Recurso eliminado', detail: resource.name});
        });
      }
    });
  }

  initForm() {
    this.resourceForm = this.fb.group({
      name: ['', [Validators.required, notBlankValidator, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(MAX_TEXT)]],
      type: ['PDF', Validators.required],
      tagNames: [[]],
      blobPath: ['']
    });

    this.resourceForm.get('type')?.valueChanges.subscribe((type: LearningResourceType) => {
      this.formType.set(type);
      const blobPath = this.resourceForm.get('blobPath')!;
      blobPath.setValidators(this.isLink(type) ? [Validators.required, urlValidator, Validators.maxLength(MAX_TEXT)] : []);
      blobPath.updateValueAndValidity();
    });
  }

  openAddModal() {
    this.editingResource.set(null);
    this.selectedFile.set(null);
    this.resourceForm.reset({name: '', description: '', type: 'PDF', tagNames: [], blobPath: ''});
    this.displayFormModal.set(true);
  }

  openEditModal(resource: LearningResource) {
    this.editingResource.set(resource);
    this.selectedFile.set(null);
    this.resourceForm.reset({
      name: resource.name,
      description: resource.description ?? '',
      type: resource.type,
      tagNames: resource.tags.map(t => t.name),
      blobPath: this.isLink(resource.type) ? resource.blobPath : ''
    });
    this.displayFormModal.set(true);
  }

  selectFormType(type: LearningResourceType) {
    this.resourceForm.get('type')?.setValue(type);
    const file = this.selectedFile();
    if (file && !this.fileMatchesType(file, type)) {
      this.selectedFile.set(null);
    }
  }

  chooseFile() {
    this.fileInput?.nativeElement.click();
  }

  onFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.acceptFile(file);
    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.acceptFile(file);
  }

  private acceptFile(file: File) {
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Archivo demasiado grande',
        detail: `El tamaño máximo es de ${MAX_UPLOAD_MB} MB`
      });
      return;
    }

    const currentType = this.formType();
    if (!this.fileMatchesType(file, currentType)) {
      this.resourceForm.get('type')?.setValue(this.detectType(file));
    }

    this.selectedFile.set(file);
    const name = this.resourceForm.get('name')!;
    if (!name.value?.trim()) {
      name.setValue(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 100));
    }
  }

  private fileMatchesType(file: File, type: LearningResourceType): boolean {
    if (type === 'PDF') return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (type === 'IMAGE') return file.type.startsWith('image/');
    return type === 'TEMPLATE';
  }

  private detectType(file: File): LearningResourceType {
    if (file.type.startsWith('image/')) return 'IMAGE';
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) return 'PDF';
    return 'TEMPLATE';
  }

  onUrlBlur() {
    const url = this.resourceForm.get('blobPath')?.value ?? '';
    if (this.formType() === 'LINK' && this.videoEmbedUrl(url)) {
      this.resourceForm.get('type')?.setValue('VIDEO_LINK');
      this.messageService.add({severity: 'info', summary: 'Vídeo detectado', detail: 'Lo guardaremos como vídeo para poder verlo desde la biblioteca'});
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  onTagFilter(event: { filter?: string }) {
    this.tagSearch.set(event.filter ?? '');
  }

  createTypedTag() {
    const name = this.tagSearch().trim();
    if (!name) return;
    if (name.length > MAX_TEXT) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Etiqueta no válida',
        detail: `El nombre de la etiqueta no puede superar los ${MAX_TEXT} caracteres`
      });
      return;
    }

    this.isCreatingTag.set(true);
    this.tagService.createTag(name).subscribe({
      next: newTag => {
        this.availableTags.update(tags => [...tags, newTag].sort((a, b) => a.name.localeCompare(b.name, 'es')));
        const current: string[] = this.resourceForm.get('tagNames')?.value ?? [];
        this.resourceForm.patchValue({tagNames: [...current, newTag.name]});
        this.isCreatingTag.set(false);
        this.tagSearch.set('');
        this.tagSelect?.resetFilter();
      },
      error: () => this.isCreatingTag.set(false)
    });
  }

  onSubmit() {
    FormUtils.markAllAsDirtyAndTouched(this.resourceForm);
    if (this.resourceForm.invalid) return;

    const editing = this.editingResource();
    const formValue = this.resourceForm.value;
    const type: LearningResourceType = formValue.type;
    const file = this.selectedFile();
    const keepsCurrentFile = !!editing && !this.isLink(editing.type) && !this.isLink(type);

    if (!this.isLink(type) && !file && !keepsCurrentFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Falta el archivo',
        detail: 'Selecciona el archivo que quieres subir para este tipo de recurso'
      });
      return;
    }

    const dto = {
      name: formValue.name.trim(),
      description: formValue.description,
      type,
      tagNames: formValue.tagNames ?? [],
      blobPath: this.isLink(type) ? formValue.blobPath.trim() : null
    };

    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(dto)], {type: 'application/json'}));
    if (!this.isLink(type) && file) {
      formData.append('file', file);
    }

    this.isSubmitting.set(true);
    const request = editing
      ? this.resourceService.update(editing.id, formData)
      : this.resourceService.upload(formData);

    request.subscribe({
      next: saved => {
        if (editing) {
          this.resources.update(list => list.map(r => r.id === saved.id ? saved : r));
          this.refreshThumbnail(saved);
          if (this.previewResource()?.id === saved.id) this.openPreview(saved);
        } else {
          this.resources.update(list => [saved, ...list]);
        }
        this.displayFormModal.set(false);
        this.isSubmitting.set(false);
        this.messageService.add({
          severity: 'success',
          summary: editing ? 'Recurso actualizado' : 'Recurso añadido',
          detail: saved.name
        });
      },
      error: () => this.isSubmitting.set(false)
    });
  }

  private refreshThumbnail(resource: LearningResource) {
    const current = this.thumbnails()[resource.id];
    if (current) URL.revokeObjectURL(current);
    this.thumbnails.update(t => {
      const {[resource.id]: _, ...rest} = t;
      return rest;
    });
    this.requestedThumbnails.delete(resource.id);
    if (resource.type === 'IMAGE') this.loadThumbnail(resource);
  }

  private readStoredLayout(): 'grid' | 'list' {
    try {
      return localStorage.getItem(LAYOUT_STORAGE_KEY) === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  }
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
