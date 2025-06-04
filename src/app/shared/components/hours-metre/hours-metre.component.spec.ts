import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HoursMetreComponent } from './hours-metre.component';

describe('HoursMetreComponent', () => {
  let component: HoursMetreComponent;
  let fixture: ComponentFixture<HoursMetreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoursMetreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HoursMetreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
