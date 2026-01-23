import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { CustomersService } from '../../../../services/customers/customers.service';
import { PersonnelService } from '../../../../services/personnel/personnel.service';
import { ServicesService } from '../../../../services/services/services.service';
import { MaterialsService } from '../../../../services/materials/materials.service';
import { TimezoneService } from '../../../../services/timezone/timezone.service';
import { validateDateRange, getDateRangeErrorMessage } from '../../../../shared/utils/date.utils';
import { Service } from '../../../../models/service.model';
import { OrderSector, OrderStatus } from '../../../../models/ticket.model';
import { Material, SelectedMaterial, MaterialDTO } from '../../../../models/material.model';

@Component({
  selector: 'app-create-order-dialog',
  templateUrl: './create-order-dialog.component.html',
  styleUrls: ['./create-order-dialog.component.scss']
})
export class CreateOrderDialogComponent implements OnInit {
  createForm: FormGroup;
  clientes: any[] = [];
  contactos: any[] = [];
  tecnicos: any[] = [];
  services: Service[] = [];
  isLoadingServices = false;
  materials: Material[] = [];
  selectedMaterials: SelectedMaterial[] = [];
  materialsDataSource = new MatTableDataSource<SelectedMaterial>([]);
  selectedMaterialForAdd: Material | null = null;
  cantidadToAdd: number = 1;
  isSubmitting = false;
  isLoadingMaterials = false;
  
  // Enums para las opciones del formulario
  sectors = Object.values(OrderSector);
  statuses = Object.values(OrderStatus);
  
  // Opciones de tipo de orden
  orderTypes = [
    { value: 'insu', label: 'Insumos' },
    { value: 'mant', label: 'Mantenimiento' },
    { value: 'sopo', label: 'Soporte' },
    { value: 'limp', label: 'Limpieza' }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CreateOrderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { technicians?: any[], autoAssign?: any, prefill?: any },
    private snackBar: MatSnackBar,
    private customersService: CustomersService,
    private personnelService: PersonnelService,
    private servicesService: ServicesService,
    private materialsService: MaterialsService,
    private timezoneService: TimezoneService
  ) {
    // Configurar valores por defecto basados en autoasignación
    const defaultSector = data?.autoAssign?.sector ? 
      this.mapSectorToEnum(data.autoAssign.sector) : OrderSector.CAMPO; // Default: Campo
    
    this.createForm = this.fb.group({
      clientId: [null, [Validators.required]],
      contactId: [null, [Validators.required]],
      description: ['', [ Validators.required, Validators.minLength(3), Validators.maxLength(1550)]],
      txtmateriales: ['', [Validators.maxLength(2000)]], // Campo para materiales utilizados
      assignedToIds: [data?.autoAssign?.technicianId ? [data.autoAssign.technicianId] : []],
      sector: [defaultSector, [Validators.required]],
      status: [OrderStatus.PENDIENTE, [Validators.required]],
      priority: ['media', [Validators.required]],
      orderType: ['sopo', [Validators.required]], // NUEVO: tipo de orden manual (default: Soporte)
      serviceType: ['out', [Validators.required]], // NUEVO: in (interno) o out (externo), default: in
      tiposerv: [null], // ID del servicio específico (opcional)
      fechaini: [''],  // Fecha inicio trabajo
      startTime: [''],
      fechafin: [''],  // Fecha fin trabajo
      endTime: ['']
    });

    if (data && data.technicians) {
      this.tecnicos = data.technicians;
    }

    // Prefill from remito
    if (data?.prefill) {
      const pre = data.prefill;
      if (pre.clientId) {
        this.createForm.get('clientId')?.setValue(pre.clientId);
        // Load contacts for the client to enable contact selection
        this.loadContacts(pre.clientId);
      }
      if (pre.description) {
        this.createForm.get('description')?.setValue(pre.description);
        // NUEVO: Mantener tipo por defecto (Soporte) - usuario puede cambiar si es necesario
        // this.createForm.get('orderType') ya está en 'sopo' por defecto
      }
      // txtmateriales se parseará después de cargar los materiales en ngOnInit
      // No establecerlo aquí para evitar conflictos con el parseo automático
      
      // Establecer fechas desde remito si están disponibles
      if (pre.fechaini) {
        // Parsear fecha correctamente para el datepicker
        const fechaIni = this.timezoneService.parseDateForDatepicker(pre.fechaini);
        if (fechaIni) {
          this.createForm.get('fechaini')?.setValue(fechaIni);
        }
      }
      if (pre.fechafin) {
        // Parsear fecha correctamente para el datepicker
        const fechaFin = this.timezoneService.parseDateForDatepicker(pre.fechafin);
        if (fechaFin) {
          this.createForm.get('fechafin')?.setValue(fechaFin);
        }
      }
      
      // Establecer horas desde remito
      if (pre.horaEntrada) {
        this.createForm.get('startTime')?.setValue(pre.horaEntrada);
      }
      if (pre.horaSalida) {
        this.createForm.get('endTime')?.setValue(pre.horaSalida);
      }
      
      // Set contact after a short delay to allow contacts to load
      if (pre.contactId) {
        setTimeout(() => {
          this.createForm.get('contactId')?.setValue(pre.contactId);
        }, 500);
      }
      
      // Auto-asignar técnico del remito si está disponible
      if (pre.assignedTechnicianId) {
        this.createForm.get('assignedToIds')?.setValue([pre.assignedTechnicianId]);
      }
    }
  }

