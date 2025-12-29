import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Service } from 'src/app/models/service.model';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  API_URI = `${environment.API_URL}/api/services`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los servicios (ng-select maneja la performance)
   */
  getServices(): Observable<Service[]> {
    return this.http.get<Service[]>(this.API_URI);
  }
}
