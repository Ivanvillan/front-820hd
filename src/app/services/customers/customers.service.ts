import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Customer } from '../../models/customer.model';

export interface CustomerFilters {
  nombre?: string;
  cuit?: string;
  email?: string;
  direccion?: string;
  telefono?: string;
}

export interface CustomerSearchResponse {
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  private apiUrl = `${environment.API_URL}/api/customers`;

  constructor(private http: HttpClient) { }

  find(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl);
  }

  getCustomers(filters: CustomerFilters, page: number = 1, limit: number = 25): Observable<Customer[]> {
    let params = new HttpParams();
    
    // Agregar parámetros de paginación
    params = params.append('page', page.toString());
    params = params.append('limit', limit.toString());
    
    // Agregar filtros si están presentes
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof CustomerFilters] && filters[key as keyof CustomerFilters]!.trim()) {
          params = params.append(key, filters[key as keyof CustomerFilters]!.trim());
        }
      });
    }
    
    return this.http.get<Customer[]>(this.apiUrl, { params });
  }

  searchCustomers(filters: CustomerFilters, page: number = 1, limit: number = 25): Observable<CustomerSearchResponse> {
    let params = new HttpParams();
    
    // Agregar parámetros de paginación
    params = params.append('page', page.toString());
    params = params.append('limit', limit.toString());
    
    // Agregar filtros si están presentes
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof CustomerFilters] && filters[key as keyof CustomerFilters]!.trim()) {
          params = params.append(key, filters[key as keyof CustomerFilters]!.trim());
        }
      });
    }
    
    return this.http.get<CustomerSearchResponse>(`${this.apiUrl}/search`, { params });
  }

  createCustomer(customer: Omit<Customer, 'id'>): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customer);
  }

  updateCustomer(id: number, customer: Partial<Omit<Customer, 'id'>>): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, customer);
  }

  deleteCustomer(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getCustomerById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  getCustomerContacts(customerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${customerId}/contacts`);
  }
} 