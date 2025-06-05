import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEducationalHomeComponent } from './admin-educational-home.component';

describe('AdminEducationalHomeComponent', () => {
  let component: AdminEducationalHomeComponent;
  let fixture: ComponentFixture<AdminEducationalHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEducationalHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminEducationalHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
