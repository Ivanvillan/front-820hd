/**
 * Utilidades compartidas para manejo de fechas
 * Centraliza funciones de parsing y validación de fechas para evitar duplicación
 */

/**
 * Parsea una fecha desde string o Date para el datepicker de Angular Material
 * Maneja formatos: "2026-01-14 00:00:00", "2026-01-14", Date object, o null/undefined
 * 
 * IMPORTANTE: Usa componentes de fecha (year, month, day) para crear Date object
 * en zona horaria local, evitando problemas de timezone al parsear strings.
 * 
 * @param dateValue - String de fecha, Date object, o null/undefined
 * @returns Date object en zona horaria local o null si no se puede parsear
 * 
 * @example
 * parseDateForDatepicker("2026-01-22") // Returns Date(2026, 0, 22) en zona local
 * parseDateForDatepicker("2026-01-22 00:00:00") // Returns Date(2026, 0, 22) en zona local
 * parseDateForDatepicker(new Date()) // Returns el mismo Date object
 * parseDateForDatepicker(null) // Returns null
 */
export function parseDateForDatepicker(dateValue: any): Date | null {
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
      // new Date(year, month, day) crea la fecha en zona horaria local
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

/**
 * Valida que la fecha de fin sea mayor o igual a la fecha de inicio
 * 
 * @param fechaini - Fecha de inicio (Date, string YYYY-MM-DD, o null)
 * @param fechafin - Fecha de fin (Date, string YYYY-MM-DD, o null)
 * @param horaini - Hora de inicio (string HH:mm o null)
 * @param horafin - Hora de fin (string HH:mm o null)
 * @returns true si la validación pasa, false si fechafin < fechaini
 */
export function validateDateRange(
  fechaini: Date | string | null | undefined,
  fechafin: Date | string | null | undefined,
  horaini?: string | null,
  horafin?: string | null
): boolean {
  // Si no hay fechas, la validación pasa (son opcionales)
  if (!fechaini || !fechafin) {
    return true;
  }
  
  // Parsear fechas a Date objects
  const fechaIni = fechaini instanceof Date ? fechaini : parseDateForDatepicker(fechaini);
  const fechaFin = fechafin instanceof Date ? fechafin : parseDateForDatepicker(fechafin);
  
  if (!fechaIni || !fechaFin) {
    return true; // Si no se pueden parsear, dejar que otros validadores manejen
  }
  
  // Si hay horas, incluirlas en la comparación
  if (horaini && horafin) {
    const [horaIni, minIni] = horaini.split(':').map(Number);
    const [horaFin, minFin] = horafin.split(':').map(Number);
    
    if (!isNaN(horaIni) && !isNaN(minIni) && !isNaN(horaFin) && !isNaN(minFin)) {
      fechaIni.setHours(horaIni, minIni, 0, 0);
      fechaFin.setHours(horaFin, minFin, 0, 0);
    }
  }
  
  // Validar que fecha fin >= fecha inicio
  return fechaFin.getTime() >= fechaIni.getTime();
}

/**
 * Obtiene un mensaje de error para validación de rango de fechas
 * 
 * @returns Mensaje de error en español
 */
export function getDateRangeErrorMessage(): string {
  return 'La fecha de fin debe ser mayor o igual a la fecha de inicio';
}
