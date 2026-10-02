import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserActivityViewComponent } from './user-activity-view.component';

describe('UserActivityViewComponent', () => {
  let component: UserActivityViewComponent;
  let fixture: ComponentFixture<UserActivityViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserActivityViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserActivityViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
