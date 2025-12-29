import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { ConfigService } from 'src/app/services/config/config.service';

import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css'],
})
export class BannerComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  
  faChevronDown = faChevronDown;
  isHome: boolean = false;
  isAdmin: boolean = false;
  isUser: boolean = false;
  isSupplies: boolean = false;
  offerButton: number = 0;
  
  // Propiedades para el header compacto de admin
  username: string = '';
  userType: string = '';
  showLogout: boolean = false;
  API_URI: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private credentialsService: CredentialsService,
    private configService: ConfigService
  ) {
    // ✅ Usar configuración centralizada
    this.API_URI = this.configService.IMAGE_URL;
  }

  ngOnInit(): void {
    // ✅ Suscribirse a eventos del router (reactivo)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateViewBasedOnRoute();
    });
    
    // Inicializar vista
    this.updateViewBasedOnRoute();
    
    // Cargar datos de usuario si es admin
    this.loadUserData();
  }

  /**
   * Actualiza la vista según la ruta actual
   * ✅ USA router.url EN LUGAR DE window.location.href
   */
  private updateViewBasedOnRoute(): void {
    const currentUrl = this.router.url;
    
    // Reset estados
    this.isHome = false;
    this.isAdmin = false;
    this.isUser = false;
    this.isSupplies = false;
    
    // Determinar vista según ruta
    if (currentUrl.includes('/home')) {
      this.isHome = true;
    } else if (currentUrl.includes('/manage')) {
      this.isAdmin = true;
      const params = this.activatedRoute.snapshot.params;
      if (params['selectedIndex']) {
        this.offerButton = +params['selectedIndex'];
      }
    } else if (currentUrl.includes('/supplies')) {
      this.isUser = true;
      this.isSupplies = true;
    } else if (currentUrl.includes('/assistance')) {
      this.isUser = true;
      this.isSupplies = false;
    }
  }

  /**
   * Carga datos del usuario desde el servicio de credenciales
   */
  private loadUserData(): void {
    // Suscribirse a cambios de ruta para recargar datos de usuario si cambia a admin
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.isAdmin) {
        const data = this.credentialsService.getCredentialsParsed();
        if (data) {
          this.username = data.name || data.contact;
          this.userType = data.type;
        }
      }
    });
    
    // Cargar inicialmente si ya estamos en admin
    if (this.router.url.includes('/manage')) {
      const data = this.credentialsService.getCredentialsParsed();
      if (data) {
        this.username = data.name || data.contact;
        this.userType = data.type;
      }
    }
  }

  // Métodos para el header compacto de admin
  toggleLogout(): void {
    this.showLogout = !this.showLogout;
  }

  logout(): void {
    this.authService.logout()
      .subscribe({
        next: (res) => {
          this.showLogout = false;
          this.router.navigate(['/signin']);
        },
        error: (err) => {
          console.log(err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
