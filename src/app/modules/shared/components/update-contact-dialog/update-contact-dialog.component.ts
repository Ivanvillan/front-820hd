import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Contact } from 'src/app/models/customer.model';
import { ContactUpdateData } from 'src/app/services/contacts/contacts.service';

export interface UpdateContactDialogData {
  contact: Contact;
  customerName?: string;
}

@Component({
  selector: 'app-update-contact-dialog',
  templateUrl: './update-contact-dialog.component.html',
  styleUrls: ['./update-contact-dialog.component.scss']
})
export class UpdateContactDialogComponent implements OnInit {

  contactForm!: FormGroup;
  isLoading = false;
  contact: Contact;
  customerName: string;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UpdateContactDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UpdateContactDialogData,
    private snackBar: MatSnackBar
  ) {
    this.contact = data.contact;
    this.customerName = data.customerName || 'Cliente';
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.contactForm = this.fb.group({
      nombre: [this.contact.nombre, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: [this.contact.email, [Validators.required, Validators.email, Validators.maxLength(100)]],
      telefono: [this.contact.telefono || '', [Validators.maxLength(20)]],
      pass: [this.contact.pass || '', [Validators.maxLength(255)]]
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isLoading = true;
      
      const contactData: ContactUpdateData = {
        nombre: this.contactForm.get('nombre')?.value.trim(),
        email: this.contactForm.get('email')?.value.trim(),
        telefono: this.contactForm.get('telefono')?.value?.trim() || '',
        pass: this.contactForm.get('pass')?.value?.trim() || ''
      };

      this.dialogRef.close(contactData);
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Por favor, complete todos los campos requeridos correctamente', 'Cerrar', { duration: 3000 });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.contactForm.get(controlName);
    
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    
    if (control?.hasError('email')) {
      return 'Ingrese un email válido';
    }
    
    if (control?.hasError('minlength')) {
      const requiredLength = control.getError('minlength').requiredLength;
      return `Mínimo ${requiredLength} caracteres`;
    }
    
    if (control?.hasError('maxlength')) {
      const requiredLength = control.getError('maxlength').requiredLength;
      return `Máximo ${requiredLength} caracteres`;
    }
    
    return '';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.contactForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  hasChanges(): boolean {
    return this.contactForm.dirty;
  }
}
