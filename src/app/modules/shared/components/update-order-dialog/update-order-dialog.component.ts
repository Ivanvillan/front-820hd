import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { OrderStatus, OrderSector } from 'src/app/models/ticket.model';
import { 
  parseOrderNotes,
  serializeOrderNotes,
  createNewNote,
  OrderNote
} from 'src/app/shared/utils/order-notes.utils';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { PersonnelService } from 'src/app/services/personnel/personnel.service';
import { CustomersService } from 'src/app/services/customers/customers.service';
import { ServicesService } from 'src/app/services/services/services.service';
import { MaterialsService } from 'src/app/services/materials/materials.service';
import { PdfExportService } from 'src/app/services/pdf-export/pdf-export.service';
import { PdfExportConfirmationDialogComponent, PdfExportConfirmationDialogData } from 'src/app/modules/shared/components/pdf-export-confirmation-dialog/pdf-export-confirmation-dialog.component';
import { TimezoneService } from 'src/app/services/timezone/timezone.service';
import { validateDateRange, getDateRangeErrorMessage } from 'src/app/shared/utils/date.utils';
import { Service } from 'src/app/models/service.model';
import { Material, SelectedMaterial, MaterialDTO } from 'src/app/models/material.model';

@Component({
  selector: 'app-update-order-dialog',
  templateUrl: './update-order-dialog.component.html',
  styleUrls: ['./update-order-dialog.component.scss']
})
export class UpdateOrderDialogComponent implements OnInit {

  updateForm: FormGroup;
  sectors = Object.values(OrderSector);
  statuses = Object.values(OrderStatus);
  technicians: any[] = [];
  existingNotes: OrderNote[] = [];
  priorities = [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' }
  ];
  
  // Clientes y contactos
  clientes: any[] = [];
  contactos: any[] = [];
  
  // Servicios
  services: Service[] = [];
  isLoadingServices = false;
  
  // Materiales
  materials: Material[] = [];
  selectedMaterials: SelectedMaterial[] = [];
  materialsDataSource = new MatTableDataSource<SelectedMaterial>([]);
  selectedMaterialForAdd: Material | null = null;
  cantidadToAdd: number = 1;
  isLoadingMaterials = false;
  materialsModified = false; // Flag para rastrear si el usuario modificó materiales
  
  // Opciones de tipo de orden
  orderTypes = [
    { value: 'insu', label: 'Insumos' },
    { value: 'mant', label: 'Mantenimiento' },
    { value: 'sopo', label: 'Soporte' },
    { value: 'limp', label: 'Limpieza' }
  ];

  /**
   * Función de búsqueda personalizada para materiales
   * Busca tanto en nombre como en marca del material
   */
  materialSearchFn = (term: string, item: Material): boolean => {
    if (!term) return true;
    
    const searchTerm = term.toLowerCase();
    const nombre = (item.nombre || '').toLowerCase();
    const marca = (item.marca || '').toLowerCase();
    
    return nombre.includes(searchTerm) || marca.includes(searchTerm);
  };

