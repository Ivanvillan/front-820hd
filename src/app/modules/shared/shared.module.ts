import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SwiperModule } from 'swiper/angular';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgxMaskModule } from 'ngx-mask';
import { NgSelectModule } from '@ng-select/ng-select';

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
import { UpdateOrderDialogComponent } from './components/update-order-dialog/update-order-dialog.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { CreateOrderDialogComponent } from './components/create-order-dialog/create-order-dialog.component';
import { CreateCustomerDialogComponent } from './components/create-customer-dialog/create-customer-dialog.component';
import { UpdateCustomerDialogComponent } from './components/update-customer-dialog/update-customer-dialog.component';
import { CustomerDetailDialogComponent } from './components/customer-detail-dialog/customer-detail-dialog.component';
import { ContactDetailDialogComponent } from './components/contact-detail-dialog/contact-detail-dialog.component';
import { CreateContactDialogComponent } from './components/create-contact-dialog/create-contact-dialog.component';
import { UpdateContactDialogComponent } from './components/update-contact-dialog/update-contact-dialog.component';
import { TechnicianManagementComponent } from './components/technician-management/technician-management.component';
import { EditTechnicianAreaDialogComponent } from './components/technician-management/edit-technician-area-dialog/edit-technician-area-dialog.component';
import { CreateTechnicianDialogComponent } from './components/technician-management/create-technician-dialog/create-technician-dialog.component';
import { EditTechnicianDialogComponent } from './components/technician-management/edit-technician-dialog/edit-technician-dialog.component';
import { DeleteTechnicianDialogComponent } from './components/technician-management/delete-technician-dialog/delete-technician-dialog.component';
import { RemitosSelectorDialogComponent } from './components/remitos-selector-dialog/remitos-selector-dialog.component';

// Nuevos componentes reutilizables
import { FilterBarModule } from 'src/app/components/filter-bar/filter-bar.module';
import { ConfigurableTableModule } from 'src/app/components/configurable-table/configurable-table.module';

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
    TicketDetailModalComponent,
    UpdateOrderDialogComponent,
    ConfirmationDialogComponent,
    CreateOrderDialogComponent,
    CreateCustomerDialogComponent,
    UpdateCustomerDialogComponent,
    CustomerDetailDialogComponent,
    ContactDetailDialogComponent,
    CreateContactDialogComponent,
    UpdateContactDialogComponent,
    TechnicianManagementComponent,
    EditTechnicianAreaDialogComponent,
    CreateTechnicianDialogComponent,
    EditTechnicianDialogComponent,
    DeleteTechnicianDialogComponent,
    RemitosSelectorDialogComponent
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
    MatPaginatorModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgxMaskModule.forRoot(),
    NgSelectModule,
    // Nuevos componentes reutilizables
    FilterBarModule,
    ConfigurableTableModule
  ],
  exports: [
    OffersComponent,
    WeekoffersComponent,
    NewsComponent,
    DashboardComponent,
    TechnicianManagementComponent,
    DashboardAuthComponent,
    TicketDetailModalComponent,
    UpdateOrderDialogComponent,
    ConfirmationDialogComponent,
    CreateOrderDialogComponent,
    CreateCustomerDialogComponent,
    UpdateCustomerDialogComponent,
    CustomerDetailDialogComponent,
    ContactDetailDialogComponent,
    CreateContactDialogComponent,
    UpdateContactDialogComponent,
    TechnicianManagementComponent,
    EditTechnicianAreaDialogComponent,
    CreateTechnicianDialogComponent,
    EditTechnicianDialogComponent,
    DeleteTechnicianDialogComponent,
    RemitosSelectorDialogComponent,
    // Re-export Material modules for child components
    MatMenuModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    // Re-export reusable component modules
    FilterBarModule,
    ConfigurableTableModule
  ]
})
export class SharedModule { }
