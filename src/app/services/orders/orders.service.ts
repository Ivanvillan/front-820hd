import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  API_URI: string = 'http://localhost:3002/api/issues';

  constructor(private http: HttpClient) { }

  readAll(id: number) {
    return this.http.get(`${this.API_URI}/${id}`)
  }

  create(data: any) {
    return this.http.post(this.API_URI, data)
  }

}
