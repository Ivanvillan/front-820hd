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

  constructor(
    private credentialsService: CredentialsService,
    private router: Router
  ) {}

  validateAccess() {
    const currentDate = new Date();
    const validCode = 'pcassi' + currentDate.getDate() + (currentDate.getMonth() + 1) + currentDate.getFullYear();
    if (this.accessCode === validCode) {
      this.credentialsService.saveDashboardToken('dashboard_view_only');
      this.router.navigate(['/dashboard-view']);
    } else {
      this.error = 'Código de acceso inválido';
    }
  }
} 