import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';

import { faArrowCircleDown } from '@fortawesome/free-solid-svg-icons';
import { OffersService } from 'src/app/services/offers/offers.service';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  setHeader: boolean = false;
  username: string = '';
  userType: string = '';
  showLogout: boolean = false;
  isHome: boolean = false;
  isAdmin: boolean = false;
  isUser: boolean = false;
  isSupplies: boolean = false;
  isAssistance: boolean = false;
  faArrowCircleDown = faArrowCircleDown;

  constructor(
    private credentialsService: CredentialsService,
    private authService: AuthService,
    private router: Router,
    private offersService: OffersService,
    private _snackBar: MatSnackBar
  ) {
    if(window.location.href.includes('/home') || window.location.href.includes('/')) {
      this.isHome = true;
      this.isAdmin = false;
      this.isUser = false;
    }
    if(window.location.href.includes('/manage')) {
      this.isAdmin = true;
      this.isHome = false;
      this.isUser = false
    }
    if(window.location.href.includes('/assistance')) {
      this.isUser = true;
      this.isHome = false;
      this.isAdmin = false;
      this.isAssistance = true;
    }
    if(window.location.href.includes('/supplies')) {
      this.isUser = true;
      this.isHome = false;
      this.isAdmin = false;
      this.isSupplies = true;
    }
    this.authService.showHeader$.subscribe({
      next: (res) => {
        const data = JSON.parse(this.credentialsService.getCredentials()!);
        this.setHeader = res;
        if (data) {
          this.username = data.name;
          this.userType = data.type; 
        }
      },
      error: (err) => {
        console.log(err);
      }
    });
    const data = JSON.parse(this.credentialsService.getCredentials()!);
    if (data) {
      this.setHeader = true;
      this.username = data.name;
      this.userType = data.type; 
    }
  }  

  ngOnInit(): void {  
    if(!(window.location.href.includes('/signin'))) {
      this.offersService.readWeekly().subscribe({
        error: (err) => {
          this._snackBar.open('Tu sesión ha expirado, necesitamos que ingreses tus credenciales nuevamente', 'Cerrar', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom',
          });
          this.setHeader = false;
          this.showLogout = false;
          this.credentialsService.revokeCredentials();
          this.authService.logout();
          this.router.navigate(['/signin']);
        }
      })
    }
  }

  toggleLogout() {
    this.showLogout = !this.showLogout;
  }
  
  logout(): void {
    this.authService.logout()
    .subscribe({
      next: (res) => {
        this.setHeader = false;
        this.showLogout = false;
        this.router.navigate(['/signin']);
      },
      error: (err) => {
        console.log(err);
      }
    })
  }

}
