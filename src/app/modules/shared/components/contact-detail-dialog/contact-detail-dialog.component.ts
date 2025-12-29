import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Contact } from 'src/app/models/customer.model';

export interface ContactDetailDialogData {
  contact: Contact;
  customerName?: string;
}

@Component({
  selector: 'app-contact-detail-dialog',
  templateUrl: './contact-detail-dialog.component.html',
  styleUrls: ['./contact-detail-dialog.component.scss']
})
export class ContactDetailDialogComponent implements OnInit {

  contact: Contact;
  customerName: string;

  constructor(
    public dialogRef: MatDialogRef<ContactDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ContactDetailDialogData
  ) {
    this.contact = data.contact;
    this.customerName = data.customerName || 'Cliente';
  }

  ngOnInit(): void {
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getContactInfo(): { label: string; value: string; icon: string }[] {
    return [
      { label: 'ID del Contacto', value: this.contact.id7c.toString(), icon: 'fingerprint' },
      { label: 'Nombre', value: this.contact.nombre, icon: 'person' },
      { label: 'Email', value: this.contact.email || 'No especificado', icon: 'email' },
      { label: 'Teléfono', value: this.contact.telefono || 'No especificado', icon: 'phone' },
      { label: 'Contraseña', value: this.contact.pass || '--', icon: 'vpn_key' },
      { label: 'Cliente', value: this.customerName, icon: 'business' }
    ];
  }
}
