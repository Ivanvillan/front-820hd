import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TechnicianGuard } from 'src/app/guards/technician.guard';
import { AreaSelectionComponent } from './components/area-selection/area-selection.component';
import { OrderListComponent } from './components/order-list/order-list.component';
import { OrderDetailComponent } from './components/order-detail/order-detail.component';

const routes: Routes = [
  {
    path: '',
    component: AreaSelectionComponent
  },
  {
    path: 'orders/:area',
    component: OrderListComponent,
    canActivate: [TechnicianGuard]
  },
  {
    path: 'orders/:area/:id',
    component: OrderDetailComponent,
    canActivate: [TechnicianGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TechnicianViewRoutingModule { }
