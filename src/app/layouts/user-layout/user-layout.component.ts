import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { AuthService } from 'src/app/services/auth/auth.service';

/**
 * UserLayoutComponent - Layout para usuarios clientes/técnicos
 * ✅ Componente específico para roles customer/technician
 * ✅ Centraliza header + navegación de usuario
 */
@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.scss']
})
export class UserLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  userEmail: string = '';
  userName: string = '';
  userType: string = '';
  
  // Estado de navegación
  isSuppliesSection: boolean = false;
  isAssistanceSection: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private credentialsService: CredentialsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Cargar datos del usuario
    this.loadUserData();
    
    // Suscribirse a cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateCurrentSection();
    });
    
    // Actualizar sección inicial
    this.updateCurrentSection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData(): void {
    const credentials = this.credentialsService.getCredentialsParsed();
    if (credentials) {
      this.userEmail = credentials.email || '';
      this.userName = credentials.contacto || credentials.contact || credentials.name || '';
      this.userType = credentials.type || '';
    }
  }

  /**
   * Actualiza la sección actual basándose en la URL
   */
  private updateCurrentSection(): void {
    const url = this.router.url;
    
    this.isSuppliesSection = url.includes('/supplies');
    this.isAssistanceSection = url.includes('/assistance');
  }

  /**
   * Cierra sesión
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/signin']);
      },
      error: (err) => {
        console.error('Error during logout:', err);
        // Navegar a login de todas formas
        this.router.navigate(['/signin']);
      }
    });
  }
}

