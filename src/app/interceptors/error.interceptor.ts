import { Injectable } from '@angular/core';
import { 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpInterceptor, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CredentialsService } from '../services/credentials/credentials.service';

/**
 * Interceptor global de errores HTTP
 * Maneja errores de manera centralizada y consistente
 * Incluye manejo automático de sesiones expiradas
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private snackBar: MatSnackBar,
    private router: Router,
    private credentialsService: CredentialsService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ha ocurrido un error';
        
        // Error del lado del cliente
        if (error.error instanceof ErrorEvent) {
          errorMessage = `Error: ${error.error.message}`;
        } 
        // Error del servidor
        else {
          switch (error.status) {
            case 400:
              errorMessage = 'Solicitud inválida';
              break;
            case 401:
              // Sesión expirada o no autorizada
              errorMessage = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente';
              this.handleSessionExpiration();
              break;
            case 403:
              // Acceso denegado - puede ser por sesión inválida también
              errorMessage = 'Acceso denegado';
              // Si es un error de autenticación, limpiar sesión
              if (error.error?.message?.toLowerCase().includes('token') || 
                  error.error?.message?.toLowerCase().includes('session') ||
                  error.error?.message?.toLowerCase().includes('unauthorized')) {
                this.handleSessionExpiration();
              }
              break;
            case 404:
              errorMessage = 'Recurso no encontrado';
              break;
            case 500:
              errorMessage = 'Error del servidor. Por favor, intente más tarde';
              break;
            default:
              errorMessage = `Error ${error.status}: ${error.message}`;
          }
          
          // Si el backend envía mensaje personalizado
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
        }
        
        // Mostrar snackbar
        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        
        // Re-throw para que los componentes puedan manejar si es necesario
        return throwError(() => error);
      })
    );
  }

  /**
   * Maneja la expiración de sesión de forma centralizada
   * Limpia credenciales y redirige al login
   */
  private handleSessionExpiration(): void {
    // Limpiar todas las credenciales del localStorage
    this.credentialsService.revokeCredentials();
    
    // Redirigir al login
    this.router.navigate(['/signin']);
  }
}
