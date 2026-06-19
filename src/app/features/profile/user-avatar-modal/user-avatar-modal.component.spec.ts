import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAvatarModalComponent } from './user-avatar-modal.component';

describe('UserAvatarModelComponent', () => {
  let component: UserAvatarModalComponent;
  let fixture: ComponentFixture<UserAvatarModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAvatarModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAvatarModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
