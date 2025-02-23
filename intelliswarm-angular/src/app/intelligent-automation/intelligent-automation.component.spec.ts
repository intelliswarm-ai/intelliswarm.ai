import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntelligentAutomationComponent } from './intelligent-automation.component';

describe('IntelligentAutomationComponent', () => {
  let component: IntelligentAutomationComponent;
  let fixture: ComponentFixture<IntelligentAutomationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntelligentAutomationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IntelligentAutomationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
