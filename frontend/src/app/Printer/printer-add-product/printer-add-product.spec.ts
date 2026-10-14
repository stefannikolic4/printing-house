import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrinterAddProduct } from './printer-add-product';

describe('PrinterAddProduct', () => {
  let component: PrinterAddProduct;
  let fixture: ComponentFixture<PrinterAddProduct>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrinterAddProduct]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrinterAddProduct);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
