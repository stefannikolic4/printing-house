import { TestBed } from '@angular/core/testing';

import { StamparijaServis } from './stamparija-servis';

describe('StamparijaServis', () => {
  let service: StamparijaServis;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StamparijaServis);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
