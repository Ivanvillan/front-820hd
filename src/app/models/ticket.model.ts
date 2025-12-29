export interface Ticket {
  // Campos básicos del ticket (1req_chino)
  id1: number;
  numero: string;
  descripcion: string;
  fecha: string;
  hora: string;
  
  // Campos de contacto y cliente
  contacto: string;
  telefono: string;
  email?: string; // Email del cliente
  nombre?: string; // Nombre de la empresa (opcional)
  empresa?: string; // Alias para nombre
  idcliente?: number; // ID del cliente
  idcontacto?: number; // ID del contacto
  
  // Campos de estado y asignación
  finalizado: boolean;
  anulada: boolean;
  fechafin?: string; // Fecha de finalización (formato ISO o SQL datetime)
  numerofin: string;
  referente: string;
  prioridad?: string;
  
  // Campos de técnicos responsables (soporte múltiple)
  idresponsable?: string; // String separado por comas "74,76,123"
  responsables?: Array<{ id: number; nombre: string }>; // Array parseado de responsables
  nombreAsignado?: string; // Concatenado "Nombre1 / Nombre2 / Nombre3"
  sector?: string;
  estado?: string;
  
  // Campo de observaciones (texto plano - resumen del trabajo realizado)
  observaciones?: string;
  
  // Campos de materiales utilizados
  txtmateriales?: string; // Materiales utilizados por el técnico (texto libre)
  materiales?: number | null; // Campo numérico legacy (raramente usado)
  materials?: Array<{ // Materiales desde 21movmat (estructurados)
    id19: number;
    cantidad: number;
    punitario: number;
    codigo?: string;
    descripcion?: string;
    unidad?: string;
    minimo?: number;
    precio_actual?: number;
    idrubro?: number;
    iva19?: number;
  }>;
  
  // Campos de fechas/horas de ejecución del trabajo
  fechaini?: string; // Fecha inicio del trabajo
  horaini?: string; // Hora inicio del trabajo
  horafin?: string; // Hora fin del trabajo
  htotal?: number; // Horas totales de trabajo
  
  // Campos legacy (mantener para compatibilidad)
  mda?: boolean;
  insu?: boolean;
  mant?: boolean;  // Mantenimiento (0 o 1)
  sopo?: boolean;
  limp?: boolean;  // Limpieza (0 o 1)
  numint?: string;
  numerosoli?: string;
  
  // Campos opcionales para funcionalidad adicional
  tipo?: string;
  
  // Campo de tipo de servicio
  tiposerv?: number; // ID del servicio asignado
  tipoServicioNombre?: string; // Nombre del servicio
}

// Enums para los valores permitidos
export enum OrderSector {
  CAMPO = 'Campo',
  LABORATORIO = 'Laboratorio',
  HD820 = '820HD'
}

export enum OrderStatus {
  PENDIENTE = 'Pendiente',
  EN_PROGRESO = 'En Progreso',
  EN_DIAGNOSTICO = 'En Diagnóstico',
  ESPERANDO_APROBACION = 'Esperando Aprobación',
  ESPERANDO_REPUESTO = 'Esperando Repuesto',
  FINALIZADA = 'Finalizada',
  CANCELADA = 'Cancelada'
}

// Interfaz para el estado de finalización
export interface OrderFinalizationStatus {
  finalizado: boolean;
  anulada: boolean;
  estado: OrderStatus;
}
