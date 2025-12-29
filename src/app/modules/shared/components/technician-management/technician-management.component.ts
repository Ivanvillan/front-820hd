import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PersonnelService, Technician, CreateTechnicianRequest, UpdateTechnicianRequest } from 'src/app/services/personnel/personnel.service';
import { PersonnelCategoryService, PersonnelCategory } from 'src/app/services/personnel-category/personnel-category.service';
import { EditTechnicianAreaDialogComponent } from './edit-technician-area-dialog/edit-technician-area-dialog.component';
import { CreateTechnicianDialogComponent } from './create-technician-dialog/create-technician-dialog.component';
import { EditTechnicianDialogComponent } from './edit-technician-dialog/edit-technician-dialog.component';
import { DeleteTechnicianDialogComponent } from './delete-technician-dialog/delete-technician-dialog.component';
import { ColumnConfig } from 'src/app/services/column-selector/column-selector.service';
import { FilterConfig } from 'src/app/components/filter-bar/filter-bar.component';

/**
 * TechnicianManagementComponent - Gestión de Técnicos
 * ✅ Refactorizado con FilterBarComponent y ConfigurableTableComponent
 * ✅ Diseño consistente Material Design 13
 */
@Component({
  selector: 'app-technician-management',
  templateUrl: './technician-management.component.html',
  styleUrls: ['./technician-management.component.scss']
})
export class TechnicianManagementComponent implements OnInit {
  
  // ==================== CONFIGURACIÓN DE FILTROS ====================
  
  filters: FilterConfig[] = [
    { name: 'search', label: 'Buscar', type: 'text', placeholder: 'Nombre, email, teléfono...' },
    { 
      name: 'area', 
      label: 'Área', 
      type: 'ng-select', 
      placeholder: 'Todas las áreas', 
      options: [
        { value: 'campo', label: 'Campo' },
        { value: 'laboratorio', label: 'Laboratorio' },
        { value: '820hd', label: '820HD' },
        { value: 'general', label: 'General' }
      ],
      optionLabel: 'label',
      optionValue: 'value'
    }
  ];

  // ==================== CONFIGURACIÓN DE COLUMNAS ====================
  
  columns: ColumnConfig[] = [
    { id: 'id', label: 'ID', visible: false, sortable: false },
    { id: 'nombre', label: 'Nombre', visible: true, sortable: false },
    { id: 'area', label: 'Área', visible: true, sortable: false },
    { id: 'email', label: 'Email', visible: true, sortable: false },
    { id: 'telefono', label: 'Teléfono', visible: true, sortable: false },
    { id: 'activo', label: 'Estado', visible: true, sortable: false },
    { id: 'actions', label: 'Acciones', visible: true, sortable: false }
  ];

  // ==================== DATOS ====================
  
  technicians: Technician[] = [];
  filteredTechnicians: Technician[] = [];
  categories: PersonnelCategory[] = [];
  loading = false;
  currentFilters: any = {};

  // Opciones de área válidas
  areaOptions = [
    { value: 'campo', label: 'Campo' },
    { value: 'laboratorio', label: 'Laboratorio' },
    { value: '820hd', label: '820HD' },
    { value: 'general', label: 'General' }
  ];

  // ==================== TEMPLATES ====================
  
  @ViewChild('nameTemplate', { static: true }) nameTemplate!: TemplateRef<any>;
  @ViewChild('areaTemplate', { static: true }) areaTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<any>;

  constructor(
    private personnelService: PersonnelService,
    private personnelCategoryService: PersonnelCategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadTechnicians();
  }

  // ==================== CARGAR DATOS ====================

