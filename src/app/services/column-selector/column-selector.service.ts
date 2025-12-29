import { Injectable } from '@angular/core';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  mandatory?: boolean;  // No se puede ocultar
  width?: string;
  sortable?: boolean;
  order?: number;       // Para ordenamiento personalizado
}

@Injectable({
  providedIn: 'root'
})
export class ColumnSelectorService {
  private readonly KEY_PREFIX = 'column_prefs_';

  constructor() { }

  /**
   * Guardar preferencias de columnas en localStorage POR USUARIO
   * Key pattern: column_prefs_{tableId}_{userId}
   */
  saveColumnPreferences(tableId: string, userId: string, columns: ColumnConfig[]): void {
    const key = this.generateKey(tableId, userId);
    try {
      const columnsData = columns.map(col => ({
        id: col.id,
        visible: col.visible,
        order: col.order
      }));
      localStorage.setItem(key, JSON.stringify(columnsData));
    } catch (error) {
      console.error('Error saving column preferences:', error);
    }
  }

  /**
   * Cargar preferencias guardadas de localStorage
   */
  loadColumnPreferences(tableId: string, userId: string): Partial<ColumnConfig>[] | null {
    const key = this.generateKey(tableId, userId);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading column preferences:', error);
    }
    return null;
  }

  /**
   * Restaurar a configuración por defecto (eliminar preferencias guardadas)
   */
  restoreDefaults(tableId: string, userId: string): void {
    const key = this.generateKey(tableId, userId);
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error restoring column preferences:', error);
    }
  }

  /**
   * Obtener columnas visibles aplicando preferencias guardadas
   */
  getVisibleColumns(tableId: string, userId: string, defaultColumns: ColumnConfig[]): ColumnConfig[] {
    const savedPreferences = this.loadColumnPreferences(tableId, userId);
    
    if (!savedPreferences) {
      // No hay preferencias guardadas, usar defaults
      return defaultColumns.filter(col => col.visible);
    }

    // Aplicar preferencias guardadas a las columnas por defecto
    const columnsWithPreferences = defaultColumns.map(col => {
      const savedCol = savedPreferences.find(saved => saved.id === col.id);
      if (savedCol) {
        return {
          ...col,
          visible: savedCol.visible !== undefined ? savedCol.visible : col.visible,
          order: savedCol.order !== undefined ? savedCol.order : col.order
        };
      }
      return col;
    });

    // Ordenar por el campo order si existe
    columnsWithPreferences.sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      return orderA - orderB;
    });

    return columnsWithPreferences.filter(col => col.visible);
  }

  /**
   * Obtener todas las columnas (visibles y ocultas) aplicando preferencias
   */
  getAllColumns(tableId: string, userId: string, defaultColumns: ColumnConfig[]): ColumnConfig[] {
    const savedPreferences = this.loadColumnPreferences(tableId, userId);
    
    if (!savedPreferences) {
      return defaultColumns;
    }

    const columnsWithPreferences = defaultColumns.map(col => {
      const savedCol = savedPreferences.find(saved => saved.id === col.id);
      if (savedCol) {
        return {
          ...col,
          visible: savedCol.visible !== undefined ? savedCol.visible : col.visible,
          order: savedCol.order !== undefined ? savedCol.order : col.order
        };
      }
      return col;
    });

    // Ordenar por el campo order
    columnsWithPreferences.sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      return orderA - orderB;
    });

    return columnsWithPreferences;
  }

  /**
   * Verificar si existen preferencias guardadas para una tabla y usuario
   */
  hasPreferences(tableId: string, userId: string): boolean {
    const key = this.generateKey(tableId, userId);
    return localStorage.getItem(key) !== null;
  }

  /**
   * Generar la key de localStorage
   */
  private generateKey(tableId: string, userId: string): string {
    return `${this.KEY_PREFIX}${tableId}_${userId}`;
  }
}

