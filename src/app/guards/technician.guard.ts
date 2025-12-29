import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { CredentialsService } from '../services/credentials/credentials.service';

@Injectable({
  providedIn: 'root'
})
export class TechnicianGuard implements CanActivate {

  constructor(
    private credentialsService: CredentialsService,
    private router: Router
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const credentials = this.credentialsService.getCredentialsParsed();
    
    if (!credentials) {
      this.router.navigate(['/signin']);
      return false;
    }

    // Si no es técnico, permitir acceso normal
    if (credentials.type !== 'technician') {
      return true;
    }

    // Para técnicos, verificar que estén en su área correcta
    const requestedArea = route.paramMap.get('area');
    const technicianArea = credentials.area;

    // Si el técnico tiene área específica, debe estar en esa área
    if (technicianArea && technicianArea !== 'general') {
      if (!requestedArea || requestedArea !== technicianArea) {
        // Redirigir al técnico a su área correcta
        this.router.navigate(['/technician/orders', technicianArea]);
        return false;
      }
    }

    // Si es técnico general, puede acceder a cualquier área
    return true;
  }
}
