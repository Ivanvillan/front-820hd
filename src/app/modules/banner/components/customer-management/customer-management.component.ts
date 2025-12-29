import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { ConfirmationDialogComponent } from 'src/app/modules/shared/components/confirmation-dialog/confirmation-dialog.component';
import { CreateCustomerDialogComponent } from 'src/app/modules/shared/components/create-customer-dialog/create-customer-dialog.component';
import { CustomerDetailDialogComponent } from 'src/app/modules/shared/components/customer-detail-dialog/customer-detail-dialog.component';
import { UpdateCustomerDialogComponent } from 'src/app/modules/shared/components/update-customer-dialog/update-customer-dialog.component';
import { ContactDetailDialogComponent } from 'src/app/modules/shared/components/contact-detail-dialog/contact-detail-dialog.component';
import { CreateContactDialogComponent } from 'src/app/modules/shared/components/create-contact-dialog/create-contact-dialog.component';
import { UpdateContactDialogComponent } from 'src/app/modules/shared/components/update-contact-dialog/update-contact-dialog.component';
import { CustomersService, CustomerFilters, CustomerSearchResponse } from 'src/app/services/customers/customers.service';
import { ContactsService, ContactFilters } from 'src/app/services/contacts/contacts.service';
import { Customer, Contact } from 'src/app/models/customer.model';
import { ColumnConfig } from 'src/app/services/column-selector/column-selector.service';
import { FilterConfig } from 'src/app/components/filter-bar/filter-bar.component';

/**
 * CustomerManagementComponent - Gestión de Clientes y sus Contactos
 * ✅ Refactorizado con FilterBarComponent y ConfigurableTableComponent
 * ✅ Diseño consistente Material Design 13
 * ✅ Maneja dos vistas: Clientes y Contactos
 */
@Component({
  selector: 'app-customer-management',
  templateUrl: './customer-management.component.html',
  styleUrls: ['./customer-management.component.scss']
})
export class CustomerManagementComponent implements OnInit {

  // ==================== VISTA DE CLIENTES ====================
  
