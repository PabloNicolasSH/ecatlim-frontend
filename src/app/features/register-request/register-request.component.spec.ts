import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterRequestComponent } from './register-request.component';

describe('RegisterRequestComponent', () => {
  let component: RegisterRequestComponent;
  let fixture: ComponentFixture<RegisterRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
