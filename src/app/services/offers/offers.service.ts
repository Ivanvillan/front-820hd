import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { checkMethod } from 'src/app/interceptors/token.interceptor';
import { CreateOfferDTO, Offer } from 'src/app/models/offers.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OffersService {

  API_URI = `${environment.API_URL}/api/advertisements`;

  constructor(private http: HttpClient) { }

  readAll() {
    return this.http.get<Offer[]>(`${this.API_URI}/10/all`)
  }

  readStandard() {
    return this.http.get<Offer[]>(`${this.API_URI}/5/standard`)
  }

  readWeekly() {
    return this.http.get<Offer[]>(`${this.API_URI}/9/weekly`)
  }
  create(data: CreateOfferDTO) {
    return this.http.post<Offer[]>(`${this.API_URI}`, data)
  }
  delete(id: number) {
    return this.http.delete(`${this.API_URI}/${id}`)
  }
}
