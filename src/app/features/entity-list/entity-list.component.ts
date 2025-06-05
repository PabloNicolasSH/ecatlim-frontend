import {Component, inject, OnInit} from '@angular/core';
import {Button} from "primeng/button";
import {TableModule} from "primeng/table";
import {ScoutGroup} from '../../shared/models/scout-group.model';
import {ScoutGroupService} from '../../shared/services/user-and-entity/scout-group.service';

@Component({
  selector: 'app-entity-list',
    imports: [
        Button,
        TableModule
    ],
  templateUrl: './entity-list.component.html',
  styleUrl: './entity-list.component.scss'
})
export class EntityListComponent implements OnInit{

  protected readonly scoutGroupService = inject(ScoutGroupService);

  entities: ScoutGroup[] = [];

  ngOnInit(): void {
    this.loadEntities();
  }

  private loadEntities() {
    this.scoutGroupService.getScoutGroups().subscribe({
        next: value => {
          this.entities = value
        }
      });
  }
}