  /**
   * Carga la lista de categorías desde la API
   */
  loadCategories(): void {
    this.personnelCategoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error cargando categorías:', error);
        this.snackBar.open('Error cargando categorías', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Carga la lista de técnicos desde la API
   */
  loadTechnicians(): void {
    this.loading = true;
    this.personnelService.getTechnicians().subscribe({
      next: (technicians) => {
        this.technicians = technicians;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar técnicos:', error);
        this.snackBar.open('Error al cargar la lista de técnicos', 'Cerrar', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  // ==================== FILTROS ====================

  /**
   * Aplica filtros a la lista de técnicos
   */
  onFilterChange(filters: any): void {
    this.currentFilters = filters;
    this.applyFilters();
  }

  onFilterClear(): void {
    this.currentFilters = {};
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.technicians];

    // Filtro de búsqueda general
    if (this.currentFilters.search) {
      const term = this.currentFilters.search.toLowerCase();
      filtered = filtered.filter(tech =>
        (tech.name && tech.name.toLowerCase().includes(term)) ||
        (tech.apellido && tech.apellido.toLowerCase().includes(term)) ||
        (tech.email && tech.email.toLowerCase().includes(term)) ||
        (tech.telefono && tech.telefono.includes(term))
      );
    }

    // Filtro de área
    if (this.currentFilters.area) {
      filtered = filtered.filter(tech => tech.area === this.currentFilters.area);
    }

    this.filteredTechnicians = filtered;
  }

  // ==================== MÉTODOS DE UTILIDAD ====================

  /**
   * Obtiene la descripción de una categoría por su ID
   */
  getCategoryDescription(categoryId: number): string {
    const category = this.categories.find(cat => cat.id === categoryId);
    return category ? category.descripcion : 'Sin categoría';
  }

  /**
   * Obtiene el nombre legible del área
   */
  getAreaLabel(area: string): string {
    const option = this.areaOptions.find(opt => opt.value === area);
    return option ? option.label : area;
  }

  // ==================== ACCIONES DE CRUD ====================

  /**
   * Abre el modal para crear un nuevo técnico
   */
  createTechnician(): void {
    const dialogRef = this.dialog.open(CreateTechnicianDialogComponent, {
      width: '90%',
      maxWidth: '50%',
      autoFocus: false,
      disableClose: false,
      data: { 
        areaOptions: this.areaOptions,
        categories: this.categories
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performCreateTechnician(result);
      }
    });
  }

  /**
   * Abre el modal para editar un técnico completo
   */
  editTechnician(technician: Technician): void {
    const dialogRef = this.dialog.open(EditTechnicianDialogComponent, {
      width: '90%',
      maxWidth: '50%',
      autoFocus: false,
      disableClose: false,
      data: { 
        technician: technician,
        areaOptions: this.areaOptions,
        categories: this.categories
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performUpdateTechnician(technician.id, result);
      }
    });
  }

  /**
   * Abre el modal para eliminar un técnico
   */
  deleteTechnician(technician: Technician): void {
    const dialogRef = this.dialog.open(DeleteTechnicianDialogComponent, {
      width: '90%',
      maxWidth: '50%',
      autoFocus: false,
      disableClose: false,
      data: { technician: technician }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performDeleteTechnician(technician.id);
      }
    });
  }

  /**
   * Abre el modal para editar solo el área de un técnico (método legacy)
   */
  editTechnicianArea(technician: Technician): void {
    const dialogRef = this.dialog.open(EditTechnicianAreaDialogComponent, {
      width: '90%',
      maxWidth: '50%',
      autoFocus: false,
      disableClose: false,
      data: { 
        technician: technician,
        areaOptions: this.areaOptions
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateTechnicianArea(technician.id, result.area);
      }
    });
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Crea un nuevo técnico
   */
  private performCreateTechnician(technicianData: CreateTechnicianRequest): void {
    this.loading = true;
    this.personnelService.createTechnician(technicianData).subscribe({
      next: (response) => {
        this.snackBar.open('Técnico creado correctamente', 'Cerrar', {
          duration: 3000
        });
        this.loadTechnicians();
      },
      error: (error) => {
        console.error('Error al crear técnico:', error);
        this.snackBar.open('Error al crear el técnico', 'Cerrar', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  /**
   * Actualiza un técnico existente
   */
  private performUpdateTechnician(technicianId: number, technicianData: UpdateTechnicianRequest): void {
    this.loading = true;
    this.personnelService.updateTechnician(technicianId, technicianData).subscribe({
      next: (response) => {
        this.snackBar.open('Técnico actualizado correctamente', 'Cerrar', {
          duration: 3000
        });
        this.loadTechnicians();
      },
      error: (error) => {
        console.error('Error al actualizar técnico:', error);
        this.snackBar.open('Error al actualizar el técnico', 'Cerrar', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  /**
   * Elimina un técnico
   */
  private performDeleteTechnician(technicianId: number): void {
    this.loading = true;
    this.personnelService.deleteTechnician(technicianId).subscribe({
      next: (response) => {
        this.snackBar.open('Técnico eliminado correctamente', 'Cerrar', {
          duration: 3000
        });
        this.loadTechnicians();
      },
      error: (error) => {
        console.error('Error al eliminar técnico:', error);
        this.snackBar.open('Error al eliminar el técnico', 'Cerrar', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  /**
   * Actualiza el área de un técnico (método legacy)
   */
  private updateTechnicianArea(technicianId: number, newArea: string): void {
    this.loading = true;
    this.personnelService.updateTechnicianArea(technicianId, newArea).subscribe({
      next: (response) => {
        this.snackBar.open('Área actualizada correctamente', 'Cerrar', {
          duration: 3000
        });
        this.loadTechnicians();
      },
      error: (error) => {
        console.error('Error al actualizar área:', error);
        this.snackBar.open('Error al actualizar el área del técnico', 'Cerrar', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }
}
