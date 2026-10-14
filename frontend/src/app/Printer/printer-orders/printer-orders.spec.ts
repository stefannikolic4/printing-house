import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrinterOrders } from './printer-orders';

describe('PrinterOrders', () => {
  let component: PrinterOrders;
  let fixture: ComponentFixture<PrinterOrders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrinterOrders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrinterOrders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
