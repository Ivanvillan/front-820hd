/**
 * Modelo para notas de trabajo internas
 * Se usa para visualización cronológica del progreso de una orden,
 * pero NO se persiste en la base de datos como JSON.
 * 
 * Las observaciones en la DB son texto plano (resumen final del trabajo).
 */
export interface WorkNote {
  /** Contenido de la nota */
  content: string;
  
  /** Timestamp de creación */
  timestamp: Date | string;
  
  /** Nombre del técnico que agregó la nota */
  technician: string;
  
  /** Tipo de nota (opcional) */
  type?: 'general' | 'material' | 'status_change' | 'system';
}

/**
 * Parsea un string de observaciones en array de WorkNotes
 * Soporta formato JSON legacy y texto plano
 * 
 * @param observaciones - String de observaciones (JSON o texto plano)
 * @returns Array de WorkNotes parseadas
 */
export function parseObservacionesToNotes(observaciones: string | undefined): WorkNote[] {
  if (!observaciones || !observaciones.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(observaciones);
    if (Array.isArray(parsed)) {
      return parsed.map(note => ({
        content: note.content || note.text || note.texto || '',
        timestamp: note.timestamp || new Date().toISOString(),
        technician: note.technician || note.tecnico || 'Sistema',
        type: note.type || note.tipo || 'general'
      }));
    }
  } catch {
    // No es JSON, tratar como texto plano
    return [{
      content: observaciones,
      timestamp: new Date().toISOString(),
      technician: 'Sistema',
      type: 'general'
    }];
  }

  return [];
}

/**
 * Serializa un array de WorkNotes a string JSON
 * 
 * @param notes - Array de WorkNotes
 * @returns String JSON
 */
export function serializeNotesToObservaciones(notes: WorkNote[]): string {
  if (!notes || notes.length === 0) {
    return '';
  }
  return JSON.stringify(notes);
}

/**
 * Extrae el resumen de texto plano de las observaciones
 * Si es JSON, retorna una versión concatenada legible
 * 
 * @param observaciones - String de observaciones
 * @returns Texto plano del resumen
 */
export function getObservacionesPlainText(observaciones: string | undefined): string {
  if (!observaciones || !observaciones.trim()) {
    return '';
  }

  try {
    const notes = parseObservacionesToNotes(observaciones);
    if (notes.length > 0) {
      return notes
        .filter(note => note.type !== 'material')
        .map(note => note.content)
        .join('\n');
    }
  } catch {
    // No es JSON, retornar como está
  }

  return observaciones;
}

