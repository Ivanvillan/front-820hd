import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Material } from 'src/app/models/material.model';

@Injectable({
  providedIn: 'root'
})
export class MaterialsService {

  private API_URI = `${environment.API_URL}/api/materials`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los materiales activos desde la API externa
   */
  getMaterials(): Observable<Material[]> {
    return this.http.get<Material[]>(this.API_URI);
  }

  /**
   * Obtiene un material específico por ID
   */
  getMaterialById(id: number): Observable<Material> {
    return this.http.get<Material>(`${this.API_URI}/${id}`);
  }

  /**
   * Busca materiales por nombre o marca
   */
  searchMaterials(term: string): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.API_URI}/search/${encodeURIComponent(term)}`);
  }
}
