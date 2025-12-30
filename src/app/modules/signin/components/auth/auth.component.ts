import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';

import { Auth } from '../../../../models/auth.model';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {

  isLoading = false;
  login: Auth = {
    email: '', // Se usará como identifier en el backend
    password: ''
  }

  constructor(
    private loginService: AuthService,
    private router: Router,
    private _snackBar: MatSnackBar,
    private credentialsService: CredentialsService
  ) { }

  auth(): void {
    this.isLoading = true;
    // Enviar 'identifier' al backend (puede ser usuario o email)
    const loginData: Auth = {
      email: this.login.email,
      identifier: this.login.email, // El backend usará esto para técnicos
      password: this.login.password
    };
    this.loginService.login(loginData)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          
          try {
            // Obtener credenciales del usuario logueado
            const credentials = this.credentialsService.getCredentialsParsed();
            if (credentials) {              
              // Mostrar mensaje de bienvenida
              this._snackBar.open(`Hola ${credentials.name}!`, 'Cerrar', {
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: ['success-snackbar']
              });
              
              // La redirección se maneja automáticamente en AuthService
              // No necesitamos hacer nada aquí
            } else {
              console.warn('No se pudieron obtener las credenciales del usuario');
              this.router.navigate(['/home']);
            }
          } catch (error) {
            console.error('Error al procesar las credenciales:', error);
            this.router.navigate(['/home']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error en el login:', err);
          this._snackBar.open('Hubo un error al iniciar sesión, por favor revise sus credenciales', 'Cerrar', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom'
          });
        }
      })
  }

  openSnackbar() {
    this._snackBar.open('Esta funcionalidad estará disponible proximamente', 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }

}
