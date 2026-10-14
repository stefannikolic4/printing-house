import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrinterStock } from './printer-stock';

describe('PrinterStock', () => {
  let component: PrinterStock;
  let fixture: ComponentFixture<PrinterStock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrinterStock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrinterStock);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
