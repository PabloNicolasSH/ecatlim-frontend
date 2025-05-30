import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EducationStageDetailComponent } from './education-stage-detail.component';

describe('EducationStageDetailComponent', () => {
  let component: EducationStageDetailComponent;
  let fixture: ComponentFixture<EducationStageDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EducationStageDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EducationStageDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
