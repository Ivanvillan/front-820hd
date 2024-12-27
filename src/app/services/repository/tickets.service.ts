import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { Ticket } from '../../models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  private API_URI: string;

  constructor(private http: HttpClient) {
    this.API_URI = `${environment.API_URL}/api/tickets`;
  }

  getMesaAyuda(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.API_URI}/0`);
  }

  getSistema(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.API_URI}/1`);
  }
}
