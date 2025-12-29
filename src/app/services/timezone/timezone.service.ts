import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as moment from 'moment-timezone';

/**
 * Servicio centralizado de zona horaria
 * Elimina timezone hardcodeado y permite configuración
 */
@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  
  private timezone: string;

  constructor() {
    this.timezone = this.initializeTimezone();
  }

  private initializeTimezone(): string {
    // Si está configurado auto-detect
    if (environment.autoDetectTimezone) {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        // Fallback si falla la detección
        return environment.defaultTimezone;
      }
    }
    
    // Usar default del environment
    return environment.defaultTimezone;
  }

  /**
   * Obtiene la zona horaria actual
   */
  getTimezone(): string {
    return this.timezone;
  }

  /**
   * Formatea una fecha con la zona horaria configurada
   */
  formatDateTime(date: Date | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    return moment(date).tz(this.timezone).format(format);
  }

  /**
   * Obtiene string de tiempo actual en la zona horaria configurada
   */
  getCurrentTimeString(): string {
    return moment().tz(this.timezone).format();
  }
}

