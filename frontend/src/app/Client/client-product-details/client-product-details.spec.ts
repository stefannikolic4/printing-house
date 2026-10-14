import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientProductDetails } from './client-product-details';

describe('ClientProductDetails', () => {
  let component: ClientProductDetails;
  let fixture: ComponentFixture<ClientProductDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientProductDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientProductDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