  constructor(
    public dialogRef: MatDialogRef<UpdateOrderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private credentialsService: CredentialsService,
    private personnelService: PersonnelService,
    private customersService: CustomersService,
    private servicesService: ServicesService,
    private materialsService: MaterialsService,
    private snackBar: MatSnackBar,
    private pdfExportService: PdfExportService,
    private timezoneService: TimezoneService,
    private dialog: MatDialog
  ) {
    this.updateForm = this.fb.group({
      // Información básica
      clientId: [null],
      contactId: [null],
      description: ['', [Validators.maxLength(1550)]],
      orderType: ['sopo'],
      serviceType: ['out'], // Tipo de servicio: in (interno) o out (externo)
      tiposerv: [null], // ID del servicio específico
      
      // Asignación
      estado: ['', Validators.required],
      sector: [''],
      assignedToIds: [[]],
      prioridad: [''],
      
      // Materiales
      txtmateriales: ['', [Validators.maxLength(2000)]],
      
      // Trabajo
      fechaini: [''],  // Fecha inicio trabajo
      horaini: [''],
      fechafin: [''],  // Fecha fin trabajo
      horafin: [''],
      
      // Observaciones
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.initializeWithLegacyLoading();
    this.setupDateValidation();
  }

  /**
   * LEGACY: Flujo de carga secuencial (actual)
   * Mantiene el comportamiento existente como fallback
   */
  private initializeWithLegacyLoading(): void {
    // Cargar todos los datos necesarios
    this.loadTechnicians();
    this.loadServices();
    
    // Cargar contactos cuando se seleccione un cliente (configurar ANTES de patchValue)
    this.updateForm.get('clientId')?.valueChanges.subscribe(clientId => {
      if (clientId) {
        this.loadContacts(clientId);
      } else {
        this.contactos = [];
        this.updateForm.get('contactId')?.setValue(null);
      }
    });
    
    if (this.data) {
      // Cargar materiales existentes después de cargar la lista de materiales
      this.loadMaterials().then(() => {
        this.loadExistingMaterials();
      });
      
      // Cargar clientes PRIMERO, luego establecer valores
      this.loadClients().then(() => {
        this.initializeFormValues();
      });
      
      // Cargar notas existentes para mostrar el historial
      this.loadExistingNotes();
    }
  }

  /**
   * Inicializa los valores del formulario con los datos de la orden
   * Centraliza la lógica de patchValue para evitar duplicación
   */
  private initializeFormValues(): void {
    if (!this.data) return;

    // Determinar tipo de orden
    let orderType = 'sopo'; // default
    if (this.data.insu) orderType = 'insu';
    else if (this.data.mant) orderType = 'mant';
    else if (this.data.sopo) orderType = 'sopo';
    else if (this.data.limp) orderType = 'limp';
    
    // Determinar serviceType (in/out) basado en tiposerv
    const serviceType = this.data.tiposerv === 1 ? 'in' : 'out';
    
    // Convertir notes de array a string si es necesario
    let notesText = '';
    if (this.data.notes) {
      if (Array.isArray(this.data.notes) && this.data.notes.length > 0) {
        notesText = this.data.notes.map((note: any) => note.content).join('\n');
      } else if (typeof this.data.notes === 'string') {
        notesText = this.data.notes;
      }
    }
    
    // Convertir servicios a number para compatibilidad con ng-select
    const servicioId = this.data.servicios ? Number(this.data.servicios) : null;

    this.updateForm.patchValue({
      // Información básica
      clientId: this.data.idcliente || null,
      description: this.data.descripcion || '',
      orderType: orderType,
      serviceType: serviceType,
      tiposerv: servicioId,
      
      // Asignación
      estado: this.data.estado || 'Pendiente',
      sector: this.data.sector || '',
      assignedToIds: this.data.responsables?.map((r: any) => r.id) || [],
      prioridad: this.data.prioridad || '',
      
      // Trabajo - Parsear fechas correctamente
      fechaini: this.timezoneService.parseDateForDatepicker(this.data.fechaini),
      horaini: this.data.horaini || '',
      fechafin: this.timezoneService.parseDateForDatepicker(this.data.fechafin),
      horafin: this.data.horafin || '',
      
      // Observaciones
      notes: notesText
    });
  }

  /**
   * Configura la validación cruzada de fechas
   */
  private setupDateValidation(): void {
    this.updateForm.get('fechaini')?.valueChanges.subscribe(() => {
      this.validateDateRange();
    });
    this.updateForm.get('fechafin')?.valueChanges.subscribe(() => {
      this.validateDateRange();
    });
    this.updateForm.get('horaini')?.valueChanges.subscribe(() => {
      this.validateDateRange();
    });
    this.updateForm.get('horafin')?.valueChanges.subscribe(() => {
      this.validateDateRange();
    });
  }

  /**
   * Carga los clientes disponibles (versión Promise - legacy)
   * Retorna una Promise para poder esperar a que se carguen
   */
  private loadClients(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.customersService.find().subscribe({
        next: (clients) => {
          this.clientes = clients;
          resolve();
        },
        error: (error) => {
          console.error('Error loading clients:', error);
          reject(error);
        }
      });
    });
  }


  /**
   * Carga los contactos de un cliente
   */
  private loadContacts(clientId: number): void {
    this.customersService.getCustomerContacts(clientId).subscribe({
      next: (contacts: any[]) => {
        this.contactos = contacts.map(contact => ({
          ...contact,
          displayName: this.createContactDisplayName(contact)
        }));
        
        // Re-establecer contactId después de cargar la lista para evitar race condition
        if (this.data?.idcontacto) {
          // Usar setTimeout para asegurar que ng-select procese la lista primero
          setTimeout(() => {
            this.updateForm.get('contactId')?.setValue(this.data.idcontacto, { emitEvent: false });
          }, 0);
        }
      },
      error: (error: any) => {
        console.error('Error loading contacts:', error);
      }
    });
  }

