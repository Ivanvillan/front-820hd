import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { CredentialsService } from '../services/credentials/credentials.service';

@Injectable({
  providedIn: 'root'
})
export class ManageGuard implements CanActivate {

  constructor(
    private credentialsService: CredentialsService,
    private router: Router
  ) { }

  canActivate(): boolean {
    const credentials = this.credentialsService.getCredentialsParsed();
    
    if (!credentials) {
      this.router.navigate(['/signin']);
      return false;
    }

    // Solo permitir acceso a /manage para admins y técnicos generales
    if (credentials.type === 'admin') {
      return true;
    }

    if (credentials.type === 'technician' && credentials.area === 'general') {
      return true;
    }

    // Para técnicos específicos, redirigir a su área
    if (credentials.type === 'technician' && credentials.area && ['campo', 'laboratorio', '820hd'].includes(credentials.area)) {
      this.router.navigate(['/technician/orders', credentials.area]);
      return false;
    }

    // Para customers, redirigir a home
    if (credentials.type === 'customer') {
      this.router.navigate(['/home']);
      return false;
    }

    // Tipo no reconocido, redirigir al login
    this.router.navigate(['/signin']);
    return false;
  }
}
