import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AttendedEventsComponent } from './attended-events.component';

describe('AttendedEventsComponent', () => {
  let fixture: ComponentFixture<AttendedEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendedEventsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(AttendedEventsComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the empty message when there is no stage', () => {
    expect(fixture.nativeElement.textContent).toContain('Todavía no has asistido');
  });
});
