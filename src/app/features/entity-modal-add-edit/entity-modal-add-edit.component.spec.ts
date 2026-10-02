import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityModalAddEditComponent } from './entity-modal-add-edit.component';

describe('EntityModalAddEditComponent', () => {
  let component: EntityModalAddEditComponent;
  let fixture: ComponentFixture<EntityModalAddEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityModalAddEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityModalAddEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
