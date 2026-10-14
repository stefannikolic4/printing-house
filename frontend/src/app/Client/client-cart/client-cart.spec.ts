import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientCart } from './client-cart';

describe('ClientCart', () => {
  let component: ClientCart;
  let fixture: ComponentFixture<ClientCart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientCart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientCart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