  customerFilters: FilterConfig[] = [
    { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Buscar por nombre' },
    { name: 'cuit', label: 'CUIT', type: 'text', placeholder: 'Buscar por CUIT' },
    { name: 'email', label: 'Email', type: 'text', placeholder: 'Buscar por email' }
  ];

  customerColumns: ColumnConfig[] = [
    { id: 'id', label: 'ID', visible: true, sortable: false },
    { id: 'nombre', label: 'Nombre', visible: true, sortable: false },
    { id: 'cuit', label: 'CUIT', visible: true, sortable: false },
    { id: 'direccion', label: 'Dirección', visible: true, sortable: false },
    { id: 'localidad', label: 'Localidad', visible: false, sortable: false },
    { id: 'cp', label: 'Código Postal', visible: false, sortable: false },
    { id: 'telefono', label: 'Teléfono', visible: true, sortable: false },
    { id: 'email', label: 'Email', visible: true, sortable: false },
    { id: 'condicion_iva', label: 'Condición IVA', visible: true, sortable: false },
    { id: 'tipocli', label: 'Tipo Cliente', visible: true, sortable: false },
    { id: 'actions', label: 'Acciones', visible: true, sortable: false }
  ];

  customers: Customer[] = [];
  isLoadingCustomers = false;
  currentCustomerFilters: any = {};
  
  // Paginación de clientes
  customerPage = 1;
  customerPageSize = 25;
  customerTotalItems: number = 0;

  // ==================== VISTA DE CONTACTOS ====================
  
  contactFilters: FilterConfig[] = [
    { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Buscar por nombre' },
    { name: 'email', label: 'Email', type: 'text', placeholder: 'Buscar por email' }
  ];

  contactColumns: ColumnConfig[] = [
    { id: 'id7c', label: 'ID', visible: true, sortable: false },
    { id: 'nombre', label: 'Nombre', visible: true, sortable: false },
    { id: 'email', label: 'Email', visible: true, sortable: false },
    { id: 'telefono', label: 'Teléfono', visible: true, sortable: false },
    { id: 'actions', label: 'Acciones', visible: true, sortable: false }
  ];

  contacts: Contact[] = [];
  isLoadingContacts = false;
  currentContactFilters: any = {};
  
  // Paginación de contactos
  contactPage = 1;
  contactPageSize = 25;

  // ==================== NAVEGACIÓN ENTRE VISTAS ====================
  
  showContactsView = false;
  selectedCustomer: Customer | null = null;

  // ==================== TEMPLATES ====================
  
  @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<any>;
  @ViewChild('contactActionsTemplate', { static: true }) contactActionsTemplate!: TemplateRef<any>;

  constructor(
    private customersService: CustomersService,
    private contactsService: ContactsService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  // ==================== GESTIÓN DE CLIENTES ====================

  loadCustomers(page: number = 1): void {
    this.isLoadingCustomers = true;
    this.customerPage = page;
    
    const filters: CustomerFilters = {};
    
    if (this.currentCustomerFilters.nombre?.trim()) {
      filters.nombre = this.currentCustomerFilters.nombre.trim();
    }
    if (this.currentCustomerFilters.cuit?.trim()) {
      filters.cuit = this.currentCustomerFilters.cuit.trim();
    }
    if (this.currentCustomerFilters.email?.trim()) {
      filters.email = this.currentCustomerFilters.email.trim();
    }

    this.customersService.searchCustomers(filters, this.customerPage, this.customerPageSize).subscribe({
      next: (response: CustomerSearchResponse) => {
        if (response && response.data) {
          this.customers = response.data;
          this.customerPage = response.pagination.page;
          this.customerPageSize = response.pagination.limit;
          this.customerTotalItems = response.pagination.total;
        } else {
          this.customers = [];
          this.customerTotalItems = 0;
        }
        this.isLoadingCustomers = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.snackBar.open('Error al cargar los clientes', 'Cerrar', { duration: 3000 });
        this.isLoadingCustomers = false;
        this.customerTotalItems = 0;
      }
    });
  }

  onCustomerPageChange(event: PageEvent): void {
    this.customerPage = event.pageIndex + 1; // Convertir de 0-indexed a 1-indexed
    this.customerPageSize = event.pageSize;
    this.loadCustomers(this.customerPage);
  }

  onCustomerFilterChange(filters: any): void {
    this.currentCustomerFilters = filters;
    this.loadCustomers(1);
  }

  onCustomerFilterClear(): void {
    this.currentCustomerFilters = {};
    this.loadCustomers(1);
  }


  // ==================== GESTIÓN DE CONTACTOS ====================

  verContactos(customer: Customer): void {    
    if (!customer.id) {
      console.error('Error: El cliente no tiene ID válido');
      this.snackBar.open('Error: El cliente no tiene ID válido', 'Cerrar', { duration: 3000 });
      return;
    }
    
    this.selectedCustomer = customer;
    this.showContactsView = true;
    this.loadContacts();
  }

  volverAClientes(): void {
    this.showContactsView = false;
    this.selectedCustomer = null;
    this.contacts = [];
    this.currentContactFilters = {};
  }

  loadContacts(page: number = 1): void {
    if (!this.selectedCustomer) {
      console.error('No hay cliente seleccionado');
      return;
    }
    
    this.isLoadingContacts = true;
    this.contactPage = page;
    
    const filters: ContactFilters = {};
    
    if (this.currentContactFilters.nombre?.trim()) {
      filters.nombre = this.currentContactFilters.nombre.trim();
    }
    if (this.currentContactFilters.email?.trim()) {
      filters.email = this.currentContactFilters.email.trim();
    }

    this.contactsService.getCustomerContacts(this.selectedCustomer.id, filters).subscribe({
      next: (contacts: Contact[]) => {
        this.contacts = contacts;
        this.isLoadingContacts = false;
      },
      error: (error) => {
        console.error('Error loading contacts:', error);
        this.snackBar.open('Error al cargar los contactos', 'Cerrar', { duration: 3000 });
        this.contacts = [];
        this.isLoadingContacts = false;
      }
    });
  }

  onContactFilterChange(filters: any): void {
    this.currentContactFilters = filters;
    this.loadContacts(1);
  }

  onContactFilterClear(): void {
    this.currentContactFilters = {};
    this.loadContacts(1);
  }


  // ==================== DIÁLOGOS DE CLIENTES ====================

  openCreateCustomerDialog(): void {
    const dialogRef = this.dialog.open(CreateCustomerDialogComponent, {
      width: '90%',
      maxWidth: '50%',
      autoFocus: false,
      disableClose: false,
      panelClass: 'custom-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customersService.createCustomer(result).subscribe({
          next: () => {
            this.loadCustomers(this.customerPage);
            this.snackBar.open('Cliente creado exitosamente', 'Cerrar', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error creating customer:', error);
            this.snackBar.open('Error al crear el cliente', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  openUpdateDialog(customer: Customer): void {
    const dialogRef = this.dialog.open(UpdateCustomerDialogComponent, {
      width: '90%',
      maxWidth: '50%',
      autoFocus: false,
      disableClose: false,
      data: customer,
      panelClass: 'custom-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customersService.updateCustomer(customer.id, result).subscribe({
          next: () => {
            this.loadCustomers(this.customerPage);
            this.snackBar.open('Cliente actualizado exitosamente', 'Cerrar', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error updating customer:', error);
            this.snackBar.open('Error al actualizar el cliente', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  openDeleteConfirmDialog(customer: Customer): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '90%',
      maxWidth: '50%',
      autoFocus: false,
      disableClose: false,
      data: { message: `¿Está seguro que desea eliminar el cliente "${customer.nombre}"?` },
      panelClass: 'custom-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customersService.deleteCustomer(customer.id).subscribe({
          next: () => {
            this.loadCustomers(this.customerPage);
            this.snackBar.open('Cliente eliminado exitosamente', 'Cerrar', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting customer:', error);
            this.snackBar.open('Error al eliminar el cliente', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  verDetalles(customer: Customer): void {
    this.dialog.open(CustomerDetailDialogComponent, {
      data: { customer },
      width: '90%',
      maxWidth: '800px',
      minWidth: '280px',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'custom-dialog-panel'
    });
  }

  // ==================== DIÁLOGOS DE CONTACTOS ====================

  openCreateContactDialog(): void {
    if (!this.selectedCustomer) {
      this.snackBar.open('Debe seleccionar un cliente primero', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(CreateContactDialogComponent, {
      width: '90%',
      maxWidth: '50%',
      autoFocus: false,
      disableClose: false,
      data: {
        customerId: this.selectedCustomer.id,
        customerName: this.selectedCustomer.nombre
      },
      panelClass: 'custom-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.contactsService.createContact(result).subscribe({
          next: () => {
            this.loadContacts(this.contactPage);
            this.snackBar.open('Contacto creado exitosamente', 'Cerrar', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error creating contact:', error);
            this.snackBar.open('Error al crear el contacto', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  openUpdateContactDialog(contact: Contact): void {
    if (!this.selectedCustomer) {
      this.snackBar.open('Error: No hay cliente seleccionado', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(UpdateContactDialogComponent, {
      width: '90%',
      maxWidth: '50%',
      autoFocus: false,
      disableClose: false,
      data: {
        contact: contact,
        customerName: this.selectedCustomer.nombre
      },
      panelClass: 'custom-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.contactsService.updateContact(contact.id7c, result).subscribe({
          next: () => {
            this.loadContacts(this.contactPage);
            this.snackBar.open('Contacto actualizado exitosamente', 'Cerrar', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error updating contact:', error);
            this.snackBar.open('Error al actualizar el contacto', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  openDeleteContactConfirmDialog(contact: Contact): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '90%',
      maxWidth: '50%',
      autoFocus: false,
      disableClose: false,
      data: { message: `¿Está seguro que desea eliminar el contacto "${contact.nombre}"?` },
      panelClass: 'custom-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.contactsService.deleteContact(contact.id7c).subscribe({
          next: () => {
            this.loadContacts(this.contactPage);
            this.snackBar.open('Contacto eliminado exitosamente', 'Cerrar', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting contact:', error);
            this.snackBar.open('Error al eliminar el contacto', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  verDetallesContacto(contact: Contact): void {
    if (!this.selectedCustomer) {
      this.snackBar.open('Error: No hay cliente seleccionado', 'Cerrar', { duration: 3000 });
      return;
    }

    this.dialog.open(ContactDetailDialogComponent, {
      width: '90%',
      maxWidth: '50%',
      autoFocus: false,
      disableClose: false,
      data: {
        contact: contact,
        customerName: this.selectedCustomer.nombre
      },
      panelClass: 'custom-dialog-panel'
    });
  }
}
