import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { ConfigService } from 'src/app/services/config/config.service';

import { faArrowCircleDown } from '@fortawesome/free-solid-svg-icons';
import { OffersService } from 'src/app/services/offers/offers.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as moment from 'moment-timezone';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../shared/components/dialog/dialog.component';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();

  setHeader: boolean = false;
  username: string = '';
  userType: string = '';
  showLogout: boolean = false;
  isHome: boolean = false;
  isAdmin: boolean = false;
  isUser: boolean = false;
  isSupplies: boolean = false;
  isAssistance: boolean = false;
  bannerSupplies: boolean = false;
  API_URI: string = '';
  faArrowCircleDown = faArrowCircleDown;

  constructor(
    private credentialsService: CredentialsService,
    private authService: AuthService,
    private router: Router,
    private offersService: OffersService,
    private _snackBar: MatSnackBar,
    public dialog: MatDialog,
    private configService: ConfigService
  ) {
    // ✅ Usar configuración centralizada
    this.API_URI = this.configService.IMAGE_URL;

    this.authService.showHeader$.subscribe({
      next: (res) => {
        const data = this.credentialsService.getCredentialsParsed();
        this.setHeader = res;
        if (data) {
          this.username = data.name || data.contact;
          this.userType = data.type;
        }
      },
      error: (err) => {
        console.log(err);
      }
    });
    
    const data = this.credentialsService.getCredentialsParsed();
    if (data) {
      this.setHeader = true;
      this.username = data.name || data.contact;
      this.userType = data.type;
    }
  }

  ngOnInit(): void {
    // ✅ Suscribirse a cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateViewBasedOnRoute();
    });
    
    // Inicializar vista
    this.updateViewBasedOnRoute();

    const data = this.credentialsService.getCredentialsParsed();
    const newsStorage = this.credentialsService.getNewsStorage();
    let session = moment().diff(data?.time, 'days');  
    
    // Mostrar diálogo de novedades solo para clientes (no técnicos ni admin)
    const currentUrl = this.router.url;
    if (!currentUrl.includes('/signin') && !!newsStorage && data?.type === 'customer') {
      this.openDialog();
    }
    
    if (!currentUrl.includes('/signin') && (session != 0)) {
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
  }

  /**
   * Actualiza estados de vista según la ruta actual
   * ✅ USA router.url EN LUGAR DE window.location.href
   */
  private updateViewBasedOnRoute(): void {
    const currentUrl = this.router.url;
    
    this.isHome = currentUrl.includes('/home') || currentUrl === '/';
    this.isAdmin = currentUrl.includes('/manage');
    this.isSupplies = currentUrl.includes('/supplies');
    this.isAssistance = currentUrl.includes('/assistance');
    this.isUser = this.isSupplies || this.isAssistance;
    this.bannerSupplies = this.isSupplies;
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

  setStyles() {
    let styles = {}
    if (this.isHome) {
      styles = {
        'background-image': `url(${this.API_URI}/front/banner2.jpg)`,
        'background-repeat': 'no-repeat',
        'background-position': 'center',
        'background-size': 'cover',
        'max-width': '100%',
        'background-color': '#262626',
        'padding-bottom': '10px'
      };
    }
    if (this.isAdmin){
      styles = {
        'background-image': `url(${this.API_URI}/front/banner4.jpg)`,
        'background-repeat': 'no-repeat',
        'background-position': 'center',
        'background-size': 'cover',
        'max-width': '100%',
        'background-color': '#262626',
        'padding-bottom': '10px'
      };
    }
    if (this.isSupplies){
      styles = {
        'background-image': `url(${this.API_URI}/front/banner1.jpg)`,
        'background-repeat': 'no-repeat',
        'background-position': 'center',
        'background-size': 'cover',
        'max-width': '100%',
        'background-color': '#262626',
        'padding-bottom': '10px'
      };
    }
    if (this.isAssistance){
      styles = {
        'background-image': `url(${this.API_URI}/front/banner5.jpg)`,
        'background-repeat': 'no-repeat',
        'background-position': 'center',
        'background-size': 'cover',
        'max-width': '100%',
        'background-color': '#262626',
        'padding-bottom': '10px'
      };
    }
    return styles
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogComponent, {
      maxWidth: '40vw',
      maxHeight: '80vh',
      data: 'news'
    });

    dialogRef.afterClosed().subscribe(() => {
      this.credentialsService.revokeNewsStorage();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
