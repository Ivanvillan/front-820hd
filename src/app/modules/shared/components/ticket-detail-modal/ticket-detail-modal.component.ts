import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Ticket } from 'src/app/models/ticket.model';

@Component({
  selector: 'app-ticket-detail-modal',
  templateUrl: './ticket-detail-modal.component.html',
  styleUrls: ['./ticket-detail-modal.component.css']
})
export class TicketDetailModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public ticket: Ticket) {}

  getTicketStatus(ticket: Ticket): { class: string, text: string } {
    const hours = this.calculateHours(ticket.fecha, ticket.hora);
    
    if (hours <= 1) return { class: 'recent-status', text: 'RECIENTE' };
    if (hours <= 2) return { class: 'pending-status', text: 'PENDIENTE' };
    if (hours <= 3) return { class: 'urgent-status', text: 'URGENTE' };
    return { class: 'critical-status', text: 'CRÍTICO' };
  }

  private calculateHours(fecha: string, hora: string): number {
    const [hours, minutes] = hora.split(':').map(Number);
    const ticketDate = new Date(fecha);
    ticketDate.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const difference = now.getTime() - ticketDate.getTime();
    return Math.floor(difference / (1000 * 3600));
  }
} 