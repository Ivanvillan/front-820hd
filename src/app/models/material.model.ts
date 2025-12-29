/**
 * Modelo de Material desde la tabla 19materiales
 */
export interface Material {
  id19: number;
  codigo: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  minimo: number;
  punitario: number;
  idrubro: number;
  rubroDescripcion?: string;
  iva19: number;
}

/**
 * Material seleccionado con cantidad para una orden
 */
export interface SelectedMaterial {
  material: Material;
  cantidad: number;
}

/**
 * DTO para enviar materiales al backend
 */
export interface MaterialDTO {
  id19: number;
  cantidad: number;
  punitario: number;
}
