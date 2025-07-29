export interface Ticket {
  fecha: string;
  hora: string;
  numero: string;
  descripcion: string;
  nombre: string;
  contacto: string;
  tipo?: string;
  asignado?: string; // Nombre de la persona asignada al ticket
}