  /**
   * Inicialización del componente
   * Flujo de materiales:
   * 1. Carga materiales disponibles desde la DB (19materiales)
   * 2. Si hay prefill desde remito, parsea los materiales
   * 3. Si encuentra materiales no existentes, expande formulario inline automáticamente
   * 4. Usuario completa datos y crea material → se agrega automáticamente a la lista
   */
  ngOnInit(): void {
    this.loadClients();
    this.loadTechnicians();
    this.loadServices();
    // IMPORTANTE: loadMaterials() retorna Promise para esperar antes de parsear
    this.loadMaterials().then(() => {
      // Después de cargar materiales, si hay materiales del remito, parsearlos
      if (this.data?.prefill) {
        const prefill = this.data.prefill;
        // Si vienen materiales estructurados, usarlos; sino usar txtmateriales
        if (prefill.materiales && Array.isArray(prefill.materiales)) {
          this.parseMaterialsFromRemito(prefill.txtmateriales || '', prefill.materiales);
        } else if (prefill.txtmateriales) {
          this.parseMaterialsFromRemito(prefill.txtmateriales);
        }
      }
    });
    
    // Cargar contactos cuando se seleccione un cliente
    this.createForm.get('clientId')?.valueChanges.subscribe(clientId => {
      if (clientId) {
        this.loadContacts(clientId);
      } else {
        this.contactos = [];
        this.createForm.get('contactId')?.setValue(null);
      }
    });

    // Validación cruzada: fechafin >= fechaini
    this.createForm.get('fechaini')?.valueChanges.subscribe(() => {
      this.validateDateRange();
    });
    this.createForm.get('fechafin')?.valueChanges.subscribe(() => {
      this.validateDateRange();
    });
    this.createForm.get('startTime')?.valueChanges.subscribe(() => {
      this.validateDateRange();
    });
    this.createForm.get('endTime')?.valueChanges.subscribe(() => {
      this.validateDateRange();
    });
  }

  /**
   * Mapea el sector del técnico al enum OrderSector
   */
  private mapSectorToEnum(sector: string): OrderSector {
    switch (sector.toLowerCase()) {
      case 'campo':
        return OrderSector.CAMPO;
      case 'laboratorio':
        return OrderSector.LABORATORIO;
      case '820hd':
        return OrderSector.HD820;
      default:
        return OrderSector.HD820;
    }
  }

