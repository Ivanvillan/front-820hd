import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Customer } from 'src/app/models/customer.model';
import { ProvincesService, Province } from 'src/app/services/provinces/provinces.service';

@Component({
  selector: 'app-update-customer-dialog',
  templateUrl: './update-customer-dialog.component.html',
  styleUrls: ['./update-customer-dialog.component.scss']
})
export class UpdateCustomerDialogComponent implements OnInit {
  form: FormGroup;
  isSubmitting = false;
  provinces: Province[] = [];
  isLoadingProvinces = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UpdateCustomerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Customer,
    private provincesService: ProvincesService
  ) {
    this.form = this.fb.group({
      nombre: [data.nombre || '', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      cuit: [data.cuit || '', [Validators.required, Validators.minLength(11), Validators.maxLength(20)]],
      direccion: [data.direccion || '', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      localidad: [data.localidad || '', [Validators.maxLength(100)]],
      cp: [data.cp || '', [Validators.pattern(/^\d+$/), Validators.maxLength(10)]],
      idprov: [data.idprov || null],
      telefono: [data.telefono || '', [Validators.required, Validators.minLength(7), Validators.maxLength(50)]],
      email: [data.email || '', [Validators.required, Validators.email, Validators.maxLength(255)]],
      condicion_iva: [data.condicion_iva || '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      tipocli: [data.tipocli || '', [Validators.maxLength(50)]]
    });
  }

  ngOnInit(): void {
    this.loadProvinces();
  }

  loadProvinces(): void {
    this.isLoadingProvinces = true;
    this.provincesService.getProvinces().subscribe({
      next: (provinces) => {
        this.provinces = provinces;
        this.isLoadingProvinces = false;
      },
      error: (error) => {
        console.error('Error loading provinces:', error);
        this.provinces = [];
        this.isLoadingProvinces = false;
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSaveClick(): void {
    if (this.form.valid) {
      this.isSubmitting = true;
      // Simulate API call delay
      setTimeout(() => {
        this.dialogRef.close(this.form.value);
        this.isSubmitting = false;
      }, 500);
    }
  }
} 