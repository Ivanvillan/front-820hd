import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { CredentialsService } from '../credentials/credentials.service';
import * as moment from 'moment-timezone';

/**
 * Servicio que monitorea la sesión del usuario
 * Verifica periódicamente si la sesión sigue válida
 * y redirige al login si ha expirado
 */
@Injectable({
  providedIn: 'root'
})
export class SessionMonitorService implements OnDestroy {
  private monitorSubscription?: Subscription;
  private readonly CHECK_INTERVAL_MS = 60000; // Verificar cada 1 minuto
  private readonly SESSION_TIMEOUT_HOURS = 24; // Sesión expira después de 24 horas

  constructor(
    private credentialsService: CredentialsService,
    private router: Router
  ) {}

  /**
   * Inicia el monitoreo de la sesión
   * Se debe llamar después del login exitoso
   */
  startMonitoring(): void {
    // Detener monitoreo previo si existe
    this.stopMonitoring();

    // Verificar cada minuto si la sesión sigue válida
    this.monitorSubscription = interval(this.CHECK_INTERVAL_MS).subscribe(() => {
      this.checkSessionValidity();
    });
  }

  /**
   * Detiene el monitoreo de la sesión
   * Se debe llamar al hacer logout
   */
  stopMonitoring(): void {
    if (this.monitorSubscription) {
      this.monitorSubscription.unsubscribe();
      this.monitorSubscription = undefined;
    }
  }

  /**
   * Verifica si la sesión actual es válida
   * basándose en el tiempo transcurrido desde el login
   */
  private checkSessionValidity(): void {
    const credentials = this.credentialsService.getCredentialsParsed();
    
    if (!credentials || !credentials.time) {
      // No hay credenciales válidas
      this.handleSessionExpired();
      return;
    }

    const loginTime = moment(credentials.time);
    const now = moment();
    const hoursSinceLogin = now.diff(loginTime, 'hours');

    // Si han pasado más de 24 horas, la sesión ha expirado
    if (hoursSinceLogin >= this.SESSION_TIMEOUT_HOURS) {
      this.handleSessionExpired();
    }
  }

  /**
   * Maneja la expiración de la sesión
   */
  private handleSessionExpired(): void {
    // Detener el monitoreo
    this.stopMonitoring();
    
    // Limpiar credenciales
    this.credentialsService.revokeCredentials();
    
    // Redirigir al login
    this.router.navigate(['/signin']);
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }
}

