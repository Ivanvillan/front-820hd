import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { faUserShield } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  faUserShield = faUserShield;

  constructor(private _snackBar: MatSnackBar) { }

  ngOnInit() {
  }

  openSnackbar() {
    this._snackBar.open('Esta funcionalidad estará disponible proximamente', 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }

}
