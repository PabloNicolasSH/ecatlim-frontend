import { TestBed } from '@angular/core/testing';

import { PendingUserService } from './pending-user.service';

describe('PendingUserService', () => {
  let service: PendingUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PendingUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
