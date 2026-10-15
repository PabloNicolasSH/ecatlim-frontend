import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {concat, Observable, of} from 'rxjs';
import {concatMap, toArray} from 'rxjs/operators';
import {Button} from 'primeng/button';
import {Dialog} from 'primeng/dialog';
import {InputText} from 'primeng/inputtext';
import {Textarea} from 'primeng/textarea';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {ConfirmationService, MessageService} from 'primeng/api';
import {NewsService} from '../../../shared/services/news.service';
import {News, NewsAttachment} from '../../../shared/models/news.model';
import {LoggedUserDataService} from '../../../core/auth/logged-user-data-service';
import {Role} from '../../../shared/models/role.model';
import {FieldErrorComponent} from '../../../shared/components/field-error/field-error.component';
import {notBlankValidator} from '../../../shared/validation/validation-patterns';

const PAGE_SIZE = 5;
const MAX_TITLE = 150;
const MAX_CONTENT = 5000;
const MAX_ATTACHMENTS = 10;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

@Component({
  selector: 'app-news-widget',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    Button,
    Dialog,
    InputText,
    Textarea,
    ConfirmDialog,
    FieldErrorComponent
  ],
  templateUrl: './news-widget.component.html'
})
export class NewsWidgetComponent implements OnInit, OnDestroy {

  private readonly newsService = inject(NewsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly loggedUserDataService = inject(LoggedUserDataService);

  readonly canManage = this.loggedUserDataService.hasAnyRole(Role.ADMIN, Role.MANAGER_DIRECTOR, Role.MANAGEMENT);
  readonly maxTitle = MAX_TITLE;
  readonly maxContent = MAX_CONTENT;
  readonly maxAttachments = MAX_ATTACHMENTS;

  news = signal<News[]>([]);
  loading = signal(true);
  hasMore = signal(false);
  expandedId = signal<number | null>(null);
  thumbnails = signal<Record<number, string>>({});

  private page = 0;

  displayForm = false;
  saving = signal(false);
  editing = signal<News | null>(null);
  coverFile = signal<File | null>(null);
  coverPreview = signal<string | null>(null);
  removeCover = signal(false);
  keptAttachments = signal<NewsAttachment[]>([]);
  newFiles = signal<File[]>([]);

  form = this.formBuilder.group({
    title: ['', [Validators.required, notBlankValidator, Validators.maxLength(MAX_TITLE)]],
    content: ['', [Validators.required, notBlankValidator, Validators.maxLength(MAX_CONTENT)]]
  });

  ngOnInit(): void {
    this.loadPage(true);
  }

  ngOnDestroy(): void {
    Object.values(this.thumbnails()).forEach(url => URL.revokeObjectURL(url));
    this.clearCoverPreview();
  }

  loadMore() {
    this.page++;
    this.loadPage(false);
  }

  toggle(news: News) {
    this.expandedId.update(current => current === news.id ? null : news.id);
  }

  download(news: News, attachment: NewsAttachment) {
    this.newsService.downloadAttachment(news.id, attachment.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  openCreate() {
    this.resetForm(null);
    this.displayForm = true;
  }

  openEdit(news: News) {
    this.resetForm(news);
    this.displayForm = true;
  }

  onCoverSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.messageService.add({severity: 'warn', summary: 'Portada no válida', detail: 'La portada debe ser una imagen'});
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      this.messageService.add({severity: 'warn', summary: 'Imagen demasiado grande', detail: 'El tamaño máximo es de 8 MB'});
      return;
    }
    this.clearCoverPreview();
    this.coverFile.set(file);
    this.coverPreview.set(URL.createObjectURL(file));
    this.removeCover.set(false);
  }

  clearCover() {
    this.clearCoverPreview();
    this.coverFile.set(null);
    this.removeCover.set(true);
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    const accepted: File[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        this.messageService.add({severity: 'warn', summary: 'Archivo demasiado grande', detail: `${file.name} supera los 8 MB`});
      } else if (this.keptAttachments().length + this.newFiles().length + accepted.length >= MAX_ATTACHMENTS) {
        this.messageService.add({severity: 'warn', summary: 'Demasiados adjuntos', detail: `Máximo ${MAX_ATTACHMENTS} adjuntos por noticia`});
        break;
      } else {
        accepted.push(file);
      }
    }
    this.newFiles.update(list => [...list, ...accepted]);
  }

