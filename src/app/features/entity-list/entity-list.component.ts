import {Component, inject, OnInit, signal} from '@angular/core';
import {Button} from "primeng/button";
import {TableModule} from "primeng/table";
import {ScoutGroup} from '../../shared/models/scout-group.model';
import {ScoutGroupService} from '../../shared/services/scout-group.service';
import {EntityModalAddEditComponent} from '../entity-modal-add-edit/entity-modal-add-edit.component';

@Component({
  selector: 'app-entity-list',
  imports: [
    Button,
    TableModule,
    EntityModalAddEditComponent
  ],
  templateUrl: './entity-list.component.html',
  styleUrl: './entity-list.component.scss'
})
export class EntityListComponent implements OnInit{

  protected readonly scoutGroupService = inject(ScoutGroupService);

  entities: ScoutGroup[] = [];
  visible: boolean = false;
  entityToEdit = signal<ScoutGroup>({} as ScoutGroup);
  dialogMode = signal<string>("Add");

  ngOnInit(): void {
    this.loadEntities();
  }

  loadEntities() {
    this.scoutGroupService.getScoutGroups().subscribe({
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
}