  /**
   * Crea un nombre de visualización para un contacto
   */
  private createContactDisplayName(contact: any): string {
    if (contact.nombre && contact.nombre.trim()) {
      return contact.nombre;
    }
    if (contact.email && contact.email.trim()) {
      return contact.email;
    }
    if (contact.telefono && contact.telefono.trim()) {
      return contact.telefono;
    }
    return `Contacto #${contact.id7c}`;
  }

  /**
   * Carga los servicios disponibles (versión void - legacy)
   */
  private loadServices(): void {
    this.isLoadingServices = true;
    this.servicesService.getServices().subscribe({
      next: (services: Service[]) => {
        this.services = services;
        this.isLoadingServices = false;
      },
      error: (error) => {
        console.error('Error loading services:', error);
        this.isLoadingServices = false;
        this.snackBar.open('Error al cargar los servicios', 'Cerrar', { duration: 3000 });
      }
    });
  }


  /**
   * Carga los materiales disponibles desde el servicio (versión Promise - legacy)
   */
  private loadMaterials(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isLoadingMaterials = true;
      this.materialsService.getMaterials().subscribe({
        next: (materials: Material[]) => {
          this.materials = materials;
          this.isLoadingMaterials = false;
          resolve();
        },
        error: (error) => {
          console.error('Error loading materials:', error);
          this.isLoadingMaterials = false;
          reject(error);
        }
      });
    });
  }


  /**
   * Carga los rubros disponibles
   */
  /**
   * Carga los materiales existentes de la orden
   */
  private loadExistingMaterials(): void {
    if (!this.data) {
      this.selectedMaterials = [];
      this.materialsDataSource.data = [];
      return;
    }

    const parsedMaterials: SelectedMaterial[] = [];

    // Prioridad 1: Si la orden tiene materiales desde 21movmat
    if (this.data.materials && Array.isArray(this.data.materials) && this.data.materials.length > 0) {
      for (const mat of this.data.materials) {
        const fullMaterial = this.materials.find(m => m.id === mat.id);
        
        if (fullMaterial) {
          parsedMaterials.push({
            material: fullMaterial,
            cantidad: mat.cantidad
          });
        }
      }
    }
    // Prioridad 2: Intentar parsear txtmateriales
    else if (this.data.txtmateriales && this.data.txtmateriales.trim()) {
      const txtMateriales = this.data.txtmateriales.trim();
      const lines = txtMateriales.split('\n').filter((line: string) => line.trim());

      for (const line of lines) {
        const match = line.match(/^(\d+)\s*x\s*(.+)$/i);
        if (match) {
          const cantidad = parseInt(match[1], 10);
          const nombre = match[2].trim();

          if (cantidad <= 0) continue;

          const material = this.materials.find(m => 
            m.nombre.toLowerCase().includes(nombre.toLowerCase()) ||
            nombre.toLowerCase().includes(m.nombre.toLowerCase())
          );

          if (material) {
            const existingIndex = parsedMaterials.findIndex(
              sm => sm.material.id === material.id
            );

            if (existingIndex >= 0) {
              parsedMaterials[existingIndex].cantidad += cantidad;
            } else {
              parsedMaterials.push({
                material: material,
                cantidad: cantidad
              });
            }
          }
        }
      }
    }

    this.selectedMaterials = parsedMaterials;
    this.materialsDataSource.data = [...this.selectedMaterials];
    this.updateTxtMateriales();
  }

  /**
   * Carga los técnicos activos desde el servicio (versión void - legacy)
   */
  private loadTechnicians(): void {
    this.personnelService.getTechnicians(true).subscribe({
      next: (technicians) => {
        // Filtrar solo técnicos activos como medida de seguridad adicional
        this.technicians = technicians.filter(t => t.activo !== false);
      },
      error: (error) => {
        console.error('Error loading technicians:', error);
        // Fallback a técnicos del data si hay error
        this.technicians = (this.data.technicians || []).filter((t: any) => t.activo !== false);
      }
    });
  }


  /**
   * Agrega un material seleccionado a la lista de materiales de la orden
   */
  addMaterial(): void {
    if (!this.selectedMaterialForAdd) {
      this.snackBar.open('Seleccione un material', 'Cerrar', { duration: 2000 });
      return;
    }

    if (this.cantidadToAdd <= 0) {
      this.snackBar.open('La cantidad debe ser mayor a 0', 'Cerrar', { duration: 2000 });
      return;
    }

    // Verificar si el material ya está en la lista
    const existingIndex = this.selectedMaterials.findIndex(
      sm => sm.material.id === this.selectedMaterialForAdd!.id
    );

    if (existingIndex >= 0) {
      // Si ya existe, actualizar la cantidad
      this.selectedMaterials[existingIndex].cantidad += this.cantidadToAdd;
      this.snackBar.open(`Cantidad actualizada: ${this.selectedMaterials[existingIndex].cantidad}`, 'Cerrar', { duration: 2000 });
    } else {
      // Si no existe, agregarlo
      this.selectedMaterials.push({
        material: this.selectedMaterialForAdd,
        cantidad: this.cantidadToAdd
      });
    }

    // Actualizar el dataSource de la tabla
    this.materialsDataSource.data = [...this.selectedMaterials];

    // Marcar que el usuario modificó materiales
    this.materialsModified = true;

    // Limpiar selección
    this.selectedMaterialForAdd = null;
    this.cantidadToAdd = 1;
    this.updateTxtMateriales();
  }

  /**
   * Elimina un material de la lista
   */
  removeMaterial(index: number): void {
    this.selectedMaterials.splice(index, 1);
    this.materialsDataSource.data = [...this.selectedMaterials];
    this.materialsModified = true;
    this.updateTxtMateriales();
  }

  /**
   * Actualiza la cantidad de un material
   */
  updateMaterialQuantity(index: number, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.snackBar.open('La cantidad debe ser mayor a 0', 'Cerrar', { duration: 2000 });
      return;
    }
    this.selectedMaterials[index].cantidad = newQuantity;
    this.materialsDataSource.data = [...this.selectedMaterials];
    this.materialsModified = true;
    this.updateTxtMateriales();
  }

  /**
   * Actualiza el campo txtmateriales con el texto descriptivo de los materiales seleccionados
   */
  private updateTxtMateriales(): void {
    const txtMateriales = this.selectedMaterials
      .map(sm => `${sm.cantidad}x ${sm.material.nombre}`)
      .join('\n');
    this.updateForm.get('txtmateriales')?.setValue(txtMateriales);
  }

  /**
   * Carga las notas existentes para mostrar el historial
   * Utiliza funciones utilitarias compartidas para garantizar consistencia
   * Ordena las notas de más reciente a más antigua
   */
  private loadExistingNotes(): void {
    const notes = parseOrderNotes(this.data.observaciones, this.data.fecha);
    // Ordenar por timestamp descendente (más reciente primero)
    this.existingNotes = notes.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA; // Orden descendente
    });
  }

  /**
   * Obtiene el nombre del técnico actual desde las credenciales
   */
  private getCurrentTechnicianName(): string {
    const userData = this.credentialsService.getCredentialsParsed();
    
    if (!userData) {
      return 'Sistema';
    }
    
    // El campo 'contact' contiene el nombre del técnico
    if (userData.contact && userData.contact.trim()) {
      return userData.contact.trim();
    }
    
    // Fallback al campo 'name'
    if (userData.name && userData.name.trim()) {
      return userData.name.trim();
    }
    
    // Último fallback: email
    if (userData.email && userData.email.includes('@')) {
      const emailName = userData.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return 'Sistema';
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.updateForm.valid) {
      const formData = this.updateForm.value;
      
      // Crear nueva nota usando utilidades compartidas si hay contenido
      const newNote = formData.notes && formData.notes.trim() ? 
        createNewNote(formData.notes.trim(), this.getCurrentTechnicianName()) : null;
      
      // Combinar notas existentes con la nueva nota para evitar sobreescritura
      let allNotes = [...this.existingNotes];
      if (newNote) {
        allNotes.push(newNote);
      }
      
      // BUGFIX: Validar que materiales se cargaron antes de filtrar
      // Evitar pérdida silenciosa de datos si la API falló
      if (this.isLoadingMaterials) {
        this.snackBar.open('Por favor, espere a que carguen los materiales', 'Cerrar', { duration: 3000 });
        return;
      }
      
      if (this.materialsModified && this.materials.length === 0 && this.selectedMaterials.length > 0) {
        // Usuario intentó agregar materiales pero la lista de materiales disponibles está vacía
        // Esto indica un error de carga - NO permitir guardar para evitar pérdida de datos
        this.snackBar.open(
          'Error: Los materiales no se pudieron cargar. Por favor, cierre el diálogo e intente nuevamente.',
          'Cerrar',
          { duration: 5000 }
        );
        return;
      }
      
      /**
       * Convertir materiales seleccionados a formato DTO para el backend
       * Solo incluir materiales que existen en la API externa
       */
      const materialsDTO: MaterialDTO[] = this.selectedMaterials
        .filter(sm => {
          const existsInAPI = this.materials.some(m => m.id === sm.material.id);
          return existsInAPI && sm.material.id > 0;
        })
        .map(sm => ({
          id: sm.material.id,
          cantidad: sm.cantidad
        }));
      
      // Construir updateData con todos los campos
      const updateData: any = {
        estado: formData.estado,
        observaciones: serializeOrderNotes(allNotes)
      };
      
      // Información básica
      if (formData.clientId) {
        updateData.clientId = formData.clientId;
      }
      if (formData.contactId) {
        updateData.contactId = formData.contactId;
      }
      if (formData.description && formData.description.trim()) {
        updateData.description = formData.description.trim();
      }
      if (formData.tiposerv) {
        updateData.servicioId = formData.tiposerv; // ID del servicio (va a campo "servicios")
      }
      if (formData.serviceType) {
        updateData.serviceType = formData.serviceType; // 'in' o 'out' (va a campo "tiposerv")
      }
      if (formData.orderType) {
        updateData.insu = formData.orderType === 'insu' ? 1 : 0;
        updateData.mant = formData.orderType === 'mant' ? 1 : 0;
        updateData.sopo = formData.orderType === 'sopo' ? 1 : 0;
        updateData.limp = formData.orderType === 'limp' ? 1 : 0;
      }
      
      // Asignación
      if (formData.sector && formData.sector.trim()) {
        updateData.sector = formData.sector;
      }
      if (formData.assignedToIds && formData.assignedToIds.length > 0) {
        updateData.assignedToIds = formData.assignedToIds;
      }
      if (formData.prioridad && formData.prioridad.trim()) {
        updateData.prioridad = formData.prioridad;
      }
      
      // Materiales
      updateData.txtmateriales = formData.txtmateriales || '';
      if (materialsDTO.length > 0) {
        updateData.materials = materialsDTO;
      }
      
      // Trabajo - Fechas
      // BUGFIX: Manejo explícito de null/undefined para permitir limpiar fechas
      if (formData.fechaini === null || formData.fechaini === '') {
        // Usuario borró el campo → limpiar fecha en BD
        updateData.fechaini = null;
        console.log('[Fecha Debug] Limpiando fechaini en BD (valor null enviado al backend)');
      } else if (formData.fechaini !== undefined) {
        // Usuario estableció una fecha
        if (formData.fechaini instanceof Date) {
          updateData.fechaini = this.timezoneService.formatDate(formData.fechaini);
          console.log('[Fecha Debug] Enviando fechaini al backend:', {
            original: formData.fechaini,
            originalISO: formData.fechaini.toISOString(),
            formatted: updateData.fechaini,
            timezone: this.timezoneService.getTimezone(),
            horaini: formData.horaini || 'no especificada'
          });
        } else if (typeof formData.fechaini === 'string' && formData.fechaini.trim()) {
          updateData.fechaini = formData.fechaini;
          console.log('[Fecha Debug] Enviando fechaini (string) al backend:', {
            value: updateData.fechaini,
            horaini: formData.horaini || 'no especificada'
          });
        }
      }
      // Si formData.fechaini === undefined → no se modificó, no enviar al backend
      
      if (formData.fechafin === null || formData.fechafin === '') {
        // Usuario borró el campo → limpiar fecha en BD
        updateData.fechafin = null;
        console.log('[Fecha Debug] Limpiando fechafin en BD (valor null enviado al backend)');
      } else if (formData.fechafin !== undefined) {
        // Usuario estableció una fecha
        if (formData.fechafin instanceof Date) {
          updateData.fechafin = this.timezoneService.formatDate(formData.fechafin);
          console.log('[Fecha Debug] Enviando fechafin al backend:', {
            original: formData.fechafin,
            originalISO: formData.fechafin.toISOString(),
            formatted: updateData.fechafin,
            timezone: this.timezoneService.getTimezone(),
            horafin: formData.horafin || 'no especificada'
          });
        } else if (typeof formData.fechafin === 'string' && formData.fechafin.trim()) {
          updateData.fechafin = formData.fechafin;
          console.log('[Fecha Debug] Enviando fechafin (string) al backend:', {
            value: updateData.fechafin,
            horafin: formData.horafin || 'no especificada'
          });
        }
      }
      // Si formData.fechafin === undefined → no se modificó, no enviar al backend
      
      // Trabajo - Horas
      if (formData.horaini && formData.horaini.trim()) {
        updateData.horaini = formData.horaini;
      }
      if (formData.horafin && formData.horafin.trim()) {
        updateData.horafin = formData.horafin;
      }
      
      // Auto-completar fechas según el estado
      const now = new Date();
      
      // Si cambia a "En Progreso" y no tiene fecha de inicio
      if (formData.estado === 'En Progreso' && !this.data.fechaini) {
        updateData.fechaini = this.timezoneService.formatDate(now);
        if (!updateData.horaini) {
          updateData.horaini = now.toTimeString().slice(0, 5);
        }
      }
      
      // Si cambia a "Finalizada" (solo si el estado anterior NO era "Finalizada")
      const previousStatus = this.data.estado || 'Pendiente';
      const isChangingToFinalized = formData.estado === 'Finalizada' && previousStatus !== 'Finalizada';
      
      if (isChangingToFinalized) {
        if (!this.data.fechafin) {
          updateData.fechafin = this.timezoneService.formatDate(now);
        }
        if (!updateData.horafin) {
          updateData.horafin = now.toTimeString().slice(0, 5);
        }
        
        // Si no tiene fecha de inicio, usar la fecha de la orden
        if (!this.data.fechaini && this.data.fecha) {
          // Parsear fecha correctamente para evitar problemas de timezone
          const orderDate = this.timezoneService.parseDateForDatepicker(this.data.fecha);
          if (orderDate) {
            updateData.fechaini = this.timezoneService.formatDate(orderDate);
          }
          if (!updateData.horaini) {
            updateData.horaini = this.data.hora || '09:00';
          }
        }
        
        // Preguntar si quiere exportar a PDF antes de finalizar
        this.askForPdfExportBeforeFinalizing(updateData);
        return; // No cerrar el diálogo todavía, esperar respuesta del usuario
      }
      
      this.dialogRef.close(updateData);
    }
  }

  /**
   * Pregunta al usuario si quiere exportar la orden a PDF antes de finalizarla
   * @param updateData - Datos de actualización que se enviarán al backend
   */
  private askForPdfExportBeforeFinalizing(updateData: any): void {
    // Crear una orden temporal con los datos actualizados para el PDF
    const orderForPdf = {
      ...this.data,
      ...updateData,
      estado: 'Finalizada'
    };

    const orderNumber = this.data.numero || this.data.id1 || 'N/A';
    
    // Mostrar diálogo de confirmación específico para PDF
    const dialogData: PdfExportConfirmationDialogData = {
      orderNumber: orderNumber
    };

    const confirmDialog = this.dialog.open(PdfExportConfirmationDialogComponent, {
      width: '90%',
      maxWidth: '500px',
      autoFocus: false,
      data: dialogData,
      disableClose: false
    });

    confirmDialog.afterClosed().subscribe((result: boolean | undefined) => {
      if (result === true) {
        // Usuario quiere exportar PDF
        try {
          this.pdfExportService.exportOrderToPdf(orderForPdf);
          this.snackBar.open('PDF exportado exitosamente', 'Cerrar', { duration: 3000 });
        } catch (error) {
          console.error('Error al exportar PDF:', error);
          this.snackBar.open('Error al exportar el PDF', 'Cerrar', { duration: 3000 });
        }
      }
      // En cualquier caso, proceder con la finalización
      this.dialogRef.close(updateData);
    });
  }

  /**
   * Valida que la fecha de fin sea mayor o igual a la fecha de inicio
   */
  private validateDateRange(): void {
    const fechaini = this.updateForm.get('fechaini')?.value;
    const fechafin = this.updateForm.get('fechafin')?.value;
    const horaini = this.updateForm.get('horaini')?.value;
    const horafin = this.updateForm.get('horafin')?.value;

    if (!fechaini || !fechafin) {
      // Limpiar errores si no hay ambas fechas
      this.updateForm.get('fechafin')?.setErrors(null);
      return;
    }

    const isValid = validateDateRange(fechaini, fechafin, horaini, horafin);
    
    if (!isValid) {
      this.updateForm.get('fechafin')?.setErrors({ 
        dateRange: { message: getDateRangeErrorMessage() }
      });
    } else {
      const errors = this.updateForm.get('fechafin')?.errors;
      if (errors && errors['dateRange']) {
        delete errors['dateRange'];
        if (Object.keys(errors).length === 0) {
          this.updateForm.get('fechafin')?.setErrors(null);
        } else {
          this.updateForm.get('fechafin')?.setErrors(errors);
        }
      }
    }
  }
}

