import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {Button} from "primeng/button";
import {TableModule} from "primeng/table";
import {FormsModule} from '@angular/forms';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {ScoutGroup} from '../../shared/models/scout-group.model';
import {PROVINCES} from '../../shared/models/provinces';
import {EntityService} from '../../shared/services/entity.service';
import {EntityModalAddEditComponent} from '../entity-modal-add-edit/entity-modal-add-edit.component';
import {ConfirmDialog} from 'primeng/confirmdialog';
import {ConfirmationService, MessageService} from 'primeng/api';

@Component({
  selector: 'app-entity-list',
  imports: [
    Button,
    TableModule,
    EntityModalAddEditComponent,
    ConfirmDialog,
    FormsModule,
    Select,
    InputText,
    IconField,
    InputIcon
  ],
  templateUrl: './entity-list.component.html',
  styleUrl: './entity-list.component.scss'
})
export class EntityListComponent implements OnInit{

  protected readonly entityService = inject(EntityService);
  protected readonly confirmationService = inject(ConfirmationService);
  protected readonly messageService = inject(MessageService);

  entities = signal<ScoutGroup[]>([]);
  visible: boolean = false;
  entityToEdit = signal<ScoutGroup>({} as ScoutGroup);
  dialogMode = signal<string>("Add");

  search = signal<string>('');
  provinceFilter = signal<number | null>(null);
  sortField = signal<'name' | 'email' | 'province'>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');

  readonly sortOptions = [
    {label: 'Nombre', value: 'name'},
    {label: 'Correo electrónico', value: 'email'},
    {label: 'Provincia', value: 'province'}
  ];

  /** Only the provinces that actually have an entity, so the filter never returns an empty list. */
  provinceOptions = computed(() => {
    const used = new Set(this.entities().map(entity => entity.provinceId));
    return [...used]
      .map(id => ({label: this.provinceName(id), value: id}))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  filteredEntities = computed(() => {
    const query = this.normalize(this.search());
    const province = this.provinceFilter();
    const field = this.sortField();
    const direction = this.sortDirection() === 'asc' ? 1 : -1;

    return this.entities().filter(entity => {
      if (province !== null && entity.provinceId !== province) return false;
      if (!query) return true;
      const haystack = this.normalize(
        [entity.name, entity.email, this.provinceName(entity.provinceId), entity.groupNumber].filter(Boolean).join(' ')
      );
      return haystack.includes(query);
    }).sort((a, b) =>
      direction * this.sortValue(a, field).localeCompare(this.sortValue(b, field), 'es', {sensitivity: 'base'})
    );
  });

  hasActiveFilters = computed(() =>
    !!this.search().trim() || this.provinceFilter() !== null
  );

  private sortValue(entity: ScoutGroup, field: 'name' | 'email' | 'province'): string {
    switch (field) {
      case 'email': return entity.email ?? '';
      case 'province': return this.provinceName(entity.provinceId);
      default: return entity.name ?? '';
    }
  }

  toggleSortDirection() {
    this.sortDirection.update(direction => direction === 'asc' ? 'desc' : 'asc');
  }

  ngOnInit(): void {
    this.loadEntities();
  }

  loadEntities() {
    this.entityService.getEntities().subscribe({
        next: value => {
          this.entities.set(value);
        }
      });
  }

  provinceName(id: number): string {
    return PROVINCES.find(province => province.id === id)?.name ?? `Provincia ${id}`;
  }

  clearFilters() {
    this.search.set('');
    this.provinceFilter.set(null);
  }

  private normalize(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  showDialog(){
    this.visible = true;
    this.dialogMode.set("Add");
  }

  openEditDialog(entity: any) {
    this.entityToEdit.set(entity);
    this.visible = true;
    this.dialogMode.set("Edit");
  }

  confirmDialog(event: Event, entity: ScoutGroup) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Estás seguro de que deseas eliminar la entidad '${entity.name}'?`,
      header: "Eliminar entidad",
      icon: "pi pi-exclamation-triangle",
      rejectButtonProps: {
        label: "Cancelar",
        severity: "secondary",
        outlined: true,
      },
      acceptButtonProps: {
        label: "Eliminar",
        severity: "danger"
      },
      accept: () => {
        this.entityService.deleteEntity(entity.id!).subscribe({
          next: () => {
            this.loadEntities();
            this.messageService.add({
              severity: 'success',
              summary: 'Confirmado',
              detail: 'Se ha eliminado correctamente la entidad'
            })
          }
        });
      },
      reject: () => {}
    })
  }
}
