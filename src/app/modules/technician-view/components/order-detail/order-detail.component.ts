import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { OrdersService } from 'src/app/services/orders/orders.service';
import { MaterialsService } from 'src/app/services/materials/materials.service';
import { Ticket, OrderStatus } from 'src/app/models/ticket.model';
import { Material, SelectedMaterial, MaterialDTO } from 'src/app/models/material.model';
import { 
  getOrderStatus,
  getStatusDisplayColor,
  getStatusDisplayName,
  ORDER_STATUS_CONFIG,
  getOrderTypeCategory,
} from 'src/app/shared/utils/order-status.utils';
import { 
  parseOrderNotes,
  serializeOrderNotes,
  OrderNote,
  getTechnicianNameFromCredentials
} from 'src/app/shared/utils/order-notes.utils';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { PdfExportService } from 'src/app/services/pdf-export/pdf-export.service';
import { TimezoneService } from 'src/app/services/timezone/timezone.service';
import { PdfExportConfirmationDialogComponent, PdfExportConfirmationDialogData } from 'src/app/modules/shared/components/pdf-export-confirmation-dialog/pdf-export-confirmation-dialog.component';

interface OrderStatusOption {
  value: OrderStatus;
  label: string;
  color: string;
}

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // Datos de la orden
  order: Ticket | null = null;
  orderId: string = '';
  area: string = '';
  areaDisplayName: string = '';

  // Estados de carga
  loading: boolean = false;
  saving: boolean = false;
  error: string = '';
  
  // Formulario para datos de trabajo del técnico
  workForm: FormGroup;

  // Lista de notas existentes
  existingNotes: OrderNote[] = [];

  // Materiales
  materials: Material[] = [];
  selectedMaterials: SelectedMaterial[] = [];
  materialsDataSource = new MatTableDataSource<SelectedMaterial>([]);
  selectedMaterialForAdd: Material | null = null;
  cantidadToAdd: number = 1;
  isLoadingMaterials = false;
  
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
  
  // Estados disponibles para la orden (usando configuración compartida)
  availableStatuses: OrderStatusOption[] = ORDER_STATUS_CONFIG.map(config => ({
    value: config.value,
    label: config.label,
    color: config.color
  }));

  // Estado actual de la orden
  currentStatus: OrderStatus = OrderStatus.PENDIENTE;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService,
    private materialsService: MaterialsService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private credentialsService: CredentialsService,
    private pdfExportService: PdfExportService,
    private dialog: MatDialog,
    private timezoneService: TimezoneService
  ) {
    // Formulario para campos de trabajo del técnico
    this.workForm = this.formBuilder.group({
      txtmateriales: [''],
      newNote: [''] // Campo para agregar nuevas observaciones
    });
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.loadMaterials();
    this.loadOrderDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el componente con los parámetros de la URL
   */
  private initializeComponent(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    this.area = this.route.snapshot.paramMap.get('area') || '';
    this.areaDisplayName = this.getAreaDisplayName(this.area);
    
    if (!this.orderId || !this.area) {
      this.error = 'Parámetros de URL inválidos';
      this.showSnackBar('Error: Parámetros de URL inválidos', 'error');
    }
  }

  /**
   * Obtiene el nombre de visualización del área
   */
  private getAreaDisplayName(area: string): string {
    const areaNames: { [key: string]: string } = {
      'campo': 'Campo',
      'laboratorio': 'Laboratorio',
      '820hd': '820HD'
    };
    return areaNames[area] || area;
  }

  /**
   * Carga los detalles de la orden
   */
  loadOrderDetails(): void {
    if (!this.orderId) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.ordersService.getOrderById(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.order = response.order || response;
          if (this.order) {            
            this.currentStatus = this.getOrderStatus(this.order);
            this.initializeWorkForm();
          }
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error al cargar los detalles de la orden';
          this.showSnackBar('Error al cargar los detalles de la orden', 'error');
          console.error('Error loading order details:', err);
        }
      });
  }

  /**
   * Inicializa el formulario de trabajo con los datos de la orden
   */
  private initializeWorkForm(): void {
    if (!this.order) return;

    // Parsear las observaciones como notas
    const notes = parseOrderNotes(this.order.observaciones, this.order.fecha);
    // Ordenar por timestamp descendente (más reciente primero)
    this.existingNotes = notes.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA; // Orden descendente
    });

    // Cargar materiales existentes
    this.loadExistingMaterials();

    // Actualizar el campo de materiales (se actualiza automáticamente desde selectedMaterials)
    this.updateTxtMateriales();
    this.workForm.patchValue({
      newNote: '' // Limpiar el campo de nueva nota
    });
  }

  /**
   * Carga los materiales disponibles desde el servicio
   */
  private loadMaterials(): Promise<void> {
    this.isLoadingMaterials = true;
    return new Promise((resolve, reject) => {
      this.materialsService.getMaterials().subscribe({
        next: (materials: Material[]) => {
          this.materials = materials;
          this.isLoadingMaterials = false;
          resolve();
        },
        error: (error: any) => {
          console.error('Error loading materials:', error);
          this.showSnackBar('Error al cargar los materiales', 'error');
          this.isLoadingMaterials = false;
          reject(error);
        }
      });
    });
  }

  /**
   * Carga los materiales existentes de la orden
   * Prioriza materiales desde 21movmat (si vienen en la respuesta), 
   * sino intenta parsear txtmateriales y mapear a materiales de la DB
   */
  private loadExistingMaterials(): void {
    if (!this.order) {
      this.selectedMaterials = [];
      this.materialsDataSource.data = [];
      return;
    }

    // Prioridad 1: Si la orden tiene materiales desde 21movmat (vienen en order.materials)
    if (this.order.materials && Array.isArray(this.order.materials) && this.order.materials.length > 0) {
      const parsedMaterials: SelectedMaterial[] = [];
      
      for (const mat of this.order.materials) {
        // Buscar el material completo en la lista de materiales cargados desde API
        const fullMaterial = this.materials.find(m => m.id === mat.id);
        
        if (fullMaterial) {
          parsedMaterials.push({
            material: fullMaterial,
            cantidad: mat.cantidad
          });
        } else {
          // Si no se encuentra en la API, crear un material básico con el ID disponible
          const basicMaterial: Material = {
            id: mat.id,
            nombre: 'Material no disponible',
            marca: ''
          };
          
          parsedMaterials.push({
            material: basicMaterial,
            cantidad: mat.cantidad
          });
        }
      }
      
      this.selectedMaterials = parsedMaterials;
      this.materialsDataSource.data = [...this.selectedMaterials];
      return;
    }

    // Prioridad 2: Intentar parsear txtmateriales (formato: "2x HP 56 NEGRO\n1x cinta gtc")
    if (!this.order.txtmateriales) {
      this.selectedMaterials = [];
      this.materialsDataSource.data = [];
      return;
    }

    const txtMateriales = this.order.txtmateriales.trim();
    if (!txtMateriales) {
      this.selectedMaterials = [];
      this.materialsDataSource.data = [];
      return;
    }

    // Parsear líneas
    const lines = txtMateriales.split('\n').filter(line => line.trim());
    const parsedMaterials: SelectedMaterial[] = [];

    for (const line of lines) {
      // Formato esperado: "cantidadx descripcion" o "cantidad x descripcion"
      const match = line.match(/^(\d+)\s*x\s*(.+)$/i);
      if (match) {
        const cantidad = parseInt(match[1], 10);
        const descripcion = match[2].trim();

        if (cantidad <= 0) continue;

        // Buscar material en la lista de materiales por nombre (búsqueda flexible)
        const material = this.materials.find(m => 
          m.nombre.toLowerCase().includes(descripcion.toLowerCase()) ||
          descripcion.toLowerCase().includes(m.nombre.toLowerCase())
        );

        // Solo agregar si el material existe en la DB
        if (material) {
          // Verificar si el material ya está en la lista
          const existingIndex = parsedMaterials.findIndex(
            sm => sm.material.id === material.id
          );

          if (existingIndex >= 0) {
            // Si ya existe, sumar la cantidad
            parsedMaterials[existingIndex].cantidad += cantidad;
          } else {
            // Si no existe, agregarlo
            parsedMaterials.push({
              material: material,
              cantidad: cantidad
            });
          }
        }
        // Si no se encuentra, simplemente no se agrega (aparecerá solo en txtmateriales como texto)
      }
    }

    this.selectedMaterials = parsedMaterials;
    this.materialsDataSource.data = [...this.selectedMaterials];
  }

  /**
   * Agrega un material seleccionado a la lista de materiales de la orden
   */
  addMaterial(): void {
    if (!this.selectedMaterialForAdd) {
      this.showSnackBar('Seleccione un material', 'error');
      return;
    }

    if (this.cantidadToAdd <= 0) {
      this.showSnackBar('La cantidad debe ser mayor a 0', 'error');
      return;
    }

    // Verificar si el material ya está en la lista
    const existingIndex = this.selectedMaterials.findIndex(
      sm => sm.material.id === this.selectedMaterialForAdd!.id
    );

    if (existingIndex >= 0) {
      // Si ya existe, actualizar la cantidad
      this.selectedMaterials[existingIndex].cantidad += this.cantidadToAdd;
      this.showSnackBar(`Cantidad actualizada: ${this.selectedMaterials[existingIndex].cantidad}`, 'success');
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
      this.showSnackBar('La cantidad debe ser mayor a 0', 'error');
      return;
    }
    this.selectedMaterials[index].cantidad = newQuantity;
    this.materialsDataSource.data = [...this.selectedMaterials];
    this.updateTxtMateriales();
  }

  /**
   * Actualiza el campo txtmateriales con el texto descriptivo de los materiales seleccionados
   * 
   * Formato: "cantidadx descripcion" por línea
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
    this.workForm.get('txtmateriales')?.setValue(txtMateriales);
  }


  /**
   * Obtiene el estado actual de la orden
   * Utiliza funciones utilitarias compartidas para consistencia
   */
  getOrderStatus = getOrderStatus;

  /**
   * Obtiene el color del estado de la orden
   * Utiliza funciones utilitarias compartidas para consistencia
   */
  getStatusColor(order: Ticket): string {
    const status = this.getOrderStatus(order);
    return getStatusDisplayColor(status);
  }

  getOrderTypeCategory = getOrderTypeCategory;

  /**
   * Obtiene el estado formateado para mostrar
   * Utiliza funciones utilitarias compartidas para consistencia
   */
  getStatusDisplayName = getStatusDisplayName;

  /**
   * Obtiene el color del estado para mostrar
   * Utiliza funciones utilitarias compartidas para consistencia
   */
  getStatusDisplayColor = getStatusDisplayColor;

  /**
   * Maneja el cambio de estado de la orden
   */
  onStatusChange(newStatus: OrderStatus): void {
    this.currentStatus = newStatus;
    // Las fechas/horas se auto-completan en el backend según el estado
  }


  /**
   * Guarda los cambios de la orden (estado, trabajo y notas)
   */
  saveChanges(): void {
    if (!this.order || !this.currentStatus) {
      this.showSnackBar('Error: Datos inválidos para guardar', 'error');
      return;
    }

    // Obtener datos del formulario de trabajo
    const workData = this.workForm.value;
    
    // Serializar las notas existentes como JSON
    const serializedNotes = serializeOrderNotes(this.existingNotes);

    /**
     * Convertir materiales seleccionados a formato DTO para el backend
     * 
     * IMPORTANTE: Solo se envían materiales que:
     * 1. Existen en la API externa (stock.pcassi.net/lsart)
     * 2. Tienen ID válido (id > 0)
     * 
     * Estos materiales se guardan en la tabla 21movmat (historial)
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

    // Preparar datos para guardar
    const updateData: any = {
      estado: this.currentStatus,
      observaciones: serializedNotes, // JSON con array de notas
      txtmateriales: workData.txtmateriales || '', // Campo para materiales utilizados (texto descriptivo)
      materials: materialsDTO // Array de materiales para guardar en 21movmat
    };

    // Si el estado cambia a "Finalizada" (solo si el estado anterior NO era "Finalizada")
    const previousStatus = this.getOrderStatus(this.order);
    const isChangingToFinalized = this.currentStatus === OrderStatus.FINALIZADA && previousStatus !== OrderStatus.FINALIZADA;
    
    if (isChangingToFinalized) {
      this.askForPdfExportBeforeFinalizing(updateData);
      return; // No guardar todavía, esperar respuesta del usuario
    }

    // Si no es finalizada, proceder con el guardado normal
    this.performSave(updateData, workData, serializedNotes);
  }

  /**
   * Pregunta al usuario si quiere exportar la orden a PDF antes de finalizarla
   * @param updateData - Datos de actualización que se enviarán al backend
   */
  private askForPdfExportBeforeFinalizing(updateData: any): void {
    if (!this.order) {
      // Si no hay orden, proceder directamente con el guardado
      const workData = this.workForm.value;
      const serializedNotes = serializeOrderNotes(this.existingNotes);
      this.performSave(updateData, workData, serializedNotes);
      return;
    }

    // Crear una orden temporal con los datos actualizados para el PDF
    const orderForPdf: Ticket = {
      ...this.order,
      ...updateData,
      estado: OrderStatus.FINALIZADA
    };

    const orderNumber = this.order.numero || this.order.id1 || 'N/A';
    
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

    confirmDialog.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: boolean | undefined) => {
        if (result === true) {
          // Usuario quiere exportar PDF
          try {
            this.pdfExportService.exportOrderToPdf(orderForPdf);
            this.showSnackBar('PDF exportado exitosamente', 'success');
          } catch (error) {
            console.error('Error al exportar PDF:', error);
            this.showSnackBar('Error al exportar el PDF', 'error');
          }
        }
        // En cualquier caso, proceder con el guardado
        const workData = this.workForm.value;
        const serializedNotes = serializeOrderNotes(this.existingNotes);
        this.performSave(updateData, workData, serializedNotes);
      });
  }

  /**
   * Realiza el guardado de los cambios de la orden
   * @param updateData - Datos de actualización
   * @param workData - Datos del formulario de trabajo
   * @param serializedNotes - Notas serializadas
   */
  private performSave(updateData: any, workData: any, serializedNotes: string): void {
    this.saving = true;

    this.ordersService.updateOrder(this.orderId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.showSnackBar('Cambios guardados exitosamente', 'success');
          
          // Actualizar la orden local con los nuevos datos
          if (this.order) {
            this.order.estado = this.currentStatus;
            this.order.observaciones = serializedNotes;
            this.order.txtmateriales = workData.txtmateriales;
          }
        },
        error: (err) => {
          this.saving = false;
          this.showSnackBar('Error al guardar los cambios', 'error');
          console.error('Error updating order:', err);
        }
      });
  }

  /**
   * Agrega una nueva observación/nota al historial
   */
  addNote(): void {
    const content = this.workForm.get('newNote')?.value?.trim();
    
    if (!content) {
      this.showSnackBar('Por favor, ingresa una observación', 'error');
      return;
    }

    // Obtener el nombre del técnico desde las credenciales
    const credentials = this.credentialsService.getCredentialsParsed();
    const technicianName = getTechnicianNameFromCredentials(credentials);

    // Crear nueva nota
    const newNote: OrderNote = {
      content: content,
      timestamp: new Date(),
      technician: technicianName
    };

    // Agregar al principio del historial (más recientes primero)
    this.existingNotes.unshift(newNote);

    // Limpiar el campo de nueva nota
    this.workForm.patchValue({ newNote: '' });

    // Guardar automáticamente
    this.saveChanges();
  }

  /**
   * Muestra un snackbar con mensaje
   */
  private showSnackBar(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: type === 'error' ? ['error-snackbar'] : ['success-snackbar']
    });
  }

  /**
   * Obtiene el nombre del técnico asignado a la orden
   * Muestra los responsables concatenados (múltiples responsables soportados)
   * @returns Nombre de los técnicos asignados o "Sin asignar"
   */
  getAssignedTechnician(): string {
    if (!this.order) return 'N/A';
    
    // Priorizar nombreAsignado (concatenado de múltiples responsables)
    if (this.order.nombreAsignado) {
      return this.order.nombreAsignado;
    }
    
    // Fallback al campo referente
    if (this.order.referente) {
      return this.order.referente;
    }
    
    // Si no hay técnico asignado
    return 'Sin asignar';
  }

  /**
   * Obtiene el nombre del técnico responsable de la orden
   * @returns Nombre del técnico responsable o "Sin responsable"
   */
  getResponsibleTechnician(): string {
    if (!this.order) return 'N/A';
    
    // Usar el campo referente (auto-generado desde idresponsable)
    if (this.order.referente) {
      return this.order.referente;
    }
    
    return 'Sin responsable';
  }

  /**
   * Verifica si el técnico puede tomar la orden
   * Solo para áreas 820HD y Campo, y órdenes sin técnico asignado
   */
  canTakeOrder(): boolean {
    if (!this.order) return false;
    
    const area = this.normalizeSector(this.area);
    const allowedAreas = ['820hd', 'campo'];
    
    // Solo en áreas permitidas
    if (!allowedAreas.includes(area)) {
      return false;
    }
    
    // Verificar array de responsables (principal)
    if (this.order.responsables && this.order.responsables.length > 0) {
      return false;
    }
    
    // Verificar campos legacy (fallback)
    const hasAssignedTech = this.order.idresponsable || this.order.nombreAsignado;
    return !hasAssignedTech;
  }

  /**
   * Auto-asigna la orden al técnico actual
   * También establece la fecha/hora de inicio del trabajo
   */
  takeOrder(): void {
    if (!this.order) return;
    
    // Doble verificación de seguridad
    if (!this.canTakeOrder()) {
      this.showSnackBar('La orden ya tiene técnicos asignados', 'error');
      return;
    }
    
    const credentials = this.credentialsService.getCredentials();
    if (!credentials) {
      this.showSnackBar('Error: No se encontraron credenciales de usuario', 'error');
      return;
    }

    const userData = JSON.parse(credentials);
    const technicianId = userData.idClient || userData.idContact;

    // Confirmar acción
    const confirmed = confirm(
      `¿Deseas asignarte la orden N° ${this.order.numero}?\n\n` +
      `Descripción: ${this.order.descripcion}`
    );
    
    if (!confirmed) return;

    // Auto-completar fecha/hora de inicio
    const now = new Date();
    const fechaini = this.timezoneService.formatDate(now);
    const horaini = now.toTimeString().slice(0, 5);

    // Actualizar orden con técnico asignado y fecha de inicio
    const sectorValue = this.getSectorForBackend(this.order.sector || this.area);
    const updateData: any = {
      assignedToIds: [technicianId],
      sector: sectorValue,
      fechaini: fechaini,
      horaini: horaini,
      estado: OrderStatus.EN_PROGRESO // Cambiar a En Progreso automáticamente
    };

    this.ordersService.updateOrder(this.orderId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackBar(`Orden N° ${this.order?.numero} asignada exitosamente`, 'success');
          this.currentStatus = OrderStatus.EN_PROGRESO;
          this.loadOrderDetails(); // Recargar detalles
        },
        error: (error) => {
          console.error('Error taking order:', error);
          this.showSnackBar('Error al asignar la orden', 'error');
        }
      });
  }

  /**
   * Normaliza el nombre del sector para comparaciones consistentes
   */
  private normalizeSector(sector: string | undefined): string {
    if (!sector) return '';
    const normalized = sector.toLowerCase().trim();
    const sectorMap: { [key: string]: string } = {
      'campo': 'campo',
      'laboratorio': 'laboratorio',
      '820hd': '820hd',
      '820HD': '820hd'
    };
    return sectorMap[normalized] || normalized;
  }

  /**
   * Convierte el sector al formato que espera el backend
   * Backend espera: 'Campo', 'Laboratorio', '820HD'
   */
  private getSectorForBackend(sector: string): string {
    const normalized = this.normalizeSector(sector);
    const backendMap: { [key: string]: string } = {
      'campo': 'Campo',
      'laboratorio': 'Laboratorio',
      '820hd': '820HD'
    };
    return backendMap[normalized] || sector;
  }

  /**
   * Navega de vuelta a la lista de órdenes del área
   */
  goBack(): void {
    this.router.navigate(['/technician/orders', this.area]);
  }

  /**
   * Exporta la orden actual a PDF
   */
  exportToPdf(): void {
    if (!this.order) {
      this.showSnackBar('No hay orden para exportar', 'error');
      return;
    }

    try {
      this.pdfExportService.exportOrderToPdf(this.order);
      this.showSnackBar('PDF generado exitosamente', 'success');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.showSnackBar('Error al generar el PDF', 'error');
    }
  }

  /**
   * Obtiene el texto de modalidad (In/Out) manejando datos legacy
   * @param tiposerv - Valor del campo tiposerv (0=Out, 1=In, null/undefined=No definido)
   * @returns Texto de modalidad formateado
   */
  getModalidadText(tiposerv: number | null | undefined): string {
    if (tiposerv === null || tiposerv === undefined) {
      return 'No definido';
    }
    return tiposerv === 1 ? 'In (Interno)' : 'Out (Externo)';
  }

  /**
   * Obtiene el color del chip de modalidad según el valor de tiposerv
   * @param tiposerv - Valor del campo tiposerv (0=Out, 1=In, null/undefined=No definido)
   * @returns Color del chip Material
   */
  getModalidadColor(tiposerv: number | null | undefined): string {
    if (tiposerv === null || tiposerv === undefined) {
      return 'basic'; // Color neutral para datos no definidos
    }
    return tiposerv === 1 ? 'primary' : 'accent';
  }

}

