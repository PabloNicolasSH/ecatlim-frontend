import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEventCalendarComponent } from './admin-event-calendar.component';

describe('AdminEventCalendarComponent', () => {
  let component: AdminEventCalendarComponent;
  let fixture: ComponentFixture<AdminEventCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEventCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminEventCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
