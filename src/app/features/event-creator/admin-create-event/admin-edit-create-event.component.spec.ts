import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEditCreateEventComponent } from './admin-edit-create-event.component';

describe('AdminCreateEventComponent', () => {
  let component: AdminEditCreateEventComponent;
  let fixture: ComponentFixture<AdminEditCreateEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEditCreateEventComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminEditCreateEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
