import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { CredentialsService } from '../../services/credentials/credentials.service';
import { ConfigService } from '../../services/config/config.service';
import { Credentials } from '../../models/credentials.models';

@Component({
  selector: 'app-top-navbar',
  templateUrl: './top-navbar.component.html',
  styleUrls: ['./top-navbar.component.scss']
})
export class TopNavbarComponent implements OnInit {
  userName: string = '';
  userRole: string = '';
  userType: string = '';
  logoUrl: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private credentialsService: CredentialsService,
    private configService: ConfigService
  ) {
    this.logoUrl = `${this.configService.IMAGE_URL}/front/logo820hd-w.png`;
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    const credentials = this.credentialsService.getCredentialsParsed();
    if (credentials) {
      this.userName = credentials.contact || credentials.contacto || credentials.name || credentials.nombre || '';
      this.userType = credentials.type || '';
      this.userRole = this.getUserRoleLabel(this.userType);
    }
  }

  private getUserRoleLabel(type: string): string {
    switch(type) {
      case 'admin':
        return 'Administrador';
      case 'technician':
        return 'Técnico';
      default:
        return 'Usuario';
    }
  }

  navigateToOrders(): void {
    this.router.navigate(['/manage/ordenes']);
  }

  navigateToClients(): void {
    this.router.navigate(['/manage/clientes']);
  }

  navigateToTechnicians(): void {
    this.router.navigate(['/manage/tecnicos']);
  }

  navigateToOffers(): void {
    this.router.navigate(['/manage/ofertas']);
  }

  navigateToNews(): void {
    this.router.navigate(['https://x.com/helpdesk820']);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/signin']);
      },
      error: (error) => {
        console.error('Error during logout:', error);
        // Force navigation even if logout fails
        this.router.navigate(['/signin']);
      }
    });
  }
}

