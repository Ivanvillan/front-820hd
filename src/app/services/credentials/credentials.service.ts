import { Injectable } from '@angular/core';
import { Credentials } from 'src/app/models/credentials.models';
import * as moment from 'moment-timezone';

@Injectable({
  providedIn: 'root'
})
export class CredentialsService {

  constructor() { }

  saveCredentials(credentials: Credentials): void {
    const timeZone = 'America/Argentina/Buenos_Aires';
    const timeString = moment().tz(timeZone).format();
    const token = credentials.token;
    const data = {
      'idContact': credentials.id7c,
      'contact': credentials.contacto,
      'idClient': credentials.id7,
      'name': credentials.contacto,
      'email': credentials.email,
      'type': credentials.type,
      'time': timeString
    }
    localStorage.setItem('credentials', JSON.stringify(data));
    localStorage.setItem('token', token);
    localStorage.setItem('news', 'true')
  }

  getCredentials() {
    const credentials = localStorage.getItem('credentials');
    return credentials;
  }

  getToken() {
    const token = localStorage.getItem('token');
    return token;
  }

  getNewsStorage() {
    const news = localStorage.getItem('news');
    return news;
  }

  revokeNewsStorage() {
    localStorage.removeItem('news');
  }

  revokeCredentials() {
    localStorage.clear();
  }

  saveDashboardToken(token: string): void {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24); // Expira en 24 horas
    
    const dashboardData = {
      token: token,
      expiration: expirationDate.getTime()
    };
    
    localStorage.setItem('dashboard_token', JSON.stringify(dashboardData));
  }

  getDashboardToken(): string | null {
    const dashboardData = localStorage.getItem('dashboard_token');
    
    if (!dashboardData) {
      return null;
    }

    const { token, expiration } = JSON.parse(dashboardData);
    const now = new Date().getTime();

    if (now > expiration) {
      // Token expirado, eliminarlo
      localStorage.removeItem('dashboard_token');
      return null;
    }

    return token;
  }
}
