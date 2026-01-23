import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Customer, Contact } from 'src/app/models/customer.model';
import { CustomersService } from 'src/app/services/customers/customers.service';
import { ProvincesService, Province } from 'src/app/services/provinces/provinces.service';

@Component({
  selector: 'app-customer-detail-dialog',
  templateUrl: './customer-detail-dialog.component.html',
  styleUrls: ['./customer-detail-dialog.component.scss']
})
export class CustomerDetailDialogComponent implements OnInit {

  customer: Customer;
  contacts: Contact[] = [];
  isLoadingContacts = false;
  provinces: Province[] = [];
  isLoadingProvinces = false;

  constructor(
    public dialogRef: MatDialogRef<CustomerDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { customer: Customer },
    private customersService: CustomersService,
    private provincesService: ProvincesService
  ) {
    this.customer = data.customer;
  }

  ngOnInit(): void {
    this.loadCustomerContacts();
    this.loadProvinces();
  }

  loadCustomerContacts(): void {
    this.isLoadingContacts = true;
    this.customersService.getCustomerContacts(this.customer.id).subscribe({
      next: (contacts: Contact[]) => {
        this.contacts = contacts;
        this.isLoadingContacts = false;
      },
      error: (error) => {
        console.error('Error loading contacts:', error);
        this.contacts = [];
        this.isLoadingContacts = false;
      }
    });
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

  getProvinceName(idprov?: number): string {
    if (!idprov) return '--';
    const province = this.provinces.find(p => p.idprovi === idprov);
    return province ? province.provincias : `ID: ${idprov}`;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  getFormattedDate(dateString: string): string {
    if (!dateString) return '--';
    
    // Parsear fecha correctamente para evitar problemas de timezone
    // Si es formato YYYY-MM-DD, usar componentes
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      const dateStr = dateString.split(' ')[0].split('T')[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      if (year && month && day) {
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-AR');
      }
    }
    
    // Fallback: intentar parsear como Date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('es-AR');
    }
    
    return '--';
  }
}
