import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Ticket, OrderSector, OrderStatus } from 'src/app/models/ticket.model';
import { CredentialsService } from '../credentials/credentials.service';
import { 
  Order, 
  CreateOrderDTO, 
  UpdateOrderDTO, 
  OrdersResponse, 
  OrderFilters,
  CreateIssueDTO 
} from 'src/app/models/order.model';
import { Customer } from 'src/app/models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  API_URI = `${environment.API_URL}/api/issues`;

  constructor(
    private http: HttpClient,
    private credentialsService: CredentialsService
  ) { }

  // ✅ Métodos con tipado completo
  
  readAllClients(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.API_URI}/clients/all`);
  }

  readAll(id: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URI}/${id}`);
  }

  readAllByContact(id: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URI}/contact/${id}`);
  }

  readByDate(id: string, first: string, second: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URI}/interval/${id}/${first}/${second}`);
  }

  readByDateAndContact(id: string, first: string, second: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URI}/interval/contact/${id}/${first}/${second}`);
  }

  createIssue(data: CreateIssueDTO): Observable<Order> {
    return this.http.post<Order>(this.API_URI, data);
  }

  createOrder(data: CreateOrderDTO): Observable<Order> {
    return this.http.post<Order>(`${this.API_URI}/internal-orders`, data);
  }

  /**
   * Convierte una fecha a string en formato yyyy-MM-dd sin problemas de zona horaria
   */
  private toDateString(date: any): string {
    if (!date) return '';
    
    // Si ya es un string en formato yyyy-MM-dd, devolverlo tal como está
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Si es un objeto Date, usar métodos locales para evitar problemas de zona horaria
    let d: Date;
    
    if (date instanceof Date) {
      d = date;
    } else if (typeof date === 'string') {
      // Para strings, crear la fecha de manera que evite problemas de zona horaria
      // Si es formato ISO (YYYY-MM-DD), crear fecha local
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        d = new Date(year, month - 1, day);
      } else {
        d = new Date(date);
      }
    } else {
      d = new Date(date);
    }
    
    // Verificar que la fecha es válida
    if (isNaN(d.getTime())) {
      console.warn('Invalid date provided:', date);
      return '';
    }
    
    // Usar métodos locales para obtener año, mes y día sin conversión de zona horaria
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd}`;
  }

  getInternalOrders(
    filters?: OrderFilters, 
    page: number = 1, 
    limit: number = 50
  ): Observable<OrdersResponse> {
    let params = new HttpParams()
      .append('page', page.toString())
      .append('limit', limit.toString());
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          if (key === 'dateRange') {
            if (value.start) params = params.append('startDate', this.toDateString(value.start));
            if (value.end) params = params.append('endDate', this.toDateString(value.end));
          } else {
            params = params.append(key, String(value));
          }
        }
      });
    }
    
    return this.http.get<OrdersResponse>(`${this.API_URI}/internal-orders`, { params });
  }

  /**
   * Obtiene remitos desde el proxy del backend
   * @param filters startDate, endDate (ISO o yyyy-MM-dd), clientId
   */
  getRemitos(filters: { startDate?: string; endDate?: string; clientId?: number } = {}): Observable<any[]> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      const value: any = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.append(key, String(value));
      }
    });
    return this.http.get<any[]>(`${this.API_URI}/remitos`, { params });
  }

  /**
   * Obtiene los items/materiales de un remito específico
   * @param remitoId ID del remito
   */
  getRemitoItems(remitoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}/remitos/${remitoId}/items`);
  }

  updateOrder(id: string, data: UpdateOrderDTO): Observable<Order> {
    return this.http.patch<Order>(`${this.API_URI}/orders/${id}`, data);
  }

  deleteOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URI}/internal-orders/${id}`);
  }

  /**
   * Obtiene las órdenes asignadas a un técnico por área
   * @param technicianId - ID del técnico
   * @param area - Área de trabajo (campo, laboratorio, 820hd)
   * @returns Observable con las órdenes asignadas
   */
  getAssignedOrdersByArea(technicianId: number, area: string): Observable<Order[]> {
    const params = new HttpParams()
      .append('technicianId', technicianId.toString())
      .append('area', area);
    
    return this.http.get<Order[]>(`${this.API_URI}/assigned`, { params });
  }

  /**
   * Obtiene las órdenes asignadas al técnico logueado para un sector específico
   * @param sector - Sector de trabajo (campo, laboratorio, 820hd)
   * @returns Observable con las órdenes asignadas
   */
  getMyAssignedOrders(sector: string): Observable<Ticket[]> {
    // Obtener el ID del técnico desde las credenciales
    const credentials = this.credentialsService.getCredentials();
    if (!credentials) {
      throw new Error('No se encontraron credenciales de usuario');
    }
    
    const userData = JSON.parse(credentials);
    const technicianId = userData.idClient || userData.idContact;
    
    const params = new HttpParams()
      .append('sector', sector)
      .append('userId', technicianId.toString());
    
    return this.http.get<Ticket[]>(`${environment.API_URL}/api/tickets/mytasks`, { params });
  }

  /**
   * Obtiene el detalle de una orden específica por ID
   * @param id - ID de la orden
   * @returns Observable con el detalle de la orden
   */
  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.API_URI}/orders/${id}`);
  }

}
