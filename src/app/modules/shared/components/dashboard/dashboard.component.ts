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
  displayedColumns: string[] = ['estado', 'fecha', 'hora', 'numero', 'descripcion', 'contacto', 'empresa'];
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
    this.ticketsService.getMesaAyuda().subscribe({
      next: (tickets) => {
        this.allTickets = tickets;
        this.ticketsDataSource.data = this.allTickets;
      },
      error: (error) => {
        console.error('Error al cargar tickets:', error);
      }
    });
  }

  private setupAutoRefresh(): void {
    this.refreshSubscription = timer(0, 600000).pipe(
      switchMap(() => this.ticketsService.getMesaAyuda())
    ).subscribe({
      next: (tickets) => {
        this.currentDateTime = new Date();
        this.allTickets = tickets;
        this.applyFilter(this.activeFilter);
      },
      error: (error) => {
        console.error('Error al cargar tickets:', error);
      }
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

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

  getTotalTickets(): { recent: number, pending: number, urgent: number, critical: number } {
    const tickets = this.ticketsDataSource.data;
    return {
      recent: tickets.filter(t => this.calculateHours(t.fecha) <= 1).length,
      pending: tickets.filter(t => this.calculateHours(t.fecha) > 1 && this.calculateHours(t.fecha) <= 3).length,
      urgent: tickets.filter(t => this.calculateHours(t.fecha) > 3 && this.calculateHours(t.fecha) <= 5).length,
      critical: tickets.filter(t => this.calculateHours(t.fecha) > 5).length
    };
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

  filterByStatus(status: string): void {
    if (this.activeFilter === status) {
      this.activeFilter = null;
      this.ticketsDataSource.data = this.allTickets;
    } else {
      this.activeFilter = status;
      this.applyFilter(status);
    }
  }

  private applyFilter(status: string | null): void {
    if (!status) {
      this.ticketsDataSource.data = this.allTickets;
      return;
    }

    this.ticketsDataSource.data = this.allTickets.filter(ticket => {
      const hours = this.calculateHours(ticket.fecha);
      switch (status) {
        case 'recent':
          return hours <= 1;
        case 'pending':
          return hours > 1 && hours <= 3;
        case 'urgent':
          return hours > 3 && hours <= 5;
        case 'critical':
          return hours > 5;
        default:
          return true;
      }
    });
  }
}
