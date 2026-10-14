import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientSearch } from './client-search';

describe('ClientSearch', () => {
  let component: ClientSearch;
  let fixture: ComponentFixture<ClientSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
