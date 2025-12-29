import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

import { BehaviorSubject } from 'rxjs';
import { CredentialsService } from '../credentials/credentials.service';
import { SessionMonitorService } from '../session/session-monitor.service';
import { checkMethod } from 'src/app/interceptors/token.interceptor';
import { Credentials } from 'src/app/models/credentials.models';
import { Auth } from 'src/app/models/auth.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private showHeader = new BehaviorSubject(false);

  showHeader$ = this.showHeader.asObservable();

  API_URI = `${environment.API_URL}/api`;

  constructor(
    private http: HttpClient, 
    private credentialsService: CredentialsService,
    private sessionMonitor: SessionMonitorService,
    private router: Router
  ) { }

  login(login: Auth) {
    return this.http.post<Credentials[]>(`${this.API_URI}/auth`, login, { 
      context: checkMethod(),
      withCredentials: true // CRÍTICO: Permitir que el backend establezca cookies
    })
    .pipe(
      tap(res => {
        const credentials = Object.assign({}, res[0], res[1]);
        // Guardar credenciales en localStorage (compatibilidad temporal)
        this.credentialsService.saveCredentials(credentials);
        // Las cookies se establecen automáticamente por el backend
        // SessionService las detectará en el próximo refresh
        this.showHeader.next(true);
        // Iniciar monitoreo de sesión
        this.sessionMonitor.startMonitoring();
        this.redirectBasedOnUserType(credentials);
      })
    )
  }

  /**
   * Redirige al usuario según su tipo y área
   * @param credentials - Credenciales del usuario autenticado
   */
  private redirectBasedOnUserType(credentials: Credentials): void {
    const { type, area } = credentials;
    
    if (type === 'admin') {
      this.router.navigate(['/manage/ordenes']);
    } else if (type === 'technician') {
      if (area === 'general') {
        this.router.navigate(['/manage/ordenes']);
      } else if (area && ['campo', 'laboratorio', '820hd'].includes(area)) {
        this.router.navigate(['/technician/orders', area]);
      } else {
        // Área no válida, redirigir al login
        this.router.navigate(['/signin']);
      }
    } else {
      // customer o tipo no reconocido
      this.router.navigate(['/home']);
    }
  }

  logout() {
    return this.http.post(`${this.API_URI}/auth/logout`, '', {
      withCredentials: true // CRÍTICO: Enviar cookies al backend para limpiarlas
    })
    .pipe(
      tap(() => {
        // Detener monitoreo de sesión
        this.sessionMonitor.stopMonitoring();
        // Limpiar localStorage (compatibilidad temporal)
        this.credentialsService.revokeCredentials();
        // Las cookies se limpian automáticamente por el backend
        // Ocultar header
        this.showHeader.next(false);
      })
    )
  }
}
