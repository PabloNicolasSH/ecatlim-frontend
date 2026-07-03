import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCreateActivityComponent } from './admin-create-activity.component';

describe('AdminCreateActivityComponent', () => {
  let component: AdminCreateActivityComponent;
  let fixture: ComponentFixture<AdminCreateActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCreateActivityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCreateActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