  private loadClients(): void {
    this.customersService.find().subscribe({
      next: (clients) => {
        this.clientes = clients;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.snackBar.open('Error al cargar los clientes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private loadContacts(clientId: number): void {
    console.log('Loading contacts for clientId:', clientId);
    this.customersService.getCustomerContacts(clientId).subscribe({
      next: (contacts: any[]) => {
        console.log('Contacts loaded:', contacts);
        // Procesar contactos para crear displayName
        this.contactos = contacts.map(contact => ({
          ...contact,
          displayName: this.createContactDisplayName(contact)
        }));
        console.log('Processed contacts:', this.contactos);
        // Si solo hay un contacto, seleccionarlo automáticamente
        if (this.contactos.length === 1) {
          this.createForm.get('contactId')?.setValue(this.contactos[0].id7c);
        }
      },
      error: (error: any) => {
        console.error('Error loading contacts:', error);
        this.snackBar.open('Error al cargar los contactos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private createContactDisplayName(contact: any): string {
    // Si tiene nombre, usarlo
    if (contact.nombre && contact.nombre.trim()) {
      return contact.nombre;
    }
    
    // Si tiene email, usarlo
    if (contact.email && contact.email.trim()) {
      return contact.email;
    }
    
    // Si tiene teléfono, usarlo
    if (contact.telefono && contact.telefono.trim()) {
      return contact.telefono;
    }
    
    // Como último recurso, usar el ID
    return `Contacto #${contact.id7c}`;
  }

  private loadTechnicians(): void {
    this.personnelService.getTechnicians(true).subscribe({
      next: (technicians) => {
        // Filtrar solo técnicos activos como medida de seguridad adicional
        this.tecnicos = technicians.filter(t => t.activo !== false);
      },
      error: (error) => {
        console.error('Error loading technicians:', error);
        this.snackBar.open('Error al cargar los técnicos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private loadServices(): void {
    this.isLoadingServices = true;
    this.servicesService.getServices().subscribe({
      next: (services: Service[]) => {
        this.services = services;
        this.isLoadingServices = false;
        // No auto-seleccionar ningún servicio
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
   * Retorna una Promise para poder esperar a que se carguen antes de parsear materiales del remito
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
          this.snackBar.open('Error al cargar los materiales', 'Cerrar', { duration: 3000 });
          this.isLoadingMaterials = false;
          reject(error);
        }
      });
    });
  }

  /**
   * Parsea los materiales que vienen desde el remito
   * Busca materiales en la API externa por nombre
   */
  private parseMaterialsFromRemito(txtMateriales: string, remitoMateriales?: any[]): void {
    const parsedMaterials: SelectedMaterial[] = [];

    // Prioridad 1: Si vienen materiales estructurados del remito, usarlos directamente
    if (remitoMateriales && Array.isArray(remitoMateriales) && remitoMateriales.length > 0) {
      for (const remitoMat of remitoMateriales) {
        const cantidad = remitoMat.cantidad || 1;
        const descripcion = remitoMat.descripcion || '';
        
        if (!descripcion || cantidad <= 0) continue;

        // Buscar material en la lista de materiales por nombre (búsqueda flexible)
        const material = this.materials.find(m => 
          m.nombre.toLowerCase().includes(descripcion.toLowerCase()) ||
          descripcion.toLowerCase().includes(m.nombre.toLowerCase())
        );

        // Si no se encuentra en la API, omitir (no se pueden crear materiales)
        if (!material) {
          console.warn(`Material "${descripcion}" no encontrado en API externa`);
          continue;
        }

        // Verificar si el material ya está en la lista
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
    // Prioridad 2: Si solo viene texto, parsearlo
    else if (txtMateriales && txtMateriales.trim()) {
      const lines = txtMateriales.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const match = line.match(/^(\d+)\s*x\s*(.+)$/i);
        if (match) {
          const cantidad = parseInt(match[1], 10);
          const descripcion = match[2].trim();

          const material = this.materials.find(m => 
            m.nombre.toLowerCase().includes(descripcion.toLowerCase()) ||
            descripcion.toLowerCase().includes(m.nombre.toLowerCase())
          );

          if (!material) {
            console.warn(`Material "${descripcion}" no encontrado en API externa`);
            continue;
          }

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

    // Actualizar selectedMaterials y el dataSource
    this.selectedMaterials = parsedMaterials;
    this.materialsDataSource.data = [...this.selectedMaterials];
    
    // Actualizar txtmateriales con el formato correcto
    this.updateTxtMateriales();
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
   * 
   * Formato: "cantidadx nombre" por línea
   * Ejemplo: "2x HP 56 NEGRO\n1x cinta gtc"
   * 
   * Este campo se mantiene para:
   * - Compatibilidad con código legacy
   * - Visualización en PDFs y vistas de solo lectura
   * - Los materiales estructurados se guardan en 21movmat (tabla relacional)
   */
  private updateTxtMateriales(): void {
    const txtMateriales = this.selectedMaterials
      .map(sm => `${sm.cantidad}x ${sm.material.nombre}`)
      .join('\n');
    this.createForm.get('txtmateriales')?.setValue(txtMateriales);
  }

  onSave(): void {
    if (this.createForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      // Preparar los datos para enviar al backend
      const formData = this.createForm.value;
      
      /**
       * Convertir materiales seleccionados a formato DTO para el backend
       * 
       * IMPORTANTE: Solo se envían materiales que existen en la API externa
       * Estos materiales se guardan en la tabla 21movmat (relacional)
       * El campo txtmateriales se guarda por separado para compatibilidad
       */
      const materialsDTO: MaterialDTO[] = this.selectedMaterials
        .filter(sm => {
          // Verificar que el material existe en la lista de materiales de la API
          const existsInAPI = this.materials.some(m => m.id === sm.material.id);
          return existsInAPI && sm.material.id > 0;
        })
        .map(sm => ({
          id: sm.material.id,
          cantidad: sm.cantidad
        }));

      const orderData: any = {
        clientId: formData.clientId,
        contactId: formData.contactId, // Usar el contacto seleccionado
        description: formData.description,
        txtmateriales: formData.txtmateriales || '', // Campo para materiales utilizados (texto descriptivo)
        materials: materialsDTO, // Array de materiales para guardar en 21movmat
        assignedToIds: formData.assignedToIds || [], // Array de IDs de técnicos responsables
        sector: formData.sector,
        status: formData.status,
        priority: formData.priority,
        servicioId: formData.tiposerv, // ID del servicio específico (va al campo "servicios")
        serviceType: formData.serviceType, // 'in' (interno) o 'out' (externo) - va a tiposerv en BD
        // NUEVO: Establecer campos de tipo según selección
        insu: formData.orderType === 'insu' ? 1 : 0,
        mant: formData.orderType === 'mant' ? 1 : 0,
        sopo: formData.orderType === 'sopo' ? 1 : 0,
        limp: formData.orderType === 'limp' ? 1 : 0
      };
      
      // Mapear campos de fecha y hora: fechaini/startTime → fechaini/horaini, fechafin/endTime → fechafin/horafin
      if (formData.fechaini) {
        // Convertir Date a string YYYY-MM-DD usando zona horaria local (no UTC)
        if (formData.fechaini instanceof Date) {
          orderData.fechaini = this.timezoneService.formatDate(formData.fechaini);
        } else if (formData.fechaini.trim()) {
          orderData.fechaini = formData.fechaini;
        }
      }
      if (formData.startTime) {
        orderData.horaini = formData.startTime;
      }
      if (formData.fechafin) {
        // Convertir Date a string YYYY-MM-DD usando zona horaria local (no UTC)
        if (formData.fechafin instanceof Date) {
          orderData.fechafin = this.timezoneService.formatDate(formData.fechafin);
        } else if (formData.fechafin.trim()) {
          orderData.fechafin = formData.fechafin;
        }
      }
      if (formData.endTime) {
        orderData.horafin = formData.endTime;
      }
      
      // Simulate API call delay for better UX
      setTimeout(() => {
        this.dialogRef.close(orderData);
        this.isSubmitting = false;
      }, 500);
    } else if (!this.createForm.valid) {
      this.markFormGroupTouched();
      this.snackBar.open('Por favor, complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
    }
  }

  onCancel(): void {
    if (!this.isSubmitting) {
      this.dialogRef.close();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.createForm.controls).forEach(key => {
      const control = this.createForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Valida que la fecha de fin sea mayor o igual a la fecha de inicio
   */
  private validateDateRange(): void {
    const fechaini = this.createForm.get('fechaini')?.value;
    const fechafin = this.createForm.get('fechafin')?.value;
    const horaini = this.createForm.get('startTime')?.value;
    const horafin = this.createForm.get('endTime')?.value;

    if (!fechaini || !fechafin) {
      // Limpiar errores si no hay ambas fechas
      this.createForm.get('fechafin')?.setErrors(null);
      return;
    }

    const isValid = validateDateRange(fechaini, fechafin, horaini, horafin);
    
    if (!isValid) {
      this.createForm.get('fechafin')?.setErrors({ 
        dateRange: { message: getDateRangeErrorMessage() }
      });
    } else {
      const errors = this.createForm.get('fechafin')?.errors;
      if (errors && errors['dateRange']) {
        delete errors['dateRange'];
        if (Object.keys(errors).length === 0) {
          this.createForm.get('fechafin')?.setErrors(null);
        } else {
          this.createForm.get('fechafin')?.setErrors(errors);
        }
      }
    }
  }

} 