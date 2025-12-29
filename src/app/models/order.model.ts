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
  horaini?: string; // Hora inicio del trabajo
  horafin?: string; // Hora fin del trabajo
}

/**
 * DTO para actualizar una orden existente
 */
export interface UpdateOrderDTO {
  status?: OrderStatus;
  observaciones?: string; // Resumen del trabajo realizado (texto plano)
  txtmateriales?: string; // Materiales utilizados (texto libre para visualización)
  materials?: MaterialDTO[]; // Array de materiales para guardar en 21movmat
  fechaini?: string; // Fecha inicio del trabajo
  horaini?: string; // Hora inicio del trabajo
  fechafin?: string; // Fecha fin del trabajo
  horafin?: string; // Hora fin del trabajo
  htotal?: number; // Horas totales de trabajo
  finalizado?: boolean;
  anulada?: boolean;
  assignedToIds?: number[]; // Array de IDs de técnicos responsables
  sector?: OrderSector;
  estado?: OrderStatus;
  prioridad?: 'baja' | 'media' | 'alta' | 'urgente';
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

