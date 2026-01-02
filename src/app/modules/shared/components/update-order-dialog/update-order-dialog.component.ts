import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
  
  // Formulario inline para crear material
  isCreatingMaterial: boolean = false;
  createMaterialForm: FormGroup;
  rubros: any[] = [];
  
  // Opciones de tipo de orden
  orderTypes = [
    { value: 'insu', label: 'Insumos' },
    { value: 'mant', label: 'Mantenimiento' },
    { value: 'sopo', label: 'Soporte' },
    { value: 'limp', label: 'Limpieza' }
  ];

  constructor(
    public dialogRef: MatDialogRef<UpdateOrderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private credentialsService: CredentialsService,
    private personnelService: PersonnelService,
    private customersService: CustomersService,
    private servicesService: ServicesService,
    private materialsService: MaterialsService,
    private snackBar: MatSnackBar
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
      horaini: [''],
      horafin: [''],
      
      // Observaciones
      notes: ['']
    });
    
    // Formulario para crear material inline
    this.createMaterialForm = this.fb.group({
      descripcion: ['', [Validators.required, Validators.maxLength(255)]],
      unidad: ['Unidad', [Validators.maxLength(50)]],
      punitario: [0, [Validators.min(0)]],
      idrubro: [null],
      iva19: [10.5, [Validators.min(0), Validators.max(100)]],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    // Cargar todos los datos necesarios
    this.loadClients();
    this.loadTechnicians();
    this.loadServices();
    this.loadRubros();
    
    if (this.data) {
      // Cargar contactos si hay cliente
      if (this.data.idcliente) {
        this.loadContacts(this.data.idcliente);
      }
      
      // Determinar tipo de orden
      let orderType = 'sopo'; // default
      if (this.data.insu) orderType = 'insu';
      else if (this.data.mant) orderType = 'mant';
      else if (this.data.sopo) orderType = 'sopo';
      else if (this.data.limp) orderType = 'limp';
      
      // Determinar serviceType (in/out) basado en tiposerv
      // tiposerv: 1 = in (interno), 0 = out (externo)
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
      
      // Cargar materiales existentes después de cargar la lista de materiales
      this.loadMaterials().then(() => {
        this.loadExistingMaterials();
      });
      
      // Convertir servicios a number para compatibilidad con ng-select
      const servicioId = this.data.servicios ? Number(this.data.servicios) : null;
      
      this.updateForm.patchValue({
        // Información básica
        clientId: this.data.idcliente || null,
        contactId: this.data.idcontacto || null,
        description: this.data.descripcion || '',
        orderType: orderType,
        serviceType: serviceType,
        tiposerv: servicioId, // Usar servicios convertido a number
        
        // Asignación
        estado: this.data.estado || 'Pendiente',
        sector: this.data.sector || '',
        assignedToIds: this.data.responsables?.map((r: any) => r.id) || [],
        prioridad: this.data.prioridad || '',
        
        // Trabajo
        horaini: this.data.horaini || '',
        horafin: this.data.horafin || '',
        
        // Observaciones
        notes: notesText
      });
      
      // Cargar notas existentes para mostrar el historial
      this.loadExistingNotes();
    }
    
    // Cargar contactos cuando se seleccione un cliente
    this.updateForm.get('clientId')?.valueChanges.subscribe(clientId => {
      if (clientId) {
        this.loadContacts(clientId);
      } else {
        this.contactos = [];
        this.updateForm.get('contactId')?.setValue(null);
      }
    });
  }

  /**
   * Carga los clientes disponibles
   */
  private loadClients(): void {
    this.customersService.find().subscribe({
      next: (clients) => {
        this.clientes = clients;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
      }
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
   * Carga los servicios disponibles
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
   * Carga los materiales disponibles desde el servicio
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
  private loadRubros(): void {
    this.materialsService.getRubros().subscribe({
      next: (rubros: any[]) => {
        this.rubros = rubros;
      },
      error: (error) => {
        console.error('Error loading rubros:', error);
      }
    });
  }

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
        const fullMaterial = this.materials.find(m => m.id19 === mat.id19);
        
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
          const descripcion = match[2].trim();

          if (cantidad <= 0) continue;

          const material = this.materials.find(m => 
            m.descripcion.toLowerCase().includes(descripcion.toLowerCase()) ||
            descripcion.toLowerCase().includes(m.descripcion.toLowerCase())
          );

          if (material) {
            const existingIndex = parsedMaterials.findIndex(
              sm => sm.material.id19 === material.id19
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
   * Carga los técnicos activos desde el servicio
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
   * Expande o colapsa el formulario de crear material
   */
  toggleCreateMaterialForm(): void {
    this.isCreatingMaterial = !this.isCreatingMaterial;
    if (!this.isCreatingMaterial) {
      this.cancelCreateMaterial();
    }
  }

  /**
   * Crea un nuevo material y lo agrega automáticamente a la lista
   */
  createAndAddMaterial(): void {
    if (this.createMaterialForm.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 2000 });
      return;
    }

    const formData = this.createMaterialForm.value;
    const materialData = {
      descripcion: formData.descripcion,
      unidad: formData.unidad || 'Unidad',
      punitario: formData.punitario || 0,
      idrubro: formData.idrubro || null,
      iva19: formData.iva19 || 10.5
    };

    this.materialsService.createMaterial(materialData).subscribe({
      next: (newMaterial: Material) => {
        // Recargar lista de materiales
        this.loadMaterials().then(() => {
          // Seleccionar el material recién creado
          this.selectedMaterialForAdd = newMaterial;
          this.cantidadToAdd = formData.cantidad || 1;
          
          // Agregar automáticamente a la lista
          this.addMaterial();
          
          // Colapsar y resetear formulario
          this.isCreatingMaterial = false;
          this.createMaterialForm.reset({
            unidad: 'Unidad',
            punitario: 0,
            idrubro: null,
            iva19: 10.5,
            cantidad: 1
          });
          
          this.snackBar.open('Material creado y agregado exitosamente', 'Cerrar', { duration: 2000 });
        });
      },
      error: (error: any) => {
        console.error('Error creating material:', error);
        const errorMessage = error?.error?.message || 'Error al crear el material';
        this.snackBar.open(errorMessage, 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Cancela la creación de material y resetea el formulario
   */
  cancelCreateMaterial(): void {
    this.isCreatingMaterial = false;
    this.createMaterialForm.reset({
      unidad: 'Unidad',
      punitario: 0,
      idrubro: null,
      iva19: 10.5,
      cantidad: 1
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
      sm => sm.material.id19 === this.selectedMaterialForAdd!.id19
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
    this.updateTxtMateriales();
  }

  /**
   * Actualiza el campo txtmateriales con el texto descriptivo de los materiales seleccionados
   */
  private updateTxtMateriales(): void {
    const txtMateriales = this.selectedMaterials
      .map(sm => `${sm.cantidad}x ${sm.material.descripcion}`)
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
      
      /**
       * Convertir materiales seleccionados a formato DTO para el backend
       * Solo incluir materiales que existen en la DB y tienen punitario > 0
       */
      const materialsDTO: MaterialDTO[] = this.selectedMaterials
        .filter(sm => {
          const existsInDB = this.materials.some(m => m.id19 === sm.material.id19);
          const hasValidPrice = sm.material.punitario > 0;
          return existsInDB && hasValidPrice && sm.material.id19 > 0;
        })
        .map(sm => ({
          id19: sm.material.id19,
          cantidad: sm.cantidad,
          punitario: sm.material.punitario
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
      
      // Trabajo
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
        updateData.fechaini = now.toISOString().split('T')[0];
        if (!updateData.horaini) {
          updateData.horaini = now.toTimeString().slice(0, 5);
        }
      }
      
      // Si cambia a "Finalizada"
      if (formData.estado === 'Finalizada') {
        if (!this.data.fechafin) {
          updateData.fechafin = now.toISOString().split('T')[0];
        }
        if (!updateData.horafin) {
          updateData.horafin = now.toTimeString().slice(0, 5);
        }
        
        // Si no tiene fecha de inicio, usar la fecha de la orden
        if (!this.data.fechaini && this.data.fecha) {
          const orderDate = new Date(this.data.fecha);
          updateData.fechaini = orderDate.toISOString().split('T')[0];
          if (!updateData.horaini) {
            updateData.horaini = this.data.hora || '09:00';
          }
        }
      }
      
      this.dialogRef.close(updateData);
    }
  }
}
