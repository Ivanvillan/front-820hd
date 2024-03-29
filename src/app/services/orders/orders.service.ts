import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  API_URI = `${environment.API_URL}/api/issues`;

  constructor(private http: HttpClient) { }

  readAllClients() {
    return this.http.get(`${this.API_URI}/clients/all`);
  }

  readAll(id: number) {
    return this.http.get(`${this.API_URI}/${id}`)
  }

  readAllByContact(id: number) {
    return this.http.get(`${this.API_URI}/contact/${id}`)
  }

  readByDate(id: string, first: string, second: string) {
    return this.http.get(`${this.API_URI}/interval/${id}/${first}/${second}`)
  }

  readByDateAndContact(id: string, first: string, second: string) {
    return this.http.get(`${this.API_URI}/interval/contact/${id}/${first}/${second}`)
  }

  create(data: any) {
    return this.http.post(this.API_URI, data)
  }

}
