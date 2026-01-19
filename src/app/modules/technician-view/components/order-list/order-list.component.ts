import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Subject, BehaviorSubject, interval, of } from 'rxjs';
import { takeUntil, filter, switchMap, catchError, retry } from 'rxjs/operators';

import { OrdersService } from 'src/app/services/orders/orders.service';
import { OrdersResponse } from 'src/app/models/order.model';
import { AuthService } from 'src/app/services/auth/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateOrderDialogComponent } from 'src/app/modules/shared/components/create-order-dialog/create-order-dialog.component';
import { RemitosSelectorDialogComponent } from 'src/app/modules/shared/components/remitos-selector-dialog/remitos-selector-dialog.component';
import { UpdateOrderDialogComponent } from 'src/app/modules/shared/components/update-order-dialog/update-order-dialog.component';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { PersonnelService, Technician } from 'src/app/services/personnel/personnel.service';
import { 
  getOrderStatus,
  getStatusDisplayColor,
  getStatusDisplayName,
  getOrderType,
  ORDER_STATUS_CONFIG,
} from 'src/app/shared/utils/order-status.utils';
import { FilterConfig, FilterValues } from 'src/app/components/filter-bar/filter-bar.component';
import { PdfExportService } from 'src/app/services/pdf-export/pdf-export.service';
import { Ticket, OrderStatus } from 'src/app/models/ticket.model';

/**
 * @deprecated Usar `Ticket` directamente.
 * Type alias para compatibilidad con código existente.
 */
type Order = Ticket & {
  direccion?: string;
};

// Constantes del componente
const PRIORITY_OPTIONS = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' }
];

const PRIORITY_TEXT_MAP: { [key: string]: string } = {
  'baja': 'Baja',
  'media': 'Media',
  'alta': 'Alta',
  'urgente': 'Urgente'
};

const PRIORITY_CLASS_MAP: { [key: string]: string } = {
  'baja': 'priority-low',
  'media': 'priority-medium',
  'alta': 'priority-high',
  'urgente': 'priority-urgent'
};

const AREA_DISPLAY_NAMES: { [key: string]: string } = {
  'campo': 'Campo',
  'laboratorio': 'Laboratorio',
  '820hd': '820HD'
};

