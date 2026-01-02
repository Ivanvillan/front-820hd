import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Ticket } from 'src/app/models/ticket.model';
import { formatNotesForDisplay } from 'src/app/shared/utils/order-notes.utils';
import { OrdersService } from 'src/app/services/orders/orders.service';
import { CredentialsService } from 'src/app/services/credentials/credentials.service';
import { PdfExportService } from 'src/app/services/pdf-export/pdf-export.service';
import { 
  getOrderStatus,
  getStatusDisplayColor,
  getStatusText as getUtilStatusText
} from 'src/app/shared/utils/order-status.utils';

@Component({
  selector: 'app-ticket-detail-modal',
  templateUrl: './ticket-detail-modal.component.html',
  styleUrls: ['./ticket-detail-modal.component.scss']
})
export class TicketDetailModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public ticket: Ticket,
    private dialogRef: MatDialogRef<TicketDetailModalComponent>,
    private ordersService: OrdersService,
    private credentialsService: CredentialsService,
    private snackBar: MatSnackBar,
    private pdfExportService: PdfExportService
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  hasAdditionalInfo(): boolean {
    return !!(this.ticket.tipo || this.ticket.observaciones);
  }

  /**
   * Formatea las observaciones para mostrar de manera legible
   * @param observaciones - Campo observaciones del backend
   * @returns String formateado para mostrar en la UI
   */
  formatObservaciones(observaciones: string | undefined): string {
    if (!observaciones || !observaciones.trim()) {
      return 'Sin observaciones';
    }

    try {
      // Intentar parsear como JSON para formatear
      const notes = JSON.parse(observaciones);
      if (Array.isArray(notes)) {
        return formatNotesForDisplay(notes);
      }
    } catch (e) {
      // Si no es JSON válido, mostrar como texto plano
      return observaciones;
    }

    return observaciones;
  }

  /**
   * Obtiene el color del chip de estado usando los utils compartidos
   * Reutiliza la misma lógica que order-management
   */
  getStatusColor(ticket: Ticket): 'primary' | 'accent' | 'warn' {
    const status = getOrderStatus(ticket);
    return getStatusDisplayColor(status);
  }

  /**
   * Obtiene el texto del estado usando los utils compartidos
   * Reutiliza la misma lógica que order-management
   */
  getStatusText(ticket: Ticket): string {
    return getUtilStatusText(ticket);
  }

  /**
   * @deprecated Usar getStatusColor y getStatusText en su lugar
   * Método legacy basado en tiempo transcurrido
   */
  getTicketStatus(ticket: Ticket): { class: string, text: string } {
    const hours = this.calculateHours(ticket.fecha, ticket.hora);
    
    if (hours <= 1) return { class: 'recent-status', text: 'RECIENTE' };
    if (hours <= 2) return { class: 'pending-status', text: 'PENDIENTE' };
    if (hours <= 3) return { class: 'urgent-status', text: 'URGENTE' };
    return { class: 'critical-status', text: 'CRÍTICO' };
  }

  private calculateHours(fecha: string, hora?: string): number {
    const ticketDate = new Date(fecha);
    if (hora) { // If hora is provided, set it manually
      const [hours, minutes] = hora.split(':').map(Number);
      ticketDate.setHours(hours, minutes, 0, 0);
    }
    
    const now = new Date();
    const difference = now.getTime() - ticketDate.getTime();
    if (isNaN(difference)) {
      return 0; // Return a default value if date is invalid
    }
    return Math.floor(difference / (1000 * 3600));
  }

  /**
   * Obtiene el nombre del técnico asignado a la orden
   * @param ticket - Ticket de la orden
   * @returns Nombre del técnico asignado o "Sin asignar"
   */
  getAssignedTechnician(ticket: Ticket): string {
    // Priorizar el campo nombreAsignado (concatenado de múltiples responsables)
    if (ticket.nombreAsignado) {
      return ticket.nombreAsignado;
    }
    
    // Fallback al campo referente
    if (ticket.referente) {
      return ticket.referente;
    }
    
    // Si no hay técnico asignado
    return 'Sin asignar';
  }

  /**
   * Obtiene el texto de prioridad formateado
   * @param priority - Prioridad del ticket
   * @returns Texto de prioridad formateado
   */
  getPriorityText(priority: string | undefined): string {
    if (!priority) return 'N/A';
    
    const priorityMap: { [key: string]: string } = {
      'baja': 'Baja',
      'media': 'Media',
      'alta': 'Alta',
      'urgente': 'Urgente'
    };
    
    return priorityMap[priority.toLowerCase()] || priority;
  }

  /**
   * Obtiene la clase CSS para el badge de prioridad
   * Reutiliza las mismas clases que order-management
   * @param priority - Prioridad del ticket
   * @returns Clase CSS correspondiente
   */
  getPriorityClass(priority: string | undefined): string {
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

  /**
   * Verifica si se puede tomar la orden
   * Solo si no tiene técnico asignado
   */
  canTakeOrder(): boolean {
    if (!this.ticket) return false;
    
    // Verificar array de responsables (principal)
    if (this.ticket.responsables && this.ticket.responsables.length > 0) {
      return false;
    }
    
    // Verificar campos legacy (fallback)
    const hasIdResponsable = this.ticket.idresponsable && this.ticket.idresponsable.trim() !== '';
    const hasNombreAsignado = this.ticket.nombreAsignado && 
                              this.ticket.nombreAsignado.trim() !== '' && 
                              this.ticket.nombreAsignado.toLowerCase() !== 'sin asignar';
    const hasReferente = this.ticket.referente && 
                         this.ticket.referente.trim() !== '' && 
                         this.ticket.referente.toLowerCase() !== 'sin asignar';
    
    const hasAssignedTech = hasIdResponsable || hasNombreAsignado || hasReferente;
    
    return !hasAssignedTech;
  }

  /**
   * Auto-asigna la orden al usuario actual
   * También establece la fecha/hora de inicio del trabajo
   */
  takeOrder(): void {
    if (!this.ticket) return;
    
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
      `¿Deseas asignarte la orden N° ${this.ticket.numero}?\n\n` +
      `Descripción: ${this.ticket.descripcion}`
    );
    
    if (!confirmed) return;

    // Auto-completar fecha/hora de inicio
    const now = new Date();
    const fechaini = now.toISOString().split('T')[0];
    const horaini = now.toTimeString().slice(0, 5);

    // Actualizar orden con técnico asignado y fecha de inicio
    const sectorValue = this.getSectorForBackend(this.ticket.sector);
    const updateData: any = {
      assignedToIds: [technicianId],
      sector: sectorValue,
      fechaini: fechaini,
      horaini: horaini,
      estado: 'En Progreso' // Cambiar a En Progreso automáticamente
    };

    this.ordersService.updateOrder(this.ticket.numero, updateData)
      .subscribe({
        next: () => {
          this.showSnackBar(`Orden N° ${this.ticket.numero} asignada exitosamente`, 'success');
          this.dialogRef.close({ assigned: true }); // Cerrar y notificar que se asignó
        },
        error: (error) => {
          console.error('Error taking order:', error);
          this.showSnackBar('Error al asignar la orden', 'error');
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
   * Exporta la orden actual a PDF
   */
  exportToPdf(): void {
    try {
      this.pdfExportService.exportOrderToPdf(this.ticket);
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