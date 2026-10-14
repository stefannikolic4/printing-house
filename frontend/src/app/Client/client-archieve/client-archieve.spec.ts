import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientArchieve } from './client-archieve';

describe('ClientArchieve', () => {
  let component: ClientArchieve;
  let fixture: ComponentFixture<ClientArchieve>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientArchieve]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientArchieve);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
