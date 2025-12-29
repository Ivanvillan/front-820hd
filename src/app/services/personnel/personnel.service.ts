import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Technician {
  id: number;
  name: string;
  apellido?: string;
  area: string;
  email?: string;
  telefono?: string;
  activo?: boolean;
  fecha_ingreso?: string;
  categoria_id?: number;
  password?: string; // Campo para contraseña (opcional en lectura)
}

export interface UpdateAreaResponse {
  message: string;
  id: number;
  area: string;
}

export interface CreateTechnicianRequest {
  name: string;
  apellido?: string;
  area: string;
  email?: string;
  telefono?: string;
  categoria_id?: number;
  password?: string; // Campo para contraseña en creación
}

export interface UpdateTechnicianRequest {
  name?: string;
  apellido?: string;
  area?: string;
  email?: string;
  telefono?: string;
  activo?: boolean;
  categoria_id?: number;
  password?: string; // Campo para contraseña en actualización
}

export interface TechnicianResponse {
  message: string;
  technician: Technician;
}

@Injectable({
  providedIn: 'root'
})
export class PersonnelService {

  private API_URI = `${environment.API_URL}/api`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de técnicos
   * @param activo - Si es true, solo devuelve técnicos activos. Si es false o undefined, devuelve todos.
   * @returns Observable con la lista de técnicos
   */
  getTechnicians(activo?: boolean): Observable<Technician[]> {
    let url = `${this.API_URI}/personnel/technicians`;
    
    // Agregar query param si se especifica activo
    if (activo === true) {
      url += '?activo=true';
    }
    
    return this.http.get<Technician[]>(url);
  }

  /**
   * Actualiza el área de un técnico
   * @param technicianId - ID del técnico
   * @param area - Nueva área
   * @returns Observable con la respuesta
   */
  updateTechnicianArea(technicianId: number, area: string): Observable<UpdateAreaResponse> {
    return this.http.put<UpdateAreaResponse>(`${this.API_URI}/personnel/${technicianId}/area`, { area });
  }

  /**
   * Crea un nuevo técnico
   * @param technician - Datos del técnico a crear
   * @returns Observable con la respuesta
   */
  createTechnician(technician: CreateTechnicianRequest): Observable<TechnicianResponse> {
    return this.http.post<TechnicianResponse>(`${this.API_URI}/personnel`, technician);
  }

  /**
   * Actualiza un técnico existente
   * @param technicianId - ID del técnico
   * @param technician - Datos a actualizar
   * @returns Observable con la respuesta
   */
  updateTechnician(technicianId: number, technician: UpdateTechnicianRequest): Observable<TechnicianResponse> {
    return this.http.put<TechnicianResponse>(`${this.API_URI}/personnel/${technicianId}`, technician);
  }

  /**
   * Elimina un técnico
   * @param technicianId - ID del técnico
   * @returns Observable con la respuesta
   */
  deleteTechnician(technicianId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URI}/personnel/${technicianId}`);
  }

  /**
   * Obtiene un técnico específico por ID
   * @param technicianId - ID del técnico
   * @returns Observable con el técnico
   */
  getTechnicianById(technicianId: number): Observable<Technician> {
    return this.http.get<Technician>(`${this.API_URI}/personnel/${technicianId}`);
  }
}