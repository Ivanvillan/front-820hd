import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';


import { BannerRoutingModule } from './banner-routing.module';
import { BannerComponent } from './banner.component';
import { OrdersAdminComponent } from './pages/orders-admin/orders-admin.component';
import { OrdersUserComponent } from './pages/orders-user/orders-user.component';
import { OfferAdminComponent } from './pages/offer-admin/offer-admin.component';
import { OrderCreateComponent } from './pages/order-create/order-create.component';
import { SharedModule } from '../shared/shared.module';
import { OrderCreateBoxComponent } from './components/order-create-box/order-create-box.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderManagementComponent } from './components/order-management/order-management.component';
import { CustomerManagementComponent } from './components/customer-management/customer-management.component';

// Nuevos componentes reutilizables
import { FilterBarModule } from 'src/app/components/filter-bar/filter-bar.module';
import { ConfigurableTableModule } from 'src/app/components/configurable-table/configurable-table.module';

@NgModule({
  declarations: [
    BannerComponent,
    OrdersAdminComponent,
    OrdersUserComponent,
    OfferAdminComponent,
    OrderCreateComponent,
    OrderCreateBoxComponent,
    OrderManagementComponent,
    CustomerManagementComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    BannerRoutingModule,
    MatTabsModule,
    FontAwesomeModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    SharedModule,
    MatSnackBarModule,
    NgSelectModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    // Nuevos componentes reutilizables
    FilterBarModule,
    ConfigurableTableModule
  ],
  exports: [
    BannerComponent,
    OrderManagementComponent,
    CustomerManagementComponent
  ]
})
export class BannerModule { }
