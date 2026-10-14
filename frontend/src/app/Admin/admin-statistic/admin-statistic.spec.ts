import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminStatistic } from './admin-statistic';

describe('AdminStatistic', () => {
  let component: AdminStatistic;
  let fixture: ComponentFixture<AdminStatistic>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminStatistic]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminStatistic);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
