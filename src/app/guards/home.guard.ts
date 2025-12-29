import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { CredentialsService } from '../services/credentials/credentials.service';

@Injectable({
  providedIn: 'root'
})
export class HomeGuard implements CanActivate {

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

    // Solo permitir acceso a /home para customers
    if (credentials.type === 'customer') {
      return true;
    }

    // Para admins, redirigir a manage
    if (credentials.type === 'admin') {
      this.router.navigate(['/manage/ordenes']);
      return false;
    }

    // Para técnicos, redirigir según su área
    if (credentials.type === 'technician') {
      if (credentials.area === 'general') {
        this.router.navigate(['/manage/ordenes']);
      } else if (credentials.area && ['campo', 'laboratorio', '820hd'].includes(credentials.area)) {
        this.router.navigate(['/technician/orders', credentials.area]);
      } else {
        this.router.navigate(['/signin']);
      }
      return false;
    }

    // Tipo no reconocido, redirigir al login
    this.router.navigate(['/signin']);
    return false;
  }
}
