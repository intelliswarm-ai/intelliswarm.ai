import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumeChatComponent } from './resume-chat.component';

describe('ResumeChatComponent', () => {
  let component: ResumeChatComponent;
  let fixture: ComponentFixture<ResumeChatComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ResumeChatComponent]
    });
    fixture = TestBed.createComponent(ResumeChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});