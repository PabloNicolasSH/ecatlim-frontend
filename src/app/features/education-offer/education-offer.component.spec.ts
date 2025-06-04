import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EducationOfferComponent } from './education-offer.component';

describe('EducationOfferComponent', () => {
  let component: EducationOfferComponent;
  let fixture: ComponentFixture<EducationOfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EducationOfferComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EducationOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
