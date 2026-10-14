import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrinterTender } from './printer-tender';

describe('PrinterTender', () => {
  let component: PrinterTender;
  let fixture: ComponentFixture<PrinterTender>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrinterTender]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrinterTender);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
