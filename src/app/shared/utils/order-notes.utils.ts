/**
 * Utilidades compartidas para el manejo de notas de órdenes
 * Estas funciones aseguran consistencia entre gestión de órdenes y vista de técnico
 */

export interface OrderNote {
  id?: number;
  content: string;
  timestamp: Date;
  technician: string;
}

/**
 * Parsea las observaciones del backend al formato de notas estructurado
 * @param observaciones - Campo observaciones del backend (puede ser JSON o texto plano)
 * @param orderDate - Fecha de la orden para usar como fallback
 * @returns Array de notas estructuradas
 */
export function parseOrderNotes(observaciones: string | undefined, orderDate?: string): OrderNote[] {
  if (!observaciones || !observaciones.trim()) {
    return [];
  }

  try {
    // Intentar parsear las observaciones como JSON (formato nuevo)
    const parsedNotes = JSON.parse(observaciones);
    if (Array.isArray(parsedNotes)) {
      return parsedNotes.map(note => ({
        id: note.id || Date.now() + Math.random(),
        content: note.content || '',
        timestamp: new Date(note.timestamp || Date.now()),
        technician: note.technician || 'Sistema'
      }));
    }
  } catch (e) {
    // Si no es JSON válido, tratar como texto plano (formato antiguo)
    console.warn('Parsing observaciones as plain text:', e);
  }

  // Crear una nota con el contenido existente
  return [{
    id: Date.now(),
    content: observaciones.trim(),
    timestamp: new Date(orderDate || Date.now()),
    technician: 'Sistema'
  }];
}

/**
 * Convierte las notas al formato JSON para guardar en el backend
 * @param notes - Array de notas
 * @returns String JSON para guardar en el campo observaciones
 */
export function serializeOrderNotes(notes: OrderNote[]): string {
  const notesForBackend = notes.map(note => ({
    content: note.content,
    timestamp: note.timestamp.toISOString(),
    technician: note.technician
  }));
  
  return JSON.stringify(notesForBackend);
}

/**
 * Crea una nueva nota con los datos correctos
 * @param content - Contenido de la nota
 * @param technicianName - Nombre del técnico (por defecto 'Técnico del Sistema')
 * @returns Nueva nota estructurada
 */
export function createNewNote(content: string, technicianName: string = 'Técnico del Sistema'): OrderNote {
  return {
    id: Date.now() + Math.random(), // ID único
    content: content.trim(),
    timestamp: new Date(),
    technician: technicianName
  };
}

/**
 * Obtiene el nombre del técnico actual
 * @returns Nombre del técnico actual (fallback)
 */
export function getCurrentTechnicianName(): string {
  return 'Sistema';
}

/**
 * Obtiene el nombre del técnico desde las credenciales del usuario
 * Busca en múltiples campos para máxima compatibilidad
 * 
 * Estructura esperada de credenciales (guardadas en localStorage):
 * {
 *   idContact: number,   // credentials.id7c
 *   contact: string,     // credentials.contacto (nombre del técnico)
 *   idClient: number,    // credentials.id7
 *   name: string,        // credentials.contacto (duplicado)
 *   email: string,
 *   type: string,        // 'customer' | 'admin' | 'technician'
 *   area: string         // 'campo' | 'laboratorio' | '820hd'
 * }
 * 
 * @param credentials - Credenciales del usuario (opcional, string JSON u objeto parseado)
 * @returns Nombre del técnico o valor por defecto
 */
export function getTechnicianNameFromCredentials(credentials?: string | object | null): string {
  if (!credentials) {
    return getCurrentTechnicianName();
  }
  
  try {
    // Si es string, parsear; si es objeto, usar directamente
    const userData = typeof credentials === 'string' 
      ? JSON.parse(credentials) 
      : credentials;
    
    // El campo 'contact' y 'name' contienen credentials.contacto 
    // que para técnicos es el nombre de la tabla 6personal
    if (userData.contact && typeof userData.contact === 'string' && userData.contact.trim()) {
      return userData.contact.trim();
    }
    
    if (userData.name && typeof userData.name === 'string' && userData.name.trim()) {
      return userData.name.trim();
    }
    
    // Fallback a email (extraer parte antes del @)
    if (userData.email && typeof userData.email === 'string' && userData.email.includes('@')) {
      const emailName = userData.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
  } catch (error) {
    console.error('Error al parsear credenciales:', error);
  }
  
  return getCurrentTechnicianName();
}

/**
 * Valida el contenido de una nota
 * @param content - Contenido a validar
 * @param minLength - Longitud mínima (por defecto 10)
 * @returns true si es válido, false si no
 */
export function validateNoteContent(content: string, minLength: number = 10): boolean {
  return Boolean(content && content.trim().length >= minLength);
}

/**
 * Crea una nota inicial para una orden nueva
 * @param orderDate - Fecha de la orden
 * @returns Nota inicial del sistema
 */
export function createInitialNote(orderDate: string | Date): OrderNote {
  return {
    id: Date.now(),
    content: 'Orden recibida y asignada al técnico',
    timestamp: new Date(orderDate || Date.now()),
    technician: 'Sistema'
  };
}

/**
 * Formatea las notas para mostrar de manera legible al usuario
 * @param notes - Array de notas
 * @returns String formateado para mostrar en la UI
 */
export function formatNotesForDisplay(notes: OrderNote[]): string {
  if (!notes || notes.length === 0) {
    return 'Sin observaciones';
  }

  // Ordenar por timestamp descendente (más reciente primero)
  const sortedNotes = [...notes].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return dateB - dateA; // Orden descendente
  });

  return sortedNotes.map(note => {
    const date = new Date(note.timestamp);
    const formattedDate = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `• ${note.content}\n  ${formattedDate} - ${note.technician}`;
  }).join('\n\n');
}

/**
 * Formatea una sola nota para mostrar de manera legible
 * @param note - Nota individual
 * @returns String formateado para mostrar en la UI
 */
export function formatSingleNoteForDisplay(note: OrderNote): string {
  const date = new Date(note.timestamp);
  const formattedDate = date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `${note.content}\n${formattedDate} - ${note.technician}`;
}
