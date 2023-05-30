import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpContext,
  HttpContextToken
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { CredentialsService } from '../services/credentials/credentials.service';


const CHECK_METHOD = new HttpContextToken<boolean>( () => true );

export function checkMethod() {
  return new HttpContext().set(CHECK_METHOD, false);
}

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(private credentialsService: CredentialsService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if(request.context.get(CHECK_METHOD)) {
      request = this.addToken(request);
      return next.handle(request);
    }
    return next.handle(request);
  }

  private addToken(request: HttpRequest<unknown>) {
    const token = this.credentialsService.getToken();
    const data = JSON.parse(this.credentialsService.getCredentials()!);
    const type = data['type'];
    if (token) {
      const authReq = request.clone({
        setHeaders: {
          'access-token': token,
          'type': type,
        },
        withCredentials: true
      });
      return authReq;
    }
    return request;
  }
}
