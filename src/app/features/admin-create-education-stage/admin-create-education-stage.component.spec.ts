import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCreateEducationStageComponent } from './admin-create-education-stage.component';

describe('AdminCreateEducationStageComponent', () => {
  let component: AdminCreateEducationStageComponent;
  let fixture: ComponentFixture<AdminCreateEducationStageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCreateEducationStageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCreateEducationStageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
