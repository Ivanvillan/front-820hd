import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * Servicio centralizado de configuración
 * Elimina necesidad de window.location.hostname
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  
  // URLs de API configuradas según environment
  public readonly API_URL: string = environment.API_URL;
  public readonly IMAGE_URL: string = environment.IMAGE_URL;
  
  constructor() {}
  
  /**
   * Obtiene URL de imagen según el path
   */
  getImageUrl(path: string): string {
    return `${this.IMAGE_URL}/${path}`;
  }
}

