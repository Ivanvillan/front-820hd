import { OrderSector, OrderStatus, Ticket } from './ticket.model';
import { MaterialDTO } from './material.model';

/**
 * @deprecated Usar `Ticket` en su lugar para el modelo principal de órdenes.
 * Este alias se mantiene para compatibilidad con código existente.
 */
export type Order = Ticket;

/**
 * DTO para crear una nueva orden
 */
export interface CreateOrderDTO {
  clientId: number;
  contactId: number;
  description: string;
  assignedToIds?: number[]; // Array de IDs de técnicos responsables
  sector?: OrderSector;
  status?: OrderStatus;
  priority?: 'baja' | 'media' | 'alta' | 'urgente';
  tiposerv?: number;
  txtmateriales?: string; // Materiales utilizados (texto libre)
  fechaini?: string; // Fecha inicio del trabajo
  horaini?: string; // Hora inicio del trabajo
  fechafin?: string; // Fecha fin del trabajo
  horafin?: string; // Hora fin del trabajo
}

/**
 * DTO para actualizar una orden existente
 * Sincronizado con los campos que realmente se envían desde update-order-dialog.component.ts
 */
export interface UpdateOrderDTO {
  // Estado y finalización
  status?: OrderStatus;
  estado?: OrderStatus;
  finalizado?: boolean;
  anulada?: boolean;
  
  // Información del cliente
  clientId?: number; // ID del cliente
  contactId?: number; // ID del contacto
  description?: string; // Descripción del problema
  
  // Tipo de orden
  orderType?: 'insu' | 'mant' | 'sopo' | 'limp'; // Tipo de orden (se convierte a flags insu/mant/sopo/limp)
  insu?: number; // Flag tipo orden: Insumos (0 o 1)
  mant?: number; // Flag tipo orden: Mantenimiento (0 o 1)
  sopo?: number; // Flag tipo orden: Soporte (0 o 1)
  limp?: number; // Flag tipo orden: Limpieza (0 o 1)
  
  // Servicio
  serviceType?: 'in' | 'out'; // Tipo de servicio: 'in' (interno) o 'out' (externo)
  servicioId?: number; // ID del servicio específico (va al campo "servicios" en BD)
  tiposerv?: number; // Tipo de servicio como número (0 = out, 1 = in)
  
  // Asignación
  assignedToIds?: number[]; // Array de IDs de técnicos responsables
  sector?: OrderSector;
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
  
  // Materiales
  txtmateriales?: string; // Materiales utilizados (texto libre para visualización)
  materials?: MaterialDTO[]; // Array de materiales para guardar en 21movmat
  
  // Fechas y horas de trabajo
  fechaini?: string; // Fecha inicio del trabajo
  horaini?: string; // Hora inicio del trabajo
  fechafin?: string; // Fecha fin del trabajo
  horafin?: string; // Hora fin del trabajo
  htotal?: number; // Horas totales de trabajo
  
  // Observaciones
  observaciones?: string; // Resumen del trabajo realizado (texto plano)
}

/**
 * Respuesta paginada de órdenes
 */
export interface OrdersResponse {
  data: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Filtros para búsqueda de órdenes
 */
export interface OrderFilters {
  assignedTo?: number;
  company?: number;
  sector?: string;
  status?: OrderStatus;
  priority?: string;
  startDate?: string;
  endDate?: string;
  showAll?: boolean;
}

/**
 * DTO para crear una orden de insumos/servicios (legacy)
 */
export interface CreateIssueDTO {
  descripcion: string;
  insu: number;
  sopo: number;
  id7: number;
  id7c: number;
  email: string;
  name: string;
  tiposerv?: number | null;
  cantidad?: number;
}

