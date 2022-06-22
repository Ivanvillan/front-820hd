import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';

import { Auth } from '../../../../models/auth.model';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {

  isLoading = false;
  login: Auth = {
    email: '',
    password: ''
  }

  constructor(
    private loginService: AuthService,
    private router: Router,
    private _snackBar: MatSnackBar
  ) { }

  auth(): void {
    this.isLoading = true;
    this.loginService.login(this.login)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.isLoading = false;
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
