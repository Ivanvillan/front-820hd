import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ColumnConfig } from '../../services/column-selector/column-selector.service';

export interface ColumnSelectorData {
  columns: ColumnConfig[];
  title?: string;
}

@Component({
  selector: 'app-column-selector',
  templateUrl: './column-selector.component.html',
  styleUrls: ['./column-selector.component.scss']
})
export class ColumnSelectorComponent implements OnInit {
  columns: ColumnConfig[] = [];
  originalColumns: ColumnConfig[] = [];
  title: string = 'Configurar Columnas';

  constructor(
    public dialogRef: MatDialogRef<ColumnSelectorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ColumnSelectorData
  ) {
    if (data) {
      this.columns = JSON.parse(JSON.stringify(data.columns)); // Deep copy
      this.originalColumns = JSON.parse(JSON.stringify(data.columns));
      if (data.title) {
        this.title = data.title;
      }
    }
  }

  ngOnInit(): void {
    // Ordenar columnas por order si existe
    this.columns.sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      return orderA - orderB;
    });
  }

  toggleColumn(column: ColumnConfig): void {
    if (!column.mandatory) {
      column.visible = !column.visible;
    }
  }

  isMandatory(column: ColumnConfig): boolean {
    return column.mandatory === true;
  }

  getVisibleCount(): number {
    return this.columns.filter(col => col.visible).length;
  }

  hasChanges(): boolean {
    return JSON.stringify(this.columns) !== JSON.stringify(this.originalColumns);
  }

  restoreDefaults(): void {
    this.columns.forEach((col, index) => {
      col.visible = this.originalColumns[index].visible;
      col.order = this.originalColumns[index].order;
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onApply(): void {
    // Asignar orden basado en la posición actual
    this.columns.forEach((col, index) => {
      col.order = index;
    });
    this.dialogRef.close(this.columns);
  }

  // Future enhancement: Drag and drop reordering
  // drop(event: CdkDragDrop<ColumnConfig[]>): void {
  //   moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
  // }
}

