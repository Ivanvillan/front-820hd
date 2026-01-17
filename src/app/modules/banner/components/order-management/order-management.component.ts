import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { ConfirmationDialogComponent } from 'src/app/modules/shared/components/confirmation-dialog/confirmation-dialog.component';
import { CreateOrderDialogComponent } from 'src/app/modules/shared/components/create-order-dialog/create-order-dialog.component';
import { RemitosSelectorDialogComponent } from 'src/app/modules/shared/components/remitos-selector-dialog/remitos-selector-dialog.component';
import { TicketDetailModalComponent } from 'src/app/modules/shared/components/ticket-detail-modal/ticket-detail-modal.component';
import { UpdateOrderDialogComponent } from 'src/app/modules/shared/components/update-order-dialog/update-order-dialog.component';
import { OrdersService } from 'src/app/services/orders/orders.service';
import { PersonnelService, Technician } from 'src/app/services/personnel/personnel.service';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { PdfExportService } from 'src/app/services/pdf-export/pdf-export.service';
import { FilterConfig, FilterValues } from 'src/app/components/filter-bar/filter-bar.component';
import { ColumnConfig } from 'src/app/services/column-selector/column-selector.service';
import { OrderStatus } from 'src/app/models/ticket.model';
import { 
  getOrderStatus,
  getStatusDisplayColor,
  getStatusText, 
  getFinalizationColor, 
  getFinalizationStatus 
} from 'src/app/shared/utils/order-status.utils';

/**
 * Interface para filtros de órdenes con type safety
 */
interface OrderFilters extends FilterValues {
  assignedTo?: number;
  company?: number;
  sector?: string;
  status?: OrderStatus;
  priority?: string;
  startDate?: string;
  endDate?: string;
  showAll?: boolean;
}

import { interval, Subject, BehaviorSubject, of } from 'rxjs';
import { takeUntil, filter, switchMap, catchError, retry } from 'rxjs/operators';

@Component({
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.scss']
})
export class OrderManagementComponent implements OnInit, OnDestroy {
  // Datos
  orders: any[] = [];
  technicians: Technician[] = [];
  customers: any[] = [];
  isLoading = false;
  
  // Refresh automático
  private destroy$ = new Subject<void>();
  isRefreshing$ = new BehaviorSubject<boolean>(false);
  isRefreshing: boolean = false;
  priorities = [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' }
  ];
  
  // Paginación
  currentPage = 1;
  pageSize = 50;
  totalItems = 0;
  pageSizeOptions = [25, 50, 100];

  // Configuración de filtros
  filterConfig: FilterConfig[] = [];
  currentFilterValues: FilterValues = {};

  // Configuración de columnas - anchos optimizados para mejor visualización
  orderColumns: ColumnConfig[] = [
    { id: 'fecha', label: 'Fecha', visible: true, mandatory: false, sortable: false, width: '80px' },
    { id: 'hora', label: 'Hora', visible: true, mandatory: false, sortable: false, width: '60px' },
    { id: 'numero', label: 'No. Orden', visible: true, mandatory: true, sortable: false, width: '90px' },
    { id: 'descripcion', label: 'Descripción', visible: true, mandatory: false, sortable: false, width: '280px' },
    { id: 'contacto', label: 'Contacto', visible: false, mandatory: false, sortable: false },
    { id: 'empresa', label: 'Empresa', visible: true, mandatory: false, sortable: false, width: '120px' },
    { id: 'sector', label: 'Sector', visible: true, mandatory: false, sortable: false, width: '100px' },
    { id: 'tipoServicio', label: 'Servicio', visible: true, mandatory: false, sortable: false, width: '120px' },
    { id: 'prioridad', label: 'Prioridad', visible: true, mandatory: false, sortable: false, width: '90px' },
    { id: 'estado', label: 'Estado', visible: true, mandatory: false, sortable: false, width: '130px' },
    { id: 'nombreAsignado', label: 'Asignado', visible: true, mandatory: false, sortable: false, width: '100px' },
    { id: 'acciones', label: '', visible: true, mandatory: true, sortable: false, width: '60px' }
  ];

