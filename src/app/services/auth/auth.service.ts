import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { tap } from 'rxjs/operators';

import { BehaviorSubject } from 'rxjs';
import { CredentialsService } from '../credentials/credentials.service';
import { checkMethod } from 'src/app/interceptors/token.interceptor';
import { Credentials } from 'src/app/models/credentials.models';
import { Auth } from 'src/app/models/auth.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private showHeader = new BehaviorSubject(false);

  showHeader$ = this.showHeader.asObservable();

  API_URI = `${environment.API_URL}/api`;

  constructor(private http: HttpClient, private credentialsService: CredentialsService) { }

  login(login: Auth) {
    return this.http.post<Credentials[]>(`${this.API_URI}/auth`, login, { context: checkMethod()})
    .pipe(
      tap(res => {
        const credentials = Object.assign({}, res[0], res[1]);        
        this.credentialsService.saveCredentials(credentials);
        this.showHeader.next(true);
      })
    )
  }

  logout() {
    return this.http.post(`${this.API_URI}/auth/logout`, '')
    .pipe(
      tap(() => {
        this.credentialsService.revokeCredentials();
      })
    )
  }
}
