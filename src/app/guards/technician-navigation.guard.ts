import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router, 
  UrlTree 
} from '@angular/router';
import { SessionService } from '../services/session/session.service';
import { CredentialsService } from '../services/credentials/credentials.service';

/**
 * Guard que previene navegación de técnicos a rutas no autorizadas
 * Reemplaza el monkey patching del router con lógica nativa de Angular
 */
@Injectable({
  providedIn: 'root'
})
export class TechnicianNavigationGuard implements CanActivate {

  // Rutas bloqueadas para técnicos con área específica
  private readonly BLOCKED_ROUTES = ['home', 'manage', 'dashboard'];

  constructor(
    private credentialsService: CredentialsService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const credentials = this.credentialsService.getCredentialsParsed();
    
    // Si no hay sesión, permitir (AuthGuard se encargará)
    if (!credentials) {
      return true;
    }

    // Solo aplicar restricciones a técnicos con área específica
    if (credentials.type !== 'technician' || credentials.area === 'general') {
      return true;
    }

    // Validar áreas permitidas
    const allowedAreas = ['campo', 'laboratorio', '820hd'];
    if (!credentials.area || !allowedAreas.includes(credentials.area)) {
      return this.router.createUrlTree(['/signin']);
    }

    // Obtener la ruta objetivo
    const targetRoute = state.url.split('/')[1];

    // Si intenta acceder a ruta bloqueada, redirigir a su área
    if (this.BLOCKED_ROUTES.includes(targetRoute)) {
      return this.router.createUrlTree(['/technician/orders', credentials.area]);
    }

    // Si intenta acceder al área de otro técnico, redirigir a la suya
    if (targetRoute === 'technician') {
      const requestedArea = state.url.split('/')[3];
      if (requestedArea && requestedArea !== credentials.area) {
        return this.router.createUrlTree(['/technician/orders', credentials.area]);
      }
    }

    // Permitir navegación
    return true;
  }
}

