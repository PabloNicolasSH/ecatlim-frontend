import { TestBed } from '@angular/core/testing';

import { ScoutGroupService } from './scout-group.service';

describe('ScoutGroupService', () => {
  let service: ScoutGroupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScoutGroupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
