import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserEventCalendarComponent } from './user-event-calendar.component';

describe('EventCalendarComponent', () => {
  let component: UserEventCalendarComponent;
  let fixture: ComponentFixture<UserEventCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserEventCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserEventCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
