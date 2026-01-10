/**
 * Modelo de Material desde API externa (stock.pcassi.net/lsart)
 */
export interface Material {
  id: number;
  nombre: string;
  marca: string;
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
  id: number;
  cantidad: number;
  punitario: number;
}
