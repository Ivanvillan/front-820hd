import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, Router } from '@angular/router';
import { CredentialsService } from '../services/credentials/credentials.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private credentialsService: CredentialsService, 
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean {
    // Ignorar rutas relacionadas con el dashboard
    if (state.url.includes('dashboard')) {
      return true;
    }

    const token = this.credentialsService.getToken();
    if (!token) {
      this.router.navigate(['signin']);
      return false;
    }
    return true;
  }
}
