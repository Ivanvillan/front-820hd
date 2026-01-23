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
   * Formatea una fecha a string YYYY-MM-DD usando la zona horaria configurada
   * Evita problemas de timezone al convertir Date a string para envío al backend
   * @param date - Date object o string a formatear
   * @returns string en formato YYYY-MM-DD en zona horaria configurada
   */
  formatDate(date: Date | string): string {
    return moment(date).tz(this.timezone).format('YYYY-MM-DD');
  }

  /**
   * Obtiene string de tiempo actual en la zona horaria configurada
   */
  getCurrentTimeString(): string {
    return moment().tz(this.timezone).format();
  }

  /**
   * Parsea una fecha desde string o Date para el datepicker de Angular Material
   * Maneja formatos: "2026-01-14 00:00:00", "2026-01-14", Date object, o null/undefined
   * 
   * IMPORTANTE: Usa componentes de fecha para crear Date object en zona horaria local,
   * evitando problemas de timezone al parsear strings.
   * 
   * @param dateValue - String de fecha, Date object, o null/undefined
   * @returns Date object en zona horaria local o null si no se puede parsear
   */
  parseDateForDatepicker(dateValue: any): Date | null {
    if (!dateValue) {
      return null;
    }
    
    // Si ya es un Date object, retornarlo directamente
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    // Si es un string, parsearlo
    if (typeof dateValue === 'string') {
      // Extraer solo la parte de fecha (antes del espacio o T)
      const dateStr = dateValue.split(' ')[0].split('T')[0];
      if (dateStr) {
        // Crear fecha usando componentes para evitar problemas de timezone
        const [year, month, day] = dateStr.split('-').map(Number);
        if (year && month && day) {
          const parsed = new Date(year, month - 1, day);
          // Verificar que la fecha es válida
          if (!isNaN(parsed.getTime())) {
            return parsed;
          }
        }
      }
    }
    
    return null;
  }
}

