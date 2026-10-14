import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientTender } from './client-tender';

describe('ClientTender', () => {
  let component: ClientTender;
  let fixture: ComponentFixture<ClientTender>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientTender]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientTender);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
