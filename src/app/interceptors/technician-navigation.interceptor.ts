import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CredentialsService } from '../services/credentials/credentials.service';

@Injectable({
  providedIn: 'root'
})
export class TechnicianNavigationInterceptor {

  constructor(
    private router: Router,
    private credentialsService: CredentialsService
  ) {
    this.setupNavigationRestriction();
  }

  private setupNavigationRestriction(): void {
    // Interceptar el evento popstate (botón atrás del navegador)
    window.addEventListener('popstate', (event) => {
      const credentials = this.credentialsService.getCredentialsParsed();
      
      if (credentials && credentials.type === 'technician' && credentials.area && credentials.area !== 'general') {
        // Si es un técnico con área específica, redirigir a su área
        event.preventDefault();
        this.router.navigate(['/technician/orders', credentials.area]);
      }
    });

    // Interceptar navegación programática
    const originalNavigate = this.router.navigate;
    this.router.navigate = (commands: any[], extras?: any) => {
      const credentials = this.credentialsService.getCredentialsParsed();
      
      if (credentials && credentials.type === 'technician' && credentials.area && credentials.area !== 'general') {
        // Verificar si está intentando acceder a rutas no permitidas
        const targetRoute = Array.isArray(commands) ? commands[0] : commands;
        
        if (targetRoute === 'home' || targetRoute === 'manage' || targetRoute?.startsWith('manage/')) {
          // Redirigir a su área en lugar de la ruta solicitada
          return originalNavigate.call(this.router, ['/technician/orders', credentials.area], extras);
        }
      }
      
      return originalNavigate.call(this.router, commands, extras);
    };

    // Interceptar el evento beforeunload para mostrar advertencia
    window.addEventListener('beforeunload', (event) => {
      const credentials = this.credentialsService.getCredentialsParsed();
      
      if (credentials && credentials.type === 'technician' && credentials.area && credentials.area !== 'general') {
        event.preventDefault();
        event.returnValue = '¿Estás seguro de que quieres salir? Perderás el progreso no guardado.';
        return event.returnValue;
      }
    });
  }
}
