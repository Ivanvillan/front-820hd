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

  getTicketStatus(date: string): { class: string, text: string } {
    const hours = this.calculateHours(date);
    
    if (hours <= 1) return { class: 'recent-status', text: 'RECIENTE' };
    if (hours > 1 && hours <= 2) return { class: 'pending-status', text: 'PENDIENTE' };
    if (hours > 2 && hours <= 4) return { class: 'urgent-status', text: 'URGENTE' };
    return { class: 'critical-status', text: 'CRÍTICO' };
  }

  private calculateHours(date: string): number {
    const ticketDate = new Date(date);
    const today = new Date();
    const difference = today.getTime() - ticketDate.getTime();
    return Math.floor(difference / (1000 * 3600));
  }
} 