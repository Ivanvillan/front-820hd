import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CreateTechnicianRequest } from 'src/app/services/personnel/personnel.service';

export interface CreateTechnicianDialogData {
  areaOptions: Array<{ value: string; label: string }>;
  categories: Array<{ id: number; descripcion: string; preciohora: number }>;
}

@Component({
  selector: 'app-create-technician-dialog',
  templateUrl: './create-technician-dialog.component.html',
  styleUrls: ['./create-technician-dialog.component.scss']
})
export class CreateTechnicianDialogComponent implements OnInit {

  technicianForm: FormGroup;
  areaOptions: Array<{ value: string; label: string }>;
  categories: Array<{ id: number; descripcion: string; preciohora: number }>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateTechnicianDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateTechnicianDialogData
  ) {
    this.areaOptions = data.areaOptions;
    this.categories = data.categories;
    this.technicianForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      apellido: [''],
      area: ['', Validators.required],
      email: ['', [Validators.email]],
      telefono: [''],
      categoria_id: [''],
      password: ['', [Validators.required, Validators.minLength(6)]] // Contraseña requerida para nuevos técnicos
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
      password: 'Contraseña'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Cancela la creación del técnico
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Confirma la creación del técnico
   */
  onSave(): void {
    if (this.isFormValid) {
      const technicianData: CreateTechnicianRequest = {
        name: this.technicianForm.value.name.trim(),
        apellido: this.technicianForm.value.apellido?.trim() || undefined,
        area: this.technicianForm.value.area,
        email: this.technicianForm.value.email?.trim() || undefined,
        telefono: this.technicianForm.value.telefono?.trim() || undefined,
        categoria_id: this.technicianForm.value.categoria_id || undefined,
        password: this.technicianForm.value.password // Incluir contraseña
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
