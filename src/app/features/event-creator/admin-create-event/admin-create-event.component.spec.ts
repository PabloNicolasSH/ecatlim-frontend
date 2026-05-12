import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCreateEventComponent } from './admin-create-event.component';

describe('AdminCreateEventComponent', () => {
  let component: AdminCreateEventComponent;
  let fixture: ComponentFixture<AdminCreateEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCreateEventComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCreateEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
