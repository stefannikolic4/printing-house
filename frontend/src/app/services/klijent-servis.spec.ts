import { TestBed } from '@angular/core/testing';

import { KlijentServis } from './klijent-servis';

describe('KlijentServis', () => {
  let service: KlijentServis;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KlijentServis);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
