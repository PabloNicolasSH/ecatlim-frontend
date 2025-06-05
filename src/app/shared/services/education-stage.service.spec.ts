import { TestBed } from '@angular/core/testing';

import { EducationStageService } from './education-stage.service';

describe('EducationStageService', () => {
  let service: EducationStageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EducationStageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
