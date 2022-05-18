/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { WeekoffersComponent } from './weekoffers.component';

describe('WeekoffersComponent', () => {
  let component: WeekoffersComponent;
  let fixture: ComponentFixture<WeekoffersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WeekoffersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WeekoffersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
