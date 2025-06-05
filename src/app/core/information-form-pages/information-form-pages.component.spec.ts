import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformationFormPagesComponent } from './information-form-pages.component';

describe('InformationFormPagesComponent', () => {
  let component: InformationFormPagesComponent;
  let fixture: ComponentFixture<InformationFormPagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformationFormPagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InformationFormPagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
