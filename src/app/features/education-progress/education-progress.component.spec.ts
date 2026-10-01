import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EducationProgressComponent } from './education-progress.component';

describe('EducationProgressComponent', () => {
  let component: EducationProgressComponent;
  let fixture: ComponentFixture<EducationProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EducationProgressComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EducationProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
