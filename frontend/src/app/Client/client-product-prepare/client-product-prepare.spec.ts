import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientProductPrepare } from './client-product-prepare';

describe('ClientProductPrepare', () => {
  let component: ClientProductPrepare;
  let fixture: ComponentFixture<ClientProductPrepare>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientProductPrepare]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientProductPrepare);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