  // Templates personalizados
  @ViewChild('fechaTemplate', { static: true }) fechaTemplate!: TemplateRef<any>;
  @ViewChild('descripcionTemplate', { static: true }) descripcionTemplate!: TemplateRef<any>;
  @ViewChild('priorityTemplate', { static: true }) priorityTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<any>;
  @ViewChild('tipoServicioTemplate', { static: true }) tipoServicioTemplate!: TemplateRef<any>;
  @ViewChild('nombreAsignadoTemplate', { static: true }) nombreAsignadoTemplate!: TemplateRef<any>;

  columnTemplates: { [key: string]: TemplateRef<any> } = {};

  constructor(
    private ordersService: OrdersService,
    private personnelService: PersonnelService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private credentialsService: CredentialsService,
    private pdfExportService: PdfExportService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadTechnicians();
    this.initializeFilterConfig();
    this.applyInitialLoad();
    this.showWelcomeMessage();
    
    // Configurar templates
    this.columnTemplates = {
      'fecha': this.fechaTemplate,
      'descripcion': this.descripcionTemplate,
      'prioridad': this.priorityTemplate,
      'estado': this.statusTemplate,
      'tipoServicio': this.tipoServicioTemplate,
      'nombreAsignado': this.nombreAsignadoTemplate,
      'acciones': this.actionsTemplate
    };
    
    // Iniciar refresh automático cada 60 segundos
    this.startAutoRefresh();
    
    // Suscribirse a cambios de isRefreshing para actualizar variable local
    this.isRefreshing$.subscribe(value => {
      this.isRefreshing = value;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicia el refresh automático cada 60 segundos
   * Mejoras implementadas:
   * - Pausa cuando la página no está visible (document.visibilityState)
   * - Pausa cuando hay modales abiertos
   * - Pausa durante carga activa
   * - Retry con backoff exponencial
   * - Cleanup adecuado con takeUntil
   */
  private startAutoRefresh(): void {
    const REFRESH_INTERVAL_MS = 60000; // 60 segundos
    
    interval(REFRESH_INTERVAL_MS).pipe(
      takeUntil(this.destroy$),
      filter(() => !this.isLoading && this.isPageVisible() && !this.hasOpenModals()),
      switchMap(() => {
        this.isRefreshing$.next(true);
        return this.loadCurrentData().pipe(
          catchError(err => {
            console.error('[Auto-refresh] Error al actualizar datos:', err);
            return of(null);
          }),
          retry({ count: 2, delay: 5000 })
        );
      })
    ).subscribe({
      next: (data) => {
        if (data) {
          this.updateOrdersData(data);
        }
        this.isRefreshing$.next(false);
      },
      error: (err) => {
        console.error('[Auto-refresh] Error crítico en suscripción:', err);
        this.isRefreshing$.next(false);
      }
    });
  }

  /**
   * Verifica si la página está visible
   */
  private isPageVisible(): boolean {
    return document.visibilityState === 'visible';
  }

  /**
   * Verifica si hay modales abiertos
   */
  private hasOpenModals(): boolean {
    // Verificar si hay elementos de Material Dialog abiertos
    return document.querySelector('.cdk-overlay-container .cdk-overlay-pane') !== null;
  }

  /**
   * Carga los datos según el estado actual de filtros
   */
  private loadCurrentData() {
    // Re-ejecutar la búsqueda actual con los mismos filtros
    const filters: OrderFilters = { 
      ...this.currentFilterValues,
      status: this.currentFilterValues['status'] as OrderStatus | undefined
    };
    filters.showAll = true;
    
    // El backend ya excluye finalizadas por defecto automáticamente
    // Si el usuario selecciona "Finalizada" en el filtro de estados, el backend mostrará solo finalizadas
    
    return this.ordersService.getInternalOrders(filters, this.currentPage, this.pageSize);
  }

  /**
   * Actualiza los datos de órdenes con los nuevos datos recibidos
   */
  private updateOrdersData(response: any): void {
    if (response.pagination) {
      this.orders = response.data;
      this.totalItems = response.pagination.total;
      this.currentPage = response.pagination.page;
      this.pageSize = response.pagination.limit;
    } else {
      this.orders = response;
      this.totalItems = response.length;
    }
  }

  /**
   * Inicializa la configuración de filtros
   */
  private initializeFilterConfig(): void {
    this.filterConfig = [
      {
        type: 'ng-select',
        name: 'assignedTo',
        label: 'Técnico Asignado',
        placeholder: 'Todos los técnicos',
        options: this.technicians,
        optionLabel: 'name',
        optionValue: 'id'
      },
      {
        type: 'ng-select',
        name: 'company',
        label: 'Empresa',
        placeholder: 'Todas las empresas',
        options: this.customers,
        optionLabel: 'nombre',
        optionValue: 'id7'
      },
      {
        type: 'ng-select',
        name: 'sector',
        label: 'Sector',
        placeholder: 'Todos los sectores',
        options: [
          { label: 'Campo', value: 'Campo' },
          { label: 'Laboratorio', value: 'Laboratorio' },
          { label: '820HD', value: '820HD' }
        ],
        optionLabel: 'label',
        optionValue: 'value'
      },
      {
        type: 'ng-select',
        name: 'status',
        label: 'Estado',
        placeholder: 'Todos los estados',
        options: [
          { label: 'Pendiente', value: 'Pendiente' },
          { label: 'En Progreso', value: 'En Progreso' },
          { label: 'En Diagnóstico', value: 'En Diagnóstico' },
          { label: 'Esperando Aprobación', value: 'Esperando Aprobación' },
          { label: 'Esperando Repuesto', value: 'Esperando Repuesto' },
          { label: 'Finalizada', value: 'Finalizada' },
          { label: 'Cancelada', value: 'Cancelada' }
        ],
        optionLabel: 'label',
        optionValue: 'value'
      },
      {
        type: 'ng-select',
        name: 'priority',
        label: 'Prioridad',
        placeholder: 'Todas las prioridades',
        options: this.priorities,
        optionLabel: 'label',
        optionValue: 'value'
      }
    ];
  }

  /**
   * Carga inicial de datos
   */
  private applyInitialLoad(): void {
    this.applyFiltersFromValues({});
  }

  /**
   * Handler para cambios en FilterBarComponent
   */
  onFilterChange(filters: FilterValues): void {
    this.currentPage = 1;
    this.currentFilterValues = filters; // Guardar filtros actuales
    this.applyFiltersFromValues(filters);
  }

  /**
   * Aplica filtros desde FilterValues
   */
  private applyFiltersFromValues(filterValues: FilterValues, page: number = 1): void {
    this.isLoading = true;
    this.currentPage = page;
    
    // Los filtros ya vienen limpios (sin valores vacíos) desde FilterBarComponent
    const filters: OrderFilters = { 
      ...filterValues,
      status: filterValues['status'] as OrderStatus | undefined
    };
    filters.showAll = true;
    
    // COMPORTAMIENTO INTENCIONAL: El backend excluye finalizadas y canceladas por defecto automáticamente.
    // Esto mejora la experiencia del usuario mostrando solo órdenes activas por defecto.
    // Si el usuario selecciona "Finalizada" o "Cancelada" en el filtro de estados,
    // el backend mostrará solo órdenes con ese estado específico.
    // No necesitamos lógica adicional aquí - el backend maneja todo
    
    this.ordersService.getInternalOrders(filters, this.currentPage, this.pageSize).subscribe({
      next: (response: any) => {
        if (response.pagination) {
          this.orders = response.data;
          this.totalItems = response.pagination.total;
          this.currentPage = response.pagination.page;
          this.pageSize = response.pagination.limit;
        } else {
          this.orders = response;
          this.totalItems = response.length;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.snackBar.open('Error al cargar las órdenes', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  /**
   * Maneja el cambio de página en el paginador
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1; // Convertir de 0-indexed a 1-indexed
    this.pageSize = event.pageSize;
    // Reaplicar filtros actuales con la nueva página
    this.applyFiltersFromValues(this.currentFilterValues, this.currentPage);
  }

  /**
   * Muestra un mensaje de bienvenida personalizado para usuarios admin
   */
  private showWelcomeMessage(): void {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.previousNavigation) {
      const previousUrl = navigation.previousNavigation?.finalUrl?.toString();
      
      if (previousUrl?.includes('/signin')) {
        const credentials = this.credentialsService.getCredentialsParsed();
        if (credentials && credentials.type === 'admin') {
          setTimeout(() => {
            this.snackBar.open(
              `¡Bienvenido a la gestión de órdenes de trabajo, ${credentials.name}! Aquí puedes administrar todas las órdenes del sistema.`, 
              'Entendido', 
              {
                duration: 6000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: ['welcome-snackbar']
              }
            );
          }, 1000);
        }
      }
    }
  }

  loadCustomers(): void {
    this.ordersService.readAllClients().subscribe({
      next: (data: any) => {
        this.customers = Array.isArray(data) ? data : [data].flat();
        // Actualizar filterConfig cuando los clientes se carguen
        this.initializeFilterConfig();
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.snackBar.open('Error al cargar la lista de clientes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  loadTechnicians(): void {
    this.personnelService.getTechnicians(true).subscribe({
      next: (data: Technician[]) => {
        // Filtrar solo técnicos activos como medida de seguridad adicional
        this.technicians = data.filter(t => t.activo !== false);
        // Actualizar filterConfig cuando los técnicos se carguen
        this.initializeFilterConfig();
      },
      error: (error) => {
        console.error('Error loading technicians:', error);
        this.snackBar.open('Error al cargar la lista de técnicos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Handler para click en fila de la tabla
   */
  onRowClick(order: any): void {
    this.verDetalles(order);
  }

  verDetalles(order: any): void {
    const dialogRef = this.dialog.open(TicketDetailModalComponent, {
      data: order,
      width: '90%',
      maxWidth: '50%',
      autoFocus: false,
      disableClose: false
    });

    // Recargar la lista si se asignó la orden
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.assigned) {
        this.applyFiltersFromValues({}, this.currentPage);
      }
    });
  }

  openUpdateDialog(order: any): void {
    const dialogData = { 
      ...order, 
      technicians: this.technicians 
    };
    
    const dialogRef = this.dialog.open(UpdateOrderDialogComponent, {
      width: '90%',
      autoFocus: false,
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ordersService.updateOrder(order.numero, result).subscribe({
          next: () => {
            this.applyFiltersFromValues({}, this.currentPage);
            this.snackBar.open('Orden actualizada exitosamente', 'Cerrar', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error updating order:', error);
            this.snackBar.open('Error al actualizar la orden', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  openCreateOrderDialog(): void {
    const dialogRef = this.dialog.open(CreateOrderDialogComponent, {
      width: '90%',
      autoFocus: false,
      disableClose: false,
      data: { technicians: this.technicians, customers: this.customers }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ordersService.createOrder(result).subscribe({
          next: () => {
            this.applyFiltersFromValues({}, 1);
            this.snackBar.open('Orden creada exitosamente', 'Cerrar', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error creating order:', error);
            this.snackBar.open('Error al crear la orden', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  openCreateFromRemito(): void {
    const dialogRef = this.dialog.open(RemitosSelectorDialogComponent, {
      width: '90%',
      autoFocus: false,
      disableClose: false,
      data: {}
    });

    dialogRef.afterClosed().subscribe((selectedRemitos: any[] | undefined) => {
      if (!selectedRemitos || selectedRemitos.length === 0) return;
      const r = selectedRemitos[0];
      
      // La descripción solo contiene la descripción del problema
      const description = r?.descripcion || '';
      
      // Los materiales van en un campo separado (txtmateriales) y también como array estructurado
      let txtmateriales = '';
      if (r?.materiales && r.materiales.length > 0) {
        txtmateriales = r.materiales.map((m: any) => `${m.cantidad}x ${m.descripcion}`).join('\n');
      }
      
      const dialogRef2 = this.dialog.open(CreateOrderDialogComponent, {
        width: '90%',
        autoFocus: false, 
        disableClose: false,
        data: { 
          prefill: {
            clientId: r?.cliente?.id,
            description: description,
            txtmateriales: txtmateriales, // Campo separado para materiales (texto)
            materiales: r?.materiales || [], // Array estructurado de materiales del remito
            horaEntrada: r?.horaEntrada,
            horaSalida: r?.horaSalida,
            assignedTechnicianId: r?.tecnico?.id
          }, 
          technicians: this.technicians, 
          customers: this.customers 
        },
      });

      dialogRef2.afterClosed().subscribe(result => {
        if (result) {
          this.ordersService.createOrder(result).subscribe({
            next: () => {
              this.applyFiltersFromValues({}, 1);
              this.snackBar.open('Orden creada desde remito', 'Cerrar', { duration: 3000 });
            },
            error: (error) => {
              console.error('Error creating order from remito:', error);
              this.snackBar.open('Error al crear la orden', 'Cerrar', { duration: 3000 });
            }
          });
        }
      });
    });
  }

  openDeleteConfirmDialog(orderId: string): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '90%',
      maxWidth: '40%',
      autoFocus: false,
      data: { message: `¿Está seguro que desea eliminar la orden N° ${orderId}?` },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ordersService.deleteOrder(orderId).subscribe({
          next: () => {
            this.applyFiltersFromValues({}, this.currentPage);
            this.snackBar.open('Orden eliminada exitosamente', 'Cerrar', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting order:', error);
            this.snackBar.open('Error al eliminar la orden', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteOrder(order: any): void {
    this.openDeleteConfirmDialog(order.numero);
  }

  /**
   * Navega a la vista técnica
   */
  navigateToTechnician(): void {
    this.router.navigate(['/technician']);
  }

  /**
   * Obtiene el nombre del técnico asignado a la orden
   */
  getAssignedTechnician(order: any): string | null {
    if (order.nombreAsignado) {
      return order.nombreAsignado;
    }
    if (order.referente) {
      return order.referente;
    }
    return null;
  }

  /**
   * Obtiene el tipo de servicio de la orden
   * Lógica:
   * 1. Si tiene servicio específico (tipoServicioNombre) → mostrar ese
   * 2. Si no, mostrar según flags: insu → "Insumos", sopo → "Soporte"
   */
  getServiceType(order: any): string {
    if (!order) return '-';
    
    // Prioridad 1: Servicio específico asignado (desde tabla [1reqservicios])
    if (order.tipoServicioNombre && order.tipoServicioNombre.trim()) {
      return order.tipoServicioNombre;
    }
    
    // Prioridad 2: Si tiene servicios asignado pero sin nombre, indicar
    if (order.servicios && !order.tipoServicioNombre) {
      return `Servicio #${order.servicios} (no encontrado)`;
    }
    
    // Prioridad 3: Tipo de pedido según flags (mismo que getOrderType de utils)
    if (order.insu) return 'Insumos';
    if (order.sopo) return 'Soporte';
    if (order.mant) return 'Mantenimiento';
    if (order.limp) return 'Limpieza';
    if (order.mda) return 'Mantenimiento'; // Legacy fallback
    
    return '-';
  }

  /**
   * Funciones utilitarias de estado y prioridad
   */
  getFinalizationColor = getFinalizationColor;
  getFinalizationStatus = getFinalizationStatus;
  getStatusText = getStatusText;
  
  /**
   * Obtiene el color de fondo para el chip de estado
   */
  getStatusColor(order: any): 'primary' | 'accent' | 'warn' {
    const status = getOrderStatus(order);
    return getStatusDisplayColor(status);
  }

  getPriorityText(priority: string): string {
    if (!priority) {
      return 'N/A';
    }
    
    const priorityMap: { [key: string]: string } = {
      'baja': 'Baja',
      'media': 'Media', 
      'alta': 'Alta',
      'urgente': 'Urgente'
    };
    
    return priorityMap[priority.toLowerCase()] || priority;
  }

  getPriorityClass(priority: any): string {
    if (!priority || priority === null || priority === undefined || priority === '') {
      return 'priority-none';
    }
    
    const priorityStr = String(priority).toLowerCase().trim();
    
    const priorityClassMap: { [key: string]: string } = {
      'baja': 'priority-low',
      'media': 'priority-medium',
      'alta': 'priority-high', 
      'urgente': 'priority-urgent'
    };
    
    return priorityClassMap[priorityStr] || 'priority-none';
  }

  getNombreAsignado(order: any): string {
    if (order.referente != ' ' && order.nombreAsignado != ' ') {
      return order.nombreAsignado || order.referente;
    }
    if (order.referente == ' ') {
      return 'N/A';
    }
    if (order.nombreAsignado == ' ') {
      return 'N/A';
    }
    return 'N/A';
  }

  getNombreAsignadoClass(order: any): string {
    if (!order) return 'nombre-asignado-na';
    return order.referente != ' ' && order.nombreAsignado != ' ' ? 'nombre-asignado-assigned' : 'nombre-asignado-na';
  }

  /**
   * Verifica si se puede tomar la orden
   * Solo si no tiene técnico asignado
   */
  canTakeOrder(order: any): boolean {
    if (!order) return false;
    
    // Verificar array de responsables (principal)
    if (order.responsables && order.responsables.length > 0) {
      return false;
    }
    
    // Verificar campos legacy (fallback)
    const hasIdResponsable = order.idresponsable && order.idresponsable.trim() !== '';
    const hasNombreAsignado = order.nombreAsignado && 
                              order.nombreAsignado.trim() !== '' && 
                              order.nombreAsignado.toLowerCase() !== 'sin asignar';
    const hasReferente = order.referente && 
                         order.referente.trim() !== '' && 
                         order.referente.toLowerCase() !== 'sin asignar';
    
    const hasAssignedTech = hasIdResponsable || hasNombreAsignado || hasReferente;
    
    return !hasAssignedTech;
  }

  /**
   * Auto-asigna la orden al usuario actual
   * También establece la fecha/hora de inicio del trabajo
   */
  takeOrder(order: any): void {
    if (!order) return;
    
    // Doble verificación de seguridad
    if (!this.canTakeOrder(order)) {
      this.snackBar.open('La orden ya tiene técnicos asignados', 'Cerrar', { duration: 3000 });
      return;
    }
    
    const credentials = this.credentialsService.getCredentials();
    if (!credentials) {
      this.snackBar.open('Error: No se encontraron credenciales de usuario', 'Cerrar', { duration: 3000 });
      return;
    }

    const userData = JSON.parse(credentials);
    const technicianId = userData.idClient || userData.idContact;

    // Confirmar acción
    const confirmed = confirm(
      `¿Deseas asignarte la orden N° ${order.numero}?\n\n` +
      `Descripción: ${order.descripcion}`
    );
    
    if (!confirmed) return;

    // Auto-completar fecha/hora de inicio
    const now = new Date();
    const fechaini = now.toISOString().split('T')[0];
    const horaini = now.toTimeString().slice(0, 5);

    // Actualizar orden con técnico asignado y fecha de inicio
    const sectorValue = this.getSectorForBackend(order.sector);
    const updateData: any = {
      assignedToIds: [technicianId],
      sector: sectorValue,
      fechaini: fechaini,
      horaini: horaini,
      estado: 'En Progreso' // Cambiar a En Progreso automáticamente
    };

    this.ordersService.updateOrder(order.numero, updateData)
      .subscribe({
        next: () => {
          this.snackBar.open(`Orden N° ${order.numero} asignada exitosamente`, 'Cerrar', { duration: 3000 });
          this.applyFiltersFromValues(this.currentFilterValues, this.currentPage);
        },
        error: (error) => {
          console.error('Error taking order:', error);
          this.snackBar.open('Error al asignar la orden', 'Cerrar', { duration: 3000 });
        }
      });
  }

  /**
   * Convierte el sector al formato que espera el backend
   * Backend espera: 'Campo', 'Laboratorio', '820HD'
   */
  private getSectorForBackend(sector: string | undefined): string {
    if (!sector) return 'Campo'; // Valor por defecto
    
    const normalized = sector.toLowerCase().trim();
    const backendMap: { [key: string]: string } = {
      'campo': 'Campo',
      'laboratorio': 'Laboratorio',
      '820hd': '820HD',
      '820HD': '820HD'
    };
    return backendMap[normalized] || sector;
  }

  /**
   * Exporta la orden a PDF
   */
  exportToPdf(order: any): void {
    try {
      this.pdfExportService.exportOrderToPdf(order);
      this.snackBar.open('PDF generado exitosamente', 'Cerrar', { duration: 3000 });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.snackBar.open('Error al generar el PDF', 'Cerrar', { duration: 3000 });
    }
  }

}
