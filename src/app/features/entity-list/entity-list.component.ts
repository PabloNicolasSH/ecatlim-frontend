import {Component, inject, OnInit, signal} from '@angular/core';
import {Button} from "primeng/button";
import {TableModule} from "primeng/table";
import {ScoutGroup} from '../../shared/models/scout-group.model';
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
    ConfirmDialog
  ],
  templateUrl: './entity-list.component.html',
  styleUrl: './entity-list.component.scss'
})
export class EntityListComponent implements OnInit{

  protected readonly entityService = inject(EntityService);
  protected readonly confirmationService = inject(ConfirmationService);
  protected readonly messageService = inject(MessageService);

  entities: ScoutGroup[] = [];
  visible: boolean = false;
  entityToEdit = signal<ScoutGroup>({} as ScoutGroup);
  dialogMode = signal<string>("Add");

  ngOnInit(): void {
    this.loadEntities();
  }

  loadEntities() {
    this.entityService.getEntities().subscribe({
        next: value => {
          this.entities = value
        }
      });
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
