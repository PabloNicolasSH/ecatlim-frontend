import { TestBed } from '@angular/core/testing';

import { LessonBlockService } from './lesson-block.service';

describe('LessonBlockService', () => {
  let service: LessonBlockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LessonBlockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
