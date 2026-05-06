import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserEducationStagesProgressComponent } from './user-education-stages-progress.component';

describe('UserEducationStagesProgressComponent', () => {
  let component: UserEducationStagesProgressComponent;
  let fixture: ComponentFixture<UserEducationStagesProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserEducationStagesProgressComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserEducationStagesProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
