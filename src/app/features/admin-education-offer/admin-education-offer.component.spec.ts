import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEducationOfferComponent } from './admin-education-offer.component';

describe('AdminEducationOfferComponent', () => {
  let component: AdminEducationOfferComponent;
  let fixture: ComponentFixture<AdminEducationOfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEducationOfferComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminEducationOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