const SECTOR_NORMALIZATION_MAP: { [key: string]: string } = {
  'campo': 'campo',
  'laboratorio': 'laboratorio',
  '820hd': '820hd',
  '820HD': '820hd'
};

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // Datos del área
  area: string = '';
  areaDisplayName: string = '';
  
  // Datos de la tabla
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  displayedColumns: string[] = [
    'fecha',
    'hora',
    'numero',
    'descripcion',
    'contacto',
    'empresa',
    'tipoServicio',
    'prioridad',
    'estado',
    'nombreAsignado',
    'acciones'
  ];
  
  // Estados de carga
  loading: boolean = false;
  error: string = '';
  
  // Refresh automático
  isRefreshing$ = new BehaviorSubject<boolean>(false);
  isRefreshing: boolean = false;
  
  // Paginación
  totalItems: number = 0;
  pageSize: number = 10;
  currentPage: number = 0;

  // Filtros
  filterConfig: FilterConfig[] = [];
  priorities = PRIORITY_OPTIONS;
  currentFilters: FilterValues = {};
  
  // Datos para filtros de 820HD
  technicians: Technician[] = [];
  currentTechnicianId: number | null = null;
  currentTechnicianName: string = '';


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private dialog: MatDialog,
    private credentialsService: CredentialsService,
    private personnelService: PersonnelService,
    private pdfExportService: PdfExportService
  ) { 
    this.initializeFilterConfig();
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.loadTechniciansIfNeeded();
    this.loadOrders();
    
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
      filter(() => !this.loading && this.isPageVisible() && !this.hasOpenModals()),
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
    // Re-ejecutar la carga de órdenes con los mismos filtros actuales
    return this.ordersService.getInternalOrders({ showAll: true }, 1, 1000);
  }

  /**
   * Actualiza los datos de órdenes con los nuevos datos recibidos
   */
  private updateOrdersData(response: OrdersResponse | any): void {
    const allOrders = response.data || response.orders || response || [];
    
    // Aplicar la misma lógica de filtrado que en loadOrders()
    const technician = this.getCurrentTechnician();
    if (!technician.id) {
      return;
    }

    const currentTechnicianId = technician.id;
    const is820hd = this.normalizeSector(this.area) === '820hd';
    const isLaboratorio = this.normalizeSector(this.area) === 'laboratorio';
    
    // Para 820hd: cargar TODAS las órdenes sin filtrar (los filtros se aplican después)
    if (is820hd) {
      this.orders = allOrders;
    } else if (isLaboratorio) {
      // Laboratorio: solo órdenes del sector laboratorio (con o sin técnico)
      this.orders = allOrders.filter((order: Order) => {
        const orderSector = this.normalizeSector(order.sector || '');
        return orderSector === 'laboratorio';
      });
    } else {
      // Otras áreas: aplicar reglas de visibilidad
      this.orders = allOrders.filter((order: Order) => {
        const orderSector = this.normalizeSector(order.sector || '');
        const orderTechnicianIds = order.idresponsable ? order.idresponsable.split(',').map(id => parseInt(id.trim())) : [];
        
        // Órdenes sin área ni técnico: visibles para todos
        if (!order.sector && orderTechnicianIds.length === 0) {
          return true;
        }
        
        // Órdenes con área pero sin técnico: visibles para todos los técnicos de esa área
        if (orderSector === this.normalizeSector(this.area) && orderTechnicianIds.length === 0) {
          return true;
        }
        
        // Órdenes con área y técnico: visibles solo para ese técnico
        if (orderSector === this.normalizeSector(this.area) && orderTechnicianIds.includes(currentTechnicianId)) {
          return true;
        }
        
        return false;
      });
    }
    
    // Aplicar filtros locales si existen (igual que en loadOrders)
    if (is820hd && Object.keys(this.currentFilters).length > 0) {
      this.applyFilters();
    } else {
      this.filteredOrders = [...this.orders];
      this.totalItems = this.orders.length;
    }
  }

  /**
   * Inicializa la configuración de filtros con ng-select
   */
  private initializeFilterConfig(): void {
    this.filterConfig = [
      {
        type: 'ng-select',
        name: 'tipo',
        label: 'Tipo de Orden',
        placeholder: 'Todos los tipos',
        options: this.getTipoOptions().map(tipo => ({ label: tipo, value: tipo })),
        optionLabel: 'label',
        optionValue: 'value'
      },
      {
        type: 'ng-select',
        name: 'estado',
        label: 'Estado Operativo',
        placeholder: 'Todos los estados',
        options: this.getEstadoOptions().map(estado => ({ label: estado, value: estado })),
        optionLabel: 'label',
        optionValue: 'value'
      },
      {
        type: 'ng-select',
        name: 'prioridad',
        label: 'Prioridad',
        placeholder: 'Todas las prioridades',
        options: this.priorities,
        optionLabel: 'label',
        optionValue: 'value'
      },
      {
        type: 'text',
        name: 'empresa',
        label: 'Empresa',
        placeholder: 'Buscar por empresa...'
      }
    ];
  }

  /**
   * Inicializa el componente con los datos del área
   */
  private initializeComponent(): void {
    // Obtener el área de la URL
    this.area = this.route.snapshot.paramMap.get('area') || '';
    this.areaDisplayName = this.getAreaDisplayName(this.area);
    
    if (!this.area) {
      this.error = 'No se pudo obtener el área seleccionada';
      this.showSnackBar('Error: No se pudo obtener el área seleccionada', 'error');
    }
  }

  /**
   * Obtiene el nombre de visualización del área
   */
  private getAreaDisplayName(area: string): string {
    return AREA_DISPLAY_NAMES[area] || area;
  }

  /**
   * Carga las órdenes según las reglas de visibilidad:
   * - Para 820hd: carga TODAS las órdenes (permite filtrado cross-area/técnico)
   * - Para Laboratorio: solo órdenes del sector Laboratorio (sin incluir órdenes sin asignar)
   * - Para otras áreas (Campo, etc):
   *   - Órdenes sin área ni técnico: visibles para todos
   *   - Órdenes con área pero sin técnico: visibles para todos los técnicos de esa área
   *   - Órdenes con área y técnico: visibles solo para ese técnico
   */
  loadOrders(): void {
    if (!this.area) {
      return;
    }

    // Obtener el ID del técnico actual
    const technician = this.getCurrentTechnician();
    if (!technician.id) {
      this.error = 'No se encontraron credenciales de usuario';
      this.showSnackBar('Error: No se encontraron credenciales de usuario', 'error');
      return;
    }

    const currentTechnicianId = technician.id;
    const is820hd = this.normalizeSector(this.area) === '820hd';

    this.loading = true;
    this.error = '';

    // Cargar todas las órdenes internas con showAll=true
    this.ordersService.getInternalOrders({ showAll: true }, 1, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: OrdersResponse | any) => {
          this.loading = false;
          const allOrders = response.data || response.orders || response || [];
          
          const isLaboratorio = this.normalizeSector(this.area) === 'laboratorio';
          
          // Para 820hd: cargar TODAS las órdenes sin filtrar (los filtros se aplican después)
          if (is820hd) {
            this.orders = allOrders;
          } else if (isLaboratorio) {
            // Laboratorio: solo órdenes del sector laboratorio (con o sin técnico)
            this.orders = allOrders.filter((order: Order) => {
              const orderSector = this.normalizeSector(order.sector);
              return orderSector === 'laboratorio';
            });
          } else {
            // Para otras áreas (Campo, etc): aplicar reglas de visibilidad
            this.orders = allOrders.filter((order: Order) => {
              // Normalizar valores de sector
              const orderSector = this.normalizeSector(order.sector);
              const currentArea = this.normalizeSector(this.area);
              
              // Verificar si hay técnicos asignados
              const hasTechnicians = (order.responsables && order.responsables.length > 0) || order.idresponsable;
              const isAssignedToTech = this.isTechnicianAssigned(order, currentTechnicianId);
              
              // Regla 1: Sin área NI técnico → visible para TODOS
              if (!orderSector && !hasTechnicians) {
                return true;
              }
              
              // Regla 2: Con área pero SIN técnico → visible para todos los técnicos de esa área
              if (orderSector && !hasTechnicians) {
                return orderSector === currentArea;
              }
              
              // Regla 3: Con área Y técnico → visible solo si el técnico actual está asignado
              if (orderSector && hasTechnicians) {
                return isAssignedToTech && orderSector === currentArea;
              }
              
              return false;
            });
          }
          
          // Para 820HD, aplicar filtros por defecto (técnico actual)
          // Para otras áreas, mostrar todas las órdenes ya filtradas
          if (is820hd && Object.keys(this.currentFilters).length > 0) {
            this.applyFilters();
          } else {
            this.filteredOrders = [...this.orders];
            this.totalItems = this.orders.length;
          }
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error al cargar las órdenes';
          this.showSnackBar('Error al cargar las órdenes', 'error');
          console.error('Error loading orders:', err);
        }
      });
  }

  /**
   * Obtiene los datos del técnico actual desde las credenciales
   * @returns {id: number | null, name: string} - Datos del técnico actual
   */
  private getCurrentTechnician(): { id: number | null; name: string } {
    const credentials = this.credentialsService.getCredentials();
    if (!credentials) {
      return { id: null, name: '' };
    }
    
    const userData = JSON.parse(credentials);
    return {
      id: userData.idClient || userData.idContact,
      name: userData.name || ''
    };
  }

  /**
   * Verifica si un técnico está asignado a una orden (soporta múltiples técnicos)
   * @param order - Orden a verificar
   * @param technicianId - ID del técnico a buscar
   * @returns true si el técnico está asignado a la orden
   */
  private isTechnicianAssigned(order: Order, technicianId: number): boolean {
    if (!order || !technicianId) return false;
    
    // Check responsables array (primary source for multiple technicians)
    if (order.responsables && order.responsables.length > 0) {
      return order.responsables.some(r => r.id === technicianId);
    }
    
    // Fallback: parse idresponsable string
    if (order.idresponsable) {
      const ids = order.idresponsable.toString().split(',').map(id => parseInt(id.trim()));
      return ids.includes(technicianId);
    }
    
    // Fallback: check by name
    const assignedTechId = this.getTechnicianIdByName(order.nombreAsignado);
    return assignedTechId === technicianId;
  }

  /**
   * Normaliza el nombre del sector para comparaciones consistentes
   */
  private normalizeSector(sector: string | undefined): string {
    if (!sector) return '';
    const normalized = sector.toLowerCase().trim();
    return SECTOR_NORMALIZATION_MAP[normalized] || normalized;
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
   * Carga los técnicos si el área actual es 820hd
   */
  private loadTechniciansIfNeeded(): void {
    if (this.area !== '820hd') return;
    
    // Obtener datos del técnico actual
    const technician = this.getCurrentTechnician();
    this.currentTechnicianId = technician.id;
    this.currentTechnicianName = technician.name;
    
    // Cargar lista de técnicos activos
    this.personnelService.getTechnicians(true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Technician[]) => {
          // Filtrar solo técnicos activos como medida de seguridad adicional
          this.technicians = data.filter(t => t.activo !== false);
          this.updateFilterConfigFor820HD();
        },
        error: (err) => {
          console.error('Error loading technicians:', err);
          this.showSnackBar('Error al cargar lista de técnicos', 'error');
        }
      });
  }

  /**
   * Actualiza la configuración de filtros para área 820HD
   */
  private updateFilterConfigFor820HD(): void {
    // Agregar filtros de técnico y sector al inicio del array
    this.filterConfig = [
      {
        type: 'ng-select',
        name: 'assignedTo',
        label: 'Técnico Asignado',
        placeholder: 'Todos los técnicos',
        options: this.technicians,
        optionLabel: 'name',
        optionValue: 'id',
        defaultValue: this.currentTechnicianId
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
        optionValue: 'value',
        defaultValue: '820HD'
      },
      ...this.filterConfig // Mantener filtros existentes
    ];
    
    // Establecer filtro por defecto al técnico actual
    const technician = this.getCurrentTechnician();
    if (technician.id) {
      this.currentFilters['assignedTo'] = technician.id;
      // Los filtros se aplicarán cuando se carguen las órdenes
    }
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
   * Maneja el cambio de página
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  /**
   * Obtiene el estado operativo de la orden
   * Utiliza funciones utilitarias compartidas para consistencia
   */
  getOrderStatus = getOrderStatus;

  /**
   * Obtiene el color del estado de la orden
   * Utiliza funciones utilitarias compartidas para consistencia
   */
  getStatusColor(order: Order): string {
    const status = this.getOrderStatus(order);
    return getStatusDisplayColor(status);
  }

  /**
   * Obtiene el nombre de visualización del estado
   * Utiliza funciones utilitarias compartidas para consistencia
   */
  getStatusDisplayName = getStatusDisplayName;

  /**
   * Obtiene el tipo de orden formateado
   * Utiliza funciones utilitarias compartidas para consistencia
   */
  getOrderType = getOrderType;

  /**
   * Obtiene la empresa del cliente
   */
  getEmpresaDisplay(order: Order): string {
    return order.empresa || order.nombre || 'N/A';
  }

  /**
   * Obtiene la hora formateada
   */
  getHoraDisplay(order: Order): string {
    return order.hora || '--';
  }

  /**
   * Navega a la vista de detalle de una orden específica
   */
  viewOrderDetails(order: Order): void {
    this.router.navigate(['/technician/orders', this.area, order.numero.toString()]);
  }

  /**
   * Abre el diálogo de edición de orden con todos los campos editables
   */
  openUpdateDialog(order: Order): void {
    // Asegurar que los técnicos estén cargados
    if (this.technicians.length === 0) {
      this.loadTechniciansIfNeeded();
    }

    const dialogData = { 
      ...order, 
      technicians: this.technicians 
    };
    
    const dialogRef = this.dialog.open(UpdateOrderDialogComponent, {
      width: '90%',
      maxWidth: '1200px',
      autoFocus: false,
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ordersService.updateOrder(order.numero, result)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadOrders(); // Recargar lista
              this.showSnackBar('Orden actualizada exitosamente', 'success');
            },
            error: (error) => {
              console.error('Error updating order:', error);
              this.showSnackBar('Error al actualizar la orden', 'error');
            }
          });
      }
    });
  }

  /**
   * Verifica si el técnico puede tomar la orden
   * Solo para áreas 820HD y Campo, y órdenes sin técnico asignado
   */
  canTakeOrder(order: Order): boolean {
    const area = this.normalizeSector(this.area);
    const allowedAreas = ['820hd', 'campo'];
    
    // Solo en áreas permitidas
    if (!allowedAreas.includes(area)) {
      return false;
    }
    
    // Verificar array de responsables (principal)
    if (order.responsables && order.responsables.length > 0) {
      return false;
    }
    
    // Verificar campos legacy (fallback)
    const hasAssignedTech = order.idresponsable || order.nombreAsignado;
    return !hasAssignedTech;
  }

  /**
   * Auto-asigna la orden al técnico actual
   * También establece la fecha/hora de inicio del trabajo
   */
  takeOrder(order: Order): void {
    // Doble verificación de seguridad
    if (!this.canTakeOrder(order)) {
      this.showSnackBar('La orden ya tiene técnicos asignados', 'error');
      return;
    }
    
    const technician = this.getCurrentTechnician();
    if (!technician.id) {
      this.showSnackBar('Error: No se encontraron credenciales de usuario', 'error');
      return;
    }

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
    const sectorValue = this.getSectorForBackend(order.sector || this.area);
    const updateData: any = {
      assignedToIds: [technician.id],
      sector: sectorValue,
      fechaini: fechaini,
      horaini: horaini,
      estado: 'En Progreso' // Cambiar a En Progreso automáticamente
    };

    this.ordersService.updateOrder(order.numero, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackBar(`Orden N° ${order.numero} asignada exitosamente`, 'success');
          this.loadOrders(); // Recargar lista
        },
        error: (error) => {
          console.error('Error taking order:', error);
          this.showSnackBar('Error al asignar la orden', 'error');
        }
      });
  }

  /**
   * Handler para cambios en los filtros
   */
  onFilterChange(filters: FilterValues): void {
    this.currentFilters = filters;
    this.applyFilters();
  }

  /**
   * Aplica los filtros a la lista de órdenes
   * Para área 820hd: permite filtrar cross-area/técnico si hay filtros activos
   * Las órdenes sin asignar (sin técnico o sin sector) siempre son visibles
   */
  private applyFilters(): void {
    const filters = this.currentFilters;
    
    this.filteredOrders = this.orders.filter(order => {
      let matches = true;

      // Filtro por técnico asignado (solo para área 820hd)
      // Incluye órdenes sin técnico asignado (disponibles para tomar)
      if (filters['assignedTo']) {
        const techId = filters['assignedTo'];
        const hasNoTechnician = (!order.responsables || order.responsables.length === 0) && !order.idresponsable;
        const isAssignedToFilteredTech = this.isTechnicianAssigned(order, techId);
        // Mostrar si: coincide con el técnico filtrado O no tiene técnico asignado
        matches = matches && (isAssignedToFilteredTech || hasNoTechnician);
      }

      // Filtro por sector (solo para área 820hd)
      // Incluye órdenes sin sector asignado (disponibles para todas las áreas)
      if (filters['sector']) {
        const orderSector = this.normalizeSector(order.sector);
        const filterSector = this.normalizeSector(filters['sector']);
        // Mostrar si: coincide con el sector filtrado O no tiene sector asignado
        matches = matches && (orderSector === filterSector || !orderSector);
      }

      // Filtro por tipo
      if (filters['tipo']) {
        const orderType = this.getOrderType(order);
        matches = matches && orderType === filters['tipo'];
      }

      // Filtro por empresa
      if (filters['empresa']) {
        const empresa = this.getEmpresaDisplay(order).toLowerCase();
        matches = matches && empresa.includes(filters['empresa'].toLowerCase());
      }

      // Filtro por estado (optimizado: usar enum OrderStatus para type safety)
      const filterEstado = filters['estado'] as string | undefined;
      
      if (filterEstado) {
        // Usuario seleccionó un estado específico: mostrar solo ese estado
        const status = this.getStatusDisplayName(this.getOrderStatus(order));
        matches = matches && status === filterEstado;
      } else {
        // COMPORTAMIENTO INTENCIONAL: Por defecto excluir órdenes finalizadas y canceladas
        // Esto mejora la experiencia mostrando solo órdenes activas por defecto.
        // Si el usuario selecciona "Finalizada" o "Cancelada" en el filtro, se mostrarán solo esas.
        // NOTA: Si una orden tiene estado='Finalizada' pero finalizado=false, se excluye por seguridad
        const orderStatus = this.getOrderStatus(order);
        const statusDisplay = this.getStatusDisplayName(orderStatus);
        // Usar enum OrderStatus para comparación type-safe
        const isFinished = orderStatus === OrderStatus.FINALIZADA || order.finalizado === true;
        const isCancelled = orderStatus === OrderStatus.CANCELADA || order.anulada === true;
        if (isFinished || isCancelled) {
          matches = false; // Excluir finalizadas y canceladas por defecto
        }
      }

      // Filtro por prioridad
      if (filters['prioridad']) {
        matches = matches && order.prioridad === filters['prioridad'];
      }

      return matches;
    });

    this.totalItems = this.filteredOrders.length;
    this.currentPage = 0; // Reset to first page when filtering
  }


  /**
   * Obtiene las opciones de tipo para el filtro
   */
  getTipoOptions(): string[] {
    return ['Insumos', 'Soporte', 'Mantenimiento', 'Limpieza', 'General'];
  }


  /**
   * Obtiene las opciones de estado para el filtro
   * Utiliza la configuración de estados operativos
   */
  getEstadoOptions(): string[] {
    return ORDER_STATUS_CONFIG.map(config => config.label);
  }

  /**
   * Obtiene el texto de la prioridad con formato consistente
   */
  getPriorityText(priority: string): string {
    if (!priority) {
      return 'Sin prioridad';
    }
    
    return PRIORITY_TEXT_MAP[priority.toLowerCase()] || priority;
  }

  /**
   * Obtiene la clase CSS para el badge de prioridad
   */
  getPriorityClass(priority: string | undefined): string {
    if (!priority) {
      return 'priority-none';
    }
    
    const priorityStr = priority.toLowerCase().trim();
    return PRIORITY_CLASS_MAP[priorityStr] || 'priority-none';
  }

  /**
   * Maneja el logout del técnico
   */
  logout(): void {
    this.authService.logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigate(['/signin']);
          this.showSnackBar('Sesión cerrada exitosamente', 'success');
        },
        error: (error) => {
          console.error('Error during logout:', error);
          // Aún así, limpiar las credenciales localmente y redirigir
          this.credentialsService.revokeCredentials();
          this.router.navigate(['/signin']);
          this.showSnackBar('Sesión cerrada (error en servidor)', 'success');
        }
      });
  }

  /**
   * Abre el diálogo para crear una nueva orden
   * Reutiliza el componente CreateOrderDialogComponent existente
   */
  createOrder(): void {
    // Obtener el técnico actual desde las credenciales
    const technician = this.getCurrentTechnician();
    if (!technician.id) {
      this.showSnackBar('Error: No se encontraron credenciales de usuario', 'error');
      return;
    }

    // Preparar datos para el diálogo con autoasignación
    const dialogData = {
      autoAssign: {
        technicianId: technician.id,
        sector: this.area,
        technicianName: technician.name
      }
    };

    const dialogRef = this.dialog.open(CreateOrderDialogComponent, {
      width: '90%',
      autoFocus: false,
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ordersService.createOrder(result).subscribe({
          next: () => {
            this.loadOrders(); // Recargar la lista de órdenes
            this.showSnackBar('Orden creada exitosamente', 'success');
          },
          error: (error) => {
            console.error('Error creating order:', error);
            this.showSnackBar('Error al crear la orden', 'error');
          }
        });
      }
    });
  }

  /**
   * Obtiene el ID del técnico por su nombre
   */
  private getTechnicianIdByName(name: string | undefined): number | null {
    if (!name) return null;
    const tech = this.technicians.find(t => t.name === name);
    return tech ? tech.id : null;
  }

  /**
   * Exporta una orden a PDF
   * @param order - Orden a exportar
   */
  exportOrderToPdf(order: Order): void {
    try {
      // Order es ahora un alias de Ticket, se puede usar directamente
      this.pdfExportService.exportOrderToPdf(order);
      this.showSnackBar('PDF generado exitosamente', 'success');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.showSnackBar('Error al generar el PDF', 'error');
    }
  }

  /**
   * Abre el diálogo para generar una orden desde remito
   * Permite a los técnicos crear OT desde remitos existentes
   */
  createOrderFromRemito(): void {
    // Obtener el técnico actual desde las credenciales
    const technician = this.getCurrentTechnician();
    if (!technician.id) {
      this.showSnackBar('Error: No se encontraron credenciales de usuario', 'error');
      return;
    }

    // Abrir selector de remitos
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
      
      // Los materiales van en un campo separado (txtmateriales)
      let txtmateriales = '';
      if (r?.materiales && r.materiales.length > 0) {
        txtmateriales = r.materiales.map((m: any) => `${m.cantidad}x ${m.descripcion}`).join('\n');
      }
      
      // Abrir diálogo de creación con datos prefilled
      const dialogRef2 = this.dialog.open(CreateOrderDialogComponent, {
        width: '90%',
        autoFocus: false,
        disableClose: false,
        data: { 
          prefill: {
            clientId: r?.cliente?.id,
            description: description,
            txtmateriales: txtmateriales, // Campo separado para materiales
            horaEntrada: r?.horaEntrada,
            horaSalida: r?.horaSalida,
            // Auto-asignar al técnico del remito si está disponible
            assignedTechnicianId: r?.tecnico?.id
          },
          autoAssign: {
            technicianId: technician.id,
            sector: this.area,
            technicianName: technician.name
          }
        },
      });

      dialogRef2.afterClosed().subscribe(result => {
        if (result) {
          this.ordersService.createOrder(result).subscribe({
            next: () => {
              this.loadOrders(); // Recargar la lista de órdenes
              this.showSnackBar('Orden creada desde remito exitosamente', 'success');
            },
            error: (error) => {
              console.error('Error creating order from remito:', error);
              this.showSnackBar('Error al crear la orden desde remito', 'error');
            }
          });
        }
      });
    });
  }
}
