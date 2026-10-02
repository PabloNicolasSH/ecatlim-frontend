import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserModalMeEditComponent } from './user-modal-me-edit.component';

describe('UserModalMeEditComponent', () => {
  let component: UserModalMeEditComponent;
  let fixture: ComponentFixture<UserModalMeEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserModalMeEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserModalMeEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
