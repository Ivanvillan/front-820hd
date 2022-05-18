/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { OrderCreateBoxComponent } from './order-create-box.component';

describe('OrderCreateBoxComponent', () => {
  let component: OrderCreateBoxComponent;
  let fixture: ComponentFixture<OrderCreateBoxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrderCreateBoxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderCreateBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
