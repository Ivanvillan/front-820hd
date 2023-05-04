import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select'
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table'
import { NgSelectModule } from '@ng-select/ng-select';


import { BannerRoutingModule } from './banner-routing.module';
import { BannerComponent } from './banner.component';
import { OrdersAdminComponent } from './pages/orders-admin/orders-admin.component';
import { OrdersUserComponent } from './pages/orders-user/orders-user.component';
import { OfferAdminComponent } from './pages/offer-admin/offer-admin.component';
import { OrderCreateComponent } from './pages/order-create/order-create.component';
import { SharedModule } from '../shared/shared.module';
import { OrderCreateBoxComponent } from './components/order-create-box/order-create-box.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';


@NgModule({
  declarations: [
    BannerComponent,
    OrdersAdminComponent,
    OrdersUserComponent,
    OfferAdminComponent,
    OrderCreateComponent,
    OrderCreateBoxComponent
  ],
  imports: [
    CommonModule,
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
    NgSelectModule
  ],
  exports: [
    BannerComponent
  ]
})
export class BannerModule { }
