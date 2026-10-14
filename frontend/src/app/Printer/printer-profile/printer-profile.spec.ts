import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrinterProfile } from './printer-profile';

describe('PrinterProfile', () => {
  let component: PrinterProfile;
  let fixture: ComponentFixture<PrinterProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrinterProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrinterProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
