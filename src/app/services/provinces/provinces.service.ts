import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Province {
  idprovi: number;
  provincias: string;
  alicuota: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProvincesService {
  private apiUrl = `${environment.API_URL}/api/provinces`;

  constructor(private http: HttpClient) { }

  getProvinces(): Observable<Province[]> {
    return this.http.get<Province[]>(this.apiUrl);
  }
}

