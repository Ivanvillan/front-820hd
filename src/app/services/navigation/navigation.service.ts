import { Injectable } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { CredentialsService } from '../credentials/credentials.service';

/**
 * Servicio centralizado de navegación con validaciones
 * Previene navegación no autorizada de manera programática
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  constructor(
    private router: Router,
    private credentialsService: CredentialsService
  ) {}

  /**
   * Navega validando permisos del usuario
   */
  navigateTo(commands: any[], extras?: NavigationExtras): Promise<boolean> {
    const credentials = this.credentialsService.getCredentialsParsed();
    
    // Si es técnico con área específica, validar navegación
    if (credentials?.type === 'technician' && credentials.area && credentials.area !== 'general') {
      const targetRoute = Array.isArray(commands) ? commands[0] : commands;
      
      // Si intenta ir a ruta bloqueada, redirigir a su área
      if (['home', 'manage'].includes(targetRoute)) {
        return this.router.navigate(['/technician/orders', credentials.area], extras);
      }
    }
    
    // Navegación normal
    return this.router.navigate(commands, extras);
  }

  /**
   * Obtiene la ruta home según el tipo de usuario
   */
  getHomeRoute(): string[] {
    const credentials = this.credentialsService.getCredentialsParsed();
    
    if (!credentials) {
      return ['/signin'];
    }
    
    if (credentials.type === 'admin') {
      return ['/manage', '1'];
    }
    
    if (credentials.type === 'technician') {
      if (credentials.area === 'general') {
        return ['/manage', '1'];
      }
      return ['/technician/orders', credentials.area || 'campo'];
    }
    
    return ['/home'];
  }
}

