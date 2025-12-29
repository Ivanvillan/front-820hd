import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Contact } from '../../models/customer.model';

export interface ContactFilters {
  nombre?: string;
  email?: string;
}

export interface ContactCreateData {
  nombre: string;
  email: string;
  telefono?: string;
  pass?: string;
  id77: number; // ID del cliente
}

export interface ContactUpdateData {
  nombre: string;
  email: string;
  telefono?: string;
  pass?: string;
}

export interface ContactStats {
  totalContacts: number;
  contactsWithPhone: number;
  contactsWithRole: number; // Siempre será 0 ya que no existe el campo cargo en la BD
}

@Injectable({
  providedIn: 'root'
})
export class ContactsService {

  private baseUrl = `${environment.API_URL}/api/contacts`;

  constructor(private http: HttpClient) { }

  /**
   * Obtener contactos de un cliente específico
   */
  getCustomerContacts(customerId: number, filters?: ContactFilters): Observable<Contact[]> {
    let url = `${this.baseUrl}/customer/${customerId}`;
    
    if (filters) {
      const params = new URLSearchParams();
      if (filters.nombre) params.append('nombre', filters.nombre);
      if (filters.email) params.append('email', filters.email);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    
    return this.http.get<Contact[]>(url);
  }

  /**
   * Obtener un contacto específico por ID
   */
  getContactById(contactId: number): Observable<Contact> {
    return this.http.get<Contact>(`${this.baseUrl}/${contactId}`);
  }

  /**
   * Crear un nuevo contacto
   */
  createContact(contactData: ContactCreateData): Observable<Contact> {
    return this.http.post<Contact>(this.baseUrl, contactData);
  }

  /**
   * Actualizar un contacto existente
   */
  updateContact(contactId: number, contactData: ContactUpdateData): Observable<Contact> {
    return this.http.put<Contact>(`${this.baseUrl}/${contactId}`, contactData);
  }

  /**
   * Eliminar un contacto
   */
  deleteContact(contactId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${contactId}`);
  }

  /**
   * Obtener estadísticas de contactos de un cliente
   */
  getContactStats(customerId: number): Observable<ContactStats> {
    return this.http.get<ContactStats>(`${this.baseUrl}/customer/${customerId}/stats`);
  }

  /**
   * Buscar contactos con filtros avanzados
   */
  searchContacts(customerId: number, filters: ContactFilters): Observable<Contact[]> {
    return this.getCustomerContacts(customerId, filters);
  }
}
