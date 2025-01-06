import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';

@Component({
  selector: 'app-dashboard-auth',
  templateUrl: './dashboard-auth.component.html',
  styleUrls: ['./dashboard-auth.component.css']
})
export class DashboardAuthComponent {
  accessCode: string = '';
  error: string = '';
  hidePassword: boolean = true;

  constructor(
    private credentialsService: CredentialsService,
    private router: Router
  ) {}

  validateAccess() {
    const validCode = 'pcassi.2016';
    if (this.accessCode === validCode) {
      this.credentialsService.saveDashboardToken('dashboard_view_only');
      this.router.navigate(['/dashboard-view']);
    } else {
      this.error = 'Código de acceso inválido';
    }
  }
} 