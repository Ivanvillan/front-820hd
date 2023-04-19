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
  }

  getCredentials() {
    const credentials = localStorage.getItem('credentials');
    return credentials;
  }
  getToken() {
    const token = localStorage.getItem('token');
    return token;
  }

  revokeCredentials() {
    return localStorage.clear();
  }
}
