import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SwiperModule } from 'swiper/angular';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog'
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';

import { SharedRoutingModule } from './shared-routing.module';
import { SharedComponent } from './shared.component';
import { OffersComponent } from './pages/offers/offers.component';
import { WeekoffersComponent } from './pages/weekoffers/weekoffers.component';
import { NewsComponent } from './pages/news/news.component';
import { DialogComponent } from './components/dialog/dialog.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TruncatePipe } from './pipes/truncate.pipe';
import { DashboardAuthComponent } from './components/dashboard-auth/dashboard-auth.component';
import { TicketDetailModalComponent } from './components/ticket-detail-modal/ticket-detail-modal.component';

@NgModule({
  declarations: [
    SharedComponent,
    OffersComponent,
    WeekoffersComponent,
    NewsComponent,
    DialogComponent,
    DashboardComponent,
    DashboardAuthComponent,
    TruncatePipe,
    TicketDetailModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedRoutingModule,
    SwiperModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTableModule,
    MatCardModule,
    MatInputModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule
  ],
  exports: [
    OffersComponent,
    WeekoffersComponent,
    NewsComponent,
    DashboardComponent,
    DashboardAuthComponent,
    TicketDetailModalComponent
  ]
})
export class SharedModule { }
