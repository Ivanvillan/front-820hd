import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, forkJoin, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { TicketsService } from 'src/app/services/repository/tickets.service';
import { Ticket } from 'src/app/models/ticket.model';
import { MatDialog } from '@angular/material/dialog';
import { TicketDetailModalComponent } from '../ticket-detail-modal/ticket-detail-modal.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentDateTime = new Date();
  ticketsDataSource = new MatTableDataSource<Ticket>();
  displayedColumns: string[] = ['estado', 'fecha', 'hora', 'numero', 'descripcion', 'contacto', 'empresa', 'asignado'];
  private refreshSubscription?: Subscription;
  private allTickets: Ticket[] = [];
  activeFilter: string | null = null;

  constructor(
    private ticketsService: TicketsService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.initializeDataSources();
    this.setupAutoRefresh();
  }

  private initializeDataSources(): void {
    this.loadTickets();
  }

  private loadTickets(): void {
    this.ticketsService.getMesaAyuda().subscribe({
      next: (tickets) => {
        this.allTickets = tickets;
        this.updateDataSource();
      },
      error: (error) => {
        console.error('Error al cargar tickets:', error);
      }
    });
  }

  private updateDataSource(): void {
    if (this.activeFilter) {
      this.ticketsDataSource.data = this.getFilteredTickets(this.activeFilter);
    } else {
      this.ticketsDataSource.data = this.allTickets;
    }
  }

  private setupAutoRefresh(): void {
    this.refreshSubscription = timer(0, 300000).pipe(
      switchMap(() => this.ticketsService.getMesaAyuda())
    ).subscribe({
      next: (tickets) => {
        this.currentDateTime = new Date();
        this.allTickets = tickets;
        this.updateDataSource();
      },
      error: (error) => {
        console.error('Error al cargar tickets:', error);
      }
    });
  }

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

  getTotalTickets(): { recent: number, pending: number, urgent: number, critical: number } {
    return {
      recent: this.getFilteredTickets('recent').length,
      pending: this.getFilteredTickets('pending').length,
      urgent: this.getFilteredTickets('urgent').length,
      critical: this.getFilteredTickets('critical').length
    };
  }

  private getFilteredTickets(status: string): Ticket[] {
    return this.allTickets.filter(ticket => {
      const hours = this.calculateHours(ticket.fecha, ticket.hora);
      switch (status) {
        case 'recent': return hours <= 1;
        case 'pending': return hours > 1 && hours <= 2;
        case 'urgent': return hours > 2 && hours <= 3;
        case 'critical': return hours > 3;
        default: return true;
      }
    });
  }

  filterByStatus(status: string): void {
    if (this.activeFilter === status) {
      this.activeFilter = null;
      this.ticketsDataSource.data = this.allTickets;
    } else {
      this.activeFilter = status;
      this.ticketsDataSource.data = this.getFilteredTickets(status);
    }
  }

  openTicketDetail(ticket: Ticket): void {
    this.dialog.open(TicketDetailModalComponent, {
      data: ticket,
      width: '90%',
      maxWidth: '600px',
      minWidth: '280px',
      maxHeight: '90vh',
      autoFocus: false
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
}
