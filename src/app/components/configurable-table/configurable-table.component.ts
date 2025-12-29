import { Component, Input, OnInit, OnChanges, Output, EventEmitter, ViewChild, OnDestroy, TemplateRef, SimpleChanges, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ColumnConfig, ColumnSelectorService } from '../../services/column-selector/column-selector.service';
import { ColumnSelectorComponent } from '../column-selector/column-selector.component';
import { CredentialsService } from '../../services/credentials/credentials.service';

@Component({
  selector: 'app-configurable-table',
  templateUrl: './configurable-table.component.html',
  styleUrls: ['./configurable-table.component.scss']
})
export class ConfigurableTableComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() tableId!: string;
  @Input() title: string = '';
  @Input() defaultColumns: ColumnConfig[] = [];
  @Input() data: any[] = [];
  @Input() showPaginator: boolean = true;
  @Input() pageSize: number = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50, 100];
  @Input() showColumnSelector: boolean = true;
  @Input() loading: boolean = false;
  @Input() emptyStateMessage: string = 'No hay datos disponibles';
  @Input() columnTemplates: { [key: string]: TemplateRef<any> } = {};
  
  // Server-side pagination inputs
  @Input() length?: number;
  @Input() pageIndex: number = 0;
  @Input() serverSidePagination: boolean = false;

  @Output() rowClick = new EventEmitter<any>();
  @Output() actionClick = new EventEmitter<{ action: string, row: any }>();
  @Output() pageChange = new EventEmitter<PageEvent>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<any>([]);
  visibleColumns: ColumnConfig[] = [];
  displayedColumns: string[] = [];
  userId: string = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private columnSelectorService: ColumnSelectorService,
    private credentialsService: CredentialsService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUserId();
    this.loadColumnConfiguration();
    this.updateDataSource();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    if (this.showPaginator && this.paginator) {
      if (this.serverSidePagination) {
        // Para paginación del servidor, NO conectar dataSource.paginator
        // En su lugar, suscribirse a eventos del paginator
        this.paginator.page
          .pipe(takeUntil(this.destroy$))
          .subscribe((event: PageEvent) => {
            this.pageChange.emit(event);
          });
      } else {
        // Para paginación del cliente, conectar dataSource.paginator
        this.dataSource.paginator = this.paginator;
      }
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Intentar recargar userId si aún no lo tenemos (usuario puede haber iniciado sesión)
    if (!this.userId) {
      this.loadUserId();
    }
    
    if (changes['data']) {
      this.updateDataSource();
    }
    
    if (changes['defaultColumns'] && changes['defaultColumns'].currentValue) {
      this.loadColumnConfiguration();
    }
  }

  private loadUserId(): void {
    const credentials = this.credentialsService.getCredentialsParsed();
    if (credentials) {
      // Intentar obtener userId de diferentes campos posibles
      this.userId = 
        credentials.idContact?.toString() || 
        credentials.id7c?.toString() || 
        credentials.idClient?.toString() ||
        credentials.id7?.toString() ||
        '';
    }
  }

  private loadColumnConfiguration(): void {
    if (!this.tableId) {
      // Sin tableId, usar columnas por defecto
      this.visibleColumns = this.defaultColumns?.filter(col => col.visible) || [];
      this.updateDisplayedColumns();
      return;
    }
    
    if (!this.userId) {
      // Sin userId, usar columnas por defecto (usuario no autenticado aún)
      this.visibleColumns = this.defaultColumns?.filter(col => col.visible) || [];
      this.updateDisplayedColumns();
      return;
    }
    
    // Con tableId y userId, cargar preferencias guardadas
    this.visibleColumns = this.columnSelectorService.getVisibleColumns(
      this.tableId,
      this.userId,
      this.defaultColumns || []
    );
    
    this.updateDisplayedColumns();
  }

  private updateDisplayedColumns(): void {
    this.displayedColumns = this.visibleColumns.map(col => col.id);
  }

  private updateDataSource(): void {
    this.dataSource.data = this.data || [];
    // Si es paginación del servidor, no resetear el paginador
    // El paginador se controla desde el componente padre
    if (!this.serverSidePagination && this.dataSource.paginator) {
      // Solo resetear si es paginación del cliente
      this.dataSource.paginator.firstPage();
    }
  }

  openColumnSelector(): void {
    const allColumns = this.columnSelectorService.getAllColumns(
      this.tableId,
      this.userId,
      this.defaultColumns
    );

    const dialogRef = this.dialog.open(ColumnSelectorComponent, {
      data: {
        columns: allColumns,
        title: `Configurar columnas - ${this.title || 'Tabla'}`
      },
      panelClass: 'custom-dialog-panel',
      autoFocus: true,        // Mover foco automáticamente al dialog
      restoreFocus: true,     // Restaurar foco al cerrar
      disableClose: false     // Permitir cerrar con ESC
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.saveColumnConfiguration(result);
          this.loadColumnConfiguration();
        }
      });
  }

  private saveColumnConfiguration(columns: ColumnConfig[]): void {
    this.columnSelectorService.saveColumnPreferences(
      this.tableId,
      this.userId,
      columns
    );
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  onActionClick(action: string, row: any, event: Event): void {
    event.stopPropagation(); // Prevent row click
    this.actionClick.emit({ action, row });
  }

  hasCustomTemplate(columnId: string): boolean {
    return !!this.columnTemplates[columnId];
  }

  getCustomTemplate(columnId: string): TemplateRef<any> | null {
    return this.columnTemplates[columnId] || null;
  }

  getCellValue(row: any, columnId: string): any {
    // Support nested properties with dot notation
    if (columnId.includes('.')) {
      return columnId.split('.').reduce((obj, key) => obj?.[key], row);
    }
    return row[columnId];
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getColumnWidth(column: ColumnConfig): string {
    return column.width || 'auto';
  }

  isSortable(column: ColumnConfig): boolean {
    return column.sortable !== false; // Default to true
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}

