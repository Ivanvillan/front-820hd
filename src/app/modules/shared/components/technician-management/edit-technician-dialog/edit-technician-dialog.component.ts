import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Technician, UpdateTechnicianRequest } from 'src/app/services/personnel/personnel.service';

export interface EditTechnicianDialogData {
  technician: Technician;
  areaOptions: Array<{ value: string; label: string }>;
  categories: Array<{ id: number; descripcion: string; preciohora: number }>;
}

@Component({
  selector: 'app-edit-technician-dialog',
  templateUrl: './edit-technician-dialog.component.html',
  styleUrls: ['./edit-technician-dialog.component.scss']
})
export class EditTechnicianDialogComponent implements OnInit {

  technicianForm: FormGroup;
  areaOptions: Array<{ value: string; label: string }>;
  categories: Array<{ id: number; descripcion: string; preciohora: number }>;
  originalTechnician: Technician;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditTechnicianDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditTechnicianDialogData
  ) {
    this.areaOptions = data.areaOptions;
    this.categories = data.categories;
    this.originalTechnician = { ...data.technician };
    
    this.technicianForm = this.fb.group({
      name: [data.technician.name || '', [Validators.required, Validators.minLength(2)]],
      apellido: [data.technician.apellido || ''],
      area: [data.technician.area || '', Validators.required],
      email: [data.technician.email || '', [Validators.email]],
      telefono: [data.technician.telefono || ''],
      activo: [data.technician.activo !== false], // Por defecto activo si no está definido
      categoria_id: [data.technician.categoria_id || null],
      password: [''] // Campo opcional para cambiar contraseña
    });
  }

  ngOnInit(): void {
  }

  /**
   * Valida si el formulario es válido
   */
  get isFormValid(): boolean {
    return this.technicianForm.valid;
  }

  /**
   * Verifica si hay cambios en el formulario
   */
  get hasChanges(): boolean {
    return this.technicianForm.dirty;
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   * @param fieldName - Nombre del campo
   * @returns Mensaje de error
   */
  getFieldError(fieldName: string): string {
    const field = this.technicianForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['email']) {
        return 'Email inválido';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  /**
   * Obtiene la etiqueta del campo para mostrar en errores
   * @param fieldName - Nombre del campo
   * @returns Etiqueta del campo
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Nombre',
      apellido: 'Apellido',
      area: 'Área',
      email: 'Email',
      telefono: 'Teléfono',
      categoria_id: 'Categoría',
      password: 'Nueva Contraseña'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Cancela la edición del técnico
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Confirma la edición del técnico
   */
  onSave(): void {
    if (this.isFormValid) {
      const technicianData: UpdateTechnicianRequest = {
        name: this.technicianForm.value.name.trim(),
        apellido: this.technicianForm.value.apellido?.trim() || undefined,
        area: this.technicianForm.value.area,
        email: this.technicianForm.value.email?.trim() || undefined,
        telefono: this.technicianForm.value.telefono?.trim() || undefined,
        activo: this.technicianForm.value.activo,
        categoria_id: this.technicianForm.value.categoria_id || undefined,
        password: this.technicianForm.value.password?.trim() || undefined // Solo incluir si se proporciona
      };
      this.dialogRef.close(technicianData);
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.technicianForm.controls).forEach(key => {
        this.technicianForm.get(key)?.markAsTouched();
      });
    }
  }
}
