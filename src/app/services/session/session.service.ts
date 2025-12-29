import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Credentials } from 'src/app/models/credentials.models';
import { environment } from 'src/environments/environment';

/**
 * Servicio de gestión de sesión usando cookies HttpOnly
 * Reemplaza CredentialsService con almacenamiento seguro
 */
@Injectable({
  providedIn: 'root'
})
export class SessionService {
  // Estado de sesión en memoria (no persiste en localStorage)
  private sessionState$ = new BehaviorSubject<Credentials | null>(null);
  
  // Observable para que componentes reacten a cambios de sesión
  public session$: Observable<Credentials | null> = this.sessionState$.asObservable();

  // Caché de credenciales parseadas para optimización
  private credentialsCache: Credentials | null = null;

  constructor(private http: HttpClient) {
    // Inicializa sesión de forma asíncrona para no bloquear la carga
    this.initializeSession();
  }

  /**
   * Inicializa la sesión validando con el backend
   * Útil al recargar la página
   * Solo intenta obtener datos si hay cookies presentes
   */
  private initializeSession(): void {
    // Verificar si hay cookies antes de intentar obtener datos
    const hasAuthCookie = this.getCookie('auth_token') || this.getCookie('user_type');
    
    if (hasAuthCookie) {
      // Solo intentar obtener datos si parece que hay sesión
      this.fetchUserData().subscribe();
    }
    // Si no hay cookies, simplemente no hacer nada (estado inicial null)
  }

  /**
   * Guarda datos de sesión en memoria (no en localStorage)
   * @param credentials - Datos del usuario autenticado
   */
  setSession(credentials: Credentials): void {
    // Solo almacenar datos NO sensibles en memoria
    const sessionData: Credentials = {
      id7c: credentials.id7c,
      contacto: credentials.contacto,
      id7: credentials.id7,
      nombre: credentials.nombre || credentials.contacto,
      email: credentials.email,
      type: credentials.type,
      area: credentials.area,
      token: '', // NO almacenar token (está en cookie HttpOnly)
    };
    
    this.sessionState$.next(sessionData);
    this.credentialsCache = sessionData; // Actualizar caché
    
    // Opcional: almacenar solo tipo de usuario en cookie accesible
    // para routing del lado del cliente
    document.cookie = `user_type=${credentials.type}; path=/; SameSite=Strict`;
    if (credentials.area) {
      document.cookie = `user_area=${credentials.area}; path=/; SameSite=Strict`;
    }
  }

  /**
   * Obtiene el estado actual de la sesión
   */
  getSession(): Credentials | null {
    return this.sessionState$.value;
  }

  /**
   * Obtiene credenciales parseadas con caché
   * Optimizado para evitar re-parseo en interceptors
   */
  getSessionCached(): Credentials | null {
    if (!this.credentialsCache) {
      this.credentialsCache = this.sessionState$.value;
    }
    return this.credentialsCache;
  }

  /**
   * Obtiene el tipo de usuario de manera segura
   */
  getUserType(): string | null {
    return this.sessionState$.value?.type || this.getCookie('user_type');
  }

  /**
   * Obtiene el área del técnico de manera segura
   */
  getUserArea(): string | null {
    return this.sessionState$.value?.area || this.getCookie('user_area');
  }

  /**
   * Valida si hay sesión activa consultando al backend
   */
  validateSession(): Observable<boolean> {
    return this.http.get<{ valid: boolean }>(`${environment.API_URL}/api/auth/validate`, {
      withCredentials: true // Incluir cookies HttpOnly
    }).pipe(
      tap(response => {
        if (!response.valid) {
          this.clearSession();
        }
      }),
      catchError(() => {
        // Si falla la validación (401, 500, etc), sesión inválida
        this.clearSession();
        return of(false);
      }),
      tap(result => result as any as boolean)
    ) as any;
  }

  /**
   * Obtiene datos del usuario desde el backend
   * El token está en cookie HttpOnly, se envía automáticamente
   */
  fetchUserData(): Observable<Credentials | null> {
    return this.http.get<Credentials>(`${environment.API_URL}/api/auth/me`, {
      withCredentials: true // CRÍTICO: Incluir cookies HttpOnly
    }).pipe(
      tap(userData => {
        if (userData) {
          this.setSession(userData);
        }
      }),
      catchError(error => {
        // Si no hay sesión (401), simplemente no hacer nada
        // No es un error real, solo significa que el usuario no está autenticado
        if (error.status !== 401) {
          console.error('Error fetching user data:', error);
        }
        this.clearSession();
        return of(null);
      })
    );
  }

  /**
   * Limpia la sesión (logout)
   */
  clearSession(): void {
    this.sessionState$.next(null);
    this.credentialsCache = null; // Limpiar caché
    
    // Limpiar cookies del lado del cliente
    document.cookie = 'user_type=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user_area=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  /**
   * Helper para leer cookies
   */
  private getCookie(name: string): string | null {
    const matches = document.cookie.match(new RegExp(
      '(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'
    ));
    return matches ? decodeURIComponent(matches[1]) : null;
  }
}

