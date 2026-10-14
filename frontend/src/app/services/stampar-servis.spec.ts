import { TestBed } from '@angular/core/testing';

import { StamparServis } from './stampar-servis';

describe('StamparServis', () => {
  let service: StamparServis;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StamparServis);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
