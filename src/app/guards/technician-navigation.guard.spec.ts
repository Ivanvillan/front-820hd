import { TestBed } from '@angular/core/testing';
import { TechnicianNavigationGuard } from './technician-navigation.guard';

describe('TechnicianNavigationGuard', () => {
  let guard: TechnicianNavigationGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(TechnicianNavigationGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});

