import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManageComponent } from './manage.component';
import { OrderManagementComponent } from '../banner/components/order-management/order-management.component';
import { CustomerManagementComponent } from '../banner/components/customer-management/customer-management.component';
import { TechnicianManagementComponent } from '../shared/components/technician-management/technician-management.component';
import { OfferAdminComponent } from '../banner/pages/offer-admin/offer-admin.component';

const routes: Routes = [
  { 
    path: '', 
    component: ManageComponent,
    children: [
      { path: '', redirectTo: 'ordenes', pathMatch: 'full' },
      { path: 'ordenes', component: OrderManagementComponent },
      { path: 'clientes', component: CustomerManagementComponent },
      { path: 'tecnicos', component: TechnicianManagementComponent },
      { path: 'ofertas', component: OfferAdminComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManageRoutingModule { }
