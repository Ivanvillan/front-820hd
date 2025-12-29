import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

export interface EditTechnicianAreaData {
  technician: {
    id: number;
    name: string;
    area: string;
  };
  areaOptions: Array<{
    value: string;
    label: string;
  }>;
}

@Component({
  selector: 'app-edit-technician-area-dialog',
  templateUrl: './edit-technician-area-dialog.component.html',
  styleUrls: ['./edit-technician-area-dialog.component.scss']
})
export class EditTechnicianAreaDialogComponent {

  areaControl = new FormControl('', [Validators.required]);

  constructor(
    public dialogRef: MatDialogRef<EditTechnicianAreaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditTechnicianAreaData
  ) {
    // Inicializar con el área actual
    this.areaControl.setValue(data.technician.area);
  }

  /**
   * Cierra el modal sin guardar cambios
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Guarda los cambios y cierra el modal
   */
  onSave(): void {
    if (this.areaControl.valid) {
      this.dialogRef.close({
        area: this.areaControl.value
      });
    }
  }

  /**
   * Obtiene el nombre legible del área
   * @param area - Código del área
   * @returns Nombre legible del área
   */
  getAreaLabel(area: string): string {
    const option = this.data.areaOptions.find(opt => opt.value === area);
    return option ? option.label : area;
  }
}
