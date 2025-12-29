import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PersonnelCategory {
  id: number;
  descripcion: string;
  preciohora: number;
}

@Injectable({
  providedIn: 'root'
})
export class PersonnelCategoryService {

  private apiUrl = `${environment.API_URL}/api/categories`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las categorías de personal
   * @returns Observable con la lista de categorías
   */
  getAllCategories(): Observable<PersonnelCategory[]> {
    return this.http.get<PersonnelCategory[]>(this.apiUrl);
  }

  /**
   * Obtiene una categoría por ID
   * @param id ID de la categoría
   * @returns Observable con la categoría
   */
  getCategoryById(id: number): Observable<PersonnelCategory> {
    return this.http.get<PersonnelCategory>(`${this.apiUrl}/${id}`);
  }
}
