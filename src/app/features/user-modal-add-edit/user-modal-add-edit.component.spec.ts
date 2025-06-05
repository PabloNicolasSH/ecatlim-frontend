import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserModalAddEditComponent } from './user-modal-add-edit.component';

describe('UserModalAddEditComponent', () => {
  let component: UserModalAddEditComponent;
  let fixture: ComponentFixture<UserModalAddEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserModalAddEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserModalAddEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
