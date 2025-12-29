import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigService } from 'src/app/services/config/config.service';

import { faUserShield } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  faUserShield = faUserShield;
  API_URI: string = '';

  constructor(
    private _snackBar: MatSnackBar,
    private configService: ConfigService
  ) {
    // ✅ Usar configuración centralizada
    this.API_URI = this.configService.IMAGE_URL;
  }

  ngOnInit() {
  }

  openSnackbar() {
    this._snackBar.open('Esta funcionalidad estará disponible proximamente', 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }

  setStyles() {
    let styles = {}
    styles = {
      'height': '100%',
      'width': '100%',
      'background-image': `url(${this.API_URI}/front/820fondo.jpg)`,
      'background-repeat': 'no-repeat',
      'background-position': 'center',
      'background-attachment': 'fixed',
      'background-size': 'cover',
      'display': 'flex',
      'justify-content': 'space-evenly',
      'align-items': 'center',
      'flex-direction': 'column'
    };
    return styles
  }

}