  removeNewFile(index: number) {
    this.newFiles.update(list => list.filter((_, i) => i !== index));
  }

  removeKeptAttachment(attachment: NewsAttachment) {
    this.keptAttachments.update(list => list.filter(a => a.id !== attachment.id));
  }

  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    const editing = this.editing();
    const dto = {
      title: this.form.value.title!,
      content: this.form.value.content!,
      removeImage: this.removeCover()
    };
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(dto)], {type: 'application/json'}));
    const cover = this.coverFile();
    if (cover) formData.append('image', cover);

    this.saving.set(true);
    const save$ = editing ? this.newsService.update(editing.id, formData) : this.newsService.create(formData);

    save$.pipe(
      concatMap(saved => {
        const attachmentRequests: Observable<unknown>[] = [
          ...(editing ? editing.attachments
            .filter(a => !this.keptAttachments().some(kept => kept.id === a.id))
            .map(a => this.newsService.removeAttachment(saved.id, a.id)) : []),
          ...this.newFiles().map(file => this.newsService.addAttachment(saved.id, file))
        ];
        return attachmentRequests.length > 0 ? concat(...attachmentRequests).pipe(toArray()) : of([]);
      })
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.displayForm = false;
        this.messageService.add({
          severity: 'success',
          summary: editing ? 'Noticia actualizada' : 'Noticia publicada',
          detail: dto.title
        });
        this.reload();
      },
      error: () => {
        this.saving.set(false);
        this.reload();
      }
    });
  }

  confirmDelete(news: News) {
    this.confirmationService.confirm({
      header: 'Eliminar noticia',
      message: `Se eliminará "${news.title}" junto con su imagen y adjuntos. Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger text-sm',
      rejectButtonStyleClass: 'p-button-text text-sm',
      accept: () => {
        this.newsService.delete(news.id).subscribe(() => {
          this.news.update(list => list.filter(n => n.id !== news.id));
          this.messageService.add({severity: 'success', summary: 'Noticia eliminada', detail: news.title});
        });
      }
    });
  }

  private reload() {
    Object.values(this.thumbnails()).forEach(url => URL.revokeObjectURL(url));
    this.thumbnails.set({});
    this.page = 0;
    this.loadPage(true);
  }

  private loadPage(replace: boolean) {
    this.loading.set(true);
    this.newsService.getLatest(this.page, PAGE_SIZE).subscribe({
      next: items => {
        this.news.update(list => replace ? items : [...list, ...items]);
        this.hasMore.set(items.length === PAGE_SIZE);
        this.loading.set(false);
        items.filter(n => n.hasImage).forEach(n => this.loadThumbnail(n.id));
      },
      error: () => this.loading.set(false)
    });
  }

  private loadThumbnail(id: number) {
    this.newsService.image(id, true).subscribe({
      next: blob => this.thumbnails.update(map => ({...map, [id]: URL.createObjectURL(blob)})),
      error: () => {}
    });
  }

  private resetForm(news: News | null) {
    this.editing.set(news);
    this.form.reset({title: news?.title ?? '', content: news?.content ?? ''});
    this.clearCoverPreview();
    this.coverFile.set(null);
    this.removeCover.set(false);
    this.keptAttachments.set(news ? [...news.attachments] : []);
    this.newFiles.set([]);
  }

  private clearCoverPreview() {
    const preview = this.coverPreview();
    if (preview) URL.revokeObjectURL(preview);
    this.coverPreview.set(null);
  }
}
