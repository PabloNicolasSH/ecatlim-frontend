import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeadEducationPendingUsersListComponent } from './head-education-pending-users-list.component';

describe('HeadEducationPendingUsersListComponent', () => {
  let component: HeadEducationPendingUsersListComponent;
  let fixture: ComponentFixture<HeadEducationPendingUsersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeadEducationPendingUsersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeadEducationPendingUsersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
