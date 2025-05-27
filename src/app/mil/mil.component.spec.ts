import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MilComponent } from './mil.component';

describe('MilComponent', () => {
  let component: MilComponent;
  let fixture: ComponentFixture<MilComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MilComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
