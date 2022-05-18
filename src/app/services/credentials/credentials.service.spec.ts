/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { CredentialsService } from './credentials.service';

describe('Service: Credentials', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CredentialsService]
    });
  });

  it('should ...', inject([CredentialsService], (service: CredentialsService) => {
    expect(service).toBeTruthy();
  }));
});
