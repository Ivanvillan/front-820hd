import { OrderStatus } from 'src/app/models/ticket.model';

/**
 * Utilidades compartidas para el manejo de estados de órdenes
 * Estas funciones aseguran consistencia entre gestión de órdenes y vista de técnico
 */

export interface StatusDisplayConfig {
  value: OrderStatus;
  label: string;
  color: 'primary' | 'accent' | 'warn';
  materialColor: string;
}

/**
 * Configuración de estados disponibles con sus colores y etiquetas
 */
export const ORDER_STATUS_CONFIG: StatusDisplayConfig[] = [
  { 
    value: OrderStatus.PENDIENTE, 
    label: 'Pendiente', 
    color: 'warn',
    materialColor: '#f44336'
  },
  { 
    value: OrderStatus.EN_DIAGNOSTICO, 
    label: 'En Diagnóstico', 
    color: 'accent',
    materialColor: '#ff9800'
  },
  { 
    value: OrderStatus.ESPERANDO_APROBACION, 
    label: 'Esperando Aprobación', 
    color: 'warn',
    materialColor: '#f44336'
  },
  { 
    value: OrderStatus.ESPERANDO_REPUESTO, 
    label: 'Esperando Repuesto', 
    color: 'accent',
    materialColor: '#ff9800'
  },
  { 
    value: OrderStatus.EN_PROGRESO, 
    label: 'En Progreso', 
    color: 'primary',
    materialColor: '#2196f3'
  },
  { 
    value: OrderStatus.FINALIZADA, 
    label: 'Finalizada', 
    color: 'primary',
    materialColor: '#4caf50'
  },
  { 
    value: OrderStatus.CANCELADA, 
    label: 'Cancelada', 
    color: 'warn',
    materialColor: '#f44336'
  }
];

/**
 * Obtiene el color del chip de estado basado en el estado de la orden
 */
export function getStatusColor(order: any): 'primary' | 'accent' | 'warn' {
  if (!order) return 'primary';
  const status = getOrderStatus(order);
  return getStatusDisplayColor(status);
}

/**
 * Obtiene el texto del estado con formato consistente
 */
export function getStatusText(order: any): string {
  if (!order) return 'Sin estado';
  const status = getOrderStatus(order);
  return getStatusDisplayName(status);
}

/**
 * Obtiene el color del chip de finalización basado en el estado
 */
export function getFinalizationColor(order: any): 'primary' | 'accent' | 'warn' {
  if (!order) return 'accent';
  if (order.anulada === true) return 'warn';
  if (order.finalizado === true) return 'primary';
  return 'accent';
}

/**
 * Obtiene el texto del estado de finalización
 */
export function getFinalizationStatus(order: any): string {
  if (!order) return 'Sin estado';
  if (order.anulada === true) return 'Anulada';
  if (order.finalizado === true) return 'Finalizada';
  return 'En Proceso';
}

/**
 * Mapea el estado del backend al enum del frontend
 */
export function mapBackendStatusToEnum(backendStatus: string): OrderStatus {
  switch (backendStatus) {
    case 'Pendiente':
      return OrderStatus.PENDIENTE;
    case 'En Progreso':
      return OrderStatus.EN_PROGRESO;
    case 'En Diagnóstico':
      return OrderStatus.EN_DIAGNOSTICO;
    case 'Esperando Aprobación':
      return OrderStatus.ESPERANDO_APROBACION;
    case 'Esperando Repuesto':
      return OrderStatus.ESPERANDO_REPUESTO;
    case 'Finalizada':
      return OrderStatus.FINALIZADA;
    case 'Cancelada':
      return OrderStatus.CANCELADA;
    default:
      return OrderStatus.PENDIENTE;
  }
}

/**
 * Determina el estado de la orden basado en campos legacy y nuevos
 */
export function getOrderStatus(order: any): OrderStatus {
  // Validar que order no sea null o undefined
  if (!order) return OrderStatus.PENDIENTE;
  
  // Si la orden tiene el campo estado, usarlo directamente
  if (order.estado) {
    return mapBackendStatusToEnum(order.estado);
  }
  
  // Fallback a la lógica antigua si no hay campo estado
  if (order.anulada === true) return OrderStatus.CANCELADA;
  if (order.finalizado === true) return OrderStatus.FINALIZADA;
  return OrderStatus.PENDIENTE;
}

/**
 * Obtiene el color del estado de la orden para display
 */
export function getStatusDisplayColor(status: OrderStatus): 'primary' | 'accent' | 'warn' {
  const config = ORDER_STATUS_CONFIG.find(c => c.value === status);
  return config ? config.color : 'primary';
}

/**
 * Obtiene el nombre de visualización del estado
 */
export function getStatusDisplayName(status: OrderStatus): string {
  const config = ORDER_STATUS_CONFIG.find(c => c.value === status);
  return config ? config.label : status.toString();
}

/**
 * Obtiene el tipo de orden formateado
 */
export function getOrderType(order: any): string {
  if (!order) return 'General';
  
  // Prioridad 1: Mostrar servicio específico si está disponible
  if (order.tipoServicioNombre && order.tipoServicioNombre.trim()) {
    return order.tipoServicioNombre;
  }
  
  // Prioridad 2: Fallback a categorías legacy
  if (order.insu) return 'Insumos';
  if (order.sopo) return 'Soporte';
  if (order.mant) return 'Mantenimiento';
  if (order.limp) return 'Limpieza';
  if (order.mda) return 'Mantenimiento'; // Legacy fallback
  
  return 'General';
}

/**
 * Obtiene solo la categoría de tipo de orden (sin servicio específico)
 */
export function getOrderTypeCategory(order: any): string {
  if (!order) return 'General';
  if (order.insu) return 'Insumos';
  if (order.sopo) return 'Soporte';
  if (order.mant) return 'Mantenimiento';
  if (order.limp) return 'Limpieza';
  if (order.mda) return 'Mantenimiento'; // Legacy fallback
  return 'General';
}
