import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { CredentialsService } from '../services/credentials/credentials.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardGuard implements CanActivate {
  constructor(
    private credentialsService: CredentialsService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const dashToken = this.credentialsService.getDashboardToken();
    const fullToken = this.credentialsService.getToken();
    
    if (dashToken || fullToken) {
      return true;
    }
    
    this.router.navigate(['/dashboard']);
    return false;
  }
} 