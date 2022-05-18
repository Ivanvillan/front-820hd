import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CredentialsService } from '../services/credentials/credentials.service';


@Injectable({
  providedIn: 'root'
})

export class AuthGuard implements CanActivate {

  constructor(private credentialsService: CredentialsService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      const token = this.credentialsService.getToken();
      if(!token) {
        this.router.navigate(['signin']);
      }
    return true;
  }
  
}
