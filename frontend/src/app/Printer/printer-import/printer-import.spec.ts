import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrinterImport } from './printer-import';

describe('PrinterImport', () => {
  let component: PrinterImport;
  let fixture: ComponentFixture<PrinterImport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrinterImport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrinterImport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
