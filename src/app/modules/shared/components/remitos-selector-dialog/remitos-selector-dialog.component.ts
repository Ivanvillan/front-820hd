import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { OrdersService } from 'src/app/services/orders/orders.service';

interface RemitoItem { id: number; descripcion: string; cantidad: number; }
interface Remito {
  id: number;
  numero: string;
  fecha: string;
  cliente: { id: number; nombre: string };
  tecnico: { id: number; nombre: string };
  descripcion: string;
  materiales: RemitoItem[];
  horaEntrada?: string;
  horaSalida?: string;
}

@Component({
  selector: 'app-remitos-selector-dialog',
  templateUrl: './remitos-selector-dialog.component.html',
  styleUrls: ['./remitos-selector-dialog.component.scss']
})
export class RemitosSelectorDialogComponent implements OnInit {
  filterForm: FormGroup;
  isLoading = false;
  dataSource = new MatTableDataSource<Remito>([]);
  displayedColumns: string[] = ['select', 'fecha', 'numero', 'cliente', 'tecnico', 'descripcion', 'horaEntrada', 'horaSalida', 'materiales'];
  selection = new Set<number>();

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private ordersService: OrdersService,
    public dialogRef: MatDialogRef<RemitosSelectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { clientId?: number }
  ) {
    this.filterForm = this.fb.group({
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    this.loadRemitos();
  }

  loadRemitos(): void {
    this.isLoading = true;
    const raw = this.filterForm.value;
    const filters: any = {};
    if (raw.startDate) filters.startDate = this.toDateString(raw.startDate);
    if (raw.endDate) filters.endDate = this.toDateString(raw.endDate);

    this.ordersService.getRemitos(filters).subscribe({
      next: (remitos: any) => {
        this.dataSource.data = Array.isArray(remitos) ? remitos : [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading remitos:', error);
        this.snackBar.open('No se pudieron cargar los remitos. Verifique la conexión con la API externa.', 'Cerrar', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }

  loadMaterials(remito: Remito): void {
    if (remito.materiales && remito.materiales.length > 0) {
      return; // Already loaded
    }
    
    this.ordersService.getRemitoItems(remito.id).subscribe({
      next: (items: any) => {
        remito.materiales = Array.isArray(items) ? items : [];
        this.snackBar.open(`Materiales cargados: ${remito.materiales.length} items`, 'Cerrar', { duration: 2000 });
      },
      error: (error) => {
        console.error('Error loading materials:', error);
        this.snackBar.open('No se pudieron cargar los materiales', 'Cerrar', { duration: 3000 });
      }
    });
  }

  toggleSelection(remito: Remito): void {
    if (this.selection.has(remito.id)) this.selection.delete(remito.id);
    else this.selection.add(remito.id);
  }

  isSelected(remito: Remito): boolean {
    return this.selection.has(remito.id);
  }

  clearSelection(): void {
    this.selection.clear();
  }

  confirm(): void {
    const selected = this.dataSource.data.filter(r => this.selection.has(r.id));
    if (selected.length === 0) {
      this.snackBar.open('Seleccione al menos un remito', 'Cerrar', { duration: 2500 });
      return;
    }
    this.dialogRef.close(selected);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private toDateString(d: any): string {
    if (!d) return '';
    
    // Si ya es un string en formato yyyy-MM-dd, devolverlo tal como está
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      return d;
    }
    
    // Si es un objeto Date, usar métodos locales para evitar problemas de zona horaria
    let date: Date;
    
    if (d instanceof Date) {
      date = d;
    } else if (typeof d === 'string') {
      // Para strings, crear la fecha de manera que evite problemas de zona horaria
      // Si es formato ISO (YYYY-MM-DD), crear fecha local
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        const [year, month, day] = d.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(d);
      }
    } else {
      date = new Date(d);
    }
    
    // Verificar que la fecha es válida
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided:', d);
      return '';
    }
    
    // Usar métodos locales para obtener año, mes y día sin conversión de zona horaria
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd}`;
  }
}


