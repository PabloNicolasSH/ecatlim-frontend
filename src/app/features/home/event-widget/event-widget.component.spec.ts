import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventWidgetComponent } from './event-widget.component';

describe('EventDashboardComponent', () => {
  let component: EventWidgetComponent;
  let fixture: ComponentFixture<EventWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
