export interface Customer {
  id: number;
  nombre: string;
  cuit: string;
  direccion: string;
  localidad?: string;
  cp?: string;
  idprov?: number;
  telefono: string;
  email: string;
  condicion_iva: string;
  tipocli?: string;
  contacts?: Contact[];
}

export interface Contact {
  id7c: number;
  nombre: string;
  email: string;
  telefono: string;
  pass?: string;
  cargo?: string;
  id77: number; // ID del cliente al que pertenece
} 