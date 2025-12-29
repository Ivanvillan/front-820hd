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
   * Obtiene todos los materiales activos
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
   * Filtra materiales por rubro
   */
  getMaterialsByRubro(idRubro: number): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.API_URI}/rubro/${idRubro}`);
  }

  /**
   * Busca materiales por código o descripción
   */
  searchMaterials(term: string): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.API_URI}/search/${encodeURIComponent(term)}`);
  }

  /**
   * Crea un nuevo material en la base de datos
   */
  createMaterial(materialData: {
    descripcion: string;
    unidad?: string;
    punitario?: number;
    idrubro?: number | null;
    iva19?: number;
  }): Observable<Material> {
    return this.http.post<Material>(this.API_URI, materialData);
  }

  /**
   * Obtiene todos los rubros disponibles
   */
  getRubros(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URI}/rubros/list`);
  }
}
