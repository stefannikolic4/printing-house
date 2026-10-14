import { TestBed } from '@angular/core/testing';

import { AdminServis } from './admin-servis';

describe('AdminServis', () => {
  let service: AdminServis;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminServis);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
